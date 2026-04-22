import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../features/auth/components/AuthContext'
import api from '../../features/auth/services/auth.service'

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

interface ReferralData {
  id: number
  name: string
  email: string
  date: string
}

interface Toast {
  id: number
  message: string
  type: 'success' | 'error'
}

export default function ProfilePage() {
  const { user, logout, setUser } = useAuth()
  const navigate = useNavigate()
  const [points, setPoints] = useState<PointsData | null>(null)
  const [coupons, setCoupons] = useState<CouponsData | null>(null)
  const [referrals, setReferrals] = useState<ReferralData[]>([])
  const [toasts, setToasts] = useState<Toast[]>([])
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false)
  const [upgrading, setUpgrading] = useState(false)
  const [showUpgradeModal, setShowUpgradeModal] = useState(false)
  const [agreements, setAgreements] = useState({
    responsible: false,
    noMisuse: false,
  })
  const [orderFilter, setOrderFilter] = useState<'all' | 'success' | 'pending' | 'failed'>('all')

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const [pointsRes, couponsRes, referralsRes] = await Promise.all([
          api.get('/user/points'),
          api.get('/user/coupons'),
          api.get('/user/referrals')
        ])
        setPoints(pointsRes.data.data)
        setCoupons(couponsRes.data.data)
        setReferrals(referralsRes.data.data || [])
      } catch (error) {
        console.error('Failed to fetch user data:', error)
      }
    }

    if (user) {
      fetchUserData()
    }
  }, [user])

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
      const response = await api.post('/user/upgrade-organizer')
      if (user && response.data?.data) {
        setUser({ ...user, role: 'ORGANIZER' })
      }
      setShowUpgradeModal(false)
      addToast('Berhasil menjadi Event Organizer!', 'success')
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
            <Link to="/login" className="mt-6 inline-flex rounded-2xl bg-indigo-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-indigo-700">Back to Login</Link>
          </div>
        </div>
      </main>
    )
  }

  const fullName = `${user.firstName} ${user.lastName}`.trim()
  const initials = `${user.firstName?.charAt(0) ?? ''}${user.lastName?.charAt(0) ?? ''}`.toUpperCase()
  const memberSince = user.createdAt ? new Date(user.createdAt).toLocaleDateString('id-ID', { year: 'numeric' }) : '2024'
  const successfulReferrals = referrals.length

  return (
    <main className="min-h-screen bg-slate-50">

      {/* Toast Notifications */}
      <div className="fixed top-4 right-4 z-50 space-y-2">
        {toasts.map((toast) => (
          <div key={toast.id} className={`rounded-xl px-4 py-3 text-sm font-medium shadow-lg transition-all ${toast.type === 'success' ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' : 'bg-red-100 text-red-800 border border-red-200'}`}>
            {toast.message}
          </div>
        ))}
      </div>

      {/* Logout Confirm Modal */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-6 shadow-xl">
            <h3 className="text-lg font-bold text-slate-900">Keluar?</h3>
            <p className="mt-2 text-sm text-slate-600">Yakin ingin keluar dari akun?</p>
            <div className="mt-6 flex gap-3">
              <button onClick={() => setShowLogoutConfirm(false)} className="flex-1 rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50">Batal</button>
              <button onClick={handleLogout} className="flex-1 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-red-700">Keluar</button>
            </div>
          </div>
        </div>
      )}

      {/* Upgrade to Organizer Modal */}
      {showUpgradeModal && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-xl">
            <h3 className="text-lg font-bold text-slate-900">Jadi Event Organizer?</h3>
            <p className="mt-2 text-sm text-slate-600">
              Anda bisa membuat dan mengelola event setelah upgrade.
            </p>

            <div className="my-5 space-y-3">
              <label className="flex cursor-pointer items-start gap-3">
                <input
                  type="checkbox"
                  checked={agreements.responsible}
                  onChange={() => handleAgreementChange('responsible')}
                  className="mt-0.5 h-4 w-4 rounded border-slate-300 text-indigo-600"
                />
                <span className="text-sm text-slate-700">
                  Saya bertanggung jawab atas event yang saya buat
                </span>
              </label>
              
              <label className="flex cursor-pointer items-start gap-3">
                <input
                  type="checkbox"
                  checked={agreements.noMisuse}
                  onChange={() => handleAgreementChange('noMisuse')}
                  className="mt-0.5 h-4 w-4 rounded border-slate-300 text-indigo-600"
                />
                <span className="text-sm text-slate-700">
                  Saya tidak akan menyalahgunakan platform
                </span>
              </label>
            </div>

            <div className="flex gap-3">
              <button 
                onClick={() => setShowUpgradeModal(false)} 
                className="flex-1 rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                Batal
              </button>
              <button 
                onClick={handleUpgradeSubmit}
                disabled={!agreements.responsible || !agreements.noMisuse || upgrading}
                className="flex-1 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:opacity-50"
              >
                {upgrading ? 'Memproses...' : 'Konfirmasi'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="mx-auto max-w-6xl px-4 py-6 lg:py-10">

        {/* ============================================
            ACCOUNT IDENTITY CARD
            ============================================ */}
        <div className="mb-6 rounded-2xl bg-[#32294f] p-6 lg:p-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            {/* Left: Avatar + Info */}
            <div className="flex items-center gap-4">
              {/* Avatar - Kotak dengan rounded-xl */}
              {user.profilePicture ? (
                <img src={user.profilePicture} alt={fullName} className="h-20 w-20 rounded-xl object-cover ring-4 ring-[#4a3fe2]/30 lg:h-24 lg:w-24" />
              ) : (
                <div className="flex h-20 w-20 items-center justify-center rounded-xl bg-[#4a3fe2]/20 text-2xl font-bold text-[#4a3fe2] ring-4 ring-[#4a3fe2]/30 lg:h-24 lg:w-24 lg:text-3xl">
                  {initials || 'U'}
                </div>
              )}

              {/* Info */}
              <div>
                <h1 className="text-2xl font-bold text-white lg:text-3xl mb-2">{fullName}</h1>
                <p className="text-sm text-white/70 mb-2">{user.email}</p>
                <p className="text-xs text-white/50">Member since {new Date(user.createdAt || Date.now()).toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })}</p>
              </div>
            </div>

            {/* Right: Action Buttons */}
            <div className="flex flex-col gap-3 lg:w-48 w-full">
              <Link
                to="/profile/edit"
                className="rounded-full bg-white px-5 py-3 text-center text-sm font-semibold text-[#32294f] transition hover:bg-white/90 flex items-center justify-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                Edit Profile
              </Link>
              <Link
                to="/profile/change-password"
                className="rounded-full bg-white/10 px-5 py-3 text-center text-sm font-semibold text-white transition hover:bg-white/20 flex items-center justify-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                Change Password
              </Link>
            </div>
          </div>
        </div>

        {/* ============================================
            MAIN GRID: LEFT (70%) | RIGHT (30%)
            ============================================ */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          
          {/* LEFT COLUMN - MAIN CONTENT */}
          <div className="flex flex-col gap-6 lg:col-span-8">
            
            {/* Profile Details - Card Grid Layout */}
            <div className="rounded-2xl bg-white p-6 shadow-[0_10px_40px_-10px_rgba(50,41,79,0.04)]">
              <h2 className="mb-6 text-xl font-bold text-[#32294f]">Informasi Profil Lengkap</h2>

              {/* 6 Cards in 2 columns */}
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                {/* Full Name */}
                <div className="rounded-xl bg-[#faf4ff] p-4 border border-[#b2a6d5]/20">
                  <div className="flex items-center gap-3 mb-2">
                    <svg className="w-5 h-5 text-[#4a3fe2]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    <p className="text-xs font-semibold capitalize tracking-[0.15em] text-[#32294f]/60 border-b border-[#b2a6d5]/20 pb-1">
                      Full name
                    </p>
                  </div>
                  <p className={`text-lg ${fullName ? 'font-bold text-[#32294f]' : 'font-semibold text-[#32294f]/40'}`}>
                    {fullName || 'Belum diisi'}
                  </p>
                  <p className="text-[10px] text-[#32294f]/40 mt-1">Nama lengkap pada akun Anda</p>
                </div>

                {/* Role */}
                <div className="rounded-xl bg-[#faf4ff] p-4 border border-[#b2a6d5]/20">
                  <div className="flex items-center gap-3 mb-2">
                    <svg className="w-5 h-5 text-[#4a3fe2]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                    <p className="text-xs font-semibold capitalize tracking-[0.15em] text-[#32294f]/60 border-b border-[#b2a6d5]/20 pb-1">
                      Role
                    </p>
                  </div>
                  <p className="text-lg font-bold uppercase text-[#32294f]">{user.role}</p>
                  <p className="text-[10px] text-[#32294f]/40 mt-1">Peran Anda di platform</p>
                </div>

                {/* Email */}
                <div className="rounded-xl bg-[#faf4ff] p-4 border border-[#b2a6d5]/20">
                  <div className="flex items-center gap-3 mb-2">
                    <svg className="w-5 h-5 text-[#4a3fe2]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                    </svg>
                    <p className="text-xs font-semibold capitalize tracking-[0.15em] text-[#32294f]/60 border-b border-[#b2a6d5]/20 pb-1">
                      Email
                    </p>
                  </div>
                  <p className={`text-base ${user.email ? 'font-bold text-[#32294f]' : 'font-semibold text-[#32294f]/40'} break-words`}>
                    {user.email || 'Belum diisi'}
                  </p>
                  <p className="text-[10px] text-[#32294f]/40 mt-1">Digunakan untuk login dan notifikasi</p>
                </div>

                {/* Phone */}
                <div className="rounded-xl bg-[#faf4ff] p-4 border border-[#b2a6d5]/20">
                  <div className="flex items-center gap-3 mb-2">
                    <svg className="w-5 h-5 text-[#4a3fe2]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                    <p className="text-xs font-semibold capitalize tracking-[0.15em] text-[#32294f]/60 border-b border-[#b2a6d5]/20 pb-1">
                      Phone
                    </p>
                  </div>
                  <p className={`text-lg ${user.phone ? 'font-bold text-[#32294f]' : 'font-semibold text-[#32294f]/40'}`}>
                    {user.phone || 'Belum diisi'}
                  </p>
                  <p className="text-[10px] text-[#32294f]/40 mt-1">Digunakan untuk verifikasi akun</p>
                </div>

                {/* Birth Date */}
                <div className="rounded-xl bg-[#faf4ff] p-4 border border-[#b2a6d5]/20">
                  <div className="flex items-center gap-3 mb-2">
                    <svg className="w-5 h-5 text-[#4a3fe2]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <p className="text-xs font-semibold capitalize tracking-[0.15em] text-[#32294f]/60 border-b border-[#b2a6d5]/20 pb-1">
                      Birth date
                    </p>
                  </div>
                  <p className={`text-base ${user.birthDate ? 'font-bold text-[#32294f]' : 'font-semibold text-[#32294f]/40'}`}>
                    {user.birthDate
                      ? new Date(user.birthDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
                      : 'Belum diisi'
                    }
                  </p>
                  <p className="text-[10px] text-[#32294f]/40 mt-1">Informasi dasar profil Anda</p>
                </div>

                {/* Gender */}
                <div className="rounded-xl bg-[#faf4ff] p-4 border border-[#b2a6d5]/20">
                  <div className="flex items-center gap-3 mb-2">
                    <svg className="w-5 h-5 text-[#4a3fe2]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                    <p className="text-xs font-semibold capitalize tracking-[0.15em] text-[#32294f]/60 border-b border-[#b2a6d5]/20 pb-1">
                      Gender
                    </p>
                  </div>
                  <p className={`text-base capitalize ${user.gender ? 'font-bold text-[#32294f]' : 'font-semibold text-[#32294f]/40'}`}>
                    {user.gender || 'Belum diisi'}
                  </p>
                  <p className="text-[10px] text-[#32294f]/40 mt-1">Sesuai data yang Anda isi</p>
                </div>
              </div>
            </div>

            {/* Orders Summary */}
            <div className="flex flex-1 flex-col rounded-2xl bg-white p-6 md:p-6 shadow-[0_10px_40px_-10px_rgba(50,41,79,0.04)]">
              <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 md:mb-8 gap-4">
                <h2 className="text-xl md:text-2xl font-bold text-[#32294f]">Semua Riwayat Event</h2>
                <div className="flex gap-2 p-1 bg-[#f5eeff] rounded-full overflow-x-auto w-full md:w-auto">
                  <button
                    onClick={() => setOrderFilter('all')}
                    className={`px-6 py-2 font-bold rounded-full text-xs shadow-sm transition-all duration-300 ease-in-out transform hover:scale-105 active:scale-95 ${
                      orderFilter === 'all' ? 'bg-white text-[#4a3fe2]' : 'text-[#5f557f] hover:text-[#32294f]'
                    }`}
                  >
                    Semua
                  </button>
                  <button
                    onClick={() => setOrderFilter('success')}
                    className={`px-6 py-2 font-bold rounded-full text-xs transition-all duration-300 ease-in-out transform hover:scale-105 active:scale-95 ${
                      orderFilter === 'success' ? 'bg-white text-[#4a3fe2] shadow-sm' : 'text-[#5f557f] hover:text-[#32294f]'
                    }`}
                  >
                    Berhasil
                  </button>
                  <button
                    onClick={() => setOrderFilter('pending')}
                    className={`px-6 py-2 font-bold rounded-full text-xs transition-all duration-300 ease-in-out transform hover:scale-105 active:scale-95 ${
                      orderFilter === 'pending' ? 'bg-white text-[#4a3fe2] shadow-sm' : 'text-[#5f557f] hover:text-[#32294f]'
                    }`}
                  >
                    Pending
                  </button>
                  <button
                    onClick={() => setOrderFilter('failed')}
                    className={`px-6 py-2 font-bold rounded-full text-xs transition-all duration-300 ease-in-out transform hover:scale-105 active:scale-95 ${
                      orderFilter === 'failed' ? 'bg-white text-[#4a3fe2] shadow-sm' : 'text-[#5f557f] hover:text-[#32294f]'
                    }`}
                  >
                    Gagal
                  </button>
                </div>
              </div>

              {/* Order History List Card */}
              <div className="rounded-xl bg-[#faf4ff] p-4 md:p-6 border border-[#b2a6d5]/10 flex-1 flex flex-col min-h-[400px]">
                {/* Table Headers - Desktop Only */}
                <div className="hidden md:block rounded-xl bg-white p-4 mb-4 overflow-x-auto">
                  <div className="grid grid-cols-[40%_20%_20%_20%] text-[#5f557f] text-xs font-bold capitalize tracking-widest min-w-[500px]">
                    <div className="px-4 text-center">Event details</div>
                    <div className="px-4 text-center">Date</div>
                    <div className="px-4 text-center">Price</div>
                    <div className="px-4 text-center">Status</div>
                  </div>
                </div>

                {/* Desktop Table */}
                <div className="hidden md:block overflow-x-auto flex-1">
                  <table className="w-full text-left min-w-[500px]">
                    <tbody className="divide-y divide-[#b2a6d5]/5">
                      {/* Placeholder - No orders yet */}
                      <tr>
                        <td colSpan={4} className="py-24 text-center">
                          <div className="flex flex-col items-center justify-center">
                            <p className="text-base text-[#32294f]/40">Belum ada riwayat pemesanan</p>
                          </div>
                        </td>
                      </tr>

                      {/* Example order item (hidden until backend ready) */}
                      {/*
                      <tr className="group hover:bg-[#f5eeff]/50 transition-colors">
                        <td className="py-6 px-4">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-lg bg-[#e8deff] overflow-hidden">
                              <img alt="Event" className="w-full h-full object-cover" src="https://images.unsplash.com/photo-1540039155733-5bb30b53aa14?auto=format&fit=crop&w=100&q=80" />
                            </div>
                            <div>
                              <p className="font-bold text-sm text-[#32294f]">Nama Event</p>
                              <p className="text-xs text-[#5f557f]">Order #KE-9821</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-6 px-4 text-sm font-medium text-[#32294f]">May 12, 2024</td>
                        <td className="py-6 px-4 text-sm font-bold text-[#32294f]">$149.00</td>
                        <td className="py-6 px-4 text-right">
                          <span className="bg-[#e8deff] text-[#4a3fe2] px-3 py-1 rounded-sm text-[10px] font-black tracking-widest">BERHASIL</span>
                        </td>
                      </tr>
                      */}
                    </tbody>
                  </table>
                </div>

                {/* Mobile Card Layout */}
                <div className="md:hidden flex-1 flex flex-col">
                  {/* Placeholder - No orders yet */}
                  <div className="flex-1 flex flex-col items-center justify-center py-16">
                    <p className="text-base text-[#32294f]/40 text-center px-4">Belum ada riwayat pemesanan</p>
                  </div>

                  {/* Example order card (hidden until backend ready) */}
                  {/*
                  <div className="rounded-xl bg-white p-4 mb-3 border border-[#b2a6d5]/10">
                    <div className="flex items-start gap-3">
                      <div className="w-16 h-16 rounded-lg bg-[#e8deff] overflow-hidden flex-shrink-0">
                        <img alt="Event" className="w-full h-full object-cover" src="https://images.unsplash.com/photo-1540039155733-5bb30b53aa14?auto=format&fit=crop&w=100&q=80" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-sm text-[#32294f] truncate">Nama Event</p>
                        <p className="text-xs text-[#5f557f] mb-2">Order #KE-9821</p>
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium text-[#32294f]">May 12, 2024</p>
                          <span className="bg-[#e8deff] text-[#4a3fe2] px-3 py-1 rounded-sm text-[10px] font-black tracking-widest">BERHASIL</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  */}
                </div>

                <Link to="/my-orders" className="block w-full rounded-xl bg-white py-3 text-center text-sm font-semibold text-[#32294f] transition hover:bg-[#4a3fe2]/10">
                  Lihat Semua
                </Link>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN - SIDEBAR */}
          <div className="space-y-4 lg:col-span-4 flex flex-col">

            {/* Points Card - Reward Points */}
            <div className="rounded-2xl bg-white p-6 shadow-[0_10px_40px_-10px_rgba(50,41,79,0.04)] h-full">
              <h2 className="mb-4 text-2xl font-bold text-[#32294f]">Points Balance</h2>

              {/* Inner Box */}
              <div className="rounded-2xl bg-[#4a3fe2]/5 p-5">
                <p className="text-xs font-semibold capitalize tracking-[0.15em] text-[#4a3fe2]">
                  Available points
                </p>
                <p className="mt-2 text-3xl font-bold text-[#4a3fe2] lg:text-4xl">
                  {(points?.total || 0).toLocaleString('id-ID')}
                </p>
                <p className="mt-3 text-sm leading-relaxed text-[#32294f]/70">
                  Points dapat dipakai saat checkout dan akan expired sesuai rule backend.
                </p>
              </div>
            </div>

            {/* Referral Card */}
            <div className="rounded-2xl bg-white p-6 shadow-[0_10px_40px_-10px_rgba(50,41,79,0.04)] h-full">
              <h2 className="mb-4 text-2xl font-bold text-[#32294f]">Referral Code</h2>

              {/* Inner Box */}
              <div className="rounded-2xl bg-[#4a3fe2]/5 p-5">
                <p className="text-xs font-semibold capitalize tracking-[0.15em] text-[#4a3fe2]">
                  Your code
                </p>
                <p className="mt-2 break-all font-mono text-2xl font-bold text-[#4a3fe2]">
                  {user.referralCode}
                </p>
                <p className="mt-3 text-sm leading-relaxed text-[#32294f]/70">
                  Bagikan kode ini ke user baru. Owner referral akan mendapatkan points.
                </p>
              </div>

              {/* Copy Button */}
              <button
                onClick={handleCopyReferral}
                className="mt-4 w-full rounded-full bg-[#4a3fe2] py-3 text-sm font-semibold text-white transition hover:bg-[#3a2fd2]"
              >
                Copy Code
              </button>
            </div>

            {/* Summary */}
            <div className="rounded-2xl bg-white p-6 shadow-[0_10px_40px_-10px_rgba(50,41,79,0.04)] h-full">
              {/* Section Label */}
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#4a3fe2] mb-1">
                Ringkasan aktivitas
              </p>
              {/* Main Title */}
              <h3 className="text-lg font-bold text-[#32294f] mb-4">Aktivitas kamu</h3>

              {/* Grid 2 columns */}
              <div className="grid grid-cols-2 gap-3">
                {/* Event diikuti */}
                <div className="rounded-xl bg-[#faf4ff] p-4 border border-[#b2a6d5]/20">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-[#32294f]/60 mb-1">
                    Event diikuti
                  </p>
                  <p className="text-xl font-bold text-[#32294f]">0 Event</p>
                </div>

                {/* Event mendatang */}
                <div className="rounded-xl bg-[#faf4ff] p-4 border border-[#b2a6d5]/20">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-[#32294f]/60 mb-1">
                    Event mendatang
                  </p>
                  <p className="text-xl font-bold text-[#32294f]">0 Event</p>
                </div>

                {/* Event selesai */}
                <div className="rounded-xl bg-[#faf4ff] p-4 border border-[#b2a6d5]/20">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-[#32294f]/60 mb-1">
                    Event selesai
                  </p>
                  <p className="text-xl font-bold text-[#32294f]">0 Event</p>
                </div>

                {/* Poin tersedia */}
                <div className="rounded-xl bg-[#faf4ff] p-4 border border-[#b2a6d5]/20">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-[#32294f]/60 mb-1">
                    Poin tersedia
                  </p>
                  <p className="text-xl font-bold text-[#4a3fe2]">
                    {(points?.total || 0).toLocaleString('id-ID')} Poin
                  </p>
                </div>
              </div>
            </div>

            {/* Action Buttons - Vertical stack, full width */}
            <div className="space-y-2">
              {user.role === 'CUSTOMER' && (
                <button
                  onClick={handleUpgradeClick}
                  className="w-full rounded-full bg-gradient-to-r from-[#4a3fe2] to-[#9795ff] px-4 py-3 text-sm font-semibold text-white transition hover:opacity-90"
                >
                  Become Organizer
                </button>
              )}
              <button
                onClick={() => setShowLogoutConfirm(true)}
                className="w-full rounded-full bg-[#32294f] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#32294f]/80"
              >
                Logout
              </button>
            </div>
          </div>
        </div>

      </div>
    </main>
  )
}
