import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowRight, ArrowLeft } from 'lucide-react'
import api from '../../features/auth/services/auth.service'

export default function ForgotPasswordPage() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [])

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
    <main className="min-h-screen bg-[#faf4ff] flex items-center justify-center p-6 md:p-8">
      {/* Background Image with gradient overlay */}
      <div className="absolute inset-0 z-0">
        <img
          src="https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1800&q=80"
          alt="Password recovery background"
          className="h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-[#4a3fe2]/80 via-[#4a3fe2]/40 to-transparent" />
      </div>

      {/* Glass Card */}
      <section className="relative z-10 w-full max-w-md">
        <div className="bg-white/85 backdrop-blur-xl rounded-xl p-10 shadow-2xl border border-white/20">
          {/* Editorial Branding */}
          <div className="mb-8">
            <span className="text-xs font-bold uppercase tracking-[0.2em] text-[#4a3fe2] block mb-3">
              Account Recovery
            </span>
            <h1 className="font-bold text-4xl text-[#32294f] tracking-tight leading-tight">
              Lupa Kata Sandi?
            </h1>
            <p className="mt-4 text-sm text-[#5f557f] leading-relaxed">
              Masukkan alamat email yang terkait dengan akun Anda. Kami akan mengirimkan tautan aman untuk mereset kata sandi dan mengakses kembali dashboard Anda.
            </p>
          </div>

          {error && (
            <div className="rounded-xl bg-[#4a3fe2]/5 px-4 py-3 text-sm text-[#32294f]">
              {error}
            </div>
          )}

          {success && (
            <div className="rounded-xl bg-[#4a3fe2]/5 px-4 py-3 text-sm text-[#32294f]">
              <p className="font-semibold">Reset token generated!</p>
              <p className="mt-1">Check the terminal/console for the token.</p>
              <p className="mt-2">Gunakan token untuk mereset kata sandi Anda:</p>
              <Link to="/reset-password" className="mt-2 inline-block text-[#4a3fe2] hover:text-[#3a2fd2] font-semibold">
                Pergi ke Reset Kata Sandi →
              </Link>
            </div>
          )}

          {/* Recovery Form */}
          <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
            <div className="space-y-2">
              <label className="text-xs font-semibold text-[#5f557f] uppercase tracking-wider" htmlFor="email">
                Alamat Email
              </label>
              <input
                className="w-full bg-[#f5eeff] border-none rounded-lg px-3 sm:px-4 py-3 sm:py-4 text-sm text-[#32294f] placeholder:text-[#b2a6d5]/50 focus:ring-2 focus:ring-[#4a3fe2]/20 focus:bg-white transition-all"
                id="email"
                name="email"
                placeholder="user@mail.com"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading || success}
              className="w-full bg-[#4a3fe2] text-white font-bold py-3 sm:py-4 rounded-full hover:bg-[#3a2fd6] transition-all duration-300 shadow-lg shadow-[#4a3fe2]/20 flex items-center justify-center gap-2 group disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
            >
              <span>{loading ? 'Sending...' : success ? 'Token Sent!' : 'Send Reset Link'}</span>
              {!loading && !success && <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />}
            </button>
          </form>

          {/* Footer Link */}
          <div className="mt-6 sm:mt-10 pt-4 sm:pt-6 border-t border-[#b2a6d5]/10 text-center">
            <Link
              to="/login"
              className="inline-flex items-center gap-2 text-[#5f557f] hover:text-[#4a3fe2] text-xs font-bold uppercase tracking-widest transition-colors duration-200"
            >
              <ArrowLeft className="w-4 h-4" />
              Kembali ke Masuk
            </Link>
          </div>
        </div>
      </section>
    </main>
  )
}
