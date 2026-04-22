import { Request, Response } from 'express'
import { OrganizerDashboardService } from '../services/organizerDashboard.service'

export class OrganizerDashboardController {
  // GET /api/organizer/statistics - Get dashboard statistics
  static async getStatistics(req: Request, res: Response) {
    try {
      const userId = (req as any).user.userId
      const filters = {
        startDate: req.query.startDate as string,
        endDate: req.query.endDate as string,
      }

      const result = await OrganizerDashboardService.getStatistics(userId, filters)

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

  // GET /api/organizer/pending-transactions - Get pending transactions for review
  static async getPendingTransactions(req: Request, res: Response) {
    try {
      const userId = (req as any).user.userId

      const result = await OrganizerDashboardService.getPendingTransactions(userId)

      res.status(200).json({
        success: true,
        data: result,
      })
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message || 'Failed to get pending transactions',
      })
    }
  }

  // GET /api/organizer/transactions - Get all transactions
  static async getOrganizerTransactions(req: Request, res: Response) {
    try {
      const userId = (req as any).user.userId
      const filters = {
        status: req.query.status as string,
      }

      const result = await OrganizerDashboardService.getOrganizerTransactions(userId, filters)

      res.status(200).json({
        success: true,
        data: result,
      })
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message || 'Failed to get transactions',
      })
    }
  }

  // PUT /api/organizer/transactions/:id/accept - Accept transaction
  static async acceptTransaction(req: Request, res: Response) {
    try {
      const transactionId = parseInt(req.params.id)
      const organizerId = (req as any).user.userId

      const result = await OrganizerDashboardService.acceptTransaction(transactionId, organizerId)

      res.status(200).json({
        success: true,
        message: result.message,
      })
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message || 'Failed to accept transaction',
      })
    }
  }

  // PUT /api/organizer/transactions/:id/reject - Reject transaction
  static async rejectTransaction(req: Request, res: Response) {
    try {
      const transactionId = parseInt(req.params.id)
      const organizerId = (req as any).user.userId

      const result = await OrganizerDashboardService.rejectTransaction(transactionId, organizerId)

      res.status(200).json({
        success: true,
        message: result.message,
      })
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message || 'Failed to reject transaction',
      })
    }
  }

  // GET /api/organizer/events/:eventId/attendees - Get attendee list for event
  static async getEventAttendees(req: Request, res: Response) {
    try {
      const eventId = parseInt(req.params.eventId)
      const organizerId = (req as any).user.userId

      const result = await OrganizerDashboardService.getEventAttendees(eventId, organizerId)

      res.status(200).json({
        success: true,
        data: result,
      })
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message || 'Failed to get attendees',
      })
    }
  }
}
