import { Router } from 'express'
import multer from 'multer'
import { UserController } from '../controllers/user.controller'
import { authenticateToken } from '../middleware/auth.middleware'

const router = Router()

// Setup multer for file upload with 2MB limit
const upload = multer({ 
  dest: 'uploads/',
  limits: { fileSize: 2 * 1024 * 1024 }, // 2MB max
  fileFilter: (req, file, cb) => {
    // Accept only images
    if (file.mimetype.startsWith('image/')) {
      cb(null, true)
    } else {
      cb(new Error('Only image files are allowed!'))
    }
  }
})

// Protected routes
router.get('/points', authenticateToken, UserController.getPoints)
router.get('/coupons', authenticateToken, UserController.getCoupons)
router.post('/coupons/validate', authenticateToken, UserController.validateCoupon)
router.get('/referrals', authenticateToken, UserController.getReferrals)

// Profile Management
router.put('/profile', authenticateToken, UserController.updateProfile)
router.put('/profile-picture', authenticateToken, upload.single('image'), UserController.updateProfilePicture)
router.put('/password', authenticateToken, UserController.changePassword)

// Role Upgrade
router.post('/upgrade-organizer', authenticateToken, UserController.upgradeToOrganizer)

export default router
