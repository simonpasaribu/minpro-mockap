import { Routes, Route, useLocation } from 'react-router-dom'
import { useEffect } from 'react'
import { AuthProvider } from './features/auth/components/AuthContext'
import ProtectedRoute from './features/auth/components/ProtectedRoute'
import Navbar from './components/shared/Navbar'
import Footer from './components/shared/Footer'

// Legal Pages
import HelpPage from './pages/legal/HelpPage'
import TermsPage from './pages/legal/TermsPage'
import PrivacyPage from './pages/legal/PrivacyPage'

// Auth Pages
import AuthPage from './pages/auth/AuthPage'
import ForgotPasswordPage from './pages/auth/ForgotPasswordPage'
import ResetPasswordPage from './pages/auth/ResetPasswordPage'

// Profile Pages
import ProfilePage from './pages/profile/ProfilePage'
import EditProfilePage from './pages/profile/EditProfilePage'
import ChangePasswordPage from './pages/profile/ChangePasswordPage'

// Event Pages - Nomor 1: Event Discovery
import LandingPage from './pages/events/LandingPage'
import EventListPage from './pages/events/EventListPage'
import EventDetailPage from './pages/events/EventDetailPage'
import EventReviewsPage from './pages/events/EventReviewsPage'

// Transaction Pages - Nomor 2: Event Transaction
import CheckoutPage from './pages/transactions/CheckoutPage'
import TransactionDetailPage from './pages/transactions/TransactionDetailPage'
import MyTransactionsPage from './pages/transactions/MyTransactionsPage'

// Review Pages - Nomor 3: Reviews and Ratings
import ReviewPage from './pages/reviews/ReviewPage'

// Organizer Pages - Nomor 3-B: Organizer Profile & Dashboard
import OrganizerProfilePage from './pages/organizers/OrganizerProfilePage'
import OrganizerDashboardPage from './pages/organizers/OrganizerDashboardPage'
import OrganizerTransactionsPage from './pages/organizers/OrganizerTransactionsPage'
import EventFormPage from './pages/organizers/EventFormPage'
import VoucherManagementPage from './pages/organizers/VoucherManagementPage'
import AttendeeListPage from './pages/organizers/AttendeeListPage'

// ScrollToTop component - scrolls to top on every route change
function ScrollToTop() {
  const { pathname } = useLocation()
  
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' })
  }, [pathname])
  
  return null
}

function App() {
  return (
    <AuthProvider>
      <div className="min-h-screen bg-[#faf4ff] flex flex-col">
        <ScrollToTop />
        <Navbar />
        <main className="flex-1">
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/events" element={<EventListPage />} />
            <Route path="/events/:slug" element={<EventDetailPage />} />
            <Route path="/events/:slug/reviews" element={<EventReviewsPage />} />
            <Route path="/organizers/:username" element={<OrganizerProfilePage />} />
            <Route path="/login" element={<AuthPage />} />
            <Route path="/register" element={<AuthPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/reset-password" element={<ResetPasswordPage />} />
            <Route path="/help" element={<HelpPage />} />
            <Route path="/terms" element={<TermsPage />} />
            <Route path="/privacy" element={<PrivacyPage />} />

            {/* Protected Routes */}
            <Route element={<ProtectedRoute />}>
              {/* Profile */}
              <Route path="/profile" element={<ProfilePage />} />
              <Route path="/profile/edit" element={<EditProfilePage />} />
              <Route path="/profile/change-password" element={<ChangePasswordPage />} />

              {/* Transactions */}
              <Route path="/checkout/:slug" element={<CheckoutPage />} />
              <Route path="/transactions/:id" element={<TransactionDetailPage />} />
              <Route path="/my-transactions" element={<MyTransactionsPage />} />
              <Route path="/my-orders" element={<MyTransactionsPage />} />

              {/* Reviews */}
              <Route path="/review/:transactionId" element={<ReviewPage />} />

              {/* Organizer Dashboard - ORGANIZER ONLY */}
              <Route element={<ProtectedRoute requiredRole="ORGANIZER" />}>
                <Route path="/organizer/dashboard" element={<OrganizerDashboardPage />} />
                <Route path="/organizer/transactions" element={<OrganizerTransactionsPage />} />
                <Route path="/transactions/:id" element={<TransactionDetailPage />} />
                <Route path="/events/create" element={<EventFormPage />} />
                <Route path="/events/:slug/edit" element={<EventFormPage />} />
                <Route path="/organizer/events/:slug/vouchers" element={<VoucherManagementPage />} />
                <Route path="/events/:slug/attendees" element={<AttendeeListPage />} />
              </Route>

            </Route>
          </Routes>
        </main>
        <Footer />
      </div>
    </AuthProvider>
  )
}

export default App
