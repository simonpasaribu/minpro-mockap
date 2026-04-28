import { Request, Response, NextFunction } from 'express'
import { PublicService } from '../services/public.service'
import { EventService } from '../services/event.service'

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

  // GET /api/events/:slug - Get single event details by slug (public)
  static async getEventDetails(req: Request, res: Response) {
    try {
      const slug = req.params.slug
      const result = await PublicService.getEventDetails(slug)

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

  // GET /api/organizers/:username - Get public organizer profile by username
  static async getOrganizerProfile(req: Request, res: Response) {
    try {
      const username = req.params.username
      const result = await PublicService.getOrganizerProfile(username)

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
      next(error)
    }
  }

  // GET /api/events/popular - Get popular events
  static async getPopularEvents(req: Request, res: Response, next: NextFunction) {
    try {
      const limit = parseInt(req.query.limit as string) || 8
      const { prisma } = await import('../utils/prisma')
      
      const popularEvents = await prisma.event.findMany({
        where: {
          isPublished: true,
          endDate: {
            gte: new Date()
          }
        },
        orderBy: {
          createdAt: 'desc'
        },
        take: limit,
        select: {
          id: true,
          title: true,
          slug: true,
          imageUrl: true,
          startDate: true,
          endDate: true,
          price: true,
          totalSeats: true,
          category: true,
          createdAt: true
        }
      })

      res.status(200).json({
        success: true,
        data: popularEvents,
      })
    } catch (error) {
      next(error)
    }
  }
}
