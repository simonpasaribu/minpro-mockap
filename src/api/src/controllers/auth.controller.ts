import { Request, Response } from 'express'
import { AuthService } from '../services/auth.service'
import { registerSchema, loginSchema } from '../utils/validation'

export class AuthController {
  // POST /api/auth/register
  static async register(req: Request, res: Response) {
    try {
      // Validate input
      const validatedData = registerSchema.parse(req.body)

      // Register user
      const result = await AuthService.register(validatedData)

      res.status(201).json({
        success: true,
        message: 'User registered successfully',
        data: result,
      })
    } catch (error: any) {
      if (error.name === 'ZodError') {
        return res.status(400).json({
          success: false,
          message: 'Validation error',
          errors: error.errors,
        })
      }

      res.status(400).json({
        success: false,
        message: error.message || 'Registration failed',
      })
    }
  }

  // POST /api/auth/login
  static async login(req: Request, res: Response) {
    try {
      // Validate input
      const validatedData = loginSchema.parse(req.body)

      // Login user
      const result = await AuthService.login(validatedData)

      res.status(200).json({
        success: true,
        message: 'Login successful',
        data: result,
      })
    } catch (error: any) {
      if (error.name === 'ZodError') {
        return res.status(400).json({
          success: false,
          message: 'Validation error',
          errors: error.errors,
        })
      }

      res.status(401).json({
        success: false,
        message: error.message || 'Login failed',
      })
    }
  }

  // GET /api/auth/profile
  static async getProfile(req: Request, res: Response) {
    try {
      const userId = (req as any).user.userId

      const profile = await AuthService.getProfile(userId)

      res.status(200).json({
        success: true,
        data: profile,
      })
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message || 'Failed to get profile',
      })
    }
  }

  // POST /api/auth/validate-referral
  static async validateReferral(req: Request, res: Response) {
    try {
      const { code } = req.body

      if (!code) {
        return res.status(400).json({
          success: false,
          message: 'Referral code is required',
        })
      }

      const result = await AuthService.validateReferralCode(code)

      res.status(200).json({
        success: true,
        data: result,
      })
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message || 'Validation failed',
      })
    }
  }

  // POST /api/auth/upgrade-to-organizer
  static async upgradeToOrganizer(req: Request, res: Response) {
    try {
      const userId = (req as any).user.userId

      const result = await AuthService.upgradeToOrganizer(userId)

      res.status(200).json({
        success: true,
        message: 'Successfully upgraded to organizer',
        data: result,
      })
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message || 'Upgrade failed',
      })
    }
  }

  // GET /api/auth/role
  static async getRoleInfo(req: Request, res: Response) {
    try {
      const userId = (req as any).user.userId

      const result = await AuthService.getUserRoleInfo(userId)

      res.status(200).json({
        success: true,
        data: result,
      })
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message || 'Failed to get role info',
      })
    }
  }

  // POST /api/auth/forgot-password
  static async forgotPassword(req: Request, res: Response) {
    try {
      const { email } = req.body

      if (!email) {
        return res.status(400).json({
          success: false,
          message: 'Email is required',
        })
      }

      const result = await AuthService.forgotPassword(email)

      res.status(200).json({
        success: true,
        message: result.message,
        data: { 
          email: result.email,
          resetToken: result.resetToken 
        },
      })
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message || 'Failed to process forgot password',
      })
    }
  }

  // POST /api/auth/reset-password
  static async resetPassword(req: Request, res: Response) {
    try {
      const { token, newPassword } = req.body

      if (!token || !newPassword) {
        return res.status(400).json({
          success: false,
          message: 'Token and new password are required',
        })
      }

      const result = await AuthService.resetPassword(token, newPassword)

      res.status(200).json({
        success: true,
        message: result.message,
      })
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message || 'Failed to reset password',
      })
    }
  }
}
