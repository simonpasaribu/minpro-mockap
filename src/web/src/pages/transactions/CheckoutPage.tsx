import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { eventApi } from '../../features/events/api/eventApi'
import { transactionApi } from '../../features/transactions/api/transactionApi'
import { Calendar, MapPin, Tag, Coins, ArrowLeft, Loader2 } from 'lucide-react'

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
  const { eventId } = useParams<{ eventId: string }>()
  const navigate = useNavigate()
  const [event, setEvent] = useState<EventDetail | null>(null)
  const [ticketCount, setTicketCount] = useState(1)
  const [pointsToUse, setPointsToUse] = useState(0)
  const [voucherCode, setVoucherCode] = useState('')
  const userPoints = 10000 // This should come from user API
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchEvent = async () => {
      if (!eventId) return
      try {
        const response = await eventApi.getEventById(parseInt(eventId))
        setEvent(response.data)
      } catch (err) {
        setError('Event tidak ditemukan')
      } finally {
        setLoading(false)
      }
    }
    fetchEvent()
  }, [eventId])

  const calculateTotals = () => {
    if (!event) return { subtotal: 0, voucherDiscount: 0, total: 0 }

    const subtotal = event.price * ticketCount

    let voucherDiscount = 0
    if (voucherCode) {
      const voucher = event.vouchers.find(v => v.code === voucherCode.toUpperCase())
      if (voucher) {
        voucherDiscount = Math.floor((subtotal * voucher.discount) / 100)
      }
    }

    const total = Math.max(0, subtotal - pointsToUse - voucherDiscount)
    return { subtotal, voucherDiscount, total }
  }

  const handleSubmit = async () => {
    if (!event) return

    try {
      setSubmitting(true)
      setError(null)

      const response = await transactionApi.createTransaction({
        eventId: event.id,
        ticketCount,
        pointsToUse,
        voucherCode: voucherCode || undefined,
      })

      // Navigate to payment or transaction detail page
      navigate(`/transactions/${response.data.id}`)
    } catch (err: any) {
      setError(err.response?.data?.message || 'Gagal membuat transaksi')
    } finally {
      setSubmitting(false)
    }
  }

  const formatPrice = (price: number) => {
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

  const { subtotal, voucherDiscount, total } = calculateTotals()

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <button
            onClick={() => navigate(`/events/${eventId}`)}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Kembali</span>
          </button>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-8">Checkout</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Event Summary */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-lg font-semibold mb-4">Detail Event</h2>
              <div className="flex gap-4">
                {event.imageUrl ? (
                  <img
                    src={event.imageUrl}
                    alt={event.title}
                    className="w-32 h-32 object-cover rounded-lg"
                  />
                ) : (
                  <div className="w-32 h-32 bg-gradient-to-br from-blue-400 to-purple-500 rounded-lg flex items-center justify-center">
                    <span className="text-white text-2xl font-bold">{event.title[0]}</span>
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

            {/* Ticket Selection */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-lg font-semibold mb-4">Pilih Tiket</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Jumlah Tiket
                  </label>
                  <div className="flex items-center gap-4">
                    <button
                      onClick={() => setTicketCount(Math.max(1, ticketCount - 1))}
                      className="w-10 h-10 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-50"
                    >
                      -
                    </button>
                    <span className="text-xl font-semibold w-12 text-center">{ticketCount}</span>
                    <button
                      onClick={() => setTicketCount(Math.min(event.availableSeats, ticketCount + 1))}
                      className="w-10 h-10 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-50"
                    >
                      +
                    </button>
                    <span className="text-sm text-gray-500">
                      (Tersedia: {event.availableSeats} kursi)
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Points & Voucher */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-lg font-semibold mb-4">Gunakan Poin & Voucher</h2>
              <div className="space-y-4">
                {/* Points */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <div className="flex items-center gap-2">
                      <Coins className="w-4 h-4" />
                      <span>Poin Anda: {userPoints.toLocaleString()}</span>
                    </div>
                  </label>
                  <input
                    type="number"
                    value={pointsToUse}
                    onChange={(e) => setPointsToUse(Math.min(userPoints, parseInt(e.target.value) || 0))}
                    max={userPoints}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Masukkan jumlah poin"
                  />
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
                  <input
                    type="text"
                    value={voucherCode}
                    onChange={(e) => setVoucherCode(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Masukkan kode voucher"
                  />
                  {event.vouchers.length > 0 && (
                    <p className="text-sm text-gray-500 mt-1">
                      Voucher tersedia: {event.vouchers.map(v => v.code).join(', ')}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-md p-6 sticky top-24">
              <h2 className="text-lg font-semibold mb-4">Ringkasan Pesanan</h2>
              
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">
                    {formatPrice(event.price)} x {ticketCount}
                  </span>
                  <span>{formatPrice(subtotal)}</span>
                </div>
                
                {pointsToUse > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Diskon Poin</span>
                    <span>-{formatPrice(pointsToUse)}</span>
                  </div>
                )}
                
                {voucherDiscount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Diskon Voucher</span>
                    <span>-{formatPrice(voucherDiscount)}</span>
                  </div>
                )}
                
                <div className="border-t pt-3 mt-3">
                  <div className="flex justify-between text-lg font-semibold">
                    <span>Total</span>
                    <span>{formatPrice(total)}</span>
                  </div>
                </div>
              </div>

              {error && (
                <p className="text-red-600 text-sm mt-4">{error}</p>
              )}

              <button
                onClick={handleSubmit}
                disabled={submitting || ticketCount > event.availableSeats}
                className="w-full mt-6 bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Memproses...
                  </>
                ) : (
                  `Bayar ${formatPrice(total)}`
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
