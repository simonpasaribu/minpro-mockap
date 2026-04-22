import { Request, Response } from 'express'
import { PublicService } from '../services/public.service'

export class PublicController {
  // GET /api/events - Get all published events with filters
  static async getPublishedEvents(req: Request, res: Response) {
    try {
      const filters = {
        category: req.query.category as string,
        location: req.query.location as string,
        search: req.query.search as string,
        isFree: req.query.isFree === 'true',
        startDate: req.query.startDate as string,
        endDate: req.query.endDate as string,
      }

      const result = await PublicService.getPublishedEvents(filters)

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

  // GET /api/events/:id - Get single event details (public)
  static async getEventDetails(req: Request, res: Response) {
    try {
      const eventId = parseInt(req.params.id)
      const result = await PublicService.getEventDetails(eventId)

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

  // GET /api/organizers/:id - Get public organizer profile
  static async getOrganizerProfile(req: Request, res: Response) {
    try {
      const organizerId = parseInt(req.params.id)
      const result = await PublicService.getOrganizerProfile(organizerId)

      res.status(200).json({
        success: true,
        data: result,
      })
    } catch (error: any) {
      res.status(404).json({
        success: false,
        message: error.message || 'Organizer not found',
      })
    }
  }

  // GET /api/categories - Get all event categories
  static async getCategories(req: Request, res: Response) {
    try {
      const result = await PublicService.getCategories()

      res.status(200).json({
        success: true,
        data: result,
      })
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message || 'Failed to get categories',
      })
    }
  }
}
