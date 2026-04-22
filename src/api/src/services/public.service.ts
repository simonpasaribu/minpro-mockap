import { prisma } from '../utils/prisma'

export class PublicService {
  // Get all published events with filters (for landing page)
  static async getPublishedEvents(filters?: any) {
    const where: any = { isPublished: true }

    // Filter by category
    if (filters?.category) {
      where.category = filters.category
    }

    // Filter by location
    if (filters?.location) {
      where.location = { contains: filters.location, mode: 'insensitive' }
    }

    // Search by title, description, or location (debounce handled on frontend)
    if (filters?.search) {
      where.OR = [
        { title: { contains: filters.search, mode: 'insensitive' } },
        { description: { contains: filters.search, mode: 'insensitive' } },
        { location: { contains: filters.search, mode: 'insensitive' } },
      ]
    }

    // Filter by free/paid
    if (filters?.isFree) {
      where.price = 0
    }

    // Filter by date range
    if (filters?.startDate || filters?.endDate) {
      where.startDate = {}
      if (filters.startDate) {
        where.startDate.gte = new Date(filters.startDate)
      }
      if (filters.endDate) {
        where.startDate.lte = new Date(filters.endDate)
      }
    }

    const events = await prisma.event.findMany({
      where,
      include: {
        organizer: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            profilePicture: true,
          },
        },
        _count: {
          select: {
            transactions: {
              where: {
                status: { in: ['DONE', 'WAITING_CONFIRMATION'] },
              },
            },
            reviews: true,
          },
        },
      },
      orderBy: { startDate: 'asc' },
    })

    return events
  }

  // Get single event details (public view)
  static async getEventDetails(eventId: number) {
    const event = await prisma.event.findUnique({
      where: { id: eventId, isPublished: true },
      include: {
        organizer: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            profilePicture: true,
            phone: true,
          },
        },
        vouchers: {
          where: {
            expiresAt: { gt: new Date() },
            quota: { gt: prisma.eventVoucher.fields.usedCount },
          },
          select: {
            code: true,
            discount: true,
            expiresAt: true,
          },
        },
        reviews: {
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
        },
        _count: {
          select: {
            transactions: {
              where: {
                status: { in: ['DONE', 'WAITING_CONFIRMATION'] },
              },
            },
          },
        },
      },
    })

    if (!event) {
      throw new Error('Event not found')
    }

    // Calculate average rating
    const avgRating = event.reviews.length > 0
      ? event.reviews.reduce((sum, r) => sum + r.rating, 0) / event.reviews.length
      : 0

    return {
      ...event,
      avgRating: parseFloat(avgRating.toFixed(1)),
    }
  }

  // Get public organizer profile with reviews
  static async getOrganizerProfile(organizerId: number) {
    const organizer = await prisma.user.findUnique({
      where: { id: organizerId, role: 'ORGANIZER' },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        profilePicture: true,
        email: true,
        phone: true,
        events: {
          where: { isPublished: true },
          select: {
            id: true,
            title: true,
            imageUrl: true,
            startDate: true,
            location: true,
            price: true,
            _count: {
              select: {
                transactions: {
                  where: {
                    status: { in: ['DONE', 'WAITING_CONFIRMATION'] },
                  },
                },
                reviews: true,
              },
            },
          },
          orderBy: { startDate: 'desc' },
        },
      },
    })

    if (!organizer) {
      throw new Error('Organizer not found')
    }

    // Get all reviews for organizer's events
    const eventIds = organizer.events.map(e => e.id)
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
      ...organizer,
      reviews,
      avgRating: parseFloat(avgRating.toFixed(1)),
      totalReviews: reviews.length,
    }
  }

  // Get all event categories
  static async getCategories() {
    return [
      'MUSIC',
      'SPORTS',
      'TECHNOLOGY',
      'BUSINESS',
      'ARTS',
      'FOOD',
      'EDUCATION',
      'OTHER',
    ]
  }
}
