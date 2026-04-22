import { Request, Response } from 'express'
import { VoucherService } from '../services/voucher.service'

export class VoucherController {
  // POST /api/organizer/events/:eventId/vouchers - Create voucher
  static async createVoucher(req: Request, res: Response) {
    try {
      const userId = (req as any).user.userId
      const eventId = parseInt(req.params.eventId)
      const voucherData = req.body

      const result = await VoucherService.createVoucher(
        userId,
        eventId,
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

  // GET /api/organizer/events/:eventId/vouchers - Get event vouchers
  static async getEventVouchers(req: Request, res: Response) {
    try {
      const userId = (req as any).user.userId
      const eventId = parseInt(req.params.eventId)

      const result = await VoucherService.getEventVouchers(userId, eventId)

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

  // DELETE /api/organizer/events/:eventId/vouchers/:voucherId - Delete voucher
  static async deleteVoucher(req: Request, res: Response) {
    try {
      const userId = (req as any).user.userId
      const eventId = parseInt(req.params.eventId)
      const voucherId = parseInt(req.params.voucherId)

      const result = await VoucherService.deleteVoucher(
        userId,
        eventId,
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
