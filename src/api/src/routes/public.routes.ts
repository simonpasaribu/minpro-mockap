import { Router } from 'express'
import { PublicController } from '../controllers/public.controller'

const router = Router()

// ============================================
// PUBLIC EVENT ROUTES (No authentication required)
// ============================================

// GET /api/events - Browse all published events with filters
router.get('/events', PublicController.getPublishedEvents)

// GET /api/events/stats - Get public platform statistics
router.get('/events/stats', PublicController.getPublicStats)

// GET /api/events/popular - Get popular events
router.get('/events/popular', PublicController.getPopularEvents)

// GET /api/events/:slug - Get single event details by slug (public)
router.get('/events/:slug', PublicController.getEventDetails)

// GET /api/organizers/:username - Get public organizer profile with reviews by username
router.get('/organizers/:username', PublicController.getOrganizerProfile)

// GET /api/categories - Get all event categories
router.get('/categories', PublicController.getCategories)

export default router
