import { useState, useEffect } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../features/auth/components/AuthContext'

export default function LoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { login } = useAuth()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  // Check if coming from password reset
  useEffect(() => {
    if (location.state?.resetSuccess) {
      setShowSuccess(true)
      // Clear location state
      window.history.replaceState({}, document.title)
    }
  }, [location])

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError('')

    const trimmedEmail = email.trim().toLowerCase()
    const trimmedPassword = password.trim()

    if (!trimmedEmail || !trimmedPassword) {
      setError('Email dan password wajib diisi.')
      return
    }

    setLoading(true)

    try {
      await login(trimmedEmail, trimmedPassword)
      // Redirect to 'from' page if exists (e.g., from event detail page), otherwise go to profile
      const from = location.state?.from
      navigate(from || '/profile')
    } catch (err: any) {
      setError(err.response?.data?.message || 'Login gagal')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen grid lg:grid-cols-[50%_50%]">
      {/* Success Modal Overlay - Glassmorphism */}
      {showSuccess && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-[#10062d]/20 backdrop-blur-sm">
          <div className="w-full max-w-md p-10 rounded-[2.5rem] bg-white/80 backdrop-blur-xl shadow-2xl flex flex-col items-center text-center space-y-6">
            {/* Checkmark Icon */}
            <div className="w-20 h-20 rounded-full bg-[#4a3fe2]/10 flex items-center justify-center text-[#4a3fe2] mb-2">
              <svg className="w-12 h-12" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
              </svg>
            </div>

            {/* Title */}
            <div className="space-y-3">
              <h2 className="text-3xl font-black tracking-tight text-[#32294f]">
                Kata Sandi Berhasil Diperbarui
              </h2>
              <p className="text-[#5f557f] font-medium">
                Kredensial Anda telah berhasil diperbarui. Sekarang Anda dapat mengakses dashboard event.
              </p>
            </div>

            {/* Button */}
            <button
              onClick={() => setShowSuccess(false)}
              className="w-full py-5 bg-[#4a3fe2] text-white font-bold text-lg rounded-full shadow-lg shadow-[#4a3fe2]/20 hover:scale-105 active:scale-95 transition-all duration-300"
            >
              Masuk Sekarang
            </button>
          </div>
        </div>
      )}

      {/* Left Side: Visual Branding */}
      <section className="relative hidden lg:flex flex-col justify-between p-16 bg-[#4a3fe2] overflow-hidden">
        {/* Background Image with Blend */}
        <div className="absolute inset-0 z-0">
          <img
            className="w-full h-full object-cover opacity-30 mix-blend-overlay"
            alt="Learning background"
            src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=1800&q=80"
          />
          <div className="absolute inset-0 bg-gradient-to-tr from-[#4a3fe2] via-[#4a3fe2]/80 to-transparent"></div>
        </div>

        {/* Brand Identity */}
        <div className="relative z-10">
          <span className="font-bold text-2xl tracking-tight text-white">LearnHub</span>
        </div>

        {/* Hero Text */}
        <div className="relative z-10 max-w-lg">
          <h1 className="font-extrabold text-6xl xl:text-7xl text-white tracking-tighter leading-tight mb-8">
            Belajar.<br/>Berkembang.<br/>Bertumbuh.
          </h1>
          <p className="text-xl text-white/80 leading-relaxed font-light">
            Bergabunglah dengan ekosistem kreator, profesional, dan inovator. Temukan kelas eksklusif, seminar, workshop, dan bootcamp yang dirancang untuk perkembangan karier Anda.
          </p>
        </div>

        {/* Decorative Element */}
        <div className="relative z-10 flex items-center gap-4">
          <div className="w-12 h-[1px] bg-white/40"></div>
          <span className="text-sm uppercase tracking-[0.2em] text-white/60">EST. 2026</span>
        </div>
      </section>

      {/* Right Side: Form */}
      <section className="bg-[#faf4ff] flex items-center justify-center p-6 md:p-8 lg:p-12 relative">
        {/* Mobile Brand Header */}
        <div className="lg:hidden absolute top-8 left-8">
          <h1 className="font-black text-2xl tracking-tighter text-[#4a3fe2]">LearnHub</h1>
        </div>

        <div className="w-full max-w-md space-y-4 sm:space-y-6">
          {/* Tab Navigation */}
          <div className="flex items-center gap-4 sm:gap-8 border-b border-[#b2a6d5]/15">
            <button className="pb-2 -mb-[1px] text-[#4a3fe2] font-bold border-b-2 border-[#4a3fe2] relative text-sm sm:text-base">
              Masuk
            </button>
            <Link
              to="/register"
              className="pb-2 -mb-[1px] text-[#5f557f] font-medium hover:text-[#4a3fe2] transition-colors duration-300 text-sm sm:text-base"
            >
              Buat Akun
            </Link>
          </div>

          {/* Form Container */}
          <div className="space-y-4 sm:space-y-5">
            <header>
              <h2 className="font-bold text-2xl sm:text-3xl text-[#32294f] tracking-tight">Selamat Datang Kembali</h2>
              <p className="text-[#5f557f] mt-1 sm:mt-2 text-sm sm:text-base">Akses dashboard event personal Anda.</p>
            </header>

            {/* Login Form */}
            <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
              {/* Email Address */}
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-[#5f557f]" htmlFor="email">
                  Alamat Email
                </label>
                <input
                  className="w-full bg-[#f5eeff] border-none rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-[#4a3fe2]/20 focus:bg-white transition-all placeholder:text-[#b2a6d5]"
                  id="email"
                  placeholder="user@mail.com"
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  required
                />
              </div>

              {/* Password */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="block text-sm font-semibold text-[#5f557f]" htmlFor="password">
                    Password
                  </label>
                  <Link to="/forgot-password" className="text-sm font-bold text-[#4a3fe2] hover:opacity-80 transition-opacity">
                    Forgot?
                  </Link>
                </div>
                <div className="relative">
                  <input
                    className="w-full bg-[#f5eeff] border-none rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-[#4a3fe2]/20 focus:bg-white transition-all placeholder:text-[#b2a6d5]"
                    id="password"
                    placeholder="••••••••"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-[#5f557f] hover:text-[#4a3fe2] transition-colors"
                  >
                    {showPassword ? (
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                      </svg>
                    ) : (
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              {error && (
                <div className="rounded-xl bg-[#4a3fe2]/5 px-4 py-3 text-sm text-[#32294f]">
                  {error}
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-[#4a3fe2] text-white font-bold rounded-full shadow-lg shadow-[#4a3fe2]/20 hover:scale-[1.02] active:scale-95 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Memuat...' : 'Masuk'}
              </button>
            </form>
          </div>

          {/* Footer Links */}
          <footer className="pt-4 border-t border-[#b2a6d5]/15 flex flex-col sm:flex-row justify-between items-center gap-4">
            <p className="text-sm text-[#5f557f] font-light">
              © 2026 LearnHub
            </p>
            <div className="flex gap-6">
              <Link
                to="/terms"
                className="text-xs uppercase tracking-widest text-[#5f557f] hover:text-[#4a3fe2] transition-colors"
              >
                Syarat & Ketentuan
              </Link>
              <Link
                to="/privacy"
                className="text-xs uppercase tracking-widest text-[#5f557f] hover:text-[#4a3fe2] transition-colors"
              >
                Kebijakan Privasi
              </Link>
            </div>
          </footer>
        </div>
      </section>

      {/* Support FAB */}
      <Link
        to="/help"
        className="fixed bottom-8 right-8 z-50"
      >
        <button className="w-14 h-14 bg-[#e8deff] text-[#4a3fe2] rounded-full flex items-center justify-center shadow-xl hover:bg-[#d8caff] transition-all group">
          <svg className="w-6 h-6 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </button>
      </Link>
    </main>
  )
}
