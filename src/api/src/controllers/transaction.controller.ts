import { Request, Response, NextFunction } from 'express'
import { TransactionService } from '../services/transaction.service'

export class TransactionController {
  // POST /api/transactions - Create new transaction (checkout)
  static async createTransaction(req: Request, res: Response) {
    try {
      const userId = (req as any).user.userId
      const { eventId, ticketCount, pointsToUse, voucherCode, attendeeDetails } = req.body

      const result = await TransactionService.createTransaction(
        userId,
        parseInt(eventId),
        parseInt(ticketCount),
        parseInt(pointsToUse || 0),
        voucherCode,
        attendeeDetails
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

  // PUT /api/transactions/:id/payment-proof - Upload payment proof via backend
  static async uploadPaymentProofBackend(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user.userId
      const transactionId = parseInt(req.params.id)

      if (!req.file) {
        return res.status(400).json({ success: false, message: 'No file uploaded' })
      }

      const { cloudinary } = await import('../utils/cloudinary')
      const { prisma } = await import('../utils/prisma')
      const fs = await import('fs')

      // Verify transaction exists and belongs to user
      const transaction = await prisma.transaction.findFirst({
        where: { id: transactionId, userId: userId }
      })

      if (!transaction) {
        fs.unlinkSync(req.file.path)
        return res.status(404).json({ success: false, message: 'Transaction not found or unauthorized' })
      }

      // Upload to Cloudinary
      const folderPath = `users/${userId}/transactions/${transactionId}`
      const result = await cloudinary.uploader.upload(req.file.path, {
        folder: folderPath,
        public_id: `payment_${Date.now()}`,
        resource_type: 'auto',
        overwrite: true,
      })

      // Delete temp file
      fs.unlinkSync(req.file.path)

      // Update transaction with payment proof URL
      await prisma.transaction.update({
        where: { id: transactionId },
        data: {
          paymentProofUrl: result.secure_url,
          status: 'WAITING_CONFIRMATION'
        }
      })

      res.status(200).json({
        success: true,
        message: 'Payment proof uploaded successfully',
        data: { paymentProofUrl: result.secure_url }
      })
    } catch (error: any) {
      // Clean up temp file if exists
      if (req.file?.path) {
        const fs = await import('fs')
        if (fs.existsSync(req.file.path)) {
          fs.unlinkSync(req.file.path)
        }
      }
      next(error)
    }
  }

  // PUT /api/transactions/:id/confirm-free - Confirm free transaction (no payment)
  static async confirmFreeTransaction(req: Request, res: Response) {
    try {
      const userId = (req as any).user.userId
      const transactionId = parseInt(req.params.id)

      const { prisma } = await import('../utils/prisma')

      // Verify transaction exists, belongs to user, and is free
      const transaction = await prisma.transaction.findFirst({
        where: { 
          id: transactionId, 
          userId: userId,
          status: 'WAITING_PAYMENT',
          totalAmount: 0
        }
      })

      if (!transaction) {
        return res.status(404).json({ 
          success: false, 
          message: 'Transaction not found, not authorized, or not a free transaction' 
        })
      }

      // Update transaction to DONE status
      await prisma.transaction.update({
        where: { id: transactionId },
        data: {
          status: 'DONE',
          confirmedAt: new Date()
        }
      })

      res.status(200).json({
        success: true,
        message: 'Free transaction confirmed successfully',
      })
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message || 'Failed to confirm free transaction',
      })
    }
  }
}
