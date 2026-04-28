import { prisma } from '../utils/prisma'
import { TransactionStatus } from '../../generated/prisma/enums'

export class ReviewService {
  // Create review (only if transaction is DONE and event has ended) - Nomor 3-A
  static async createReview(
    userId: number,
    transactionId: number,
    rating: number,
    comment?: string
  ) {
    // Validate rating (1-5)
    if (rating < 1 || rating > 5) {
      throw new Error('Rating must be between 1 and 5')
    }

    // Get transaction with event
    const transaction = await prisma.transaction.findUnique({
      where: { id: transactionId },
      include: { event: true },
    })

    if (!transaction) {
      throw new Error('Transaction not found')
    }

    if (transaction.userId !== userId) {
      throw new Error('Unauthorized')
    }

    // Check if transaction status is DONE
    if (transaction.status !== TransactionStatus.DONE) {
      throw new Error('Can only review completed transactions')
    }

    // Check if event has ended
    const now = new Date()
    const eventEndDate = transaction.event.endDate || transaction.event.startDate
    if (eventEndDate > now) {
      throw new Error('Can only review after the event has ended')
    }

    // Check if review already exists
    const existingReview = await prisma.review.findUnique({
      where: { transactionId },
    })

    if (existingReview) {
      throw new Error('You have already reviewed this transaction')
    }

    // Create review
    const review = await prisma.review.create({
      data: {
        transactionId,
        eventId: transaction.eventId,
        userId,
        rating,
        comment: comment || null,
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            profilePicture: true,
          },
        },
        event: {
          select: {
            id: true,
            title: true,
          },
        },
      },
    })

    return review
  }

  // Get reviews for an event
  static async getEventReviews(eventId: number) {
    const reviews = await prisma.review.findMany({
      where: { eventId },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            profilePicture: true,
          },
        },
        transaction: {
          select: {
            ticketCount: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    // Calculate average rating
    const avgRating = reviews.length > 0
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
      : 0

    return {
      reviews,
      avgRating: parseFloat(avgRating.toFixed(1)),
      totalReviews: reviews.length,
    }
  }

  // Get user's reviews
  static async getUserReviews(userId: number) {
    const reviews = await prisma.review.findMany({
      where: { userId },
      include: {
        event: {
          select: {
            id: true,
            title: true,
            imageUrl: true,
            startDate: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    return reviews
  }

  // Update review
  static async updateReview(
    reviewId: number,
    userId: number,
    rating: number,
    comment?: string
  ) {
    // Validate rating
    if (rating < 1 || rating > 5) {
      throw new Error('Rating must be between 1 and 5')
    }

    const review = await prisma.review.findUnique({
      where: { id: reviewId },
    })

    if (!review) {
      throw new Error('Review not found')
    }

    if (review.userId !== userId) {
      throw new Error('Unauthorized')
    }

    const updated = await prisma.review.update({
      where: { id: reviewId },
      data: {
        rating,
        comment: comment || null,
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        event: {
          select: {
            id: true,
            title: true,
          },
        },
      },
    })

    return updated
  }

  // Delete review
  static async deleteReview(reviewId: number, userId: number) {
    const review = await prisma.review.findUnique({
      where: { id: reviewId },
    })

    if (!review) {
      throw new Error('Review not found')
    }

    if (review.userId !== userId) {
      throw new Error('Unauthorized')
    }

    await prisma.review.delete({
      where: { id: reviewId },
    })

    return { message: 'Review deleted successfully' }
  }

  // Check if user can review a transaction
  static async canReviewTransaction(userId: number, transactionId: number) {
    const transaction = await prisma.transaction.findUnique({
      where: { id: transactionId },
      include: { event: true },
    })

    if (!transaction) {
      return { canReview: false, reason: 'Transaction not found' }
    }

    if (transaction.userId !== userId) {
      return { canReview: false, reason: 'Unauthorized' }
    }

    if (transaction.status !== TransactionStatus.DONE) {
      return { canReview: false, reason: 'Transaction is not completed' }
    }

    const now = new Date()
    const eventEndDate = transaction.event.endDate || transaction.event.startDate
    if (eventEndDate > now) {
      return { canReview: false, reason: 'Event has not ended yet' }
    }

    const existingReview = await prisma.review.findUnique({
      where: { transactionId },
    })

    if (existingReview) {
      return { canReview: false, reason: 'Already reviewed' }
    }

    return { canReview: true }
  }

  // Respond to review (organizer or customer)
  static async respondToReview(
    reviewId: number,
    userId: number,
    response: string
  ) {
    const review = await prisma.review.findUnique({
      where: { id: reviewId },
      include: { event: true },
    })

    if (!review) {
      throw new Error('Review not found')
    }

    // Allow both organizer and customers to respond
    // Store the response (this will overwrite any existing response)
    const updated = await prisma.review.update({
      where: { id: reviewId },
      data: {
        response,
        respondedAt: new Date(),
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            profilePicture: true,
          },
        },
        event: {
          select: {
            id: true,
            title: true,
            organizerId: true,
          },
        },
      },
    })

    return updated
  }

  // Get reviews for organizer's events
  static async getOrganizerReviews(organizerId: number) {
    const events = await prisma.event.findMany({
      where: { organizerId },
      select: { id: true },
    })

    const eventIds = events.map(e => e.id)

    const reviews = await prisma.review.findMany({
      where: { eventId: { in: eventIds } },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            profilePicture: true,
          },
        },
        event: {
          select: {
            id: true,
            title: true,
            slug: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    return reviews
  }

  // Get event reviews by slug
  static async getEventReviewsBySlug(slug: string) {
    const event = await prisma.event.findUnique({
      where: { slug },
      select: { 
        id: true, 
        title: true, 
        organizerId: true,
      },
    })

    if (!event) {
      throw new Error('Event not found')
    }

    // Get organizer info
    const organizer = await prisma.user.findUnique({
      where: { id: event.organizerId },
      select: {
        firstName: true,
        lastName: true,
      },
    })

    const reviews = await prisma.review.findMany({
      where: { eventId: event.id },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            profilePicture: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    // Add event data to each review
    const reviewsWithEvent = reviews.map(review => ({
      ...review,
      event: {
        id: event.id,
        organizerId: event.organizerId,
      },
    }))

    return {
      reviews: reviewsWithEvent,
      eventTitle: event.title,
      event: {
        id: event.id,
        organizerId: event.organizerId,
        organizerFirstName: organizer?.firstName,
        organizerLastName: organizer?.lastName,
      },
    }
  }
}
