import bcrypt from 'bcrypt'
import { prisma } from '../utils/prisma'

const SALT_ROUNDS = 10

export class UserService {
  // Poin B: Get active points (global balance system)
  static async getActivePoints(userId: number) {
    const now = new Date()

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { pointsBalance: true, pointsExpiry: true },
    })

    if (!user || !user.pointsExpiry) {
      return { total: 0, expiresAt: null }
    }

    // Check if all points expired
    if (user.pointsExpiry <= now) {
      return { total: 0, expiresAt: user.pointsExpiry }
    }

    return {
      total: user.pointsBalance,
      expiresAt: user.pointsExpiry,
    }
  }

  // Poin B: Get active coupons (not expired, not used)
  static async getActiveCoupons(userId: number) {
    const now = new Date()

    const coupons = await prisma.coupon.findMany({
      where: {
        userId,
        expiresAt: { gt: now },
        isUsed: false,
      },
      orderBy: { expiresAt: 'asc' },
    })

    return {
      total: coupons.length,
      coupons: coupons.map((c) => ({
        id: c.id,
        code: c.code,
        discount: c.discount,
        expiresAt: c.expiresAt,
      })),
    }
  }

  // Poin C: Update profile
  static async updateProfile(userId: number, data: {
    firstName?: string
    lastName?: string
    email?: string
    phone?: string | null
    birthDate?: string | null
    gender?: string | null
  }) {
    // Check if email already exists (if changing email)
    if (data.email) {
      const existingUser = await prisma.user.findFirst({
        where: {
          email: data.email,
          NOT: { id: userId },
        },
      })
      if (existingUser) {
        throw new Error('Email already in use by another account')
      }
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        ...(data.firstName && { firstName: data.firstName }),
        ...(data.lastName && { lastName: data.lastName }),
        ...(data.email && { email: data.email }),
        ...(data.phone !== undefined && { phone: data.phone }),
        ...(data.birthDate !== undefined && { birthDate: data.birthDate ? new Date(data.birthDate) : null }),
        ...(data.gender !== undefined && { gender: data.gender }),
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        profilePicture: true,
        referralCode: true,
        phone: true,
        birthDate: true,
        gender: true,
        createdAt: true,
      },
    })

    return updatedUser
  }

  // Poin C: Update profile picture (via Cloudinary URL)
  static async updateProfilePicture(userId: number, imageUrl: string) {
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { profilePicture: imageUrl },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        profilePicture: true,
      },
    })

    return updatedUser
  }

  // Poin C: Change password
  static async changePassword(userId: number, oldPassword: string, newPassword: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    })

    if (!user) {
      throw new Error('User not found')
    }

    // Verify old password
    const isValid = await bcrypt.compare(oldPassword, user.password)
    if (!isValid) {
      throw new Error('Current password is incorrect')
    }

    // Validate new password
    if (newPassword.length < 8) {
      throw new Error('New password must be at least 8 characters')
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, SALT_ROUNDS)

    await prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword },
    })

    return { message: 'Password changed successfully' }
  }

  // Upgrade role to ORGANIZER
  static async upgradeToOrganizer(userId: number) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true },
    })

    if (!user) {
      throw new Error('User not found')
    }

    if (user.role === 'ORGANIZER') {
      throw new Error('User is already an organizer')
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { role: 'ORGANIZER' },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        profilePicture: true,
        referralCode: true,
        phone: true,
        birthDate: true,
        gender: true,
        createdAt: true,
      },
    })

    return updatedUser
  }

  // Get list of users who used this user's referral code
  static async getReferrals(userId: number) {
    const referrals = await prisma.user.findMany({
      where: { referredBy: userId },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    })

    return referrals.map((r) => ({
      id: r.id,
      name: `${r.firstName} ${r.lastName}`.trim(),
      email: r.email,
      date: r.createdAt,
    }))
  }
}
