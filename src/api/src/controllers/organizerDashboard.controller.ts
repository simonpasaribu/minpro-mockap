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
      console.error('acceptTransaction error:', error)
      res.status(400).json({
        success: false,
        message: error.message || 'Failed to accept transaction',
        error: error.stack || String(error),
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

  // GET /api/organizer/events/:slug/attendees - Get attendee list for event
  static async getEventAttendees(req: Request, res: Response) {
    try {
      const slug = req.params.slug
      const organizerId = (req as any).user.userId

      const result = await OrganizerDashboardService.getEventAttendeesBySlug(slug, organizerId)

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

  // GET /api/organizer/statistics-chart - Get chart data with date filter
  static async getStatisticsChart(req: Request, res: Response) {
    try {
      const userId = (req as any).user.userId
      const filter = (req.query.filter as 'year' | 'month' | 'day') || 'month'

      if (!['year', 'month', 'day'].includes(filter)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid filter. Must be year, month, or day',
        })
      }

      const { chartData, summary } = await OrganizerDashboardService.getStatisticsChart(userId, filter)

      res.status(200).json({
        success: true,
        data: {
          chartData,
          summary,
        },
      })
    } catch (error: any) {
      console.error('getStatisticsChart error:', error)
      res.status(400).json({
        success: false,
        message: error.message || 'Failed to get chart data',
      })
    }
  }

  // GET /api/organizer/top-buyers - Get top buyers
  static async getTopBuyers(req: Request, res: Response) {
    try {
      const userId = (req as any).user.userId

      const buyers = await OrganizerDashboardService.getTopBuyers(userId)

      res.status(200).json({
        success: true,
        data: buyers,
      })
    } catch (error: any) {
      console.error('getTopBuyers error:', error)
      res.status(400).json({
        success: false,
        message: error.message || 'Failed to get top buyers',
      })
    }
  }

  // GET /api/organizer/daily-revenue-report - Get daily revenue report
  static async getDailyRevenueReport(req: Request, res: Response) {
    try {
      const userId = (req as any).user.userId

      const result = await OrganizerDashboardService.getDailyRevenueReport(userId)

      res.status(200).json({
        success: true,
        data: result,
      })
    } catch (error: any) {
      console.error('getDailyRevenueReport error:', error)
      res.status(400).json({
        success: false,
        message: error.message || 'Failed to get daily revenue report',
      })
    }
  }
}
