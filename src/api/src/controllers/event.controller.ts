import { Request, Response } from 'express'
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
      res.status(400).json({
        success: false,
        message: error.message || 'Failed to get events',
      })
    }
  }

  // GET /api/events/:id - Get single event by ID
  static async getEventById(req: Request, res: Response) {
    try {
      const eventId = parseInt(req.params.id)
      const userId = (req as any).user.userId

      const result = await EventService.getEventById(eventId, userId)

      res.status(200).json({
        success: true,
        data: result,
      })
    } catch (error: any) {
      res.status(404).json({
        success: false,
        message: error.message || 'Event not found',
      })
    }
  }

  // PUT /api/events/:id - Update event
  static async updateEvent(req: Request, res: Response) {
    try {
      const eventId = parseInt(req.params.id)
      const userId = (req as any).user.userId
      const eventData = req.body

      const result = await EventService.updateEvent(eventId, userId, eventData)

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

  // DELETE /api/events/:id - Delete event
  static async deleteEvent(req: Request, res: Response) {
    try {
      const eventId = parseInt(req.params.id)
      const userId = (req as any).user.userId

      const result = await EventService.deleteEvent(eventId, userId)

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
}
