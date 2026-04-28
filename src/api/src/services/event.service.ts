import { prisma } from '../utils/prisma'
import { generateSlug } from '../utils/slug'

export class EventService {
  // Create new event (Organizer only)
  static async createEvent(userId: number, eventData: any) {
    const slug = generateSlug(eventData.title)
    const event = await prisma.event.create({
      data: {
        title: eventData.title,
        slug,
        description: eventData.description,
        location: eventData.location,
        eventLink: eventData.eventLink || null,
        category: eventData.category || 'OTHER',
        price: eventData.price || 0,
        totalSeats: eventData.totalSeats,
        availableSeats: eventData.totalSeats,
        startDate: new Date(eventData.startDate),
        endDate: eventData.endDate ? new Date(eventData.endDate) : null,
        registrationDeadline: eventData.registrationDeadline ? new Date(eventData.registrationDeadline) : null,
        imageUrl: eventData.imageUrl || 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=1200&q=80',
        organizerId: userId,
        isPublished: eventData.isPublished || false,
      },
    })

    // Auto-create Early Bird voucher (5-10% of total seats, 20% discount, expires H-7)
    const earlyBirdQuota = Math.ceil(eventData.totalSeats * 0.1) // 10% of seats
    const earlyBirdExpiresAt = new Date(eventData.startDate)
    earlyBirdExpiresAt.setDate(earlyBirdExpiresAt.getDate() - 7) // H-7

    await prisma.eventVoucher.create({
      data: {
        eventId: event.id,
        code: `EARLY${event.id}`,
        discount: 20, // 20% discount
        quota: earlyBirdQuota,
        usedCount: 0,
        expiresAt: earlyBirdExpiresAt,
      },
    })

    return event
  }

  // Get all events for an organizer
  static async getOrganizerEvents(userId: number) {
    const events = await prisma.event.findMany({
      where: { organizerId: userId },
      include: {
        _count: {
          select: {
            transactions: true,
            reviews: true,
          },
        },
        transactions: {
          where: {
            status: 'DONE',
          },
          select: {
            ticketCount: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    // Calculate sold tickets from completed transactions
    return events.map(event => ({
      ...event,
      soldTickets: event.transactions.reduce((sum, t) => sum + t.ticketCount, 0),
    }))
  }

  // Get single event by ID
  static async getEventById(eventId: number, userId: number) {
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      include: {
        organizer: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        _count: {
          select: {
            transactions: true,
            reviews: true,
          },
        },
      },
    })

    if (!event) {
      throw new Error('Event not found')
    }

    // Check if user is the organizer
    if (event.organizerId !== userId) {
      throw new Error('Unauthorized to view this event')
    }

    return event
  }

  // Update event
  static async updateEvent(eventId: number, userId: number, eventData: any) {
    // Check if event exists and belongs to user
    const existingEvent = await prisma.event.findUnique({
      where: { id: eventId },
    })

    if (!existingEvent) {
      throw new Error('Event not found')
    }

    if (existingEvent.organizerId !== userId) {
      throw new Error('Unauthorized to update this event')
    }

    const updatedEvent = await prisma.event.update({
      where: { id: eventId },
      data: {
        ...(eventData.title && { title: eventData.title }),
        ...(eventData.description && { description: eventData.description }),
        ...(eventData.location && { location: eventData.location }),
        ...(eventData.eventLink !== undefined && { eventLink: eventData.eventLink }),
        ...(eventData.category && { category: eventData.category }),
        ...(eventData.price !== undefined && { price: eventData.price }),
        ...(eventData.totalSeats && { totalSeats: eventData.totalSeats }),
        ...(eventData.startDate && { startDate: new Date(eventData.startDate) }),
        ...(eventData.endDate && { endDate: new Date(eventData.endDate) }),
        ...(eventData.registrationDeadline && { registrationDeadline: new Date(eventData.registrationDeadline) }),
        ...(eventData.imageUrl !== undefined && { imageUrl: eventData.imageUrl }),
        ...(eventData.isPublished !== undefined && { isPublished: eventData.isPublished }),
      },
    })

    return updatedEvent
  }

  // Get event by slug
  static async getEventBySlug(slug: string, userId: number) {
    const event = await prisma.event.findUnique({
      where: { slug },
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
          },
          orderBy: { createdAt: 'desc' },
        },
        _count: {
          select: {
            transactions: true,
            reviews: true,
          },
        },
      },
    })

    if (!event) {
      throw new Error('Event not found')
    }

    // Check if user is the organizer
    if (event.organizerId !== userId) {
      throw new Error('Unauthorized to view this event')
    }

    return event
  }

  // Update event by slug
  static async updateEventBySlug(slug: string, userId: number, eventData: any) {
    // Check if event exists
    const existingEvent = await prisma.event.findUnique({
      where: { slug },
    })

    if (!existingEvent) {
      throw new Error('Event not found')
    }

    if (existingEvent.organizerId !== userId) {
      throw new Error('Unauthorized to update this event')
    }

    // Generate new slug if title changed
    let newSlug = existingEvent.slug
    if (eventData.title && eventData.title !== existingEvent.title) {
      newSlug = generateSlug(eventData.title)
    }

    const updatedEvent = await prisma.event.update({
      where: { id: existingEvent.id },
      data: {
        ...(eventData.title && { title: eventData.title, slug: newSlug }),
        ...(eventData.description && { description: eventData.description }),
        ...(eventData.location && { location: eventData.location }),
        ...(eventData.eventLink !== undefined && { eventLink: eventData.eventLink }),
        ...(eventData.category && { category: eventData.category }),
        ...(eventData.price !== undefined && { price: eventData.price }),
        ...(eventData.totalSeats && { totalSeats: eventData.totalSeats }),
        ...(eventData.startDate && { startDate: new Date(eventData.startDate) }),
        ...(eventData.endDate && { endDate: eventData.endDate ? new Date(eventData.endDate) : null }),
        ...(eventData.registrationDeadline && { registrationDeadline: eventData.registrationDeadline ? new Date(eventData.registrationDeadline) : null }),
        ...(eventData.imageUrl && { imageUrl: eventData.imageUrl }),
        ...(eventData.isPublished !== undefined && { isPublished: eventData.isPublished }),
      },
    })

    return updatedEvent
  }

  // Delete event
  static async deleteEvent(eventId: number, userId: number) {
    // Check if event exists and belongs to user
    const existingEvent = await prisma.event.findUnique({
      where: { id: eventId },
    })

    if (!existingEvent) {
      throw new Error('Event not found')
    }

    if (existingEvent.organizerId !== userId) {
      throw new Error('Unauthorized to delete this event')
    }

    // Check if event has transactions
    const transactionCount = await prisma.transaction.count({
      where: { eventId },
    })

    if (transactionCount > 0) {
      throw new Error('Cannot delete event with existing transactions')
    }

    await prisma.event.delete({
      where: { id: eventId },
    })

    return { message: 'Event deleted successfully' }
  }

  // Delete event by slug
  static async deleteEventBySlug(slug: string, userId: number) {
    const existingEvent = await prisma.event.findUnique({ where: { slug } })
    if (!existingEvent) throw new Error('Event not found')
    if (existingEvent.organizerId !== userId) throw new Error('Unauthorized')
    
    const transactionCount = await prisma.transaction.count({
      where: { eventId: existingEvent.id },
    })
    if (transactionCount > 0) throw new Error('Cannot delete event with transactions')
    
    await prisma.event.delete({ where: { id: existingEvent.id } })
    return { message: 'Event deleted successfully' }
  }

  // Get published events (for public browsing - Simon's feature)
  static async getPublishedEvents(filters?: any) {
    const where: any = { isPublished: true }

    if (filters?.category) {
      where.category = filters.category
    }

    if (filters?.search) {
      where.OR = [
        { title: { contains: filters.search, mode: 'insensitive' } },
        { description: { contains: filters.search, mode: 'insensitive' } },
        { location: { contains: filters.search, mode: 'insensitive' } },
      ]
    }

    const events = await prisma.event.findMany({
      where,
      include: {
        organizer: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        _count: {
          select: {
            transactions: true,
            reviews: true,
          },
        },
      },
      orderBy: { startDate: 'asc' },
    })

    return events
  }

  // Get public platform statistics
  static async getPublicStats() {
    const [totalEvents, ticketBooks, activeOrganizers] = await Promise.all([
      // Total event yang sudah dipublikasikan
      prisma.event.count({ where: { isPublished: true } }),
      // Total tiket terjual (transaksi sukses)
      prisma.transaction.count({ where: { status: 'DONE' } }),
      // Total organizer yang punya event aktif
      prisma.user.count({
        where: {
          role: 'ORGANIZER',
          events: { some: { isPublished: true } }
        }
      })
    ])

    return {
      totalEvents,
      ticketBooks,
      activeOrganizers
    }
  }
}
