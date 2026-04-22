import { Request, Response } from 'express'
import { TransactionService } from '../services/transaction.service'

export class TransactionController {
  // POST /api/transactions - Create new transaction (checkout)
  static async createTransaction(req: Request, res: Response) {
    try {
      const userId = (req as any).user.userId
      const { eventId, ticketCount, pointsToUse, voucherCode } = req.body

      const result = await TransactionService.createTransaction(
        userId,
        parseInt(eventId),
        parseInt(ticketCount),
        parseInt(pointsToUse || 0),
        voucherCode
      )

      res.status(201).json({
        success: true,
        message: 'Transaction created successfully',
        data: result,
      })
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message || 'Failed to create transaction',
      })
    }
  }

  // GET /api/transactions - Get user's transactions
  static async getUserTransactions(req: Request, res: Response) {
    try {
      const userId = (req as any).user.userId
      const { status } = req.query

      const result = await TransactionService.getUserTransactions(
        userId,
        status as string
      )

      res.status(200).json({
        success: true,
        data: result,
      })
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message || 'Failed to get transactions',
      })
    }
  }

  // GET /api/transactions/:id - Get single transaction
  static async getTransactionById(req: Request, res: Response) {
    try {
      const userId = (req as any).user.userId
      const transactionId = parseInt(req.params.id)

      const result = await TransactionService.getTransactionById(
        transactionId,
        userId
      )

      res.status(200).json({
        success: true,
        data: result,
      })
    } catch (error: any) {
      res.status(404).json({
        success: false,
        message: error.message || 'Transaction not found',
      })
    }
  }

  // PUT /api/transactions/:id/payment-proof - Upload payment proof
  static async uploadPaymentProof(req: Request, res: Response) {
    try {
      const userId = (req as any).user.userId
      const transactionId = parseInt(req.params.id)
      const { paymentProofUrl } = req.body

      const result = await TransactionService.uploadPaymentProof(
        transactionId,
        userId,
        paymentProofUrl
      )

      res.status(200).json({
        success: true,
        message: 'Payment proof uploaded successfully',
        data: result,
      })
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message || 'Failed to upload payment proof',
      })
    }
  }

  // PUT /api/transactions/:id/cancel - Cancel transaction
  static async cancelTransaction(req: Request, res: Response) {
    try {
      const userId = (req as any).user.userId
      const transactionId = parseInt(req.params.id)

      const result = await TransactionService.cancelTransaction(
        transactionId,
        userId
      )

      res.status(200).json({
        success: true,
        message: result.message,
      })
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message || 'Failed to cancel transaction',
      })
    }
  }
}
