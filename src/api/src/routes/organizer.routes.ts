import { Router } from 'express'
import { EventController } from '../controllers/event.controller'
import { OrganizerDashboardController } from '../controllers/organizerDashboard.controller'
import { VoucherController } from '../controllers/voucher.controller'
import { authenticateToken } from '../middleware/auth.middleware'

const router = Router()

// All organizer routes are protected
router.use(authenticateToken)

// ============================================
// EVENT MANAGEMENT (Organizer)
// ============================================

// Create event
router.post('/events', EventController.createEvent)

// Get organizer's events
router.get('/events', EventController.getOrganizerEvents)

// Get event by ID
router.get('/events/:id', EventController.getEventById)

// Update event
router.put('/events/:id', EventController.updateEvent)

// Delete event
router.delete('/events/:id', EventController.deleteEvent)

// ============================================
// EVENT VOUCHERS (Pricing & Promotions)
// ============================================

// Create voucher for event
router.post('/events/:eventId/vouchers', VoucherController.createVoucher)

// Get event vouchers
router.get('/events/:eventId/vouchers', VoucherController.getEventVouchers)

// Delete voucher
router.delete('/events/:eventId/vouchers/:voucherId', VoucherController.deleteVoucher)

// ============================================
// ORGANIZER DASHBOARD
// ============================================

// Get statistics
router.get('/statistics', OrganizerDashboardController.getStatistics)

// Get pending transactions for review
router.get('/pending-transactions', OrganizerDashboardController.getPendingTransactions)

// Get all transactions
router.get('/transactions', OrganizerDashboardController.getOrganizerTransactions)

// Accept transaction
router.put('/transactions/:id/accept', OrganizerDashboardController.acceptTransaction)

// Reject transaction
router.put('/transactions/:id/reject', OrganizerDashboardController.rejectTransaction)

// Get event attendees
router.get('/events/:eventId/attendees', OrganizerDashboardController.getEventAttendees)

export default router
