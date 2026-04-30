import { Request, Response, NextFunction } from 'express'
import { EventService } from '../services/event.service'

export class EventController {
  // POST /api/events - Create new event (Organizer only)
  static async createEvent(req: Request, res: Response) {
    try {
      const userId = (req as any).user.userId
      const eventData = req.body

      const result = await EventService.createEvent(userId, eventData)

      res.status(201).json({
        success: true,
        message: 'Event created successfully',
        data: result,
      })
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message || 'Failed to create event',
      })
    }
  }

  // GET /api/events - Get all events (public)
  static async getEvents(req: Request, res: Response) {
    try {
      const filters = {
        category: req.query.category as string,
        search: req.query.search as string,
      }

      const result = await EventService.getPublishedEvents(filters)

      res.status(200).json({
        success: true,
        data: result,
      })
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message || 'Failed to get events',
      })
    }
  }

  // GET /api/organizer/events - Get organizer's events
  static async getOrganizerEvents(req: Request, res: Response) {
    try {
      const userId = (req as any).user.userId

      const result = await EventService.getOrganizerEvents(userId)

      res.status(200).json({
        success: true,
        data: result,
      })
    } catch (error: any) {
      console.error('getEventBySlug error:', error)
      res.status(400).json({
        success: false,
        message: error.message || 'Failed to get events',
      })
    }
  }

  // GET /api/events/:slug - Get single event by slug
  static async getEventById(req: Request, res: Response) {
    try {
      const slug = req.params.slug
      const userId = (req as any).user.userId

      const result = await EventService.getEventBySlug(slug, userId)

      res.status(200).json({
        success: true,
        data: result,
      })
    } catch (error: any) {
      console.error('getEventBySlug error:', error)
      res.status(404).json({
        success: false,
        message: error.message || 'Event not found',
      })
    }
  }

  // PUT /api/events/:slug - Update event
  static async updateEvent(req: Request, res: Response) {
    try {
      const slug = req.params.slug
      const userId = (req as any).user.userId
      const eventData = req.body

      const result = await EventService.updateEventBySlug(slug, userId, eventData)

      res.status(200).json({
        success: true,
        message: 'Event updated successfully',
        data: result,
      })
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message || 'Failed to update event',
      })
    }
  }

  // DELETE /api/events/:slug - Delete event
  static async deleteEvent(req: Request, res: Response) {
    try {
      const slug = req.params.slug
      const userId = (req as any).user.userId

      const result = await EventService.deleteEventBySlug(slug, userId)

      res.status(200).json({
        success: true,
        message: result.message,
      })
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message || 'Failed to delete event',
      })
    }
  }

  // GET /api/events/stats - Get public platform statistics
  static async getPublicStats(req: Request, res: Response) {
    try {
      const result = await EventService.getPublicStats()

      res.status(200).json({
        success: true,
        data: result,
      })
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message || 'Failed to get statistics',
      })
    }
  }

  // POST /organizer/events/:eventId/image - Upload event image
  static async uploadEventImage(req: Request, res: Response, next: NextFunction) {
    try {
      const { eventId } = req.params
      const userId = (req as any).user?.userId

      if (!req.file) {
        return res.status(400).json({ success: false, message: 'No file uploaded' })
      }

      const { cloudinary } = await import('../utils/cloudinary')
      const { prisma } = await import('../utils/prisma')
      const fs = await import('fs')

      // Verify event exists and belongs to user
      const event = await prisma.event.findFirst({
        where: { id: Number(eventId), organizerId: userId }
      })

      if (!event) {
        fs.unlinkSync(req.file.path)
        return res.status(404).json({ success: false, message: 'Event not found or unauthorized' })
      }

      // Upload to Cloudinary
      const folderPath = `events/${userId}/${eventId}`
      const result = await cloudinary.uploader.upload(req.file.path, {
        folder: folderPath,
        public_id: `event_${eventId}_${Date.now()}`,
        resource_type: 'auto',
        overwrite: true,
      })

      // Delete temp file
      fs.unlinkSync(req.file.path)

      // Update event with image URL
      await prisma.event.update({
        where: { id: Number(eventId) },
        data: { imageUrl: result.secure_url }
      })

      res.status(200).json({
        success: true,
        message: 'Event image uploaded successfully',
        data: { imageUrl: result.secure_url }
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
}
