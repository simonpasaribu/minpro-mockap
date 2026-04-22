import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import api from '../../features/auth/services/auth.service'

export default function ForgotPasswordPage() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess(false)
    setLoading(true)

    try {
      const response = await api.post('/auth/forgot-password', { email: email.trim().toLowerCase() })
      // Simpan token di sessionStorage untuk auto-fill di reset password page
      if (response.data?.data?.resetToken) {
        sessionStorage.setItem('resetToken', response.data.data.resetToken)
        sessionStorage.setItem('resetEmail', email.trim().toLowerCase())
      }
      // Auto redirect ke reset password page
      navigate('/reset-password')
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to send reset request')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="relative h-screen overflow-hidden bg-[#faf4ff]">
      {/* Background Image with gradient overlay */}
      <div className="absolute inset-0">
        <img
          src="https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1800&q=80"
          alt="Password recovery background"
          className="h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-[#4a3fe2]/60 via-[#4a3fe2]/40 to-[#9795ff]/30 backdrop-blur-sm" />
      </div>

      {/* Card */}
      <section className="relative flex h-full items-center justify-center px-6">
        <div className="w-full max-w-lg rounded-2xl bg-white/90 p-8 backdrop-blur-xl md:p-10">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#4a3fe2]">
            Account Recovery
          </p>

          <h1 className="mt-4 text-3xl font-bold text-[#32294f] md:text-4xl">
            Forgot Password?
          </h1>

          <p className="mt-3 text-base leading-relaxed text-[#32294f]/70">
            Enter your email address. If valid, a reset token will be generated and displayed in the terminal.
          </p>

          {error && (
            <div className="mt-6 rounded-xl bg-[#4a3fe2]/5 px-4 py-3 text-sm text-[#32294f]">
              {error}
            </div>
          )}

          {success && (
            <div className="mt-6 rounded-xl bg-[#4a3fe2]/5 px-4 py-3 text-sm text-[#32294f]">
              <p className="font-semibold">Reset token generated!</p>
              <p className="mt-1">Check the terminal/console for the token.</p>
              <p className="mt-2">Use the token to reset your password:</p>
              <Link to="/reset-password" className="mt-2 inline-block text-[#4a3fe2] hover:text-[#3a2fd2] font-semibold">
                Go to Reset Password →
              </Link>
            </div>
          )}

          <form onSubmit={handleSubmit} className="mt-8 space-y-6">
            <div>
              <label className="mb-2 block text-sm font-semibold text-[#32294f]">
                Email
              </label>
              <input
                type="email"
                placeholder="Enter your registered email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-xl bg-[#faf4ff] px-4 py-3.5 text-sm text-[#32294f] outline-none transition focus:bg-white focus:ring-2 focus:ring-[#4a3fe2]/20"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading || success}
              className="w-full rounded-full bg-[#4a3fe2] px-6 py-3.5 text-sm font-semibold text-white transition hover:bg-[#3a2fd2] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Sending...' : success ? 'Token Sent!' : 'Send Reset Link'}
            </button>
          </form>

          <p className="mt-8 text-center text-sm text-[#32294f]/70">
            Remember your password?{' '}
            <Link to="/login" className="font-semibold text-[#4a3fe2] hover:text-[#3a2fd2]">
              Back to login
            </Link>
          </p>
        </div>
      </section>
    </div>
  )
}
