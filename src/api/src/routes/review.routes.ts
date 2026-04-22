import { Router } from 'express'
import { ReviewController } from '../controllers/review.controller'
import { authenticateToken } from '../middleware/auth.middleware'

const router = Router()

// ============================================
// PUBLIC ROUTES
// ============================================

// Get event reviews (public)
router.get('/event/:eventId', ReviewController.getEventReviews)

// ============================================
// PROTECTED ROUTES
// ============================================

router.use(authenticateToken)

// Create review
router.post('/', ReviewController.createReview)

// Get user's reviews
router.get('/my-reviews', ReviewController.getUserReviews)

// Check if can review
router.get('/can-review/:transactionId', ReviewController.canReview)

// Update review
router.put('/:id', ReviewController.updateReview)

// Delete review
router.delete('/:id', ReviewController.deleteReview)

export default router
