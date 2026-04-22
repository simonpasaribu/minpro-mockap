import { Router } from 'express'
import { AuthController } from '../controllers/auth.controller'
import { authenticateToken } from '../middleware/auth.middleware'

const router = Router()

// Public routes
router.post('/register', AuthController.register)
router.post('/login', AuthController.login)
router.post('/validate-referral', AuthController.validateReferral)
router.post('/forgot-password', AuthController.forgotPassword)
router.post('/reset-password', AuthController.resetPassword)

// Protected routes
router.get('/profile', authenticateToken, AuthController.getProfile)
router.post('/upgrade-to-organizer', authenticateToken, AuthController.upgradeToOrganizer)
router.get('/role', authenticateToken, AuthController.getRoleInfo)

export default router
