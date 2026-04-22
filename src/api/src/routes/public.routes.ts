import { Router } from 'express'
import { PublicController } from '../controllers/public.controller'

const router = Router()

// ============================================
// PUBLIC EVENT ROUTES (No authentication required)
// ============================================

// GET /api/events - Browse all published events with filters
router.get('/events', PublicController.getPublishedEvents)

// GET /api/events/:id - Get single event details (public)
router.get('/events/:id', PublicController.getEventDetails)

// GET /api/organizers/:id - Get public organizer profile with reviews
router.get('/organizers/:id', PublicController.getOrganizerProfile)

// GET /api/categories - Get all event categories
router.get('/categories', PublicController.getCategories)

export default router
