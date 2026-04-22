import { Role } from '../../generated/prisma/enums'

// User Types
export interface UserPayload {
  id: number
  email: string
  firstName: string
  lastName: string
  role: Role
  referralCode: string
  profilePicture?: string
  createdAt?: Date
  phone?: string
  birthDate?: Date
  gender?: string
  _count?: {
    referrals: number
  }
}

// Auth Types
export interface RegisterInput {
  email: string
  password: string
  firstName: string
  lastName: string
  referralCode?: string
}

export interface LoginInput {
  email: string
  password: string
}

export interface AuthResponse {
  user: UserPayload
  token: string
}

// JWT Payload
export interface JWTPayload {
  userId: number
  email: string
  role: Role
}
