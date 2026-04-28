import { prisma } from '../utils/prisma'
import { TransactionStatus } from '../../generated/prisma/enums'

export class TransactionService {
  // Create new transaction (checkout) - Nomor 2-A: Purchasing & Point Usage
  static async createTransaction(
    userId: number,
    eventId: number,
    ticketCount: number,
    pointsToUse: number,
    voucherCode?: string,
    attendeeDetails?: { fullName: string; idType: string; idNumber: string; phone: string }
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
      let usedCouponId: number | null = null

      // Validate and apply voucher/coupon - Nomor 1-D: Pricing & Promotions
      if (voucherCode && ticketPrice > 0) {
        // First try to validate as event voucher
        const voucher = await tx.eventVoucher.findFirst({
          where: {
            eventId,
            code: voucherCode.toUpperCase(),
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
        } else {
          // Try to validate as personal coupon
          const coupon = await tx.coupon.findFirst({
            where: {
              userId,
              code: voucherCode.toUpperCase(),
              expiresAt: { gt: new Date() },
              isUsed: false,
            },
          })

          if (coupon) {
            voucherDiscount = Math.floor((subtotal * coupon.discount) / 100)
            validVoucherCode = coupon.code
            usedCouponId = coupon.id

            // Mark coupon as used
            await tx.coupon.update({
              where: { id: coupon.id },
              data: { isUsed: true },
            })
          }
        }
      }

      // Calculate total
      const TAX_RATE = 0.11 // 11% PPN
      const afterDiscount = Math.max(0, subtotal - pointsToUse - voucherDiscount)
      const tax = Math.floor(afterDiscount * TAX_RATE)
      const totalAmount = afterDiscount + tax

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

      // For free events, transaction is immediately DONE (no payment needed)
      const isFreeEvent = ticketPrice === 0

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
          status: isFreeEvent
            ? TransactionStatus.DONE
            : TransactionStatus.WAITING_PAYMENT,
          expiredAt: isFreeEvent ? null : expiredAt,
          confirmedAt: isFreeEvent ? new Date() : null,
          attendeeFullName: attendeeDetails?.fullName,
          attendeeIdType: attendeeDetails?.idType,
          attendeeIdNumber: attendeeDetails?.idNumber,
          attendeePhone: attendeeDetails?.phone,
        },
        include: {
          event: {
            select: {
              title: true,
              startDate: true,
              location: true,
            },
          },
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
        },
      })

      // Transform attendeeDetails to match frontend format
      const attendeeDetailsResponse = attendeeDetails ? {
        fullName: attendeeDetails.fullName,
        idType: attendeeDetails.idType,
        idNumber: attendeeDetails.idNumber,
        phone: attendeeDetails.phone,
      } : null

      return {
        ...transaction,
        attendeeDetails: attendeeDetailsResponse,
      }
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
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
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

    // Transform attendeeDetails to match frontend format
    return transactions.map(transaction => ({
      ...transaction,
      attendeeDetails: transaction.attendeeFullName ? {
        fullName: transaction.attendeeFullName,
        idType: transaction.attendeeIdType,
        idNumber: transaction.attendeeIdNumber,
        phone: transaction.attendeePhone,
      } : null,
    }))
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

    // Allow access if user is the transaction owner OR the event organizer
    if (transaction.userId !== userId && transaction.event.organizerId !== userId) {
      throw new Error('Unauthorized')
    }

    // Transform attendeeDetails to match frontend format
    // Fallback to user profile data if transaction attendee details are missing
    const attendeeDetails = (transaction.attendeeFullName || transaction.attendeeIdType || transaction.attendeeIdNumber || transaction.attendeePhone) ? {
      fullName: transaction.attendeeFullName,
      idType: transaction.attendeeIdType,
      idNumber: transaction.attendeeIdNumber,
      phone: transaction.attendeePhone,
    } : {
      // Fallback to user profile data
      fullName: transaction.user.firstName + ' ' + transaction.user.lastName,
      idType: null,
      idNumber: null,
      phone: transaction.user.phone || null,
    }

    return {
      ...transaction,
      attendeeDetails,
    }
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
        // Check if it's an event voucher or personal coupon
        const voucher = await tx.eventVoucher.findFirst({
          where: {
            eventId: transaction.eventId,
            code: transaction.voucherCode,
          },
        })

        if (voucher) {
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
        } else {
          // It's a personal coupon, restore it
          await tx.coupon.updateMany({
            where: {
              userId: transaction.userId,
              code: transaction.voucherCode,
            },
            data: {
              isUsed: false,
            },
          })
        }
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
          // Check if it's an event voucher or personal coupon
          const voucher = await tx.eventVoucher.findFirst({
            where: {
              eventId: transaction.eventId,
              code: transaction.voucherCode,
            },
          })

          if (voucher) {
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
          } else {
            // It's a personal coupon, restore it
            await tx.coupon.updateMany({
              where: {
                userId: transaction.userId,
                code: transaction.voucherCode,
              },
              data: {
                isUsed: false,
              },
            })
          }
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
          // Check if it's an event voucher or personal coupon
          const voucher = await tx.eventVoucher.findFirst({
            where: {
              eventId: transaction.eventId,
              code: transaction.voucherCode,
            },
          })

          if (voucher) {
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
          } else {
            // It's a personal coupon, restore it
            await tx.coupon.updateMany({
              where: {
                userId: transaction.userId,
                code: transaction.voucherCode,
              },
              data: {
                isUsed: false,
              },
            })
          }
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
