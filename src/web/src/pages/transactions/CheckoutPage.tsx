import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { eventApi } from '../../features/events/api/eventApi'
import { transactionApi } from '../../features/transactions/api/transactionApi'
import { Calendar, MapPin, Tag, Coins, ArrowLeft, Loader2, AlertCircle, CheckCircle } from 'lucide-react'
import api from '../../features/auth/services/auth.service'
import { setUnsavedChangesFlag } from '../../contexts/UnsavedChangesContext'

interface EventDetail {
  id: number
  title: string
  description: string | null
  location: string
  price: number
  availableSeats: number
  totalSeats: number
  startDate: string
  imageUrl: string | null
  organizer: {
    firstName: string
    lastName: string
  }
  vouchers: {
    code: string
    discount: number
  }[]
}

export default function CheckoutPage() {
  const { slug } = useParams<{ slug: string }>()
  const navigate = useNavigate()
  const [event, setEvent] = useState<EventDetail | null>(null)
  const [ticketCount, setTicketCount] = useState(1)
  const [pointsToUse, setPointsToUse] = useState('')
  const [pointsConfirmed, setPointsConfirmed] = useState(false)
  const [pointsError, setPointsError] = useState<string | null>(null)
  const [voucherCode, setVoucherCode] = useState('')
  const [appliedVoucher, setAppliedVoucher] = useState<{ code: string; discount: number } | null>(null)
  const [voucherError, setVoucherError] = useState<string | null>(null)
  const [validatingVoucher, setValidatingVoucher] = useState(false)
  const [attendeeDetails, setAttendeeDetails] = useState({
    fullName: '',
    idType: 'KTP' as 'KTP' | 'SIM' | 'PASSPORT',
    idNumber: '',
    phone: ''
  })
  const [attendeeErrors, setAttendeeErrors] = useState({
    fullName: '',
    idNumber: '',
    phone: ''
  })
  const [userPoints, setUserPoints] = useState(0)
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const [showConfirmModal, setShowConfirmModal] = useState(false)
  const [pendingNavigation, setPendingNavigation] = useState<(() => void) | null>(null)

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [])

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault()
        e.returnValue = ''
      }
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    
    // Update global flag when hasUnsavedChanges changes
    setUnsavedChangesFlag(hasUnsavedChanges)
    
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload)
      setUnsavedChangesFlag(false)
    }
  }, [hasUnsavedChanges])

  const handleNavigation = (navigationAction: () => void) => {
    if (hasUnsavedChanges) {
      setPendingNavigation(() => navigationAction)
      setShowConfirmModal(true)
    } else {
      navigationAction()
    }
  }

  const handleConfirmNavigation = () => {
    setShowConfirmModal(false)
    if (pendingNavigation) {
      pendingNavigation()
      setPendingNavigation(null)
    }
    // Redirect to event page after confirming
    if (slug) {
      navigate(`/events/${slug}`)
    }
  }

  const handleCancelNavigation = () => {
    setShowConfirmModal(false)
    setPendingNavigation(null)
  }
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchEvent = async () => {
      if (!slug) return
      try {
        const response = await eventApi.getEventBySlug(slug)
        setEvent(response)
      } catch (err) {
        setError('Event tidak ditemukan')
      } finally {
        setLoading(false)
      }
    }
    fetchEvent()
  }, [slug])

  useEffect(() => {
    const fetchUserPoints = async () => {
      try {
        const response = await api.get('/user/points')
        setUserPoints(response.data.data?.total || 0)
      } catch (err) {
        console.error('Failed to fetch user points:', err)
      }
    }
    fetchUserPoints()
  }, [])

  const TAX_RATE = 0.11 // 11% PPN

  const calculateTotals = () => {
    if (!event) return { subtotal: 0, voucherDiscount: 0, tax: 0, total: 0 }

    const subtotal = event.price * ticketCount

    let voucherDiscount = 0
    if (appliedVoucher) {
      voucherDiscount = Math.floor((subtotal * appliedVoucher.discount) / 100)
    }

    const pointsValue = parseInt(pointsToUse) || 0
    // Limit points to maximum of subtotal after voucher discount
    const maxPointsUsable = Math.max(0, subtotal - voucherDiscount)
    const actualPointsUsed = Math.min(pointsValue, maxPointsUsable)
    const afterDiscount = Math.max(0, subtotal - actualPointsUsed - voucherDiscount)
    const tax = Math.floor(afterDiscount * TAX_RATE)
    const total = afterDiscount + tax

    return { subtotal, voucherDiscount, tax, total, actualPointsUsed }
  }

  const handleSubmit = async () => {
    if (!event) return

    // Validate attendee details with specific messages
    if (!attendeeDetails.fullName.trim()) {
      setAttendeeErrors(prev => ({ ...prev, fullName: 'Nama lengkap harus diisi' }))
      document.getElementById('fullName')?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      return
    }
    if (!attendeeDetails.idNumber.trim()) {
      setAttendeeErrors(prev => ({ ...prev, idNumber: `Nomor ${attendeeDetails.idType} harus diisi` }))
      document.getElementById('idNumber')?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      return
    }
    if (!attendeeDetails.phone.trim()) {
      setAttendeeErrors(prev => ({ ...prev, phone: 'Nomor telepon harus diisi' }))
      document.getElementById('phone')?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      return
    }

    // Validate points
    const pointsInput = parseInt(pointsToUse) || 0
    if (pointsInput > userPoints) {
      setPointsError('Poin tidak cukup')
      document.getElementById('pointsInput')?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      return
    }

    try {
      setSubmitting(true)
      setError(null)

      const { actualPointsUsed } = calculateTotals()
      const response = await transactionApi.createTransaction({
        eventId: event.id,
        ticketCount: 1, // Hardcoded: only 1 ticket per checkout
        pointsToUse: actualPointsUsed || 0,
        voucherCode: voucherCode || undefined,
        attendeeDetails, // Include attendee info
      })

      // Navigate to payment or transaction detail page
      navigate(`/transactions/${response.data.id}`)
      setHasUnsavedChanges(false)
    } catch (err: any) {
      setError(err.response?.data?.message || 'Gagal membuat transaksi')
    } finally {
      setSubmitting(false)
    }
  }

  const formatPrice = (price: number) => {
    if (price === 0) return 'Gratis'
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(price)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    )
  }

  if (error || !event) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={() => navigate('/')}
            className="text-blue-600 hover:underline"
          >
            Kembali
          </button>
        </div>
      </div>
    )
  }

  const { subtotal, voucherDiscount, tax, total, actualPointsUsed } = calculateTotals()

  return (
    <div className="min-h-screen bg-gray-50 pb-16 sm:pb-20 pt-20">
      <div className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        {/* Back Button */}
        <button
          onClick={() => handleNavigation(() => navigate(-1))}
          className="flex items-center gap-2 px-3 py-2 sm:px-4 sm:py-2.5 rounded-full bg-[#e2d7ff] text-[#4e339c] font-semibold hover:bg-[#d8caff] transition-colors mb-4 sm:mb-6 text-sm sm:text-base"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="hidden sm:inline">Kembali</span>
        </button>

        <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mb-6 sm:mb-8">Checkout</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-8">
          {/* Main Form */}
          <div className="lg:col-span-2 space-y-4 sm:space-y-6">
            {/* Event Summary */}
            <div className="bg-white rounded-2xl shadow-sm border border-[#e2d7ff]/20 p-4 sm:p-6">
              <h2 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4">Detail Event</h2>
              <div className="flex gap-3 sm:gap-4">
                {event.imageUrl ? (
                  <img
                    src={event.imageUrl}
                    alt={event.title}
                    className="w-24 h-24 sm:w-32 sm:h-32 object-cover rounded-lg"
                  />
                ) : (
                  <div className="w-24 h-24 sm:w-32 sm:h-32 bg-gradient-to-br from-blue-400 to-purple-500 rounded-lg flex items-center justify-center">
                    <span className="text-white text-xl sm:text-2xl font-bold">{event.title[0]}</span>
                  </div>
                )}
                <div>
                  <h3 className="font-semibold text-lg">{event.title}</h3>
                  <p className="text-gray-600">{event.organizer.firstName} {event.organizer.lastName}</p>
                  <div className="mt-2 space-y-1 text-sm text-gray-500">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      <span>{new Date(event.startDate).toLocaleDateString('id-ID')}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4" />
                      <span>{event.location}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Attendee Details - ID Verification */}
            <div className="bg-white rounded-2xl shadow-sm border border-[#e2d7ff]/20 p-6">
              <h2 className="text-lg font-semibold mb-4">Data Peserta</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nama Lengkap
                  </label>
                  <input
                    id="fullName"
                    type="text"
                    value={attendeeDetails.fullName}
                    onChange={(e) => {
                      const value = e.target.value
                      setAttendeeDetails({...attendeeDetails, fullName: value})
                      setHasUnsavedChanges(true)
                      setAttendeeErrors(prev => ({
                        ...prev,
                        fullName: !value.trim() ? 'Nama lengkap harus diisi' : ''
                      }))
                      if (error && error.includes('Nama')) setError(null)
                    }}
                    className={`w-full px-4 py-2 border rounded-xl focus:ring-2 focus:ring-[#4a3fe2] focus:border-transparent transition-colors ${
                      attendeeErrors.fullName ? 'border-red-500 bg-red-50' : 'border-gray-300'
                    }`}
                    placeholder="Masukkan nama lengkap"
                  />
                  {attendeeErrors.fullName && (
                    <p className="text-red-600 text-xs mt-1">{attendeeErrors.fullName}</p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Jenis ID
                    </label>
                    <select
                      value={attendeeDetails.idType}
                      onChange={(e) => {
                        setAttendeeDetails({...attendeeDetails, idType: e.target.value as any})
                        setHasUnsavedChanges(true)
                      }}
                      className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#4a3fe2] focus:border-transparent"
                    >
                      <option value="KTP">KTP</option>
                      <option value="SIM">SIM</option>
                      <option value="PASSPORT">Passport</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Nomor ID
                    </label>
                    <input
                      id="idNumber"
                      type="text"
                      value={attendeeDetails.idNumber}
                      onChange={(e) => {
                        const value = e.target.value
                        setAttendeeDetails({...attendeeDetails, idNumber: value})
                        setHasUnsavedChanges(true)
                        setAttendeeErrors(prev => ({
                          ...prev,
                          idNumber: !value.trim() ? 'Nomor ID harus diisi' : ''
                        }))
                        if (error && error.includes('Nomor')) setError(null)
                      }}
                      className={`w-full px-4 py-2 border rounded-xl focus:ring-2 focus:ring-[#4a3fe2] focus:border-transparent transition-colors ${
                        attendeeErrors.idNumber ? 'border-red-500 bg-red-50' : 'border-gray-300'
                      }`}
                      placeholder={`Nomor ${attendeeDetails.idType}`}
                    />
                    {attendeeErrors.idNumber && (
                      <p className="text-red-600 text-xs mt-1">{attendeeErrors.idNumber}</p>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nomor Telepon
                  </label>
                  <input
                    id="phone"
                    type="tel"
                    value={attendeeDetails.phone}
                    onChange={(e) => {
                      const value = e.target.value
                      setAttendeeDetails({...attendeeDetails, phone: value})
                      setHasUnsavedChanges(true)
                      setAttendeeErrors(prev => ({
                        ...prev,
                        phone: !value.trim() ? 'Nomor telepon harus diisi' : ''
                      }))
                      if (error && error.includes('telepon')) setError(null)
                    }}
                    className={`w-full px-4 py-2 border rounded-xl focus:ring-2 focus:ring-[#4a3fe2] focus:border-transparent transition-colors ${
                      attendeeErrors.phone ? 'border-red-500 bg-red-50' : 'border-gray-300'
                    }`}
                    placeholder="08xxxxxxxxxx"
                  />
                  {attendeeErrors.phone && (
                    <p className="text-red-600 text-xs mt-1">{attendeeErrors.phone}</p>
                  )}
                </div>

                <p className="text-xs text-gray-500">
                  * Data ini wajib diisi dan akan diverifikasi saat masuk ke event
                </p>
              </div>
            </div>

            {/* Points & Voucher */}
            <div className="bg-white rounded-2xl shadow-sm border border-[#e2d7ff]/20 p-6">
              <h2 className="text-lg font-semibold mb-4">Gunakan Poin & Voucher</h2>
              <div className="space-y-4">
                {/* Points */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <div className="flex items-center gap-2">
                      <Coins className="w-4 h-4" />
                      <span>Poin Anda: {(userPoints - (pointsConfirmed ? (parseInt(pointsToUse) || 0) : 0)).toLocaleString()}</span>
                    </div>
                  </label>
                  <div className="flex gap-2">
                    <input
                      id="pointsInput"
                      type="number"
                      value={pointsToUse}
                      onChange={(e) => {
                        const value = e.target.value.replace(/[^0-9]/g, '')
                        const numValue = parseInt(value) || 0
                        if (numValue > userPoints) {
                          setPointsError('Poin tidak cukup')
                        } else {
                          setPointsError(null)
                        }
                        setPointsToUse(value)
                        setHasUnsavedChanges(true)
                      }}
                      max={userPoints}
                      disabled={pointsConfirmed}
                      className={`flex-1 px-4 py-2 border rounded-xl focus:ring-2 focus:ring-[#4a3fe2] focus:border-transparent transition-colors ${
                        pointsError ? 'border-red-500 bg-red-50' : pointsConfirmed ? 'bg-gray-100 border-gray-300 cursor-not-allowed' : 'border-gray-300'
                      }`}
                      placeholder="Masukkan jumlah poin"
                    />
                    {!pointsConfirmed ? (
                    <button
                      onClick={() => {
                        const numPoints = parseInt(pointsToUse) || 0
                        if (numPoints > userPoints) {
                          setPointsError('Poin tidak cukup')
                          return
                        }
                        if (numPoints === 0) {
                          setPointsError('Masukkan jumlah poin yang ingin digunakan')
                          return
                        }
                        setPointsConfirmed(true)
                        setPointsError(null)
                      }}
                      disabled={!pointsToUse || (parseInt(pointsToUse) || 0) > userPoints}
                      className="w-24 px-4 py-2 bg-[#4a3fe2] text-white rounded-xl font-medium hover:bg-[#3d2fd6] disabled:bg-gray-300 disabled:cursor-not-allowed whitespace-nowrap"
                    >
                      Gunakan
                    </button>
                  ) : (
                    <button
                      onClick={() => {
                        setPointsConfirmed(false)
                        setPointsError(null)
                      }}
                      className="w-24 px-4 py-2 bg-gray-500 text-white rounded-xl font-medium hover:bg-gray-600 whitespace-nowrap"
                    >
                      Ubah
                    </button>
                  )}
                  </div>
                  {pointsError && (
                    <p className="text-red-600 text-sm mt-2 flex items-center gap-1">
                      <AlertCircle className="w-4 h-4" />
                      {pointsError}
                    </p>
                  )}
                  {pointsConfirmed && (
                    <p className="text-green-600 text-sm mt-2 flex items-center gap-1">
                      <CheckCircle className="w-4 h-4" />
                      {(parseInt(pointsToUse) || 0).toLocaleString()} poin akan digunakan
                    </p>
                  )}
                  <p className="text-sm text-gray-500 mt-1">
                    1 Poin = Rp 1
                  </p>
                </div>

                {/* Voucher */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <div className="flex items-center gap-2">
                      <Tag className="w-4 h-4" />
                      <span>Kode Voucher</span>
                    </div>
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={voucherCode}
                      onChange={(e) => {
                        setVoucherCode(e.target.value)
                        setHasUnsavedChanges(true)
                        setVoucherError(null)
                        if (appliedVoucher && appliedVoucher.code !== e.target.value.toUpperCase()) {
                          setAppliedVoucher(null)
                        }
                      }}
                      className={`flex-1 px-4 py-2 border rounded-xl focus:ring-2 focus:ring-[#4a3fe2] focus:border-transparent ${
                        voucherError ? 'border-red-500 bg-red-50' : appliedVoucher ? 'border-green-500 bg-green-50' : 'border-gray-300'
                      }`}
                      placeholder="Masukkan kode voucher"
                    />
                    <button
                      onClick={async () => {
                        if (!voucherCode.trim()) {
                          setVoucherError('Masukkan kode voucher')
                          return
                        }
                        setValidatingVoucher(true)
                        setVoucherError(null)
                        
                        try {
                          // First try to validate as event voucher
                          const eventVoucher = event.vouchers.find(v => v.code === voucherCode.toUpperCase())
                          
                          if (eventVoucher) {
                            setAppliedVoucher(eventVoucher)
                            setVoucherError(null)
                          } else {
                            // Try to validate as personal coupon
                            const response = await api.post('/user/coupons/validate', { code: voucherCode })
                            setAppliedVoucher(response.data.data)
                            setVoucherError(null)
                          }
                        } catch (err: any) {
                          setVoucherError(err.response?.data?.message || 'Kode voucher tidak valid atau sudah tidak berlaku')
                          setAppliedVoucher(null)
                        } finally {
                          setValidatingVoucher(false)
                        }
                      }}
                      disabled={validatingVoucher || appliedVoucher?.code === voucherCode.toUpperCase()}
                      className="w-24 px-4 py-2 bg-[#4a3fe2] text-white rounded-xl font-medium hover:bg-[#3d2fd6] disabled:bg-gray-300 disabled:cursor-not-allowed whitespace-nowrap"
                    >
                      {validatingVoucher ? '...' : appliedVoucher?.code === voucherCode.toUpperCase() ? 'Terapkan' : 'Terapkan'}
                    </button>
                  </div>
                  
                  {/* Voucher Status Messages */}
                  {voucherError && (
                    <p className="text-red-600 text-sm mt-2 flex items-center gap-1">
                      <AlertCircle className="w-4 h-4" />
                      {voucherError}
                    </p>
                  )}
                  {appliedVoucher && (
                    <p className="text-green-600 text-sm mt-2 flex items-center gap-1">
                      <CheckCircle className="w-4 h-4" />
                      Voucher {appliedVoucher.code} berhasil diterapkan! Diskon {appliedVoucher.discount}%
                    </p>
                  )}
                  
                  {event.vouchers.length > 0 && !appliedVoucher && (
                    <p className="text-sm text-gray-500 mt-2">
                      Voucher tersedia: {event.vouchers.map(v => v.code).join(', ')}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1 order-first lg:order-last">
            <div className="bg-white rounded-2xl shadow-sm border border-[#e2d7ff]/20 p-4 sm:p-6 lg:sticky lg:top-24">
              <h2 className="text-lg font-semibold mb-4">Ringkasan Pesanan</h2>

              {(() => {
                const { subtotal, voucherDiscount, tax, total, actualPointsUsed } = calculateTotals()
                const afterDiscount = Math.max(0, subtotal - (actualPointsUsed || 0) - voucherDiscount)
                return (
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">
                        {formatPrice(event.price)} x {ticketCount}
                      </span>
                      <span>{formatPrice(subtotal)}</span>
                    </div>

                    {(actualPointsUsed || 0) > 0 && (
                      <div className="flex justify-between text-green-600">
                        <span>Diskon Poin</span>
                        <span>-{formatPrice(actualPointsUsed || 0)}</span>
                      </div>
                    )}

                    {appliedVoucher && voucherDiscount > 0 && (
                      <div className="flex justify-between items-center bg-green-50 text-green-700 px-3 py-2 rounded-lg -mx-3">
                        <span className="flex items-center gap-2">
                          <CheckCircle className="w-4 h-4" />
                          Diskon {appliedVoucher.discount}% ({appliedVoucher.code})
                        </span>
                        <span className="font-semibold">-{formatPrice(voucherDiscount)}</span>
                      </div>
                    )}

                    {((actualPointsUsed || 0) > 0 || (appliedVoucher && voucherDiscount > 0)) && (
                      <div className="flex justify-between text-gray-700 font-medium">
                        <span>Subtotal setelah diskon</span>
                        <span>{formatPrice(afterDiscount)}</span>
                      </div>
                    )}

                    <div className="flex justify-between text-gray-600">
                      <span>PPN (11%)</span>
                      <span>{formatPrice(tax)}</span>
                    </div>

                    <div className="border-t pt-3 mt-3">
                      <div className="flex justify-between items-center">
                        <span className="text-lg font-semibold">Total</span>
                        <div className="text-right">
                          {((actualPointsUsed || 0) > 0 || (appliedVoucher && voucherDiscount > 0)) && (
                            <p className="text-sm text-gray-400 line-through">
                              {formatPrice(subtotal + Math.floor(subtotal * TAX_RATE))}
                            </p>
                          )}
                          <p className="text-xl font-bold text-blue-600">{formatPrice(total)}</p>
                        </div>
                      </div>
                      {((actualPointsUsed || 0) > 0 || (appliedVoucher && voucherDiscount > 0)) && (
                        <p className="text-xs text-green-600 mt-1 text-right">
                          Hemat {formatPrice((actualPointsUsed || 0) + voucherDiscount)}
                        </p>
                      )}
                    </div>
                  </div>
                )
              })()}

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 mt-4 flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-red-800 font-semibold text-sm">{error}</p>
                    <p className="text-red-600 text-xs mt-1">Silakan lengkapi data di atas untuk melanjutkan pembayaran.</p>
                  </div>
                </div>
              )}

              <button
                onClick={handleSubmit}
                disabled={submitting || ticketCount > event.availableSeats}
                className="w-full mt-6 bg-[#4a3fe2] text-white py-3 rounded-xl font-semibold hover:bg-[#3d2fd6] disabled:bg-gray-300 flex items-center justify-center gap-2"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Memproses...
                  </>
                ) : total === 0 ? (
                  'Daftar Gratis'
                ) : (
                  `Bayar ${formatPrice(total)}`
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 border border-[#b2a6d5]/20">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-full bg-yellow-100 flex items-center justify-center">
                <AlertCircle className="w-6 h-6 text-yellow-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Konfirmasi Kembali</h3>
                <p className="text-sm text-gray-600">Anda memiliki perubahan yang belum disimpan</p>
              </div>
            </div>
            <p className="text-gray-700 mb-6">
              Apakah Anda yakin ingin kembali? Data yang telah Anda isi akan hilang.
            </p>
            <div className="flex gap-3">
              <button
                onClick={handleCancelNavigation}
                className="flex-1 px-4 py-2.5 rounded-xl border border-[#b2a6d5] text-[#32294f] font-semibold hover:bg-[#f5eeff] transition-colors"
              >
                Batal
              </button>
              <button
                onClick={handleConfirmNavigation}
                className="flex-1 px-4 py-2.5 rounded-xl bg-[#4a3fe2] text-white font-semibold hover:bg-[#3d2fd6] transition-colors"
              >
                Ya, Kembali
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
