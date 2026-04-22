import { prisma } from '../utils/prisma'
import { TransactionStatus } from '../../generated/prisma/enums'

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
            status: { in: ['DONE', 'WAITING_CONFIRMATION'] },
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
        status: TransactionStatus.WAITING_CONFIRMATION,
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
      // Get transaction
      const transaction = await tx.transaction.findUnique({
        where: { id: transactionId },
        include: { event: true },
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
        throw new Error('Transaction cannot be accepted')
      }

      // Update transaction status
      await tx.transaction.update({
        where: { id: transactionId },
        data: {
          status: TransactionStatus.DONE,
          confirmedAt: new Date(),
        },
      })

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

      return { message: 'Transaction rejected successfully' }
    })
  }

  // Get attendee list for a specific event
  static async getEventAttendees(eventId: number, organizerId: number) {
    // Check if organizer owns the event
    const event = await prisma.event.findUnique({
      where: { id: eventId },
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
        eventId,
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
}
