import { Request, Response } from 'express'
import { VoucherService } from '../services/voucher.service'

export class VoucherController {
  // POST /api/organizer/events/:slug/vouchers - Create voucher
  static async createVoucher(req: Request, res: Response) {
    try {
      const userId = (req as any).user.userId
      const slug = req.params.slug
      const voucherData = req.body

      const result = await VoucherService.createVoucher(
        userId,
        slug,
        voucherData
      )

      res.status(201).json({
        success: true,
        message: 'Voucher created successfully',
        data: result,
      })
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message || 'Failed to create voucher',
      })
    }
  }

  // GET /api/organizer/events/:slug/vouchers - Get event vouchers
  static async getEventVouchers(req: Request, res: Response) {
    try {
      const userId = (req as any).user.userId
      const slug = req.params.slug

      const result = await VoucherService.getEventVouchers(userId, slug)

      res.status(200).json({
        success: true,
        data: result,
      })
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message || 'Failed to get vouchers',
      })
    }
  }

  // DELETE /api/organizer/events/:slug/vouchers/:voucherId - Delete voucher
  static async deleteVoucher(req: Request, res: Response) {
    try {
      const userId = (req as any).user.userId
      const slug = req.params.slug
      const voucherId = parseInt(req.params.voucherId)

      const result = await VoucherService.deleteVoucher(
        userId,
        slug,
        voucherId
      )

      res.status(200).json({
        success: true,
        message: result.message,
      })
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message || 'Failed to delete voucher',
      })
    }
  }

  // POST /api/vouchers/validate - Validate voucher (public)
  static async validateVoucher(req: Request, res: Response) {
    try {
      const { eventId, code } = req.body

      const result = await VoucherService.validateVoucher(
        parseInt(eventId),
        code
      )

      res.status(200).json({
        success: true,
        data: result,
      })
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message || 'Invalid voucher',
      })
    }
  }
}
