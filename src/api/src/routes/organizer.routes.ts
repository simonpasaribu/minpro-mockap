import { Router } from 'express'
import multer from 'multer'
import { EventController } from '../controllers/event.controller'
import { OrganizerDashboardController } from '../controllers/organizerDashboard.controller'
import { VoucherController } from '../controllers/voucher.controller'
import { authenticateToken, isOrganizer } from '../middleware/auth.middleware'

const router = Router()

// Setup multer for file upload with 5MB limit
const upload = multer({
  dest: 'uploads/',
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true)
    } else {
      cb(new Error('Only image files are allowed'))
    }
  }
})

// All organizer routes are protected
router.use(authenticateToken)

// ============================================
// EVENT MANAGEMENT (Organizer)
// ============================================

// Create event (Organizer only)
router.post('/events', isOrganizer, EventController.createEvent)

// Get organizer's events (Organizer only)
router.get('/events', isOrganizer, EventController.getOrganizerEvents)

// Get event by ID (Organizer only)
router.get('/events/:slug', isOrganizer, EventController.getEventById)

// Update event (Organizer only)
router.put('/events/:slug', isOrganizer, EventController.updateEvent)

// Delete event (Organizer only)
router.delete('/events/:slug', isOrganizer, EventController.deleteEvent)

// ============================================
// EVENT VOUCHERS (Pricing & Promotions)
// ============================================

// Create voucher for event (Organizer only)
router.post('/events/:slug/vouchers', isOrganizer, VoucherController.createVoucher)

// Get event vouchers (Organizer only)
router.get('/events/:slug/vouchers', isOrganizer, VoucherController.getEventVouchers)

// Delete voucher (Organizer only)
router.delete('/events/:slug/vouchers/:voucherId', isOrganizer, VoucherController.deleteVoucher)

// ============================================
// ORGANIZER DASHBOARD
// ============================================

// Get statistics (Organizer only)
router.get('/statistics', isOrganizer, OrganizerDashboardController.getStatistics)

// Get pending transactions for review (Organizer only)
router.get('/pending-transactions', isOrganizer, OrganizerDashboardController.getPendingTransactions)

// Get all transactions (Organizer only)
router.get('/transactions', isOrganizer, OrganizerDashboardController.getOrganizerTransactions)

// Accept transaction (Organizer only)
router.put('/transactions/:id/accept', isOrganizer, OrganizerDashboardController.acceptTransaction)

// Reject transaction (Organizer only)
router.put('/transactions/:id/reject', isOrganizer, OrganizerDashboardController.rejectTransaction)

// Get event attendees (Organizer only)
router.get('/events/:slug/attendees', isOrganizer, OrganizerDashboardController.getEventAttendees)

// Get statistics chart data (Organizer only)
router.get('/statistics-chart', isOrganizer, OrganizerDashboardController.getStatisticsChart)

// Get top buyers (Organizer only)
router.get('/top-buyers', isOrganizer, OrganizerDashboardController.getTopBuyers)

// Get daily revenue report (Organizer only)
router.get('/daily-revenue-report', isOrganizer, OrganizerDashboardController.getDailyRevenueReport)

// Upload event image (Organizer only)
router.post('/events/:eventId/image', isOrganizer, upload.single('image'), EventController.uploadEventImage)

export default router
