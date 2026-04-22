import { Router } from 'express'
import authRoutes from './auth.routes'
import userRoutes from './user.routes'
import organizerRoutes from './organizer.routes'
import publicRoutes from './public.routes'
import transactionRoutes from './transaction.routes'
import reviewRoutes from './review.routes'

const router = Router()

// Public routes (no auth required)
router.use('/', publicRoutes)

// Protected routes
router.use('/auth', authRoutes)
router.use('/user', userRoutes)
router.use('/organizer', organizerRoutes)
router.use('/transactions', transactionRoutes)
router.use('/reviews', reviewRoutes)

export default router
