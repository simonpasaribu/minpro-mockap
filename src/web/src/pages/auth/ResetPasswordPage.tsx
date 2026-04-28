import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowLeft, Eye, EyeOff } from 'lucide-react'
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
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [])

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
      setError('Kata sandi tidak cocok')
      return
    }

    if (formData.newPassword.length < 6) {
      setError('Kata sandi harus minimal 6 karakter')
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
      setError(err.response?.data?.message || 'Gagal mereset kata sandi')
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  return (
    <div className="min-h-screen bg-[#faf4ff] pb-16 sm:pb-20 pt-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pb-8 sm:pb-12">
        {/* Back Button */}
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 px-4 py-2 sm:px-5 sm:py-2.5 rounded-full bg-[#e2d7ff] text-[#4e339c] font-semibold hover:bg-[#d8caff] transition-colors mb-4 sm:mb-6 text-sm sm:text-base"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Kembali</span>
        </button>

        <div className="flex items-center justify-center">
          <div className="w-full max-w-md">
            {/* Brand Identity */}
            <div className="mb-6 sm:mb-10 text-center">
              <span className="text-2xl sm:text-3xl font-black tracking-tighter text-[#4a3fe2]">
                LearnHub
              </span>
            </div>

            {/* Glass Card */}
            <div className="bg-white/80 backdrop-blur-xl rounded-2xl p-6 sm:p-10 shadow-[0_10px_40px_-10px_rgba(50,41,79,0.12)] border border-white/20">
          <header className="mb-6 sm:mb-8">
            <span className="text-xs font-bold uppercase tracking-[0.2em] text-[#4a3fe2] block mb-2 sm:mb-3">
              Pemulihan Akun
            </span>
            <h1 className="font-bold text-2xl sm:text-4xl text-[#32294f] tracking-tight leading-tight">
              Kata Sandi Baru
            </h1>
            <p className="text-xs sm:text-sm text-[#5f557f] font-medium leading-relaxed mt-2 sm:mt-3">
              Masukkan email dan buat kata sandi baru untuk mereset akun Anda.
            </p>
          </header>

          {error && (
            <div className="rounded-xl bg-[#4a3fe2]/5 px-4 py-3 text-sm text-[#32294f]">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
            {/* New Password */}
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-widest text-[#5f557f] px-1" htmlFor="new-password">
                Kata Sandi Baru
              </label>
              <div className="relative">
                <input
                  className="w-full bg-[#f5eeff] border-none rounded-xl px-5 py-4 text-sm text-[#32294f] placeholder:text-[#b2a6d5]/40 focus:bg-white focus:ring-2 focus:ring-[#4a3fe2]/20 transition-all outline-none"
                  id="new-password"
                  name="newPassword"
                  placeholder="••••••••"
                  type={showNewPassword ? 'text' : 'password'}
                  value={formData.newPassword}
                  onChange={handleChange}
                  required
                  minLength={6}
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-[#5f557f]/60 hover:text-[#4a3fe2] transition-colors"
                >
                  {showNewPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Confirm Password */}
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-widest text-[#5f557f] px-1" htmlFor="confirm-password">
                Konfirmasi Kata Sandi
              </label>
              <div className="relative">
                <input
                  className="w-full bg-[#f5eeff] border-none rounded-xl px-5 py-4 text-sm text-[#32294f] placeholder:text-[#b2a6d5]/40 focus:bg-white focus:ring-2 focus:ring-[#4a3fe2]/20 transition-all outline-none"
                  id="confirm-password"
                  name="confirmPassword"
                  placeholder="••••••••"
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-[#5f557f]/60 hover:text-[#4a3fe2] transition-colors"
                >
                  {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#4a3fe2] text-white font-bold py-4 rounded-full shadow-lg shadow-[#4a3fe2]/30 hover:scale-[1.02] active:scale-95 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Mereset...' : 'Reset Kata Sandi'}
              </button>
            </div>
          </form>

          {/* Footer Link */}
          <footer className="mt-8 text-center">
            <Link
              to="/login"
              className="inline-flex items-center gap-2 text-sm font-semibold text-[#4a3fe2] hover:text-[#6249b2] transition-colors group"
            >
              <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
              Kembali ke masuk
            </Link>
          </footer>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
