import { prisma } from '../utils/prisma'
import { TransactionStatus } from '../../generated/prisma/enums'

export class TransactionService {
  // Create new transaction (checkout) - Nomor 2-A: Purchasing & Point Usage
  static async createTransaction(
    userId: number,
    eventId: number,
    ticketCount: number,
    pointsToUse: number,
    voucherCode?: string
  ) {
    return await prisma.$transaction(async (tx) => {
      // Get event
      const event = await tx.event.findUnique({
        where: { id: eventId },
      })

      if (!event) {
        throw new Error('Event not found')
      }

      if (!event.isPublished) {
        throw new Error('Event is not published')
      }

      // Check available seats
      if (event.availableSeats < ticketCount) {
        throw new Error('Not enough seats available')
      }

      // Get user
      const user = await tx.user.findUnique({
        where: { id: userId },
      })

      if (!user) {
        throw new Error('User not found')
      }

      // Check if user has enough points
      if (pointsToUse > 0) {
        if (user.pointsBalance < pointsToUse) {
          throw new Error('Insufficient points balance')
        }
      }

      // Calculate pricing
      const ticketPrice = event.price
      const subtotal = ticketCount * ticketPrice

      let voucherDiscount = 0
      let validVoucherCode: string | null = null

      // Validate and apply voucher - Nomor 1-D: Pricing & Promotions
      if (voucherCode && ticketPrice > 0) {
        const voucher = await tx.eventVoucher.findFirst({
          where: {
            eventId,
            code: voucherCode,
            expiresAt: { gt: new Date() },
            quota: { gt: tx.eventVoucher.fields.usedCount },
          },
        })

        if (voucher) {
          voucherDiscount = Math.floor((subtotal * voucher.discount) / 100)
          validVoucherCode = voucher.code

          // Increment voucher used count
          await tx.eventVoucher.update({
            where: { id: voucher.id },
            data: { usedCount: { increment: 1 } },
          })
        }
      }

      // Calculate total
      const totalAmount = Math.max(0, subtotal - pointsToUse - voucherDiscount)

      // For free events
      const finalTotal = ticketPrice === 0 ? 0 : totalAmount

      // Deduct points if used
      if (pointsToUse > 0) {
        await tx.user.update({
          where: { id: userId },
          data: {
            pointsBalance: { decrement: pointsToUse },
          },
        })
      }

      // Decrement available seats
      await tx.event.update({
        where: { id: eventId },
        data: {
          availableSeats: { decrement: ticketCount },
        },
      })

      // Set expiration time (2 hours from now) - Nomor 2-B: Transaction Statuses
      const expiredAt = new Date(Date.now() + 2 * 60 * 60 * 1000)

      // Create transaction
      const transaction = await tx.transaction.create({
        data: {
          userId,
          eventId,
          ticketCount,
          ticketPrice,
          subtotal,
          pointsUsed: pointsToUse,
          voucherDiscount,
          totalAmount: finalTotal,
          voucherCode: validVoucherCode,
          status: finalTotal === 0
            ? TransactionStatus.WAITING_CONFIRMATION
            : TransactionStatus.WAITING_PAYMENT,
          expiredAt: finalTotal === 0 ? null : expiredAt,
        },
        include: {
          event: {
            select: {
              title: true,
              startDate: true,
              location: true,
            },
          },
        },
      })

      return transaction
    })
  }

  // Upload payment proof - Nomor 2-B: Payment Proof
  static async uploadPaymentProof(
    transactionId: number,
    userId: number,
    paymentProofUrl: string
  ) {
    const transaction = await prisma.transaction.findUnique({
      where: { id: transactionId },
    })

    if (!transaction) {
      throw new Error('Transaction not found')
    }

    if (transaction.userId !== userId) {
      throw new Error('Unauthorized')
    }

    if (transaction.status !== TransactionStatus.WAITING_PAYMENT) {
      throw new Error('Transaction is not waiting for payment')
    }

    if (transaction.expiredAt && new Date() > transaction.expiredAt) {
      throw new Error('Transaction has expired')
    }

    const updated = await prisma.transaction.update({
      where: { id: transactionId },
      data: {
        paymentProofUrl,
        status: TransactionStatus.WAITING_CONFIRMATION,
      },
    })

    return updated
  }

  // Get user's transactions
  static async getUserTransactions(userId: number, status?: string) {
    const where: any = { userId }

    if (status) {
      where.status = status
    }

    const transactions = await prisma.transaction.findMany({
      where,
      include: {
        event: {
          select: {
            id: true,
            title: true,
            imageUrl: true,
            startDate: true,
            endDate: true,
            location: true,
            organizer: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
              },
            },
          },
        },
        review: {
          select: {
            id: true,
            rating: true,
            comment: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    return transactions
  }

  // Get single transaction
  static async getTransactionById(transactionId: number, userId: number) {
    const transaction = await prisma.transaction.findUnique({
      where: { id: transactionId },
      include: {
        event: {
          include: {
            organizer: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                phone: true,
              },
            },
          },
        },
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
          },
        },
        review: true,
      },
    })

    if (!transaction) {
      throw new Error('Transaction not found')
    }

    if (transaction.userId !== userId) {
      throw new Error('Unauthorized')
    }

    return transaction
  }

  // Cancel transaction (customer cancels) - Nomor 2-D: Rollbacks
  static async cancelTransaction(transactionId: number, userId: number) {
    return await prisma.$transaction(async (tx) => {
      const transaction = await tx.transaction.findUnique({
        where: { id: transactionId },
        include: { event: true },
      })

      if (!transaction) {
        throw new Error('Transaction not found')
      }

      if (transaction.userId !== userId) {
        throw new Error('Unauthorized')
      }

      // Can only cancel if waiting for payment or waiting for confirmation
      const cancellableStatuses = [
        TransactionStatus.WAITING_PAYMENT,
        TransactionStatus.WAITING_CONFIRMATION,
      ]
      if (!cancellableStatuses.includes(transaction.status as typeof cancellableStatuses[number])) {
        throw new Error('Transaction cannot be cancelled')
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

      // Rollback: Restore user points
      if (transaction.pointsUsed > 0) {
        await tx.user.update({
          where: { id: transaction.userId },
          data: {
            pointsBalance: {
              increment: transaction.pointsUsed,
            },
          },
        })

        // Create point record for refund
        await tx.point.create({
          data: {
            userId: transaction.userId,
            amount: transaction.pointsUsed,
            reason: 'Refund: Transaction cancelled',
            expiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
          },
        })
      }

      // Rollback: Restore voucher
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
          status: TransactionStatus.CANCELED,
        },
      })

      return { message: 'Transaction cancelled successfully' }
    })
  }

  // Auto expire transactions (cron job) - Nomor 2-C: Automatic Status Changes
  static async expireOldTransactions() {
    return await prisma.$transaction(async (tx) => {
      // Find expired transactions
      const expiredTransactions = await tx.transaction.findMany({
        where: {
          status: TransactionStatus.WAITING_PAYMENT,
          expiredAt: { lt: new Date() },
        },
        include: { event: true },
      })

      for (const transaction of expiredTransactions) {
        // Rollback: Restore event seats
        await tx.event.update({
          where: { id: transaction.eventId },
          data: {
            availableSeats: {
              increment: transaction.ticketCount,
            },
          },
        })

        // Rollback: Restore user points
        if (transaction.pointsUsed > 0) {
          await tx.user.update({
            where: { id: transaction.userId },
            data: {
              pointsBalance: {
                increment: transaction.pointsUsed,
              },
            },
          })

          await tx.point.create({
            data: {
              userId: transaction.userId,
              amount: transaction.pointsUsed,
              reason: 'Refund: Transaction expired',
              expiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
            },
          })
        }

        // Rollback: Restore voucher
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

        // Update status
        await tx.transaction.update({
          where: { id: transaction.id },
          data: {
            status: TransactionStatus.EXPIRED,
          },
        })
      }

      return { expiredCount: expiredTransactions.length }
    })
  }

  // Auto cancel transactions waiting for confirmation too long (3 days)
  static async cancelUnconfirmedTransactions() {
    return await prisma.$transaction(async (tx) => {
      const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000)

      const unconfirmedTransactions = await tx.transaction.findMany({
        where: {
          status: TransactionStatus.WAITING_CONFIRMATION,
          updatedAt: { lt: threeDaysAgo },
        },
        include: { event: true },
      })

      for (const transaction of unconfirmedTransactions) {
        // Rollback: Restore event seats
        await tx.event.update({
          where: { id: transaction.eventId },
          data: {
            availableSeats: {
              increment: transaction.ticketCount,
            },
          },
        })

        // Rollback: Restore user points
        if (transaction.pointsUsed > 0) {
          await tx.user.update({
            where: { id: transaction.userId },
            data: {
              pointsBalance: {
                increment: transaction.pointsUsed,
              },
            },
          })

          await tx.point.create({
            data: {
              userId: transaction.userId,
              amount: transaction.pointsUsed,
              reason: 'Refund: Transaction auto-cancelled (no organizer confirmation)',
              expiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
            },
          })
        }

        // Rollback: Restore voucher
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

        // Update status
        await tx.transaction.update({
          where: { id: transaction.id },
          data: {
            status: TransactionStatus.CANCELED,
          },
        })
      }

      return { cancelledCount: unconfirmedTransactions.length }
    })
  }
}
