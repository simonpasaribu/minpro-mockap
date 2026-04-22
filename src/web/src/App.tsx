import { Routes, Route } from 'react-router-dom'
import { AuthProvider } from './features/auth/components/AuthContext'
import ProtectedRoute from './features/auth/components/ProtectedRoute'

// Auth Pages
import LoginPage from './pages/auth/LoginPage'
import RegisterPage from './pages/auth/RegisterPage'
import ForgotPasswordPage from './pages/auth/ForgotPasswordPage'
import ResetPasswordPage from './pages/auth/ResetPasswordPage'

// Profile Pages
import ProfilePage from './pages/profile/ProfilePage'
import EditProfilePage from './pages/profile/EditProfilePage'
import ChangePasswordPage from './pages/profile/ChangePasswordPage'

// Event Pages - Nomor 1: Event Discovery
import LandingPage from './pages/events/LandingPage'
import EventDetailPage from './pages/events/EventDetailPage'

// Transaction Pages - Nomor 2: Event Transaction
import CheckoutPage from './pages/transactions/CheckoutPage'
import TransactionDetailPage from './pages/transactions/TransactionDetailPage'
import MyTransactionsPage from './pages/transactions/MyTransactionsPage'

// Review Pages - Nomor 3: Reviews and Ratings
import ReviewPage from './pages/reviews/ReviewPage'

// Organizer Pages - Nomor 3-B: Organizer Profile
import OrganizerProfilePage from './pages/organizers/OrganizerProfilePage'

function App() {
  return (
    <AuthProvider>
      <div className="min-h-screen bg-gray-50">
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/events/:id" element={<EventDetailPage />} />
          <Route path="/organizers/:id" element={<OrganizerProfilePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />

          {/* Protected Routes */}
          <Route element={<ProtectedRoute />}>
            {/* Profile */}
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/profile/edit" element={<EditProfilePage />} />
            <Route path="/profile/change-password" element={<ChangePasswordPage />} />

            {/* Transactions */}
            <Route path="/checkout/:eventId" element={<CheckoutPage />} />
            <Route path="/transactions/:id" element={<TransactionDetailPage />} />
            <Route path="/my-transactions" element={<MyTransactionsPage />} />

            {/* Reviews */}
            <Route path="/review/:transactionId" element={<ReviewPage />} />
          </Route>
        </Routes>
      </div>
    </AuthProvider>
  )
}

export default App
