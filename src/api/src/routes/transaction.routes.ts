import { Router } from 'express'
import multer from 'multer'
import { TransactionController } from '../controllers/transaction.controller'
import { authenticateToken } from '../middleware/auth.middleware'

const router = Router()

// Setup multer for file upload with 5MB limit
const upload = multer({
  dest: 'uploads/',
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true)
    } else {
      cb(new Error('Only image files are allowed'))
    }
  }
})

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

// Upload payment proof (via backend)
router.put('/:id/payment-proof', upload.single('paymentProof'), TransactionController.uploadPaymentProofBackend)

// Cancel transaction
router.put('/:id/cancel', TransactionController.cancelTransaction)

export default router
