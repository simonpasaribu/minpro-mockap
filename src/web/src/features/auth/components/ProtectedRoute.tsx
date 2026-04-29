import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from './AuthContext'

interface ProtectedRouteProps {
  requiredRole?: 'ORGANIZER' | 'CUSTOMER'
}

export default function ProtectedRoute({ requiredRole }: ProtectedRouteProps) {
  const { isAuthenticated, isLoading, user } = useAuth()

  if (isLoading) {
    return <div className="flex justify-center items-center h-screen">Loading...</div>
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  // Check role if required (case-insensitive)
  if (requiredRole && user?.role?.toUpperCase() !== requiredRole) {
    return <Navigate to="/" replace />
  }

  return <Outlet />
}
