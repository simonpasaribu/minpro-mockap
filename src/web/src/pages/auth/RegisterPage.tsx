import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../features/auth/components/AuthContext'

export default function RegisterPage() {
  const navigate = useNavigate()
  const { register } = useAuth()

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    referralCode: ''
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showExitModal, setShowExitModal] = useState(false)
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const [pendingNavigation, setPendingNavigation] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    // Validate password length
    if (formData.password.length < 8) {
      setError('Kata sandi harus minimal 8 karakter')
      return
    }

    // Validate firstName and lastName (min 2 chars to match backend)
    if (formData.firstName.length < 2) {
      setError('Nama depan harus minimal 2 karakter')
      return
    }
    if (formData.lastName.length < 2) {
      setError('Nama belakang harus minimal 2 karakter')
      return
    }

    setLoading(true)

    try {
      await register(formData)
      setHasUnsavedChanges(false)
      navigate('/profile')
    } catch (err: any) {
      setError(err.response?.data?.message || 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
    setHasUnsavedChanges(true)
  }

  const handleExitConfirm = () => {
    setShowExitModal(false)
    setHasUnsavedChanges(false)
    if (pendingNavigation) {
      navigate(pendingNavigation)
    }
  }

  const handleExitCancel = () => {
    setShowExitModal(false)
    setPendingNavigation(null)
  }

  // Handle navigation away from page
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault()
        e.returnValue = ''
      }
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [hasUnsavedChanges])

  return (
    <main className="min-h-screen grid lg:grid-cols-[50%_50%]">
      {/* Left Side: Visual Anchor */}
      <section className="relative hidden lg:flex flex-col justify-between p-16 bg-[#4a3fe2] overflow-hidden">
        {/* Background Image with Blend */}
        <div className="absolute inset-0 z-0">
          <img
            className="w-full h-full object-cover opacity-30 mix-blend-overlay"
            alt="Learning background"
            src="https://images.unsplash.com/photo-1503676260728-1c00da094a0b?auto=format&fit=crop&w=1800&q=80"
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
            Belajar.<br/>Berpengalaman.<br/>Berkembang.
          </h1>
          <p className="text-xl text-white/80 leading-relaxed font-light">
            Bergabunglah dalam ekosistem pilihan para kreator, pemikir, dan pembangun. Temukan kelas eksklusif, seminar profesional, workshop imersif, dan bootcamp intensif yang dirancang untuk era modern.
          </p>
        </div>

        {/* Decorative Element */}
        <div className="relative z-10 flex items-center gap-4">
          <div className="w-12 h-[1px] bg-white/40"></div>
          <span className="text-sm uppercase tracking-[0.2em] text-white/60">EST. 2026</span>
        </div>
      </section>

      {/* Right Side: Interaction Canvas */}
      <section className="bg-[#faf4ff] flex items-center justify-center p-6 md:p-8 lg:p-12">
        <div className="w-full max-w-md space-y-6">
          {/* Tab Navigation */}
          <div className="flex items-center gap-8 border-b border-[#b2a6d5]/15">
            <Link
              to="/login"
              onClick={(e) => {
                if (hasUnsavedChanges) {
                  e.preventDefault()
                  setPendingNavigation('/login')
                  setShowExitModal(true)
                }
              }}
              className="pb-2 -mb-[1px] text-[#5f557f] font-medium hover:text-[#4a3fe2] transition-colors duration-300"
            >
              Masuk
            </Link>
            <button className="pb-2 -mb-[1px] text-[#4a3fe2] font-bold border-b-2 border-[#4a3fe2] relative">
              Buat Akun
            </button>
          </div>

          {/* Form Container */}
          <div className="space-y-4 sm:space-y-5">
            <header>
              <h2 className="font-bold text-2xl sm:text-3xl text-[#32294f] tracking-tight">Mulai perjalanan Anda.</h2>
              <p className="text-[#5f557f] mt-1 sm:mt-2 text-sm sm:text-base">Isi detail Anda untuk memulai.</p>
            </header>

            <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
              {/* Name Row */}
              <div className="grid grid-cols-2 gap-3 sm:gap-4">
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-[#5f557f]" htmlFor="first-name">Nama Depan</label>
                  <input
                    className="w-full bg-[#f5eeff] border-none rounded-xl px-3 sm:px-4 py-2.5 focus:ring-2 focus:ring-[#4a3fe2]/20 focus:bg-white transition-all placeholder:text-[#b2a6d5] text-sm sm:text-base"
                    id="first-name"
                    name="firstName"
                    placeholder="Jane"
                    type="text"
                    value={formData.firstName}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-[#5f557f]" htmlFor="last-name">Nama Belakang</label>
                  <input
                    className="w-full bg-[#f5eeff] border-none rounded-xl px-3 sm:px-4 py-2.5 focus:ring-2 focus:ring-[#4a3fe2]/20 focus:bg-white transition-all placeholder:text-[#b2a6d5] text-sm sm:text-base"
                    id="last-name"
                    name="lastName"
                    placeholder="Doe"
                    type="text"
                    value={formData.lastName}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>

              {/* Email */}
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-[#5f557f]" htmlFor="email">Alamat Email</label>
                <input
                  className="w-full bg-[#f5eeff] border-none rounded-xl px-4 py-3.5 focus:ring-2 focus:ring-[#4a3fe2]/20 focus:bg-white transition-all placeholder:text-[#b2a6d5]"
                  id="email"
                  name="email"
                  placeholder="jane.doe@editorial.com"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                />
              </div>

              {/* Password */}
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-[#5f557f]" htmlFor="password">Kata Sandi</label>
                <div className="relative">
                  <input
                    className="w-full bg-[#f5eeff] border-none rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-[#4a3fe2]/20 focus:bg-white transition-all placeholder:text-[#b2a6d5]"
                    id="password"
                    name="password"
                    placeholder="••••••••"
                    type={showPassword ? 'text' : 'password'}
                    value={formData.password}
                    onChange={handleChange}
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
                <p className="text-xs text-[#5f557f]/70">Minimal 8 karakter</p>
              </div>

              {/* Referral */}
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-[#5f557f]" htmlFor="referral">
                  Referral Code <span className="font-normal opacity-60">(Optional)</span>
                </label>
                <input
                  className="w-full bg-[#f5eeff] border-none rounded-xl px-4 py-3.5 focus:ring-2 focus:ring-[#4a3fe2]/20 focus:bg-white transition-all placeholder:text-[#b2a6d5] uppercase tracking-wider"
                  id="referral"
                  name="referralCode"
                  placeholder="LEARNHUB-2026"
                  type="text"
                  value={formData.referralCode}
                  onChange={handleChange}
                />
              </div>

              {error && (
                <div className="rounded-xl bg-[#4a3fe2]/5 px-4 py-3 text-sm text-[#32294f]">
                  {error}
                </div>
              )}

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-[#4a3fe2] text-white font-bold rounded-full shadow-lg shadow-[#4a3fe2]/20 hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Membuat Akun...' : 'Buat Akun'}
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

      {/* Exit Confirmation Modal */}
      {showExitModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-[#10062d]/20 backdrop-blur-sm">
          <div className="w-full max-w-md p-8 rounded-2xl bg-white/90 backdrop-blur-xl shadow-2xl space-y-6">
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-[#4a3fe2]/10 flex items-center justify-center text-[#4a3fe2] mx-auto mb-4">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-[#32294f] mb-2">Tinggalkan halaman ini?</h3>
              <p className="text-[#5f557f]">
                Anda memiliki perubahan yang belum disimpan. Apakah Anda yakin ingin keluar tanpa membuat akun?
              </p>
            </div>
            <div className="flex gap-4">
              <button
                onClick={handleExitCancel}
                className="flex-1 py-3 bg-[#f5eeff] text-[#32294f] font-bold rounded-full hover:bg-[#e8deff] transition-colors"
              >
                Tetap Disini
              </button>
              <button
                onClick={handleExitConfirm}
                className="flex-1 py-3 bg-[#4a3fe2] text-white font-bold rounded-full hover:bg-[#3d2fd6] transition-colors"
              >
                Keluar
              </button>
            </div>
          </div>
        </div>
      )}

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
