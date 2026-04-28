import bcrypt from 'bcrypt'
import crypto from 'crypto'
import { Role } from '../../generated/prisma/enums'
import { prisma } from '../utils/prisma'
import { generateToken } from '../utils/jwt'
import { generateReferralCode } from '../utils/referral'
import { RegisterInput, LoginInput, AuthResponse } from '../types'

const SALT_ROUNDS = 10

// Generate username from email (e.g., john@example.com -> john)
function generateUsername(email: string): string {
  return email.split('@')[0].toLowerCase().replace(/[^a-z0-9]/g, '')
}
const REFERRAL_REWARD_POINTS = 10000
const REFERRAL_REWARD_COUPON_DISCOUNT = 10
const POINTS_EXPIRY_MONTHS = 3
const COUPON_EXPIRY_MONTHS = 3
const PASSWORD_RESET_EXPIRY_HOURS = 1

export class AuthService {
  // Poin A: Account Creation
  static async register(data: RegisterInput): Promise<AuthResponse> {
    const { email, password, firstName, lastName, referralCode } = data

    // Check if email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    })

    if (existingUser) {
      throw new Error('Email already registered')
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS)

    // Generate unique referral code
    let uniqueReferralCode = generateReferralCode(firstName, lastName)
    let isUnique = false
    let attempts = 0

    while (!isUnique && attempts < 10) {
      const existing = await prisma.user.findUnique({
        where: { referralCode: uniqueReferralCode },
      })
      if (!existing) {
        isUnique = true
      } else {
        uniqueReferralCode = generateReferralCode(firstName, lastName)
        attempts++
      }
    }

    if (!isUnique) {
      throw new Error('Failed to generate unique referral code')
    }

    // Generate unique username
    let baseUsername = generateUsername(email)
    let uniqueUsername = baseUsername
    let usernameAttempts = 0

    while (usernameAttempts < 10) {
      const existing = await prisma.user.findUnique({
        where: { username: uniqueUsername },
      })
      if (!existing) {
        break
      } else {
        uniqueUsername = `${baseUsername}${Math.floor(Math.random() * 1000)}`
        usernameAttempts++
      }
    }

    // Prepare transaction
    const expiresAtPoints = new Date()
    expiresAtPoints.setMonth(expiresAtPoints.getMonth() + POINTS_EXPIRY_MONTHS)

    const expiresAtCoupon = new Date()
    expiresAtCoupon.setMonth(expiresAtCoupon.getMonth() + COUPON_EXPIRY_MONTHS)

    // Poin C: Referral Registration & Generation
    let referredById: number | null = null

    if (referralCode) {
      const referrer = await prisma.user.findUnique({
        where: { referralCode },
      })

      if (!referrer) {
        throw new Error('Invalid referral code')
      }

      referredById = referrer.id
    }

    // Execute transaction
    const result = await prisma.$transaction(async (tx) => {
      // Use custom default profile picture from Cloudinary
      const defaultAvatarUrl = process.env.DEFAULT_PROFILE_PICTURE || 
        'https://res.cloudinary.com/dkdx79ror/image/upload/v1776703106/Foto_profil_default_hdsg6t.png'

      // Create user
      const user = await tx.user.create({
        data: {
          email,
          username: uniqueUsername,
          password: hashedPassword,
          firstName,
          lastName,
          referralCode: uniqueReferralCode,
          referredBy: referredById,
          role: Role.CUSTOMER,
          profilePicture: defaultAvatarUrl,
        },
      })

      // Poin A: Referral Rewards - New user gets coupon
      await tx.coupon.create({
        data: {
          userId: user.id,
          code: `WELCOME${user.id}`,
          discount: REFERRAL_REWARD_COUPON_DISCOUNT,
          expiresAt: expiresAtCoupon,
        },
      })

      // Poin A: Referral Rewards - Referrer gets points (global balance)
      if (referredById) {
        await tx.user.update({
          where: { id: referredById },
          data: {
            pointsBalance: { increment: REFERRAL_REWARD_POINTS },
            pointsExpiry: expiresAtPoints, // Reset expiry date for ALL points
          },
        })
      }

      return user
    })

    // Generate JWT token
    const token = generateToken({
      userId: result.id,
      email: result.email,
      role: result.role,
    })

    return {
      user: {
        id: result.id,
        email: result.email,
        firstName: result.firstName,
        lastName: result.lastName,
        role: result.role,
        referralCode: result.referralCode,
        profilePicture: result.profilePicture || undefined,
        createdAt: result.createdAt,
      },
      token,
    }
  }

  static async login(data: LoginInput): Promise<AuthResponse> {
    const { email, password } = data

    // Find user
    const user = await prisma.user.findUnique({
      where: { email },
    })

    if (!user) {
      throw new Error('Invalid email or password')
    }

    // Verify password
    const isValid = await bcrypt.compare(password, user.password)

    if (!isValid) {
      throw new Error('Invalid email or password')
    }

    // Generate JWT token
    const token = generateToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    })

    return {
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        referralCode: user.referralCode,
        profilePicture: user.profilePicture || undefined,
        createdAt: user.createdAt,
        phone: user.phone || undefined,
        birthDate: user.birthDate || undefined,
        gender: user.gender || undefined,
      },
      token,
    }
  }

  // Get current user profile
  static async getProfile(userId: number) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        referralCode: true,
        profilePicture: true,
        createdAt: true,
        phone: true,
        birthDate: true,
        gender: true,
        _count: {
          select: {
            referrals: true,
          },
        },
      },
    })

    if (!user) {
      throw new Error('User not found')
    }

    return user
  }

  // Validate referral code
  static async validateReferralCode(code: string) {
    const user = await prisma.user.findUnique({
      where: { referralCode: code },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        referralCode: true,
      },
    })

    return { valid: !!user, user }
  }

  // Poin B: Upgrade user to Organizer
  static async upgradeToOrganizer(userId: number) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    })

    if (!user) {
      throw new Error('User not found')
    }

    if (user.role === Role.ORGANIZER) {
      throw new Error('User is already an organizer')
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { role: Role.ORGANIZER },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        referralCode: true,
      },
    })

    // Generate new token with updated role
    const newToken = generateToken({
      userId: updatedUser.id,
      email: updatedUser.email,
      role: updatedUser.role,
    })

    return {
      user: updatedUser,
      token: newToken,
    }
  }

  // Get user role info
  static async getUserRoleInfo(userId: number) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        referralCode: true,
        createdAt: true,
      },
    })

    if (!user) {
      throw new Error('User not found')
    }

    return {
      ...user,
      isOrganizer: user.role === Role.ORGANIZER,
      isCustomer: user.role === Role.CUSTOMER,
    }
  }

  // Poin D: Forgot Password - Generate reset token
  static async forgotPassword(email: string) {
    const user = await prisma.user.findUnique({
      where: { email },
    })

    if (!user) {
      throw new Error('User not found')
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex')
    const resetExpires = new Date()
    resetExpires.setHours(resetExpires.getHours() + PASSWORD_RESET_EXPIRY_HOURS)

    // Save to database
    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordResetToken: resetToken,
        passwordResetExpires: resetExpires,
      },
    })

    // For development: log to console (replace with email service in production)
    console.log(`\n========================================`)
    console.log(`PASSWORD RESET TOKEN for ${email}`)
    console.log(`Token: ${resetToken}`)
    console.log(`Expires: ${resetExpires}`)
    console.log(`========================================\n`)

    return {
      message: 'Password reset token sent. Check console/terminal for the token.',
      email: user.email,
      resetToken: resetToken,
    }
  }

  // Poin D: Reset Password with token
  static async resetPassword(token: string, newPassword: string) {
    // Find user with valid token
    const user = await prisma.user.findFirst({
      where: {
        passwordResetToken: token,
        passwordResetExpires: {
          gt: new Date(),
        },
      },
    })

    if (!user) {
      throw new Error('Invalid or expired reset token')
    }

    // Validate new password
    if (newPassword.length < 8) {
      throw new Error('Password must be at least 8 characters')
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, SALT_ROUNDS)

    // Update password and clear reset token
    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        passwordResetToken: null,
        passwordResetExpires: null,
      },
    })

    return {
      message: 'Password reset successfully. Please login with your new password.',
    }
  }
}
