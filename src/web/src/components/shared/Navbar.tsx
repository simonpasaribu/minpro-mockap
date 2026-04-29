import { useState, useEffect } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { Menu, X, User, LogOut, Calendar, AlertCircle, LayoutDashboard } from 'lucide-react'
import { getUnsavedChangesFlag } from '../../contexts/UnsavedChangesContext'
import { useAuth } from '../../features/auth/components/AuthContext'

export default function Navbar() {
  const { user, logout } = useAuth()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isScrolled, setIsScrolled] = useState(false)
  const [showLogoutModal, setShowLogoutModal] = useState(false)
  const [showUnsavedModal, setShowUnsavedModal] = useState(false)
  const [pendingNavigation, setPendingNavigation] = useState<(() => void) | null>(null)
  const navigate = useNavigate()
  const location = useLocation()

  const checkUnsavedChanges = (navigationAction: () => void) => {
    if (getUnsavedChangesFlag()) {
      setPendingNavigation(() => navigationAction)
      setShowUnsavedModal(true)
    } else {
      navigationAction()
    }
  }

  const handleConfirmUnsaved = () => {
    setShowUnsavedModal(false)
    if (pendingNavigation) {
      pendingNavigation()
      setPendingNavigation(null)
    }
  }

  const handleCancelUnsaved = () => {
    setShowUnsavedModal(false)
    setPendingNavigation(null)
  }

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20)
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    if (isMenuOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [isMenuOpen])

  const handleLogoutClick = () => {
    setShowLogoutModal(true)
    setIsMenuOpen(false)
  }

  const confirmLogout = () => {
    logout()
    setShowLogoutModal(false)
    navigate('/login')
  }

  const navLinks = [
    { name: 'Event', href: '/events', icon: Calendar },
    ...(user?.role?.toUpperCase() === 'ORGANIZER' ? [{ name: 'Dashboard', href: '/organizer/dashboard', icon: LayoutDashboard }] : []),
  ]

  // Check if current page is auth page
  const isAuthPage = location.pathname === '/login' || location.pathname === '/register' || location.pathname === '/forgot-password' || location.pathname === '/reset-password'

  return (
    <>
    <nav className={`fixed top-0 left-0 right-0 z-50 w-full transition-all duration-300 ${
      isScrolled
        ? 'bg-white/90 backdrop-blur-md shadow-md'
        : 'bg-white shadow-md'
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 w-full">
        <div className="flex items-center justify-between h-12 w-full">
          {/* Logo */}
          <Link to="/" onClick={(e) => {
            e.preventDefault()
            checkUnsavedChanges(() => navigate('/'))
          }} className="flex items-center gap-2">
            <span className="font-bold text-xl text-[#32294f]">LearnHub</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-6">
            {navLinks.map((link) => (
              <div
                key={link.name}
                onClick={() => checkUnsavedChanges(() => navigate(link.href))}
                className={`flex items-center gap-2 text-sm font-medium transition-colors cursor-pointer ${
                  location.pathname === link.href
                    ? 'text-[#4a3fe2]'
                    : 'text-[#5f557f] hover:text-[#32294f]'
                }`}
              >
                <link.icon className="w-4 h-4" />
                {link.name}
              </div>
            ))}

            {!!user ? (
              <div className="flex items-center gap-3">
                <div
                  onClick={() => checkUnsavedChanges(() => navigate('/profile'))}
                  className="flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-slate-900 cursor-pointer"
                >
                  <User className="w-4 h-4" />
                  Profil
                </div>
                <button
                  onClick={handleLogoutClick}
                  className="flex items-center gap-2 px-3 py-2 text-sm text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  Keluar
                </button>
              </div>
            ) : (
              !isAuthPage && (
                <div className="flex items-center gap-3">
                  <div
                    onClick={() => checkUnsavedChanges(() => navigate('/login'))}
                    className="text-sm font-medium text-slate-600 hover:text-slate-900 cursor-pointer"
                  >
                    Masuk
                  </div>
                  <div
                    onClick={() => checkUnsavedChanges(() => navigate('/register'))}
                    className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors cursor-pointer"
                  >
                    Daftar
                  </div>
                </div>
              )
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="md:hidden p-2 rounded-lg text-[#5f557f] hover:bg-[#f5eeff] relative z-[100]"
          >
            {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden py-4 border-t border-slate-200">
            <div className="flex flex-col gap-3">
              {navLinks.map((link) => (
                <div
                  key={link.name}
                  onClick={() => {
                    checkUnsavedChanges(() => navigate(link.href))
                    setIsMenuOpen(false)
                  }}
                  className={`flex items-center justify-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all shadow-sm cursor-pointer ${
                    location.pathname === link.href
                      ? 'bg-[#4a3fe2] text-white shadow-[#4a3fe2]/20'
                      : 'bg-white text-[#5f557f] hover:bg-[#f5eeff] hover:shadow-md'
                  }`}
                >
                  <link.icon className="w-5 h-5" />
                  {link.name}
                </div>
              ))}

              {!!user ? (
                <>
                  <div className="flex flex-col gap-3">
                    <div
                      onClick={() => {
                        checkUnsavedChanges(() => navigate('/profile'))
                        setIsMenuOpen(false)
                      }}
                      className="flex items-center justify-center gap-3 px-4 py-3 rounded-xl text-sm font-medium bg-white text-[#5f557f] hover:bg-[#f5eeff] hover:shadow-md transition-all shadow-sm cursor-pointer"
                    >
                      <User className="w-5 h-5" />
                      Profil
                    </div>
                    <button
                      onClick={handleLogoutClick}
                      className="flex items-center justify-center gap-3 px-4 py-3 rounded-xl text-sm font-medium bg-white text-red-500 hover:bg-red-50 hover:shadow-md transition-all shadow-sm"
                    >
                      <LogOut className="w-5 h-5" />
                      Keluar
                    </button>
                  </div>
                </>
              ) : (
                !isAuthPage && (
                  <div className="flex flex-col gap-3">
                    <div
                      onClick={() => {
                        checkUnsavedChanges(() => navigate('/login'))
                        setIsMenuOpen(false)
                      }}
                      className="flex items-center justify-center gap-3 px-4 py-3 rounded-xl text-sm font-medium bg-[#e8deff] text-[#4a3fe2] hover:bg-[#d8caff] hover:shadow-md transition-all shadow-sm cursor-pointer"
                    >
                      Masuk
                    </div>
                    <div
                      onClick={() => {
                        checkUnsavedChanges(() => navigate('/register'))
                        setIsMenuOpen(false)
                      }}
                      className="flex items-center justify-center gap-3 px-4 py-3 rounded-xl text-sm font-medium bg-[#4a3fe2] text-white hover:bg-[#32294f] transition-all shadow-md shadow-[#4a3fe2]/20 cursor-pointer"
                    >
                      Daftar
                    </div>
                  </div>
                )
              )}
            </div>
          </div>
        )}
      </div>
    </nav>

      {/* Logout Confirmation Modal */}
      {showLogoutModal && (
        <div className="fixed inset-0 z-[100] bg-[#32294f]/50 backdrop-blur-sm p-4">
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white max-w-sm w-full rounded-2xl p-6 sm:p-8 text-center shadow-2xl">
            <div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <LogOut className="w-7 h-7 text-red-600" />
            </div>
            <h3 className="text-lg sm:text-xl font-bold text-[#32294f] mb-2">Keluar dari Akun?</h3>
            <p className="text-sm text-[#5f557f] mb-6">Anda akan keluar dari akun Anda. Lanjutkan?</p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowLogoutModal(false)}
                className="flex-1 px-4 py-2.5 rounded-xl border border-gray-300 text-gray-700 font-semibold hover:bg-gray-50 transition-colors"
              >
                Batal
              </button>
              <button
                onClick={confirmLogout}
                className="flex-1 px-4 py-2.5 rounded-xl bg-red-500 text-white font-semibold hover:bg-red-600 transition-colors"
              >
                Keluar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Unsaved Changes Confirmation Modal */}
      {showUnsavedModal && (
        <div className="fixed inset-0 z-[100] bg-[#32294f]/50 backdrop-blur-sm p-4">
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white max-w-sm w-full rounded-2xl p-6 sm:p-8 text-center shadow-2xl">
            <div className="w-14 h-14 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-7 h-7 text-yellow-600" />
            </div>
            <h3 className="text-lg sm:text-xl font-bold text-[#32294f] mb-2">Perubahan Belum Disimpan</h3>
            <p className="text-sm text-[#5f557f] mb-6">Anda memiliki perubahan yang belum disimpan. Apakah Anda yakin ingin meninggalkan halaman ini?</p>
            <div className="flex gap-3">
              <button
                onClick={handleCancelUnsaved}
                className="flex-1 px-4 py-2.5 rounded-xl border border-gray-300 text-gray-700 font-semibold hover:bg-gray-50 transition-colors"
              >
                Batal
              </button>
              <button
                onClick={handleConfirmUnsaved}
                className="flex-1 px-4 py-2.5 rounded-xl bg-blue-600 text-white font-semibold hover:bg-blue-700 transition-colors"
              >
                Ya, Tinggalkan
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
