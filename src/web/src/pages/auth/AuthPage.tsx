import { useState, useEffect } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../features/auth/components/AuthContext'

export default function AuthPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { login, register } = useAuth()

  // Tab state: 'login' or 'register'
  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login')

  // Login form state
  const [loginEmail, setLoginEmail] = useState('')
  const [loginPassword, setLoginPassword] = useState('')
  const [loginError, setLoginError] = useState('')
  const [loginLoading, setLoginLoading] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)

  // Register form state
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    referralCode: ''
  })
  const [registerError, setRegisterError] = useState('')
  const [registerLoading, setRegisterLoading] = useState(false)
  const [showExitModal, setShowExitModal] = useState(false)
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const [pendingNavigation, setPendingNavigation] = useState<string | null>(null)

  // Set initial tab based on URL
  useEffect(() => {
    const path = location.pathname
    if (path === '/register') {
      setActiveTab('register')
    } else {
      setActiveTab('login')
    }
  }, [location.pathname])

  // Check if coming from password reset
  useEffect(() => {
    if (location.state?.resetSuccess) {
      setShowSuccess(true)
      window.history.replaceState({}, document.title)
    }
  }, [location])

  const handleLoginSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setLoginError('')

    const trimmedEmail = loginEmail.trim().toLowerCase()
    const trimmedPassword = loginPassword.trim()

    if (!trimmedEmail || !trimmedPassword) {
      setLoginError('Email dan password wajib diisi.')
      return
    }

    setLoginLoading(true)

    try {
      await login(trimmedEmail, trimmedPassword)
      const from = location.state?.from
      navigate(from || '/profile')
    } catch (err: any) {
      setLoginError(err.response?.data?.message || 'Login failed')
    } finally {
      setLoginLoading(false)
    }
  }

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setRegisterError('')
    setRegisterLoading(true)

    try {
      await register(formData)
      setHasUnsavedChanges(false)
      navigate('/profile')
    } catch (err: any) {
      setRegisterError(err.response?.data?.message || 'Registration failed')
    } finally {
      setRegisterLoading(false)
    }
  }

  const handleRegisterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
    // Check if form has any data
    const hasData = Object.values({ ...formData, [e.target.name]: e.target.value }).some(
      (value) => value && value.toString().trim().length > 0
    )
    setHasUnsavedChanges(hasData)
  }

  const handleTabChange = (tab: 'login' | 'register') => {
    if (tab === 'login' && hasUnsavedChanges) {
      setPendingNavigation('/login')
      setShowExitModal(true)
      return
    }
    setActiveTab(tab)
    navigate(tab === 'login' ? '/login' : '/register', { replace: true })
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
    <main className="grid lg:grid-cols-[50%_50%]">
      {/* Success Modal Overlay */}
      {showSuccess && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-[#10062d]/20 backdrop-blur-sm">
          <div className="w-full max-w-md p-10 rounded-[2.5rem] bg-white/80 backdrop-blur-xl shadow-2xl flex flex-col items-center text-center space-y-6">
            <div className="w-20 h-20 rounded-full bg-[#4a3fe2]/10 flex items-center justify-center text-[#4a3fe2] mb-2">
              <svg className="w-12 h-12" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
              </svg>
            </div>
            <div className="space-y-3">
              <h2 className="text-3xl font-black tracking-tight text-[#32294f]">
                Kata Sandi Berhasil Diperbarui
              </h2>
              <p className="text-[#5f557f] font-medium">
                Your credentials have been securely updated. You can now access your events dashboard.
              </p>
            </div>
            <button
              onClick={() => setShowSuccess(false)}
              className="w-full py-5 bg-[#4a3fe2] text-white font-bold text-lg rounded-full shadow-lg shadow-[#4a3fe2]/20 hover:scale-105 active:scale-95 transition-all duration-300"
            >
              Masuk Sekarang
            </button>
          </div>
        </div>
      )}

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
              <h3 className="text-2xl font-bold text-[#32294f] mb-2">Leave this page?</h3>
              <p className="text-[#5f557f]">
                You have unsaved changes. Are you sure you want to leave without creating your account?
              </p>
            </div>
            <div className="flex gap-4">
              <button
                onClick={handleExitCancel}
                className="flex-1 py-3 bg-[#f5eeff] text-[#32294f] font-bold rounded-full hover:bg-[#e8deff] transition-colors"
              >
                Stay Here
              </button>
              <button
                onClick={handleExitConfirm}
                className="flex-1 py-3 bg-[#4a3fe2] text-white font-bold rounded-full hover:bg-[#3d2fd6] transition-colors"
              >
                Leave Anyway
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Left Side: Visual Branding */}
      <section className="relative hidden lg:flex flex-col justify-center p-16 bg-[#4a3fe2] overflow-hidden min-h-screen">
        <div className="absolute inset-0 z-0">
          <img
            className="w-full h-full object-cover opacity-30 mix-blend-overlay"
            alt="Learning background"
            src="https://images.unsplash.com/photo-1503676260728-1c00da094a0b?auto=format&fit=crop&w=1800&q=80"
          />
          <div className="absolute inset-0 bg-gradient-to-tr from-[#4a3fe2] via-[#4a3fe2]/80 to-transparent"></div>
        </div>

        <div className="relative z-10 max-w-lg">
          <h1 className="font-extrabold text-6xl xl:text-7xl text-white tracking-tighter leading-tight mb-8">
            Learn.<br/>Experience.<br/>Grow.
          </h1>
          <p className="text-xl text-white/80 leading-relaxed font-light">
            Join a curated ecosystem of creators, thinkers, and builders. Discover exclusive classes, professional seminars, immersive workshops, and intensive bootcamps designed for the modern era.
          </p>
        </div>
      </section>

      {/* Right Side: Form */}
      <section className="bg-[#faf4ff] flex items-center justify-center p-6 md:p-8 lg:p-12 relative min-h-screen">
        {/* Mobile Brand Header */}
        <div className="lg:hidden absolute top-8 left-8">
          <h1 className="font-black text-2xl tracking-tighter text-[#4a3fe2]">LearnHub</h1>
        </div>

        <div className="w-full max-w-md space-y-4 sm:space-y-6">
          {/* Tab Navigation */}
          <div className="flex items-center gap-4 sm:gap-8 border-b border-[#b2a6d5]/15">
            <button
              onClick={() => handleTabChange('login')}
              className={`pb-2 -mb-[1px] font-bold border-b-2 relative transition-colors text-sm sm:text-base ${
                activeTab === 'login'
                  ? 'text-[#4a3fe2] border-[#4a3fe2]'
                  : 'text-[#5f557f] border-transparent hover:text-[#4a3fe2]'
              }`}
            >
              Masuk
            </button>
            <button
              onClick={() => handleTabChange('register')}
              className={`pb-2 -mb-[1px] font-bold border-b-2 relative transition-colors text-sm sm:text-base ${
                activeTab === 'register'
                  ? 'text-[#4a3fe2] border-[#4a3fe2]'
                  : 'text-[#5f557f] border-transparent hover:text-[#4a3fe2]'
              }`}
            >
              Buat Akun
            </button>
          </div>

          {/* Form Container */}
          <div className="space-y-4 sm:space-y-5">
            {activeTab === 'login' ? (
              <>
                <header>
                  <h2 className="font-bold text-2xl sm:text-3xl text-[#32294f] tracking-tight">Selamat Datang Kembali</h2>
                  <p className="text-sm sm:text-base text-[#5f557f] mt-1 sm:mt-2">Akses dashboard event yang dipersonalisasi.</p>
                </header>

                <form onSubmit={handleLoginSubmit} className="space-y-3 sm:space-y-4">
                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-[#5f557f]" htmlFor="login-email">
                      Alamat Email
                    </label>
                    <input
                      className="w-full bg-[#f5eeff] border-none rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-[#4a3fe2]/20 focus:bg-white transition-all placeholder:text-[#b2a6d5]"
                      id="login-email"
                      placeholder="user@mail.com"
                      type="email"
                      value={loginEmail}
                      onChange={(event) => setLoginEmail(event.target.value)}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <label className="block text-sm font-semibold text-[#5f557f]" htmlFor="login-password">
                        Kata Sandi
                      </label>
                      <Link to="/forgot-password" className="text-sm font-bold text-[#4a3fe2] hover:opacity-80 transition-opacity">
                        Lupa?
                      </Link>
                    </div>
                    <input
                      className="w-full bg-[#f5eeff] border-none rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-[#4a3fe2]/20 focus:bg-white transition-all placeholder:text-[#b2a6d5]"
                      id="login-password"
                      placeholder="••••••••"
                      type="password"
                      value={loginPassword}
                      onChange={(event) => setLoginPassword(event.target.value)}
                      required
                    />
                  </div>

                  {loginError && (
                    <div className="rounded-xl bg-[#4a3fe2]/5 px-4 py-3 text-sm text-[#32294f]">
                      {loginError}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={loginLoading}
                    className="w-full py-3 bg-[#4a3fe2] text-white font-bold rounded-full shadow-lg shadow-[#4a3fe2]/20 hover:scale-[1.02] active:scale-95 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loginLoading ? 'Memuat...' : 'Masuk'}
                  </button>
                </form>
              </>
            ) : (
              <>
                <header>
                  <h2 className="font-bold text-2xl sm:text-3xl text-[#32294f] tracking-tight">Mulai perjalanan Anda.</h2>
                  <p className="text-sm sm:text-base text-[#5f557f] mt-1 sm:mt-2">Isi detail Anda untuk memulai.</p>
                </header>

                <form onSubmit={handleRegisterSubmit} className="space-y-3 sm:space-y-4">
                  <div className="grid grid-cols-2 gap-3 sm:gap-4">
                    <div className="space-y-2">
                      <label className="block text-sm font-semibold text-[#5f557f]" htmlFor="firstName">
                        Nama Depan
                      </label>
                      <input
                        className="w-full bg-[#f5eeff] border-none rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-[#4a3fe2]/20 focus:bg-white transition-all placeholder:text-[#b2a6d5]"
                        id="firstName"
                        name="firstName"
                        placeholder="John"
                        type="text"
                        value={formData.firstName}
                        onChange={handleRegisterChange}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="block text-sm font-semibold text-[#5f557f]" htmlFor="lastName">
                        Nama Belakang
                      </label>
                      <input
                        className="w-full bg-[#f5eeff] border-none rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-[#4a3fe2]/20 focus:bg-white transition-all placeholder:text-[#b2a6d5]"
                        id="lastName"
                        name="lastName"
                        placeholder="Doe"
                        type="text"
                        value={formData.lastName}
                        onChange={handleRegisterChange}
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-[#5f557f]" htmlFor="register-email">
                      Alamat Email
                    </label>
                    <input
                      className="w-full bg-[#f5eeff] border-none rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-[#4a3fe2]/20 focus:bg-white transition-all placeholder:text-[#b2a6d5]"
                      id="register-email"
                      name="email"
                      placeholder="user@mail.com"
                      type="email"
                      value={formData.email}
                      onChange={handleRegisterChange}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-[#5f557f]" htmlFor="register-password">
                      Password
                    </label>
                    <input
                      className="w-full bg-[#f5eeff] border-none rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-[#4a3fe2]/20 focus:bg-white transition-all placeholder:text-[#b2a6d5]"
                      id="register-password"
                      name="password"
                      placeholder="••••••••"
                      type="password"
                      value={formData.password}
                      onChange={handleRegisterChange}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-[#5f557f]" htmlFor="referralCode">
                      Kode Referral (Opsional)
                    </label>
                    <input
                      className="w-full bg-[#f5eeff] border-none rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-[#4a3fe2]/20 focus:bg-white transition-all placeholder:text-[#b2a6d5]"
                      id="referralCode"
                      name="referralCode"
                      placeholder="Enter code"
                      type="text"
                      value={formData.referralCode}
                      onChange={handleRegisterChange}
                    />
                  </div>

                  {registerError && (
                    <div className="rounded-xl bg-[#4a3fe2]/5 px-4 py-3 text-sm text-[#32294f]">
                      {registerError}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={registerLoading}
                    className="w-full py-3 bg-[#4a3fe2] text-white font-bold rounded-full shadow-lg shadow-[#4a3fe2]/20 hover:scale-[1.02] active:scale-95 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {registerLoading ? 'Memuat...' : 'Buat Akun'}
                  </button>
                </form>
              </>
            )}
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
                Terms of Service
              </Link>
              <Link
                to="/privacy"
                className="text-xs uppercase tracking-widest text-[#5f557f] hover:text-[#4a3fe2] transition-colors"
              >
                Privacy Policy
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
