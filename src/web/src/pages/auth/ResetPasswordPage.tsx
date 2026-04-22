import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import api from '../../features/auth/services/auth.service'

export default function ResetPasswordPage() {
  const navigate = useNavigate()
  
  const [formData, setFormData] = useState({
    email: '',
    token: '',
    newPassword: '',
    confirmPassword: ''
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Auto-fill token dan email dari sessionStorage (di-set oleh ForgotPasswordPage)
  useEffect(() => {
    const savedToken = sessionStorage.getItem('resetToken')
    const savedEmail = sessionStorage.getItem('resetEmail')
    
    if (savedToken && savedEmail) {
      setFormData(prev => ({
        ...prev,
        token: savedToken,
        email: savedEmail
      }))
    }
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (formData.newPassword !== formData.confirmPassword) {
      setError('Passwords do not match')
      return
    }

    if (formData.newPassword.length < 6) {
      setError('Password must be at least 6 characters')
      return
    }

    setLoading(true)

    try {
      await api.post('/auth/reset-password', {
        email: formData.email.trim().toLowerCase(),
        token: formData.token.trim(),
        newPassword: formData.newPassword
      })
      // Hapus sessionStorage dan redirect ke login dengan success state
      sessionStorage.removeItem('resetToken')
      sessionStorage.removeItem('resetEmail')
      navigate('/login', { state: { resetSuccess: true } })
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to reset password')
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  return (
    <div className="relative h-screen overflow-hidden bg-[#faf4ff]">
      {/* Background Image with gradient overlay */}
      <div className="absolute inset-0">
        <img
          src="https://images.unsplash.com/photo-1633265486064-086b219458ec?auto=format&fit=crop&w=1800&q=80"
          alt="Reset password background"
          className="h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-[#4a3fe2]/60 via-[#4a3fe2]/40 to-[#9795ff]/30 backdrop-blur-sm" />
      </div>

      {/* Card */}
      <section className="relative flex h-full items-center justify-center px-6 py-8">
        <div className="w-full max-w-lg rounded-2xl bg-white/90 p-8 backdrop-blur-xl md:p-10 max-h-[90vh] overflow-y-auto">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#4a3fe2]">
            Reset Password
          </p>

          <h1 className="mt-4 text-3xl font-bold text-[#32294f] md:text-4xl">
            Create New Password
          </h1>

          <p className="mt-3 text-base leading-relaxed text-[#32294f]/70">
            Enter your email and create a new password to reset your account.
          </p>

          {error && (
            <div className="mt-6 rounded-xl bg-[#4a3fe2]/5 px-4 py-3 text-sm text-[#32294f]">
              {error}
            </div>
          )}


          <form onSubmit={handleSubmit} className="mt-8 space-y-6">
            <div>
              <label className="mb-2 block text-sm font-semibold text-[#32294f]">
                Email
              </label>
              <input
                type="email"
                name="email"
                placeholder="Enter your email"
                value={formData.email}
                onChange={handleChange}
                className="w-full rounded-xl bg-[#faf4ff] px-4 py-3.5 text-sm text-[#32294f] outline-none transition focus:bg-white focus:ring-2 focus:ring-[#4a3fe2]/20"
                required
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-[#32294f]">
                New Password
              </label>
              <input
                type="password"
                name="newPassword"
                placeholder="Enter new password (min 6 chars)"
                value={formData.newPassword}
                onChange={handleChange}
                className="w-full rounded-xl bg-[#faf4ff] px-4 py-3.5 text-sm text-[#32294f] outline-none transition focus:bg-white focus:ring-2 focus:ring-[#4a3fe2]/20"
                required
                minLength={6}
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-[#32294f]">
                Confirm Password
              </label>
              <input
                type="password"
                name="confirmPassword"
                placeholder="Confirm new password"
                value={formData.confirmPassword}
                onChange={handleChange}
                className="w-full rounded-xl bg-[#faf4ff] px-4 py-3.5 text-sm text-[#32294f] outline-none transition focus:bg-white focus:ring-2 focus:ring-[#4a3fe2]/20"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-full bg-[#4a3fe2] px-6 py-3.5 text-sm font-semibold text-white transition hover:bg-[#3a2fd2] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Resetting...' : 'Reset Password'}
            </button>
          </form>

          <p className="mt-8 text-center text-sm text-[#32294f]/70">
            Didn't receive reset link?{' '}
            <Link to="/forgot-password" className="font-semibold text-[#4a3fe2] hover:text-[#3a2fd2]">
              Request again
            </Link>
          </p>
        </div>
      </section>
    </div>
  )
}
