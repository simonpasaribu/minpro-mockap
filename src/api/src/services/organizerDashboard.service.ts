import { prisma } from '../utils/prisma'
import { TransactionStatus } from '../../generated/prisma/enums'
import { sendTransactionAcceptedEmail, sendTransactionRejectedEmail } from '../utils/email'

export class OrganizerDashboardService {
  // Get statistics for organizer dashboard
  static async getStatistics(userId: number, filters?: any) {
    const where: any = { organizerId: userId }

    // Filter by date range
    if (filters?.startDate || filters?.endDate) {
      where.startDate = {}
      if (filters.startDate) {
        where.startDate.gte = new Date(filters.startDate)
      }
      if (filters.endDate) {
        where.startDate.lte = new Date(filters.endDate)
      }
    }

    // Get all events
    const events = await prisma.event.findMany({
      where,
      include: {
        transactions: {
          where: {
            status: { in: ['DONE'] },
          },
        },
        reviews: true,
      },
    })

    // Calculate statistics
    const totalEvents = events.length
    const totalTransactions = events.reduce((sum, e) => sum + e.transactions.length, 0)
    const totalRevenue = events.reduce((sum, e) => 
      sum + e.transactions.reduce((tSum, t) => tSum + t.totalAmount, 0), 0
    )
    const totalAttendees = events.reduce((sum, e) => 
      sum + e.transactions.reduce((tSum, t) => tSum + t.ticketCount, 0), 0
    )

    // Average rating
    const allReviews = events.flatMap(e => e.reviews)
    const avgRating = allReviews.length > 0
      ? allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length
      : 0

    return {
      totalEvents,
      totalTransactions,
      totalRevenue,
      totalAttendees,
      avgRating: parseFloat(avgRating.toFixed(1)),
    }
  }

  // Get transactions for organizer review
  static async getPendingTransactions(userId: number) {
    const events = await prisma.event.findMany({
      where: { organizerId: userId },
      select: { id: true },
    })

    const eventIds = events.map(e => e.id)

    const transactions = await prisma.transaction.findMany({
      where: {
        eventId: { in: eventIds },
        status: {
          in: [TransactionStatus.WAITING_PAYMENT, TransactionStatus.WAITING_CONFIRMATION],
        },
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        event: {
          select: {
            id: true,
            title: true,
            startDate: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    return transactions
  }

  // Get all transactions for an organizer
  static async getOrganizerTransactions(userId: number, filters?: any) {
    const events = await prisma.event.findMany({
      where: { organizerId: userId },
      select: { id: true },
    })

    const eventIds = events.map(e => e.id)

    const where: any = { eventId: { in: eventIds } }

    if (filters?.status) {
      where.status = filters.status
    }

    const transactions = await prisma.transaction.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            profilePicture: true,
          },
        },
        event: {
          select: {
            id: true,
            title: true,
            startDate: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    return transactions
  }

  // Accept transaction (with rollback support)
  static async acceptTransaction(transactionId: number, organizerId: number) {
    // Use transaction to ensure atomicity
    return await prisma.$transaction(async (tx) => {
      // Get transaction with user info
      const transaction = await tx.transaction.findUnique({
        where: { id: transactionId },
        include: { 
          event: { include: { organizer: true } }, 
          user: true 
        },
      })

      if (!transaction) {
        throw new Error('Transaction not found')
      }

      // Verify this transaction belongs to an event organized by this user
      if (transaction.event.organizerId !== organizerId) {
        throw new Error('Unauthorized: This transaction does not belong to your event')
      }

      // Debug logging
      console.log('Transaction status:', transaction.status)
      console.log('Expected status:', TransactionStatus.WAITING_CONFIRMATION)
      console.log('TransactionStatus enum:', TransactionStatus)

      // Check if transaction is in correct status
      if (transaction.status !== TransactionStatus.WAITING_CONFIRMATION) {
        throw new Error(`Invalid transaction status: ${transaction.status}. Expected: ${TransactionStatus.WAITING_CONFIRMATION}. Available statuses: ${Object.values(TransactionStatus).join(', ')}`)
      }

      // Update transaction status
      await tx.transaction.update({
        where: { id: transactionId },
        data: {
          status: TransactionStatus.DONE,
          confirmedAt: new Date(),
        },
      })

      // Send email notification (async, don't wait)
      sendTransactionAcceptedEmail(
        transaction.user.email,
        transaction.user.firstName,
        transaction.event.title,
        transaction.ticketCount
      ).catch(err => console.error('Email notification failed:', err))

      // Send email notification to organizer
      sendTransactionAcceptedEmail(
        transaction.event.organizer.email,
        transaction.event.organizer.firstName,
        transaction.event.title,
        transaction.ticketCount
      ).catch(err => console.error('Email notification failed:', err))

      return { message: 'Transaction accepted successfully' }
    })
  }

  // Reject transaction (with rollback)
  static async rejectTransaction(transactionId: number, organizerId: number) {
    // Use transaction to ensure atomicity
    return await prisma.$transaction(async (tx) => {
      // Get transaction
      const transaction = await tx.transaction.findUnique({
        where: { id: transactionId },
        include: { event: true, user: true },
      })

      if (!transaction) {
        throw new Error('Transaction not found')
      }

      // Check if organizer owns the event
      if (transaction.event.organizerId !== organizerId) {
        throw new Error('Unauthorized')
      }

      // Check current status
      if (transaction.status !== TransactionStatus.WAITING_CONFIRMATION) {
        throw new Error('Transaction cannot be rejected')
      }

      // Rollback: Restore event seats
      await tx.event.update({
        where: { id: transaction.eventId },
        data: {
          availableSeats: {
            increment: transaction.ticketCount,
          },
        },
      })

      // Rollback: Restore user points if used
      if (transaction.pointsUsed > 0) {
        await tx.user.update({
          where: { id: transaction.userId },
          data: {
            pointsBalance: {
              increment: transaction.pointsUsed,
            },
          },
        })

        // Create point record
        await tx.point.create({
          data: {
            userId: transaction.userId,
            amount: transaction.pointsUsed,
            reason: 'Refund: Transaction rejected',
            expiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90 days
          },
        })
      }

      // Rollback: Restore voucher if used
      if (transaction.voucherCode) {
        await tx.eventVoucher.updateMany({
          where: {
            eventId: transaction.eventId,
            code: transaction.voucherCode,
          },
          data: {
            usedCount: {
              decrement: 1,
            },
          },
        })
      }

      // Update transaction status
      await tx.transaction.update({
        where: { id: transactionId },
        data: {
          status: TransactionStatus.REJECTED,
        },
      })

      // Send email notification (async, don't wait)
      sendTransactionRejectedEmail(
        transaction.user.email,
        transaction.user.firstName,
        transaction.event.title,
        transaction.ticketCount,
        transaction.totalAmount
      ).catch(err => console.error('Email notification failed:', err))

      return { message: 'Transaction rejected successfully' }
    })
  }

  // Get attendee list for a specific event by slug
  static async getEventAttendeesBySlug(slug: string, organizerId: number) {
    // Find event by slug
    const event = await prisma.event.findUnique({
      where: { slug },
    })

    if (!event) {
      throw new Error('Event not found')
    }

    if (event.organizerId !== organizerId) {
      throw new Error('Unauthorized')
    }

    // Get all successful transactions for this event
    const transactions = await prisma.transaction.findMany({
      where: {
        eventId: event.id,
        status: TransactionStatus.DONE,
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    return transactions.map(t => ({
      transactionId: t.id,
      user: t.user,
      ticketCount: t.ticketCount,
      ticketPrice: t.ticketPrice,
      totalAmount: t.totalAmount,
      purchasedAt: t.createdAt,
    }))
  }

  // Get statistics chart data with date grouping (last 7 periods)
  static async getStatisticsChart(userId: number, filter: 'year' | 'month' | 'day') {
    const events = await prisma.event.findMany({
      where: { organizerId: userId },
      select: { id: true },
    })

    const eventIds = events.map(e => e.id)

    // Calculate date range for last 7 periods
    const now = new Date()
    let startDate: Date
    let endDate = new Date(now)

    if (filter === 'year') {
      // Last 7 years (current year + 6 previous)
      startDate = new Date(now.getFullYear() - 6, 0, 1)
    } else if (filter === 'month') {
      // Last 7 months (current month + 6 previous)
      startDate = new Date(now.getFullYear(), now.getMonth() - 6, 1)
    } else {
      // Last 7 days
      startDate = new Date(now)
      startDate.setDate(startDate.getDate() - 6)
      startDate.setHours(0, 0, 0, 0)
    }

    // Get transactions within the date range
    const transactions = await prisma.transaction.findMany({
      where: {
        eventId: { in: eventIds },
        status: TransactionStatus.DONE,
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      select: {
        totalAmount: true,
        ticketCount: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'asc' },
    })

    // Generate 7 periods and fill with transaction data
    const chartData: any[] = []
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des']

    for (let i = 6; i >= 0; i--) {
      let periodKey: string
      let periodLabel: string
      let periodStart: Date
      let periodEnd: Date

      if (filter === 'year') {
        const year = now.getFullYear() - i
        periodKey = year.toString()
        periodLabel = year.toString()
        periodStart = new Date(year, 0, 1)
        periodEnd = new Date(year, 11, 31, 23, 59, 59)
      } else if (filter === 'month') {
        const date = new Date(now.getFullYear(), now.getMonth() - i, 1)
        const year = date.getFullYear()
        const month = date.getMonth()
        periodKey = `${year}-${String(month + 1).padStart(2, '0')}`
        periodLabel = `${monthNames[month]} ${year}`
        periodStart = new Date(year, month, 1)
        periodEnd = new Date(year, month + 1, 0, 23, 59, 59)
      } else {
        // day
        const date = new Date(now)
        date.setDate(date.getDate() - i)
        periodKey = date.toISOString().split('T')[0]
        periodLabel = `${date.getDate()} ${monthNames[date.getMonth()]} ${date.getFullYear()}`
        periodStart = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0)
        periodEnd = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59)
      }

      // Sum transactions for this period
      const periodTransactions = transactions.filter(t => {
        const tDate = new Date(t.createdAt)
        return tDate >= periodStart && tDate <= periodEnd
      })

      const revenue = periodTransactions.reduce((sum, t) => sum + t.totalAmount, 0)
      const attendees = periodTransactions.reduce((sum, t) => sum + t.ticketCount, 0)

      chartData.push({
        date: periodKey,
        label: periodLabel,
        revenue,
        attendees,
      })
    }

    // Calculate MoM/YoM/DoD change for each period
    const chartDataWithChange = chartData.map((period, index) => {
      const prevPeriod = index > 0 ? chartData[index - 1] : null

      const revenueChange = prevPeriod && prevPeriod.revenue > 0
        ? ((period.revenue - prevPeriod.revenue) / prevPeriod.revenue * 100)
        : (period.revenue > 0 ? 100 : 0)

      const attendeesChange = prevPeriod && prevPeriod.attendees > 0
        ? ((period.attendees - prevPeriod.attendees) / prevPeriod.attendees * 100)
        : (period.attendees > 0 ? 100 : 0)

      return {
        ...period,
        prevRevenue: prevPeriod?.revenue || 0,
        prevAttendees: prevPeriod?.attendees || 0,
        revenueChange: Math.round(revenueChange * 100) / 100,
        attendeesChange: Math.round(attendeesChange * 100) / 100,
      }
    })

    // Calculate summary metrics
    const totalRevenue = chartDataWithChange.reduce((sum, d) => sum + d.revenue, 0)
    const totalAttendees = chartDataWithChange.reduce((sum, d) => sum + d.attendees, 0)
    const avgRevenue = totalRevenue / 7
    const avgAttendees = totalAttendees / 7

    // Find best period
    const bestRevenue = chartDataWithChange.reduce((max, d) => d.revenue > max.revenue ? d : max, chartDataWithChange[0])
    const bestAttendees = chartDataWithChange.reduce((max, d) => d.attendees > max.attendees ? d : max, chartDataWithChange[0])

    return {
      chartData: chartDataWithChange,
      summary: {
        totalRevenue,
        totalAttendees,
        avgRevenue,
        avgAttendees,
        bestRevenuePeriod: bestRevenue?.label || null,
        bestRevenueAmount: bestRevenue?.revenue || 0,
        bestAttendeesPeriod: bestAttendees?.label || null,
        bestAttendeesCount: bestAttendees?.attendees || 0,
      }
    }
  }

  // Get daily revenue report
  static async getDailyRevenueReport(userId: number) {
    const events = await prisma.event.findMany({
      where: { organizerId: userId },
      select: { id: true, title: true },
    })

    const eventIds = events.map(e => e.id)

    // Get transactions grouped by date and event
    const transactions = await prisma.transaction.findMany({
      where: {
        eventId: { in: eventIds },
        status: TransactionStatus.DONE,
      },
      select: {
        totalAmount: true,
        ticketCount: true,
        createdAt: true,
        eventId: true,
      },
      orderBy: { createdAt: 'desc' },
    })

    // Group by date and event
    const reportMap = new Map<string, Map<number, any>>()

    transactions.forEach(t => {
      const dateKey = new Date(t.createdAt).toISOString().split('T')[0]
      
      if (!reportMap.has(dateKey)) {
        reportMap.set(dateKey, new Map())
      }
      
      const eventMap = reportMap.get(dateKey)!
      
      if (!eventMap.has(t.eventId)) {
        const event = events.find(e => e.id === t.eventId)
        eventMap.set(t.eventId, {
          eventId: t.eventId,
          eventTitle: event?.title || 'Unknown',
          transactionCount: 0,
          totalRevenue: 0,
        })
      }
      
      const eventData = eventMap.get(t.eventId)!
      eventData.transactionCount += 1
      eventData.totalRevenue += t.totalAmount
    })

    // Convert to array and sort by date descending
    const report = Array.from(reportMap.entries())
      .map(([date, eventMap]) => {
        const events = Array.from(eventMap.values())
        const dayTotal = events.reduce((sum, e) => sum + e.totalRevenue, 0)
        const dayTransactionCount = events.reduce((sum, e) => sum + e.transactionCount, 0)
        
        return {
          date,
          events,
          dayTotal,
          dayTransactionCount,
          runningTotal: 0,
        }
      })
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

    // Calculate running total (from oldest to newest)
    const reportWithRunningTotal = [...report].reverse()
    let runningTotal = 0
    reportWithRunningTotal.forEach(day => {
      runningTotal += day.dayTotal
      day.runningTotal = runningTotal
    })

    // Return in descending order (newest first)
    return reportWithRunningTotal.reverse()
  }
}
