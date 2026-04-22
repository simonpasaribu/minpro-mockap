import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { eventApi, Event } from '../../features/events/api/eventApi'
import { Calendar, MapPin, Users, Clock, User, Star, ArrowLeft } from 'lucide-react'

interface EventDetail extends Event {
  vouchers: {
    code: string
    discount: number
    expiresAt: string
  }[]
  reviews: {
    id: number
    rating: number
    comment: string | null
    createdAt: string
    user: {
      firstName: string
      lastName: string
      profilePicture: string | null
    }
  }[]
  avgRating: number
}

export default function EventDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [event, setEvent] = useState<EventDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchEventDetail = async () => {
      if (!id) return

      try {
        setLoading(true)
        const response = await eventApi.getEventById(parseInt(id))
        setEvent(response.data)
        setError(null)
      } catch (err) {
        setError('Event tidak ditemukan')
      } finally {
        setLoading(false)
      }
    }

    fetchEventDetail()
  }, [id])

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    })
  }

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('id-ID', {
      hour: '2-digit',
      minute: '2-digit',
    })
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
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
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
            Kembali ke Beranda
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Kembali</span>
          </button>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Event Image */}
            <div className="bg-white rounded-lg overflow-hidden shadow-md">
              {event.imageUrl ? (
                <img
                  src={event.imageUrl}
                  alt={event.title}
                  className="w-full h-64 object-cover"
                />
              ) : (
                <div className="w-full h-64 bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center">
                  <span className="text-white text-4xl font-bold">{event.title[0]}</span>
                </div>
              )}
            </div>

            {/* Event Info */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <span className="inline-block px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium mb-4">
                {event.category}
              </span>
              <h1 className="text-3xl font-bold text-gray-900 mb-4">
                {event.title}
              </h1>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                <div className="flex items-center gap-3">
                  <Calendar className="w-5 h-5 text-gray-500" />
                  <div>
                    <p className="text-sm text-gray-500">Tanggal</p>
                    <p className="font-medium">{formatDate(event.startDate)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Clock className="w-5 h-5 text-gray-500" />
                  <div>
                    <p className="text-sm text-gray-500">Waktu</p>
                    <p className="font-medium">{formatTime(event.startDate)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <MapPin className="w-5 h-5 text-gray-500" />
                  <div>
                    <p className="text-sm text-gray-500">Lokasi</p>
                    <p className="font-medium">{event.location}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Users className="w-5 h-5 text-gray-500" />
                  <div>
                    <p className="text-sm text-gray-500">Kursi Tersedia</p>
                    <p className="font-medium">{event.availableSeats} / {event.totalSeats}</p>
                  </div>
                </div>
              </div>

              {/* Description */}
              <div className="border-t pt-6">
                <h2 className="text-xl font-semibold mb-4">Deskripsi Event</h2>
                <p className="text-gray-600 whitespace-pre-wrap">
                  {event.description || 'Tidak ada deskripsi'}
                </p>
              </div>
            </div>

            {/* Reviews */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center gap-4 mb-6">
                <h2 className="text-xl font-semibold">Ulasan</h2>
                {event.avgRating > 0 && (
                  <div className="flex items-center gap-1 bg-yellow-100 px-3 py-1 rounded-full">
                    <Star className="w-4 h-4 text-yellow-600 fill-yellow-600" />
                    <span className="font-medium text-yellow-800">
                      {event.avgRating} ({event.reviews.length})
                    </span>
                  </div>
                )}
              </div>

              {event.reviews.length === 0 ? (
                <p className="text-gray-500">Belum ada ulasan</p>
              ) : (
                <div className="space-y-4">
                  {event.reviews.map((review) => (
                    <div key={review.id} className="border-b pb-4 last:border-0">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center">
                          <User className="w-5 h-5 text-gray-600" />
                        </div>
                        <div>
                          <p className="font-medium">
                            {review.user.firstName} {review.user.lastName}
                          </p>
                          <div className="flex items-center gap-1">
                            {[...Array(5)].map((_, i) => (
                              <Star
                                key={i}
                                className={`w-4 h-4 ${
                                  i < review.rating
                                    ? 'text-yellow-400 fill-yellow-400'
                                    : 'text-gray-300'
                                }`}
                              />
                            ))}
                          </div>
                        </div>
                        <span className="ml-auto text-sm text-gray-500">
                          {new Date(review.createdAt).toLocaleDateString('id-ID')}
                        </span>
                      </div>
                      {review.comment && (
                        <p className="text-gray-600 pl-13 ml-12">{review.comment}</p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-md p-6 sticky top-24">
              {/* Price */}
              <div className="mb-6">
                <p className="text-sm text-gray-500 mb-1">Harga Tiket</p>
                <p className="text-3xl font-bold text-gray-900">
                  {formatPrice(event.price)}
                </p>
              </div>

              {/* Vouchers */}
              {event.vouchers.length > 0 && (
                <div className="mb-6 p-4 bg-green-50 rounded-lg">
                  <p className="text-sm font-medium text-green-800 mb-2">
                    Voucher Tersedia
                  </p>
                  <ul className="space-y-1">
                    {event.vouchers.map((voucher, idx) => (
                      <li key={idx} className="text-sm text-green-700">
                        • {voucher.code}: {voucher.discount}% OFF
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* CTA Button */}
              <button
                onClick={() => navigate(`/checkout/${event.id}`)}
                disabled={event.availableSeats === 0}
                className={`w-full py-3 rounded-lg font-semibold transition-colors ${
                  event.availableSeats === 0
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}
              >
                {event.availableSeats === 0 ? 'Sold Out' : 'Beli Tiket'}
              </button>

              {/* Organizer Info */}
              <div className="mt-6 pt-6 border-t">
                <p className="text-sm text-gray-500 mb-3">Diselenggarakan oleh</p>
                <button
                  onClick={() => navigate(`/organizers/${event.organizerId}`)}
                  className="flex items-center gap-3 hover:bg-gray-50 p-2 rounded-lg transition-colors"
                >
                  <div className="w-12 h-12 rounded-full bg-gray-300 flex items-center justify-center">
                    <User className="w-6 h-6 text-gray-600" />
                  </div>
                  <div className="text-left">
                    <p className="font-medium text-gray-900">
                      {event.organizer.firstName} {event.organizer.lastName}
                    </p>
                    <p className="text-sm text-blue-600">Lihat Profil</p>
                  </div>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
