import { Request, Response } from 'express'
import fs from 'fs'
import { prisma } from '../utils/prisma'
import { UserService } from '../services/user.service'
import { cloudinary } from '../utils/cloudinary'

export class UserController {
  // GET /api/user/points
  static async getPoints(req: Request, res: Response) {
    try {
      const userId = (req as any).user.userId

      const result = await UserService.getActivePoints(userId)

      res.status(200).json({
        success: true,
        data: result,
      })
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message || 'Failed to get points',
      })
    }
  }

  // GET /api/user/coupons
  static async getCoupons(req: Request, res: Response) {
    try {
      const userId = (req as any).user.userId

      const result = await UserService.getActiveCoupons(userId)

      res.status(200).json({
        success: true,
        data: result,
      })
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message || 'Failed to get coupons',
      })
    }
  }

  // PUT /api/user/profile
  static async updateProfile(req: Request, res: Response) {
    try {
      const userId = (req as any).user.userId
      const { firstName, lastName, email, phone, birthDate, gender } = req.body

      const result = await UserService.updateProfile(userId, {
        firstName,
        lastName,
        email,
        phone,
        birthDate,
        gender,
      })

      res.status(200).json({
        success: true,
        message: 'Profile updated successfully',
        data: result,
      })
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message || 'Failed to update profile',
      })
    }
  }

  // PUT /api/user/profile-picture
  static async updateProfilePicture(req: Request, res: Response) {
    try {
      const userId = (req as any).user.userId
      let imageUrl: string

      // Get user email for folder name
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { email: true }
      })
      const userEmail = user?.email || `user_${userId}`
      const folderPath = `profile-pictures/${userEmail.replace(/[@.]/g, '_')}`

      // Debug: Check env variables
      console.log('Cloudinary Config:', {
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
        api_key: process.env.CLOUDINARY_API_KEY,
        has_secret: !!process.env.CLOUDINARY_API_SECRET
      })

      // Check if file uploaded (multipart/form-data)
      if (req.file) {
        // Upload to Cloudinary
        const result = await cloudinary.uploader.upload(req.file.path, {
          folder: folderPath,
          public_id: `profile_${Date.now()}`,
        })
        imageUrl = result.secure_url
        // Clean up temporary file
        fs.unlinkSync(req.file.path)
      } else if (req.body.imageUrl) {
        // Use provided URL (JSON)
        imageUrl = req.body.imageUrl
      } else {
        return res.status(400).json({
          success: false,
          message: 'Please provide an image file or imageUrl',
        })
      }

      const result = await UserService.updateProfilePicture(userId, imageUrl)

      res.status(200).json({
        success: true,
        message: 'Profile picture updated successfully',
        data: result,
      })
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message || 'Failed to update profile picture',
      })
    }
  }

  // PUT /api/user/password
  static async changePassword(req: Request, res: Response) {
    try {
      const userId = (req as any).user.userId
      const { oldPassword, newPassword } = req.body

      if (!oldPassword || !newPassword) {
        return res.status(400).json({
          success: false,
          message: 'Old password and new password are required',
        })
      }

      const result = await UserService.changePassword(userId, oldPassword, newPassword)

      res.status(200).json({
        success: true,
        message: result.message,
      })
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message || 'Failed to change password',
      })
    }
  }

  // POST /api/user/upgrade-organizer
  static async upgradeToOrganizer(req: Request, res: Response) {
    try {
      const userId = (req as any).user.userId

      const result = await UserService.upgradeToOrganizer(userId)

      res.status(200).json({
        success: true,
        message: 'Successfully upgraded to organizer',
        data: result,
      })
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message || 'Failed to upgrade role',
      })
    }
  }

  // GET /api/user/referrals
  static async getReferrals(req: Request, res: Response) {
    try {
      const userId = (req as any).user.userId

      const result = await UserService.getReferrals(userId)

      res.status(200).json({
        success: true,
        data: result,
      })
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message || 'Failed to get referrals',
      })
    }
  }
}
