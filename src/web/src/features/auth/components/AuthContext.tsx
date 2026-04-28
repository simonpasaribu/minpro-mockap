import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { authService } from '../services/auth.service'

interface User {
  id: number
  email: string
  firstName: string
  lastName: string
  role: string
  profilePicture?: string
  referralCode: string
  createdAt?: string
  phone?: string
  birthDate?: string
  gender?: string
  _count?: {
    referrals: number
  }
}

interface AuthContextType {
  user: User | null
  setUser: (user: User | null) => void
  isAuthenticated: boolean
  isLoading: boolean
  login: (email: string, password: string) => Promise<void>
  register: (data: RegisterData) => Promise<void>
  logout: () => void
  upgradeToOrganizer: () => Promise<void>
}

interface RegisterData {
  email: string
  password: string
  firstName: string
  lastName: string
  referralCode?: string
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem('token')
      console.log('Auth init - token exists:', !!token)
      
      if (token) {
        try {
          const profile = await authService.getProfile()
          console.log('Profile loaded:', profile)
          setUser(profile)
        } catch (error) {
          console.error('Failed to load profile:', error)
          localStorage.removeItem('token')
        }
      }
      setIsLoading(false)
    }
    initAuth()
  }, [])

  const login = async (email: string, password: string) => {
    const response = await authService.login({ email, password })
    console.log('Login success:', response)
    localStorage.setItem('token', response.token)
    setUser(response.user)
  }

  const register = async (data: RegisterData) => {
    const response = await authService.register(data)
    console.log('Register success:', response)
    localStorage.setItem('token', response.token)
    setUser(response.user)
  }

  const logout = () => {
    localStorage.removeItem('token')
    setUser(null)
  }

  const upgradeToOrganizer = async () => {
    const response = await authService.upgradeToOrganizer()
    console.log('Upgrade to organizer success:', response)
    localStorage.setItem('token', response.token)
    setUser(response.user)
  }

  return (
    <AuthContext.Provider value={{
      user,
      setUser,
      isAuthenticated: !!user,
      isLoading,
      login,
      register,
      logout,
      upgradeToOrganizer
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used within AuthProvider')
  return context
}
