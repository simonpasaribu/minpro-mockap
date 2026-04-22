import { Router } from 'express'
import { TransactionController } from '../controllers/transaction.controller'
import { authenticateToken } from '../middleware/auth.middleware'

const router = Router()

// All transaction routes are protected
router.use(authenticateToken)

// ============================================
// CUSTOMER TRANSACTIONS
// ============================================

// Create new transaction (checkout)
router.post('/', TransactionController.createTransaction)

// Get user's transactions
router.get('/', TransactionController.getUserTransactions)

// Get single transaction
router.get('/:id', TransactionController.getTransactionById)

// Upload payment proof
router.put('/:id/payment-proof', TransactionController.uploadPaymentProof)

// Cancel transaction
router.put('/:id/cancel', TransactionController.cancelTransaction)

export default router
