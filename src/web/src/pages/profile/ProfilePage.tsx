import { useState, useEffect, useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../features/auth/components/AuthContext'
import api from '../../features/auth/services/auth.service'
import { transactionApi } from '../../features/transactions/api/transactionApi'
import { User, Verified, Mail, Phone, Cake, Users, Stars, Coins, Copy, Lock, Edit, Clock, Tag } from 'lucide-react'

interface Transaction {
  id: number
  event: {
    title: string
    startDate: string
    imageUrl: string | null
  }
  totalAmount: number
  status: string
  createdAt: string
  expiredAt?: string | null
  paymentProofUrl?: string | null
  ticketCount?: number
  updatedAt?: string
  subtotal?: number
  pointsUsed?: number
  voucherDiscount?: number
  voucherCode?: string | null
}

interface PointsData {
  total: number
  expiresAt: string | null
}

interface CouponsData {
  total: number
  coupons: Array<{
    id: number
    code: string
    discount: number
    expiresAt: string
  }>
}

interface Toast {
  id: number
  message: string
  type: 'success' | 'error'
}

export default function ProfilePage() {
  const { user, logout, upgradeToOrganizer } = useAuth()
  const navigate = useNavigate()
  const [points, setPoints] = useState<PointsData | null>(null)
  const [coupons, setCoupons] = useState<CouponsData | null>(null)
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [toasts, setToasts] = useState<Toast[]>([])
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false)
  const [upgrading, setUpgrading] = useState(false)
  const [showUpgradeModal, setShowUpgradeModal] = useState(false)
  const [showSuccessModal, setShowSuccessModal] = useState(false)
  const [agreements, setAgreements] = useState({
    responsible: false,
    noMisuse: false
  })
  const [orderFilter, setOrderFilter] = useState<'all' | 'success' | 'pending' | 'failed'>('all')

  // Count for each filter
  const filterCounts = {
    all: transactions.length,
    success: transactions.filter(t => t.status === 'DONE').length,
    pending: transactions.filter(t => t.status === 'PENDING' || t.status === 'WAITING_PAYMENT').length,
    failed: transactions.filter(t => t.status === 'FAILED' || t.status === 'EXPIRED' || t.status === 'CANCELLED').length,
  }

  // Filter transactions based on orderFilter, sort by newest, limit to 5
  const filteredTransactions = useMemo(() => {
    let filtered = transactions
    if (orderFilter === 'all') {
      filtered = transactions
    } else {
      filtered = transactions.filter(t => {
        if (orderFilter === 'success') return t.status === 'DONE'
        if (orderFilter === 'pending') return t.status === 'PENDING' || t.status === 'WAITING_PAYMENT'
        if (orderFilter === 'failed') return t.status === 'FAILED' || t.status === 'EXPIRED' || t.status === 'CANCELLED'
        return true
      })
    }
    // Sort by newest (createdAt descending)
    return filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 5)
  }, [transactions, orderFilter])

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const [pointsRes, couponsRes] = await Promise.all([
          api.get('/user/points'),
          api.get('/user/coupons')
        ])
        setPoints(pointsRes.data.data)
        setCoupons(couponsRes.data.data)
      } catch (error) {
        console.error('Failed to fetch user data:', error)
      }
    }

    const fetchTransactions = async () => {
      try {
        // Both ORGANIZER and CUSTOMER show their own purchase transactions
        const response = await transactionApi.getMyTransactions()
        setTransactions(response.data?.data || response.data || [])
      } catch (error) {
        console.error('Failed to fetch transactions:', error)
      }
    }

    if (user) {
      fetchUserData()
      fetchTransactions()
    }
  }, [user])

  // Filter out used and expired vouchers from coupon list
  const availableCoupons = useMemo(() => {
    if (!coupons || !transactions) return coupons?.coupons || []
    
    // Only count vouchers from DONE transactions (not rejected/cancelled)
    const usedVoucherCodes = new Set(
      transactions
        .filter(t => t.voucherCode && t.status === 'DONE')
        .map(t => t.voucherCode!.toUpperCase())
    )
    
    const now = new Date()
    
    // Return only coupons that haven't been used in DONE transactions and are not expired
    return coupons.coupons.filter(coupon => 
      !usedVoucherCodes.has(coupon.code.toUpperCase()) && 
      new Date(coupon.expiresAt) > now
    )
  }, [coupons, transactions])

  // Copy coupon code to clipboard
  const copyCouponCode = (code: string) => {
    navigator.clipboard.writeText(code).then(() => {
      addToast('Kode kupon berhasil disalin!', 'success')
    }).catch(() => {
      addToast('Gagal menyalin kode kupon', 'error')
    })
  }

  const addToast = (message: string, type: 'success' | 'error' = 'success') => {
    const id = Date.now()
    setToasts((prev) => [...prev, { id, message, type }])
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id))
    }, 3000)
  }

  const handleCopyReferral = () => {
    if (user?.referralCode) {
      navigator.clipboard.writeText(user.referralCode)
      addToast('Kode referral berhasil disalin!', 'success')
    }
  }

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const handleUpgradeClick = () => {
    setShowUpgradeModal(true)
  }

  const handleAgreementChange = (key: 'responsible' | 'noMisuse') => {
    setAgreements(prev => ({ ...prev, [key]: !prev[key] }))
  }

  const handleUpgradeSubmit = async () => {
    if (!agreements.responsible || !agreements.noMisuse) return

    setUpgrading(true)
    try {
      await upgradeToOrganizer()
      setShowUpgradeModal(false)
      setShowSuccessModal(true)
      // Auto logout after 2 seconds
      setTimeout(() => {
        handleLogout()
      }, 2000)
    } catch (error: any) {
      addToast(error.response?.data?.message || 'Gagal upgrade', 'error')
    } finally {
      setUpgrading(false)
    }
  }

  if (!user) {
    return (
      <main className="relative min-h-screen overflow-hidden bg-white px-4 py-10">
        <div className="mx-auto max-w-6xl">
          <div className="relative mx-auto max-w-2xl rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-2xl">
            <h1 className="text-2xl font-bold text-slate-900">User Not Found</h1>
            <p className="mt-3 text-sm text-slate-600">Data user tidak tersedia. Silakan login kembali.</p>
            <Link to="/login" className="mt-6 inline-flex rounded-2xl bg-indigo-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-indigo-700">Kembali ke Masuk</Link>
          </div>
        </div>
      </main>
    )
  }

  const fullName = `${user.firstName} ${user.lastName}`.trim()
  const initials = `${user.firstName?.charAt(0) ?? ''}${user.lastName?.charAt(0) ?? ''}`.toUpperCase()
  const memberSince = user.createdAt ? new Date(user.createdAt).toLocaleDateString('id-ID', { year: 'numeric' }) : '2024'

  return (
    <div className="min-h-screen bg-[#faf4ff] pb-16 sm:pb-20 pt-20 overflow-x-hidden">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pb-8 sm:pb-12 space-y-6 sm:space-y-12">

      {/* Toast Notifications */}
      <div className="fixed top-4 right-4 z-50 space-y-1 sm:space-y-2">
        {toasts.map((toast) => (
          <div key={toast.id} className={`rounded-xl px-4 py-3 text-sm font-medium shadow-lg transition-all ${toast.type === 'success' ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' : 'bg-red-100 text-red-800 border border-red-200'}`}>
            {toast.message}
          </div>
        ))}
      </div>

      {/* Logout Confirm Modal */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-[#32294f]/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl border border-[#b2a6d5]/20 bg-white p-4 sm:p-6 shadow-xl">
            <h3 className="text-base sm:text-lg font-bold text-[#32294f]">Keluar?</h3>
            <p className="mt-1 sm:mt-2 text-sm text-[#5f557f]">Yakin ingin keluar dari akun?</p>
            <div className="mt-4 sm:mt-6 flex gap-3">
              <button onClick={() => setShowLogoutConfirm(false)} className="flex-1 rounded-xl border border-[#b2a6d5] px-4 py-2.5 text-sm font-semibold text-[#32294f] transition hover:bg-[#f5eeff]">Batal</button>
              <button onClick={handleLogout} className="flex-1 rounded-xl bg-[#b41340] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#a70138]">Keluar</button>
            </div>
          </div>
        </div>
      )}

      {/* Upgrade to Organizer Modal */}
      {showUpgradeModal && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-[#32294f]/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-[#b2a6d5]/20 bg-white p-4 sm:p-6 shadow-xl">
            <h3 className="text-base sm:text-lg font-bold text-[#32294f]">Jadi Event Organizer?</h3>
            <p className="mt-1 sm:mt-2 text-sm text-[#5f557f]">
              Anda bisa membuat dan mengelola event setelah upgrade.
            </p>

            <div className="my-3 sm:my-5 space-y-2 sm:space-y-3">
              <label className="flex cursor-pointer items-start gap-3">
                <input
                  type="checkbox"
                  checked={agreements.responsible}
                  onChange={() => handleAgreementChange('responsible')}
                  className="mt-0.5 h-4 w-4 rounded border-[#b2a6d5] text-[#4a3fe2]"
                />
                <span className="text-sm text-[#32294f]">
                  Saya bertanggung jawab atas event yang saya buat
                </span>
              </label>

              <label className="flex cursor-pointer items-start gap-3">
                <input
                  type="checkbox"
                  checked={agreements.noMisuse}
                  onChange={() => handleAgreementChange('noMisuse')}
                  className="mt-0.5 h-4 w-4 rounded border-[#b2a6d5] text-[#4a3fe2]"
                />
                <span className="text-sm text-[#32294f]">
                  Saya tidak akan menyalahgunakan platform
                </span>
              </label>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowUpgradeModal(false)}
                className="flex-1 rounded-xl border border-[#b2a6d5] px-4 py-2.5 text-sm font-semibold text-[#32294f] transition hover:bg-[#f5eeff]"
              >
                Batal
              </button>
              <button
                onClick={handleUpgradeSubmit}
                disabled={!agreements.responsible || !agreements.noMisuse || upgrading}
                className="flex-1 rounded-xl bg-[#4a3fe2] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#3d2fd6] disabled:opacity-50"
              >
                {upgrading ? 'Memproses...' : 'Konfirmasi'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Upgrade Success Modal */}
      {showSuccessModal && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-[#32294f]/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl border border-[#b2a6d5]/20 bg-white p-6 sm:p-8 shadow-xl text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
              <svg className="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-[#32294f]">Berhasil!</h3>
            <p className="mt-2 text-sm text-[#5f557f]">
              Akun Anda telah menjadi Event Organizer. Anda akan keluar otomatis untuk login kembali.
            </p>
          </div>
        </div>
      )}

        {/* Identity Header */}
        <header className="relative overflow-hidden bg-[#32294f] rounded-3xl p-8 sm:p-12 text-white flex flex-col md:flex-row items-center md:items-end justify-between gap-8 shadow-[0_10px_40px_-10px_rgba(50,41,79,0.2)]">
          <div className="flex flex-col md:flex-row items-center gap-8 z-10">
            <div className="w-32 h-32 rounded-full border-4 border-[#9795ff] overflow-hidden bg-[#e2d7ff]">
              {user.profilePicture ? (
                <img src={user.profilePicture} alt={fullName} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-4xl font-bold text-[#4a3fe2]">
                  {initials || 'U'}
                </div>
              )}
            </div>
            <div className="text-center md:text-left">
              <h1 className="text-4xl font-extrabold tracking-tight text-white mb-2">{fullName}</h1>
              <p className="text-[#e2d7ff] font-medium mb-1">{user.email}</p>
              <div className="flex items-center justify-center md:justify-start gap-2 text-[#b2a6d5] text-sm">
                <Cake className="w-4 h-4" />
                <span>Member since {memberSince}</span>
              </div>
            </div>
          </div>
          <div className="flex flex-col justify-center gap-4 z-10">
            <Link
              to="/profile/change-password"
              className="px-6 py-3 rounded-full bg-white/10 text-white font-semibold flex items-center justify-center gap-2 hover:bg-white/20 transition-colors backdrop-blur-md"
            >
              <Lock className="w-4 h-4" />
              Ubah Kata Sandi
            </Link>
            <Link
              to="/profile/edit"
              className="px-6 py-3 rounded-full bg-[#4a3fe2] text-white font-semibold flex items-center justify-center gap-2 hover:bg-[#3d2fd6] transition-all shadow-lg shadow-[#4a3fe2]/25"
            >
              <Edit className="w-4 h-4" />
              Edit Profil
            </Link>
          </div>
          {/* Decorative background elements */}
          <div className="absolute -top-24 -right-24 w-64 h-64 bg-[#4a3fe2]/20 rounded-full blur-3xl"></div>
          <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-[#983772]/10 rounded-full blur-3xl"></div>
        </header>

        {/* ============================================
            MAIN CONTENT CONTAINER
            ============================================ */}
        <div className="bg-white rounded-2xl p-8 sm:p-12 shadow-sm border border-[#e2d7ff]/20">
          
          {/* Main Grid Layout */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 items-stretch mb-6">

            {/* LEFT: Profile Details + Riwayat Transaksi */}
            <div className="lg:col-span-8 flex flex-col gap-6">
              {/* Informasi Profil */}
              <div className="flex items-center gap-3 mb-5">
                <div className="w-1.5 h-6 bg-[#4a3fe2] rounded-full"></div>
                <h2 className="text-lg sm:text-xl font-bold tracking-tight text-[#32294f]">Informasi Profil</h2>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {/* Full Name */}
                <div className="flex items-center gap-3 p-3 sm:p-4 bg-[#f5eeff] rounded-xl hover:bg-white transition-all hover:shadow-md border border-transparent hover:border-[#e2d7ff]">
                  <div className="w-10 h-10 rounded-lg bg-white flex items-center justify-center flex-shrink-0 shadow-sm">
                    <User className="w-5 h-5 text-[#4a3fe2]" style={{ fill: 'currentColor' }} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-[#5f557f]">Nama Lengkap</p>
                    <p className={`text-sm font-semibold truncate ${fullName ? 'text-[#32294f]' : 'text-[#9ca3af]'}`}>{fullName || 'Belum diisi'}</p>
                  </div>
                </div>
                {/* Role */}
                <div className="flex items-center gap-3 p-3 sm:p-4 bg-[#f5eeff] rounded-xl hover:bg-white transition-all hover:shadow-md border border-transparent hover:border-[#e2d7ff]">
                  <div className="w-10 h-10 rounded-lg bg-white flex items-center justify-center flex-shrink-0 shadow-sm">
                    <Verified className="w-5 h-5 text-[#4a3fe2]" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-[#5f557f]">Peran</p>
                    <p className="text-sm font-semibold text-[#32294f]">{user.role || 'Customer'}</p>
                  </div>
                </div>
                {/* Email */}
                <div className="flex items-center gap-3 p-3 sm:p-4 bg-[#f5eeff] rounded-xl hover:bg-white transition-all hover:shadow-md border border-transparent hover:border-[#e2d7ff]">
                  <div className="w-10 h-10 rounded-lg bg-white flex items-center justify-center flex-shrink-0 shadow-sm">
                    <Mail className="w-5 h-5 text-[#4a3fe2]" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-[#5f557f]">Email</p>
                    <p className={`text-sm font-semibold truncate ${user.email ? 'text-[#32294f]' : 'text-[#9ca3af]'}`}>{user.email || 'Belum diisi'}</p>
                  </div>
                </div>
                {/* Phone */}
                <div className="flex items-center gap-3 p-3 sm:p-4 bg-[#f5eeff] rounded-xl hover:bg-white transition-all hover:shadow-md border border-transparent hover:border-[#e2d7ff]">
                  <div className="w-10 h-10 rounded-lg bg-white flex items-center justify-center flex-shrink-0 shadow-sm">
                    <Phone className="w-5 h-5 text-[#4a3fe2]" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-[#5f557f]">Nomor Telepon</p>
                    <p className={`text-sm font-semibold ${user.phone ? 'text-[#32294f]' : 'text-[#9ca3af]'}`}>{user.phone || 'Belum diisi'}</p>
                  </div>
                </div>
                {/* Birth Date */}
                <div className="flex items-center gap-3 p-3 sm:p-4 bg-[#f5eeff] rounded-xl hover:bg-white transition-all hover:shadow-md border border-transparent hover:border-[#e2d7ff]">
                  <div className="w-10 h-10 rounded-lg bg-white flex items-center justify-center flex-shrink-0 shadow-sm">
                    <Cake className="w-5 h-5 text-[#4a3fe2]" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-[#5f557f]">Tanggal Lahir</p>
                    <p className={`text-sm font-semibold ${user.birthDate ? 'text-[#32294f]' : 'text-[#9ca3af]'}`}>
                      {user.birthDate
                        ? new Date(user.birthDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
                        : 'Belum diisi'
                      }
                    </p>
                  </div>
                </div>
                {/* Gender */}
                <div className="flex items-center gap-3 p-3 sm:p-4 bg-[#f5eeff] rounded-xl hover:bg-white transition-all hover:shadow-md border border-transparent hover:border-[#e2d7ff]">
                  <div className="w-10 h-10 rounded-lg bg-white flex items-center justify-center flex-shrink-0 shadow-sm">
                    <Users className="w-5 h-5 text-[#4a3fe2]" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-[#5f557f]">Jenis Kelamin</p>
                    <p className={`text-sm font-semibold capitalize ${user.gender ? 'text-[#32294f]' : 'text-[#9ca3af]'}`}>{user.gender || 'Belum diisi'}</p>
                  </div>
                </div>
              </div>

              {/* Riwayat Transaksi */}
              <div className="flex items-center gap-3 mb-5">
                <div className="w-2 h-8 bg-[#4a3fe2] rounded-full"></div>
                <h2 className="text-2xl font-bold tracking-tight text-[#32294f]">Riwayat Transaksi</h2>
              </div>
              {/* Tabs - Mobile: Grid with counts, Desktop: Horizontal Scroll */}
              <nav className="hidden sm:flex p-1.5 bg-[#f5eeff] rounded-full items-center overflow-x-auto scrollbar-hide -mx-2 px-2 sm:mx-0 sm:px-1.5 mb-6">
                <button
                  onClick={() => setOrderFilter('all')}
                  className={`flex-1 px-4 sm:px-6 py-2 sm:py-2.5 rounded-full text-sm font-bold transition-all ${
                    orderFilter === 'all' ? 'bg-white text-[#4a3fe2] shadow-sm' : 'text-[#5f557f] hover:text-[#32294f]'
                  }`}
                >
                  Semua
                </button>
                <button
                  onClick={() => setOrderFilter('success')}
                  className={`flex-1 px-4 sm:px-6 py-2 sm:py-2.5 rounded-full text-sm font-medium transition-all ${
                    orderFilter === 'success' ? 'bg-white text-[#4a3fe2] shadow-sm' : 'text-[#5f557f] hover:text-[#32294f]'
                  }`}
                >
                  Berhasil
                </button>
                <button
                  onClick={() => setOrderFilter('pending')}
                  className={`flex-1 px-4 sm:px-6 py-2 sm:py-2.5 rounded-full text-sm font-medium transition-all ${
                    orderFilter === 'pending' ? 'bg-white text-[#4a3fe2] shadow-sm' : 'text-[#5f557f] hover:text-[#32294f]'
                  }`}
                >
                  Menunggu
                </button>
                <button
                  onClick={() => setOrderFilter('failed')}
                  className={`flex-1 px-4 sm:px-6 py-2 sm:py-2.5 rounded-full text-sm font-medium transition-all ${
                    orderFilter === 'failed' ? 'bg-white text-[#4a3fe2] shadow-sm' : 'text-[#5f557f] hover:text-[#32294f]'
                  }`}
                >
                  Gagal
                </button>
              </nav>
              {/* Mobile Grid Filter - Visible only on mobile */}
              <nav className="sm:hidden grid grid-cols-2 gap-2 mb-6">
                <button
                  onClick={() => setOrderFilter('all')}
                  className={`flex items-center justify-between px-3 py-2 rounded-full font-semibold text-xs ${
                    orderFilter === 'all' 
                      ? 'bg-[#4a3fe2] text-white' 
                      : 'text-[#5f557f] hover:bg-[#e8deff] transition-colors'
                  }`}
                >
                  <span className="truncate">Semua</span>
                  <span className={`px-1.5 py-0.5 rounded text-[10px] ml-1 ${
                    orderFilter === 'all' ? 'bg-white/20' : 'bg-[#e2d7ff] text-[#5f557f]'
                  }`}>{filterCounts.all}</span>
                </button>
                <button
                  onClick={() => setOrderFilter('success')}
                  className={`flex items-center justify-between px-3 py-2 rounded-full font-semibold text-xs ${
                    orderFilter === 'success' 
                      ? 'bg-[#e2d7ff] text-[#4a3fe2]' 
                      : 'text-[#5f557f] hover:bg-[#e8deff] transition-colors'
                  }`}
                >
                  <span className="truncate">Berhasil</span>
                  <span className={`px-1.5 py-0.5 rounded text-[10px] ml-1 ${
                    orderFilter === 'success' ? 'bg-white/20' : 'bg-[#e2d7ff] text-[#5f557f]'
                  }`}>{filterCounts.success}</span>
                </button>
                <button
                  onClick={() => setOrderFilter('pending')}
                  className={`flex items-center justify-between px-3 py-2 rounded-full font-semibold text-xs ${
                    orderFilter === 'pending' 
                      ? 'bg-[#d8caff] text-[#4e339c]' 
                      : 'text-[#5f557f] hover:bg-[#e8deff] transition-colors'
                  }`}
                >
                  <span className="truncate">Menunggu</span>
                  <span className={`px-1.5 py-0.5 rounded text-[10px] ml-1 ${
                    orderFilter === 'pending' ? 'bg-white/20' : 'bg-[#e2d7ff] text-[#5f557f]'
                  }`}>{filterCounts.pending}</span>
                </button>
                <button
                  onClick={() => setOrderFilter('failed')}
                  className={`flex items-center justify-between px-3 py-2 rounded-full font-semibold text-xs ${
                    orderFilter === 'failed' 
                      ? 'bg-[#fd8bca]/20 text-[#983772]' 
                      : 'text-[#5f557f] hover:bg-[#e8deff] transition-colors'
                  }`}
                >
                  <span className="truncate">Gagal</span>
                  <span className={`px-1.5 py-0.5 rounded text-[10px] ml-1 ${
                    orderFilter === 'failed' ? 'bg-white/20' : 'bg-[#e2d7ff] text-[#5f557f]'
                  }`}>{filterCounts.failed}</span>
                </button>
              </nav>
              <div className="overflow-hidden bg-white rounded-3xl shadow-[0_10px_40px_-10px_rgba(50,41,79,0.04)] min-h-[400px]">
                {/* Desktop Table - Hidden on mobile */}
                <div className="hidden md:block">
                  <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-[#f5eeff]/50">
                          <th className="px-6 py-5 text-xs font-bold uppercase tracking-widest text-[#5f557f] text-center">Detail Event</th>
                          <th className="px-6 py-5 text-xs font-bold uppercase tracking-widest text-[#5f557f] text-center">Tanggal</th>
                          <th className="px-6 py-5 text-xs font-bold uppercase tracking-widest text-[#5f557f] text-center">Harga</th>
                          <th className="px-6 py-5 text-xs font-bold uppercase tracking-widest text-[#5f557f] text-center">Status</th>
                          <th className="px-6 py-5 text-xs font-bold uppercase tracking-widest text-[#5f557f] text-center">Ket</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#b2a6d5]/10">
                        {filteredTransactions.length === 0 ? (
                          <tr>
                            <td colSpan={5} className="py-24 text-center">
                              <p className="text-base text-[#32294f]/40">
                                {orderFilter === 'all' ? 'Belum ada riwayat pemesanan' : `Tidak ada transaksi ${orderFilter}`}
                              </p>
                            </td>
                          </tr>
                        ) : (
                          filteredTransactions.map((transaction) => (
                            <tr key={transaction.id} className="hover:bg-[#f5eeff]/30 transition-colors h-20">
                              <td className="px-6 h-20 align-middle">
                                <div className="flex items-center gap-4">
                                  <div className="w-16 h-16 rounded-xl overflow-hidden flex-shrink-0">
                                    <img 
                                      alt={transaction.event.title}
                                      className="w-full h-full object-cover"
                                      src={transaction.event.imageUrl || 'https://images.unsplash.com/photo-1540039155733-5bb30b53aa14?auto=format&fit=crop&w=100&q=80'}
                                      onError={(e) => {
                                        const target = e.target as HTMLImageElement;
                                        target.src = 'https://images.unsplash.com/photo-1540039155733-5bb30b53aa14?auto=format&fit=crop&w=100&q=80';
                                      }}
                                    />
                                  </div>
                                  <div>
                                    <p className="font-bold text-sm text-[#32294f] leading-tight">{transaction.event.title}</p>
                                    <p className="text-xs text-[#5f557f]">Pesanan #{transaction.id}</p>
                                  </div>
                                </div>
                              </td>
                              <td className="px-6 h-20 align-middle text-sm text-[#32294f]">{new Date(transaction.event.startDate).toLocaleDateString('id-ID')}</td>
                              <td className="px-6 h-20 align-middle text-sm font-bold text-[#4a3fe2]">{transaction.totalAmount === 0 ? 'Gratis' : `Rp ${transaction.totalAmount.toLocaleString()}`}</td>
                              <td className="px-6 h-20 align-middle text-center">
                                <span className={`inline-flex items-center justify-center px-4 py-2 rounded-full text-[10px] font-bold uppercase tracking-tighter min-w-[140px] min-h-[36px] text-center leading-tight ${
                                  transaction.status === 'DONE' ? 'bg-green-100 text-green-700' :
                                  transaction.status === 'WAITING_CONFIRMATION' ? 'bg-yellow-100 text-yellow-700' :
                                  transaction.status === 'WAITING_PAYMENT' ? 'bg-blue-100 text-blue-700' :
                                  transaction.status === 'FAILED' || transaction.status === 'EXPIRED' || transaction.status === 'CANCELLED' ? 'bg-red-100 text-red-700' :
                                  'bg-[#e8deff] text-[#4a3fe2]'
                                }`}>
                                  {transaction.status === 'DONE' ? 'Berhasil' :
                                   transaction.status === 'WAITING_PAYMENT' ? 'Menunggu Pembayaran' :
                                   transaction.status === 'WAITING_CONFIRMATION' ? 'Menunggu Konfirmasi' :
                                   transaction.status === 'REJECTED' ? 'Ditolak' :
                                   transaction.status === 'EXPIRED' ? 'Kedaluwarsa' :
                                   transaction.status === 'CANCELED' ? 'Dibatalkan' :
                                   transaction.status === 'FAILED' ? 'Gagal' :
                                   transaction.status}
                                </span>
                              </td>
                              <td className="px-6 h-20 align-middle text-center">
                                <button
                                  onClick={() => navigate(`/transactions/${transaction.id}`)}
                                  className="text-sm font-bold text-[#4a3fe2] hover:underline underline-offset-4"
                                >
                                  Lihat Detail
                                </button>
                              </td>
                            </tr>
                          ))
                        )}
                        {/* Empty rows to maintain fixed height of 5 rows */}
                        {filteredTransactions.length > 0 && filteredTransactions.length < 5 && (
                          Array.from({ length: 5 - filteredTransactions.length }).map((_, index) => (
                            <tr key={`empty-${index}`} className="h-20">
                              <td colSpan={5} className="px-6"></td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                </div>

                {/* Mobile Card List - Visible only on mobile */}
                <div className="md:hidden">
                  {filteredTransactions.length === 0 ? (
                    <div className="py-16 text-center">
                      <p className="text-base text-[#32294f]/40">
                        {orderFilter === 'all' ? 'Belum ada riwayat pemesanan' : `Tidak ada transaksi ${orderFilter}`}
                      </p>
                    </div>
                  ) : (
                    <div className="divide-y divide-[#b2a6d5]/10">
                      {filteredTransactions.map((transaction) => (
                        <div key={transaction.id} className="p-4">
                          {/* Header: Thumbnail + Event Info */}
                          <div className="flex gap-3 mb-3">
                            <div className="w-16 h-16 rounded-lg overflow-hidden flex-shrink-0">
                              <img 
                                alt={transaction.event.title}
                                className="w-full h-full object-cover"
                                src={transaction.event.imageUrl || 'https://images.unsplash.com/photo-1540039155733-5bb30b53aa14?auto=format&fit=crop&w=100&q=80'}
                                onError={(e) => {
                                  const target = e.target as HTMLImageElement;
                                  target.src = 'https://images.unsplash.com/photo-1540039155733-5bb30b53aa14?auto=format&fit=crop&w=100&q=80';
                                }}
                              />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-bold text-sm text-[#32294f] leading-tight mb-1 line-clamp-2">{transaction.event.title}</p>
                              <p className="text-xs text-[#5f557f] font-medium">Pesanan #{transaction.id}</p>
                            </div>
                          </div>
                          
                          {/* Date & Price Row */}
                          <div className="flex justify-between items-start mb-3 text-sm">
                            <div>
                              <span className="text-[#5f557f] text-xs">Tanggal: </span>
                              <span className="text-[#32294f]">{new Date(transaction.event.startDate).toLocaleDateString('id-ID')}</span>
                            </div>
                            <div className="text-right">
                              <span className="text-[#5f557f] text-xs block">Harga</span>
                              <span className="font-bold text-[#4a3fe2]">{transaction.totalAmount === 0 ? 'Gratis' : `Rp ${transaction.totalAmount.toLocaleString()}`}</span>
                            </div>
                          </div>
                          
                          {/* Status & Action Row */}
                          <div className="flex items-center justify-between">
                            <span className={`inline-flex items-center justify-center px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-tighter ${
                              transaction.status === 'DONE' ? 'bg-green-100 text-green-700' :
                              transaction.status === 'WAITING_CONFIRMATION' ? 'bg-yellow-100 text-yellow-700' :
                              transaction.status === 'WAITING_PAYMENT' ? 'bg-blue-100 text-blue-700' :
                              transaction.status === 'FAILED' || transaction.status === 'EXPIRED' || transaction.status === 'CANCELLED' ? 'bg-red-100 text-red-700' :
                              'bg-[#e8deff] text-[#4a3fe2]'
                            }`}>
                              {transaction.status === 'DONE' ? 'Berhasil' :
                               transaction.status === 'WAITING_PAYMENT' ? 'Menunggu' :
                               transaction.status === 'WAITING_CONFIRMATION' ? 'Menunggu' :
                               transaction.status === 'REJECTED' ? 'Ditolak' :
                               transaction.status === 'EXPIRED' ? 'Kadaluarsa' :
                               transaction.status === 'CANCELED' ? 'Dibatalkan' :
                               transaction.status === 'FAILED' ? 'Gagal' :
                               transaction.status}
                            </span>
                            <button
                              onClick={() => navigate(`/transactions/${transaction.id}`)}
                              className="text-sm font-bold text-[#4a3fe2] hover:underline underline-offset-4"
                            >
                              Lihat Detail
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              <div className="mt-4">
                <Link
                  to="/my-transactions"
                  className="flex items-center justify-center gap-2 px-6 py-2.5 rounded-full bg-[#f5eeff] text-[#4a3fe2] font-semibold hover:bg-[#e2d7ff] transition-colors w-full"
                >
                  Lihat Semua Riwayat Transaksi
                </Link>
              </div>
            </div>

            {/* RIGHT: Points + Referral + Coupons */}
            <div className="lg:col-span-4 flex flex-col gap-6">
              {/* Placeholder header to align with left column profile cards */}
              <div className="flex items-center gap-3 mb-5 opacity-0 lg:opacity-0 pointer-events-none h-[26px]">
                <div className="w-1.5 h-6 bg-[#4a3fe2] rounded-full"></div>
                <h2 className="text-lg sm:text-xl font-bold tracking-tight text-[#32294f]">Poin</h2>
              </div>
              
              {/* Three equal-height cards */}
              <div className="grid grid-rows-3 gap-6 flex-1">
                {/* Points Balance */}
                <div className="bg-[#4a3fe2] p-8 rounded-3xl text-white relative overflow-hidden group shadow-xl shadow-[#4a3fe2]/20 flex flex-col">
                  <div className="z-10 relative flex flex-col h-full">
                    {/* Header - Poin Tersedia */}
                    <div className="flex items-center gap-2 text-[#e2d7ff]/80 mb-2">
                      <Stars className="w-4 h-4" />
                      <p className="text-xs font-bold uppercase tracking-widest">Poin Tersedia</p>
                    </div>
                    {/* Center Content - Points & Description */}
                    <div className="flex-1 flex flex-col justify-center">
                      <h3 className="text-5xl font-black tracking-tight mb-4">{(points?.total || 0).toLocaleString('id-ID')}</h3>
                      <p className="text-sm text-white/70 leading-relaxed">Tukarkan poin Anda untuk diskon event eksklusif dan akses VIP backstage.</p>
                    </div>
                    {/* Footer - Berlaku hingga */}
                    {points?.expiresAt && (
                      <p className="mt-3 text-xs text-white/60 flex items-center gap-1.5">
                        <Clock className="w-3 h-3" />
                        Berlaku hingga: {new Date(points.expiresAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                      </p>
                    )}
                  </div>
                  <Coins className="absolute -bottom-4 -right-4 w-24 h-24 opacity-10 rotate-12 group-hover:scale-110 transition-transform duration-700" />
                </div>

                {/* Referral Code */}
                <div className="bg-[#f5eeff] p-8 rounded-3xl border border-[#b2a6d5]/10 flex flex-col">
                  <div className="flex flex-col h-full">
                    {/* Header - Kode Referral Anda */}
                    <div className="flex items-center gap-2 text-[#5f557f] mb-2">
                      <Copy className="w-4 h-4" />
                      <p className="text-xs font-bold uppercase tracking-widest">Kode Referral Anda</p>
                    </div>
                    {/* Center Content - Referral Code */}
                    <div className="flex-1 flex flex-col items-center justify-center">
                      <div className="flex items-center justify-between bg-white p-4 rounded-2xl border-2 border-dashed border-[#b2a6d5]/30 w-full">
                        <span className="font-mono font-bold text-[#4a3fe2] tracking-wider flex-1 text-center">{user.referralCode || 'N/A'}</span>
                        <button
                          onClick={handleCopyReferral}
                          className="p-2 bg-[#4a3fe2]/5 rounded-lg text-[#4a3fe2] hover:bg-[#4a3fe2]/10 transition-colors"
                        >
                          <Copy className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    {/* Footer - Description */}
                    <p className="text-sm text-[#5f557f]/70 leading-relaxed mt-4">Bagikan kode ini ke teman untuk dapatkan 10.000 poin bonus setiap kali!</p>
                  </div>
                </div>

                {/* Active Coupons */}
                <div className="bg-white p-6 rounded-3xl border border-[#b2a6d5]/20 shadow-sm">
                  <div className="flex items-center gap-2 mb-4">
                    <Tag className="w-4 h-4 text-[#4a3fe2]" />
                    <p className="text-xs font-bold uppercase tracking-widest text-[#5f557f]">Kupon Aktif</p>
                  </div>
                  {availableCoupons.length > 0 ? (
                    <div className="space-y-3">
                      {availableCoupons.slice(0, 5).map((coupon: CouponsData['coupons'][0]) => (
                        <div key={coupon.id} className="bg-[#f5eeff] p-3 rounded-xl border border-[#b2a6d5]/20">
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-mono font-bold text-sm text-[#4a3fe2]">{coupon.code}</span>
                            <span className="text-xs font-bold text-green-600">{coupon.discount}% OFF</span>
                            <Tag className="w-4 h-4 text-[#4a3fe2]" />
                          </div>
                          <div className="flex items-center justify-between">
                            <p className="text-xs text-[#5f557f] flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {new Date(coupon.expiresAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                            </p>
                            <button
                              onClick={() => copyCouponCode(coupon.code)}
                              className="p-2 bg-[#4a3fe2]/5 rounded-lg text-[#4a3fe2] hover:bg-[#4a3fe2]/10 transition-colors"
                            >
                              <Copy className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                      {availableCoupons.length > 5 && (
                        <p className="text-xs text-center text-[#5f557f] py-2">
                          +{availableCoupons.length - 5} kupon lainnya
                        </p>
                      )}
                    </div>
                  ) : (
                    <div className="flex items-center justify-center py-8">
                      <p className="text-sm text-[#5f557f] text-center">Belum ada kupon aktif</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Role Action Button */}
              <div>
                {user.role === 'CUSTOMER' ? (
                  <button
                    onClick={handleUpgradeClick}
                    className="w-full px-6 py-3 rounded-xl bg-[#4a3fe2] text-white font-bold hover:bg-[#3a2fe2] transition-all shadow-lg shadow-[#4a3fe2]/20"
                  >
                    Become Organizer
                  </button>
                ) : user.role === 'ORGANIZER' ? (
                  <Link
                    to="/organizer/dashboard"
                    className="block w-full px-6 py-3 rounded-xl bg-[#983772] text-white font-bold hover:bg-[#882762] transition-all shadow-lg shadow-[#983772]/20 text-center"
                  >
                    Organizer Dashboard
                  </Link>
                ) : null}
              </div>
            </div>
          </div>

        </div>
      </div>

    </div>
  )
}
