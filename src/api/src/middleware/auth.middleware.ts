import { Request, Response, NextFunction } from 'express'
import { Role } from '../../generated/prisma/enums'
import { verifyToken } from '../utils/jwt'
import { JWTPayload } from '../types'

// Extend Express Request to include user
declare global {
  namespace Express {
    interface Request {
      user?: JWTPayload
    }
  }
}

// Poin D: Role-Based Access Control - JWT Middleware
export function authenticateToken(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers['authorization']
  const token = authHeader && authHeader.split(' ')[1] // Bearer TOKEN

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Access denied. No token provided.',
    })
  }

  try {
    const decoded = verifyToken(token)
    req.user = decoded
    next()
  } catch (error) {
    return res.status(403).json({
      success: false,
      message: 'Invalid or expired token',
    })
  }
}

// Poin D: Role-Based Access Control - Role Middleware
export function authorizeRoles(...allowedRoles: Role[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. User not authenticated.',
      })
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Access denied. Required role: ${allowedRoles.join(' or ')}`,
      })
    }

    next()
  }
}

// Middleware to check if user is organizer
export function isOrganizer(req: Request, res: Response, next: NextFunction) {
  return authorizeRoles(Role.ORGANIZER)(req, res, next)
}

// Middleware to check if user is customer
export function isCustomer(req: Request, res: Response, next: NextFunction) {
  return authorizeRoles(Role.CUSTOMER)(req, res, next)
}

// Middleware to check if user is either customer or organizer
export function isAuthenticated(req: Request, res: Response, next: NextFunction) {
  return authorizeRoles(Role.CUSTOMER, Role.ORGANIZER)(req, res, next)
}
