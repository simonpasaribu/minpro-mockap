import { Request, Response } from 'express'
import { ReviewService } from '../services/review.service'

export class ReviewController {
  // POST /api/reviews - Create new review
  static async createReview(req: Request, res: Response) {
    try {
      const userId = (req as any).user.userId
      const { transactionId, rating, comment } = req.body

      const result = await ReviewService.createReview(
        userId,
        parseInt(transactionId),
        parseInt(rating),
        comment
      )

      res.status(201).json({
        success: true,
        message: 'Review created successfully',
        data: result,
      })
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message || 'Failed to create review',
      })
    }
  }

  // GET /api/reviews/my-reviews - Get user's reviews
  static async getUserReviews(req: Request, res: Response) {
    try {
      const userId = (req as any).user.userId

      const result = await ReviewService.getUserReviews(userId)

      res.status(200).json({
        success: true,
        data: result,
      })
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message || 'Failed to get reviews',
      })
    }
  }

  // GET /api/reviews/event/:eventId - Get event reviews (public)
  static async getEventReviews(req: Request, res: Response) {
    try {
      const eventId = parseInt(req.params.eventId)

      const result = await ReviewService.getEventReviews(eventId)

      res.status(200).json({
        success: true,
        data: result,
      })
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message || 'Failed to get reviews',
      })
    }
  }

  // GET /api/reviews/can-review/:transactionId - Check if can review
  static async canReview(req: Request, res: Response) {
    try {
      const userId = (req as any).user.userId
      const transactionId = parseInt(req.params.transactionId)

      const result = await ReviewService.canReviewTransaction(
        userId,
        transactionId
      )

      res.status(200).json({
        success: true,
        data: result,
      })
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message || 'Failed to check review status',
      })
    }
  }

  // PUT /api/reviews/:id - Update review
  static async updateReview(req: Request, res: Response) {
    try {
      const userId = (req as any).user.userId
      const reviewId = parseInt(req.params.id)
      const { rating, comment } = req.body

      const result = await ReviewService.updateReview(
        reviewId,
        userId,
        parseInt(rating),
        comment
      )

      res.status(200).json({
        success: true,
        message: 'Review updated successfully',
        data: result,
      })
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message || 'Failed to update review',
      })
    }
  }

  // DELETE /api/reviews/:id - Delete review
  static async deleteReview(req: Request, res: Response) {
    try {
      const userId = (req as any).user.userId
      const reviewId = parseInt(req.params.id)

      const result = await ReviewService.deleteReview(reviewId, userId)

      res.status(200).json({
        success: true,
        message: result.message,
      })
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message || 'Failed to delete review',
      })
    }
  }
}
