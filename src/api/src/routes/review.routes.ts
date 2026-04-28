import { Router } from 'express'
import { ReviewController } from '../controllers/review.controller'
import { authenticateToken } from '../middleware/auth.middleware'

const router = Router()

// ============================================
// PUBLIC ROUTES
// ============================================

// Get event reviews (public)
router.get('/event/:eventId', ReviewController.getEventReviews)

// Get event reviews by slug (public - for event detail page)
router.get('/event/by-slug/:slug', ReviewController.getEventReviewsBySlug)

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

// Respond to review (organizer only)
router.post('/:id/respond', ReviewController.respondToReview)

// Get organizer's reviews
router.get('/organizer', ReviewController.getOrganizerReviews)

export default router
