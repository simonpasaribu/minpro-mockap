import { useState, useEffect } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import { eventApi, Event } from '../../features/events/api/eventApi'
import { organizerApi, Attendee } from '../../features/organizers/api/organizerApi'
import { useAuth } from '../../features/auth/components/AuthContext'
import { Calendar, MapPin, Users, Clock, Star, ArrowLeft } from 'lucide-react'

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
  const { slug } = useParams<{ slug: string }>()
  const navigate = useNavigate()
  const location = useLocation()
  const { user } = useAuth()
  const [event, setEvent] = useState<EventDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [attendees, setAttendees] = useState<Attendee[]>([])
  const [showAttendees, setShowAttendees] = useState(false)
  const [attendeesLoading, setAttendeesLoading] = useState(false)

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [])

  useEffect(() => {
    const fetchEventDetail = async () => {
      if (!slug) return

      try {
        setLoading(true)
        const response = await eventApi.getEventBySlug(slug)
        setEvent(response)
        setError(null)
      } catch (err) {
        setError('Event tidak ditemukan')
      } finally {
        setLoading(false)
      }
    }

    fetchEventDetail()
  }, [slug])

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

  const fetchAttendees = async () => {
    if (!slug) return
    try {
      setAttendeesLoading(true)
      const data = await organizerApi.getEventAttendees(slug)
      setAttendees(data)
    } catch (error) {
      console.error('Failed to fetch attendees:', error)
    } finally {
      setAttendeesLoading(false)
    }
  }

  const isOrganizer = user && event && user.role === 'ORGANIZER' && user.id === event.organizer.id

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
    <div className="min-h-screen bg-gray-50 pb-20 pt-20">
      <div className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        {/* Back Button */}
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 px-3 py-2 sm:px-4 sm:py-2.5 rounded-full bg-[#e2d7ff] text-[#4e339c] font-semibold hover:bg-[#d8caff] transition-colors mb-4 sm:mb-6 text-sm sm:text-base"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="hidden sm:inline">Kembali</span>
        </button>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Event Image */}
            <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-[#e2d7ff]/20">
              {event.imageUrl ? (
                <img
                  src={event.imageUrl}
                  alt={event.title}
                  className="w-full h-48 sm:h-64 object-cover"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement
                    target.style.display = 'none'
                    const parent = target.parentElement
                    parent?.classList.add('bg-gradient-to-br', 'from-blue-400', 'to-purple-500', 'flex', 'items-center', 'justify-center')
                    const fallback = document.createElement('div')
                    fallback.innerHTML = `<span class="text-white text-4xl font-bold">${event.title[0]}</span>`
                    parent?.appendChild(fallback)
                  }}
                />
              ) : (
                <div className="w-full h-48 sm:h-64 md:h-80 bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center">
                  <span className="text-white text-3xl sm:text-4xl md:text-5xl font-bold">${event.title[0]}</span>
                </div>
              )}
            </div>

            {/* Event Info */}
            <div className="bg-white rounded-2xl shadow-sm border border-[#e2d7ff]/20 p-4 sm:p-6">
              <span className="inline-block px-3 py-1 bg-[#f5eeff] text-[#4a3fe2] rounded-full text-xs sm:text-sm font-medium mb-3 sm:mb-4">
                {event.category}
              </span>
              <h1 className="text-2xl sm:text-3xl font-bold text-[#32294f] mb-3 sm:mb-4">
                {event.title}
              </h1>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mb-4 sm:mb-6">
                <div className="flex items-center gap-3">
                  <Calendar className="w-5 h-5 text-[#4a3fe2]" />
                  <div>
                    <p className="text-sm text-[#5f557f]">Tanggal</p>
                    <p className="font-medium text-[#32294f]">{formatDate(event.startDate)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Clock className="w-5 h-5 text-[#4a3fe2]" />
                  <div>
                    <p className="text-sm text-[#5f557f]">Waktu</p>
                    <p className="font-medium text-[#32294f]">{formatTime(event.startDate)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <MapPin className="w-5 h-5 text-[#4a3fe2]" />
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
              <div className="border-t pt-4 sm:pt-6">
                <h2 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4">Deskripsi Event</h2>
                <p className="text-gray-600 whitespace-pre-wrap text-sm sm:text-base">
                  {event.description || 'Tidak ada deskripsi'}
                </p>
              </div>
            </div>

            {/* Reviews */}
            <div className="bg-white rounded-2xl shadow-sm border border-[#e2d7ff]/20 p-4 sm:p-6">
              <h2 className="text-lg sm:text-xl font-semibold mb-4 sm:mb-6">Penilaian</h2>

              {event.reviews.length === 0 ? (
                <p className="text-gray-500">Belum ada ulasan</p>
              ) : (
                <div className="bg-[#f5eeff] rounded-xl p-4 sm:p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-3xl sm:text-4xl font-bold text-[#32294f]">
                        {event.avgRating.toFixed(1)}
                      </span>
                      <div className="flex gap-0.5">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`w-5 h-5 sm:w-6 sm:h-6 ${
                              i < Math.round(event.avgRating)
                                ? 'text-yellow-400 fill-yellow-400'
                                : 'text-yellow-400'
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                    <button
                      onClick={() => navigate(`/events/${slug}/reviews`, { state: { from: location.pathname } })}
                      className="text-sm font-bold text-[#4a3fe2] hover:underline underline-offset-4"
                    >
                      Lihat semua ulasan ({event.reviews.length})
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Attendee List - Only for organizers */}
            {isOrganizer && (
              <div className="bg-white rounded-2xl shadow-sm border border-[#e2d7ff]/20 p-4 sm:p-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 mb-4 sm:mb-6">
                  <h2 className="text-lg sm:text-xl font-semibold">Daftar Peserta</h2>
                  <button
                    onClick={() => {
                      if (showAttendees) {
                        setShowAttendees(false)
                      } else {
                        fetchAttendees()
                        setShowAttendees(true)
                      }
                    }}
                    className="flex items-center gap-2 px-3 py-2 sm:px-4 sm:py-2 bg-[#4a3fe2] text-white rounded-lg hover:bg-[#3f35c0] transition-colors text-sm sm:text-base"
                  >
                    <Users className="w-4 h-4" />
                    <span>{showAttendees ? 'Sembunyikan' : 'Lihat Peserta'}</span>
                  </button>
                </div>

                {showAttendees && (
                  <>
                    {attendeesLoading ? (
                      <div className="flex items-center justify-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                      </div>
                    ) : attendees.length === 0 ? (
                      <div className="text-center py-8">
                        <Users className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                        <p className="text-gray-500">Belum ada peserta</p>
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Peserta
                              </th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Tiket
                              </th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Total Harga
                              </th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {attendees.map((attendee) => (
                              <tr key={attendee.transactionId} className="hover:bg-gray-50">
                                <td className="px-4 py-3 whitespace-nowrap">
                                  <div className="flex items-center">
                                    <div className="flex-shrink-0 h-8 w-8 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center text-white text-sm font-semibold">
                                      {attendee.user.firstName[0]}{attendee.user.lastName[0]}
                                    </div>
                                    <div className="ml-3">
                                      <div className="text-sm font-medium text-gray-900">
                                        {attendee.user.firstName} {attendee.user.lastName}
                                      </div>
                                      <div className="text-xs text-gray-500">{attendee.user.email}</div>
                                    </div>
                                  </div>
                                </td>
                                <td className="px-4 py-3 whitespace-nowrap">
                                  <div className="text-sm text-gray-900">
                                    {attendee.ticketCount} x {formatPrice(attendee.ticketPrice)}
                                  </div>
                                </td>
                                <td className="px-4 py-3 whitespace-nowrap">
                                  <div className="text-sm font-semibold text-gray-900">
                                    {formatPrice(attendee.totalAmount)}
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-md p-4 sm:p-6 sticky top-20 sm:top-24">
              {/* Price */}
              <div className="mb-4 sm:mb-6">
                <p className="text-xs sm:text-sm text-gray-500 mb-1">Harga Tiket</p>
                <p className="text-2xl sm:text-3xl font-bold text-gray-900">
                  {formatPrice(event.price)}
                </p>
              </div>

              {/* Vouchers */}
              {event.vouchers.length > 0 && (
                <div className="mb-4 sm:mb-6 p-3 sm:p-4 bg-green-50 rounded-lg">
                  <p className="text-xs sm:text-sm font-medium text-green-800 mb-2">
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

              {/* Buy Ticket Button */}
              <button
                onClick={() => {
                  if (!user) {
                    navigate('/login', { state: { from: `/events/${slug}` } })
                    return
                  }
                  navigate(`/checkout/${event.slug}`)
                }}
                className="w-full rounded-xl bg-[#4a3fe2] px-4 py-3 sm:px-6 sm:py-3 text-center text-xs sm:text-sm font-semibold text-white transition hover:bg-[#3f35c0]"
              >
                {event.availableSeats === 0 ? 'Sold Out' : user ? 'Beli Tiket' : 'Login untuk Beli Tiket'}
              </button>

              {/* Organizer Info */}
              <div className="mt-4 sm:mt-6 pt-4 sm:pt-6 border-t">
                <p className="text-xs sm:text-sm text-gray-500 mb-2 sm:mb-3">Diselenggarakan oleh</p>
                <button
                  onClick={() => navigate(`/organizers/${event.organizer.username}`)}
                  className="flex items-center gap-2 sm:gap-3 hover:bg-gray-50 p-2 rounded-lg transition-colors w-full text-left"
                >
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-gray-300 flex items-center justify-center flex-shrink-0 overflow-hidden">
                    {event.organizer.profilePicture ? (
                      <img
                        src={event.organizer.profilePicture}
                        alt={`${event.organizer.firstName} ${event.organizer.lastName}`}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-[#4a3fe2] text-white font-semibold text-sm sm:text-base">
                        {event.organizer.firstName[0]}{event.organizer.lastName[0]}
                      </div>
                    )}
                  </div>
                  <div className="text-left min-w-0">
                    <p className="font-medium text-gray-900 text-sm sm:text-base truncate">
                      {event.organizer.firstName} {event.organizer.lastName}
                    </p>
                    <p className="text-xs sm:text-sm text-blue-600">Lihat Profil</p>
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
