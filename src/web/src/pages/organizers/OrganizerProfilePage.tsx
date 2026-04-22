import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { eventApi } from '../../features/events/api/eventApi'
import { User, Calendar, MapPin, Star, ArrowLeft, Ticket } from 'lucide-react'

interface Organizer {
  id: number
  firstName: string
  lastName: string
  profilePicture: string | null
  email: string
  phone: string | null
  events: {
    id: number
    title: string
    imageUrl: string | null
    startDate: string
    location: string
    price: number
    _count: {
      transactions: number
      reviews: number
    }
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
    event: {
      title: string
    }
  }[]
  avgRating: number
  totalReviews: number
}

export default function OrganizerProfilePage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [organizer, setOrganizer] = useState<Organizer | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'events' | 'reviews'>('events')

  useEffect(() => {
    const fetchOrganizer = async () => {
      if (!id) return
      try {
        setLoading(true)
        const response = await eventApi.getOrganizerProfile(parseInt(id))
        setOrganizer(response.data)
      } catch (err) {
        setError('Organizer tidak ditemukan')
      } finally {
        setLoading(false)
      }
    }

    fetchOrganizer()
  }, [id])

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

  if (error || !organizer) {
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
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Kembali</span>
          </button>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Organizer Info Card */}
        <div className="bg-white rounded-lg shadow-md p-8 mb-8">
          <div className="flex flex-col md:flex-row items-center gap-6">
            {/* Avatar */}
            <div className="w-32 h-32 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center">
              {organizer.profilePicture ? (
                <img
                  src={organizer.profilePicture}
                  alt={`${organizer.firstName} ${organizer.lastName}`}
                  className="w-full h-full rounded-full object-cover"
                />
              ) : (
                <User className="w-16 h-16 text-white" />
              )}
            </div>

            {/* Info */}
            <div className="text-center md:text-left flex-1">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                {organizer.firstName} {organizer.lastName}
              </h1>

              {/* Rating */}
              <div className="flex items-center justify-center md:justify-start gap-2 mb-4">
                <div className="flex items-center gap-1 bg-yellow-100 px-3 py-1 rounded-full">
                  <Star className="w-5 h-5 text-yellow-600 fill-yellow-600" />
                  <span className="font-semibold text-yellow-800">
                    {organizer.avgRating}
                  </span>
                </div>
                <span className="text-gray-500">
                  ({organizer.totalReviews} ulasan)
                </span>
              </div>

              {/* Contact */}
              <div className="space-y-1 text-gray-600">
                <p>{organizer.email}</p>
                {organizer.phone && <p>{organizer.phone}</p>}
              </div>
            </div>

            {/* Stats */}
            <div className="flex gap-8">
              <div className="text-center">
                <p className="text-3xl font-bold text-gray-900">
                  {organizer.events.length}
                </p>
                <p className="text-gray-500">Event</p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-bold text-gray-900">
                  {organizer.totalReviews}
                </p>
                <p className="text-gray-500">Ulasan</p>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-4 mb-6">
          <button
            onClick={() => setActiveTab('events')}
            className={`px-6 py-3 rounded-lg font-semibold ${
              activeTab === 'events'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
          >
            Event ({organizer.events.length})
          </button>
          <button
            onClick={() => setActiveTab('reviews')}
            className={`px-6 py-3 rounded-lg font-semibold ${
              activeTab === 'reviews'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
          >
            Ulasan ({organizer.totalReviews})
          </button>
        </div>

        {/* Content */}
        {activeTab === 'events' ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {organizer.events.map((event) => (
              <div
                key={event.id}
                onClick={() => navigate(`/events/${event.id}`)}
                className="bg-white rounded-lg shadow-md overflow-hidden cursor-pointer hover:shadow-lg transition-shadow"
              >
                {event.imageUrl ? (
                  <img
                    src={event.imageUrl}
                    alt={event.title}
                    className="w-full h-48 object-cover"
                  />
                ) : (
                  <div className="w-full h-48 bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center">
                    <span className="text-white text-2xl font-bold">{event.title[0]}</span>
                  </div>
                )}
                <div className="p-4">
                  <h3 className="font-semibold text-lg mb-2 line-clamp-1">{event.title}</h3>
                  <div className="space-y-1 text-sm text-gray-600">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      <span>{new Date(event.startDate).toLocaleDateString('id-ID')}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4" />
                      <span className="line-clamp-1">{event.location}</span>
                    </div>
                  </div>
                  <div className="mt-4 flex items-center justify-between">
                    <span className="font-semibold text-blue-600">
                      {formatPrice(event.price)}
                    </span>
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <span className="flex items-center gap-1">
                        <Ticket className="w-4 h-4" />
                        {event._count.transactions}
                      </span>
                      <span className="flex items-center gap-1">
                        <Star className="w-4 h-4" />
                        {event._count.reviews}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            {organizer.reviews.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-lg">
                <p className="text-gray-500">Belum ada ulasan</p>
              </div>
            ) : (
              organizer.reviews.map((review) => (
                <div key={review.id} className="bg-white rounded-lg shadow-md p-6">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-full bg-gray-300 flex items-center justify-center">
                      <User className="w-6 h-6 text-gray-600" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <p className="font-semibold">
                            {review.user.firstName} {review.user.lastName}
                          </p>
                          <p className="text-sm text-gray-500">
                            untuk event: {review.event.title}
                          </p>
                        </div>
                        <span className="text-sm text-gray-500">
                          {new Date(review.createdAt).toLocaleDateString('id-ID')}
                        </span>
                      </div>
                      <div className="flex items-center gap-1 mb-2">
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
                      {review.comment && (
                        <p className="text-gray-600">{review.comment}</p>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  )
}
