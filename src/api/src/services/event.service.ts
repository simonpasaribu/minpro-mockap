import { prisma } from '../utils/prisma'

export class EventService {
  // Create new event (Organizer only)
  static async createEvent(userId: number, eventData: any) {
    const event = await prisma.event.create({
      data: {
        title: eventData.title,
        description: eventData.description,
        location: eventData.location,
        category: eventData.category || 'OTHER',
        price: eventData.price || 0,
        totalSeats: eventData.totalSeats,
        availableSeats: eventData.totalSeats,
        startDate: new Date(eventData.startDate),
        endDate: eventData.endDate ? new Date(eventData.endDate) : null,
        registrationDeadline: eventData.registrationDeadline ? new Date(eventData.registrationDeadline) : null,
        imageUrl: eventData.imageUrl || null,
        organizerId: userId,
        isPublished: eventData.isPublished || false,
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
      },
      orderBy: { createdAt: 'desc' },
    })

    return events
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
}
