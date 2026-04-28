import { prisma } from '../utils/prisma'

export class VoucherService {
  // Create voucher for an event (Organizer only)
  static async createVoucher(
    organizerId: number,
    slug: string,
    voucherData: {
      code: string
      discount: number
      quota: number
      expiresAt: string
    }
  ) {
    // Check if event exists and belongs to organizer
    const event = await prisma.event.findUnique({
      where: { slug },
    })

    if (!event) {
      throw new Error('Event not found')
    }

    if (event.organizerId !== organizerId) {
      throw new Error('Unauthorized: You do not own this event')
    }

    // Check if voucher code already exists for this event
    const existingVoucher = await prisma.eventVoucher.findFirst({
      where: {
        eventId: event.id,
        code: voucherData.code,
      },
    })

    if (existingVoucher) {
      throw new Error('Voucher code already exists for this event')
    }

    // Validate discount (1-100%)
    if (voucherData.discount < 1 || voucherData.discount > 100) {
      throw new Error('Discount must be between 1 and 100 percent')
    }

    // Validate quota
    if (voucherData.quota < 1) {
      throw new Error('Quota must be at least 1')
    }

    // Create voucher
    const voucher = await prisma.eventVoucher.create({
      data: {
        eventId: event.id,
        code: voucherData.code.toUpperCase(),
        discount: voucherData.discount,
        quota: voucherData.quota,
        usedCount: 0,
        expiresAt: new Date(voucherData.expiresAt),
      },
    })

    return voucher
  }

  // Get vouchers for an event (Organizer only)
  static async getEventVouchers(organizerId: number, slug: string) {
    // Check if event exists and belongs to organizer
    const event = await prisma.event.findUnique({
      where: { slug },
    })

    if (!event) {
      throw new Error('Event not found')
    }

    if (event.organizerId !== organizerId) {
      throw new Error('Unauthorized: You do not own this event')
    }

    const vouchers = await prisma.eventVoucher.findMany({
      where: { eventId: event.id },
      orderBy: { createdAt: 'desc' },
    })

    return vouchers
  }

  // Delete voucher (Organizer only)
  static async deleteVoucher(
    organizerId: number,
    slug: string,
    voucherId: number
  ) {
    // Check if event exists and belongs to organizer
    const event = await prisma.event.findUnique({
      where: { slug },
    })

    if (!event) {
      throw new Error('Event not found')
    }

    if (event.organizerId !== organizerId) {
      throw new Error('Unauthorized: You do not own this event')
    }

    // Check if voucher exists and belongs to event
    const voucher = await prisma.eventVoucher.findFirst({
      where: {
        id: voucherId,
        eventId: event.id,
      },
    })

    if (!voucher) {
      throw new Error('Voucher not found')
    }

    // Check if voucher has been used
    if (voucher.usedCount > 0) {
      throw new Error('Cannot delete voucher that has already been used')
    }

    await prisma.eventVoucher.delete({
      where: { id: voucherId },
    })

    return { message: 'Voucher deleted successfully' }
  }

  // Validate voucher (for transaction creation)
  static async validateVoucher(eventId: number, code: string) {
    const voucher = await prisma.eventVoucher.findFirst({
      where: {
        eventId,
        code: code.toUpperCase(),
        expiresAt: { gt: new Date() },
        quota: { gt: prisma.eventVoucher.fields.usedCount },
      },
    })

    if (!voucher) {
      throw new Error('Invalid or expired voucher code')
    }

    return {
      code: voucher.code,
      discount: voucher.discount,
      expiresAt: voucher.expiresAt,
    }
  }
}
