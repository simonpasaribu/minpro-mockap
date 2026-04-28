import { useState, useEffect } from 'react'
import { useNavigate, useParams, useLocation } from 'react-router-dom'
import { ArrowLeft, MessageSquare, Star, Send } from 'lucide-react'
import axios from 'axios'
import { useAuth } from '../../features/auth/components/AuthContext'

const API_URL = (import.meta as any).env?.VITE_API_URL || 'http://localhost:8000/api'

const api = axios.create({
  baseURL: API_URL,
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

interface Review {
  id: number
  rating: number
  comment: string | null
  response: string | null
  respondedAt: string | null
  createdAt: string
  user: {
    id: number
    firstName: string
    lastName: string
    profilePicture: string | null
  }
}

interface EventData {
  id: number
  title: string
  organizerId: number
  organizerName: string
  organizerFirstName?: string
  organizerLastName?: string
}

export default function EventReviewsPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { slug } = useParams<{ slug: string }>()
  const { user } = useAuth()
  
  const [reviews, setReviews] = useState<Review[]>([])
  const [loading, setLoading] = useState(true)
  const [eventTitle, setEventTitle] = useState('')
  const [avgRating, setAvgRating] = useState(0)
  const [eventData, setEventData] = useState<EventData | null>(null)
  const [respondingTo, setRespondingTo] = useState<number | null>(null)
  const [responseText, setResponseText] = useState('')

  // Determine if current user is the event owner
  // Convert both to number for comparison since organizerId can be string from API
  const isOwner = user?.role === 'ORGANIZER' && Number(eventData?.organizerId) === Number(user?.id)
  
  // Debug logging
  useEffect(() => {
    console.log('isOwner check:', {
      userRole: user?.role,
      userId: user?.id,
      eventOrganizerId: eventData?.organizerId,
      isOwner
    })
  }, [user, eventData, isOwner])

  useEffect(() => {
    fetchReviews()
  }, [slug])

  const fetchReviews = async () => {
    try {
      setLoading(true)
      const response = await api.get(`/reviews/event/by-slug/${slug}`)
      console.log('API Response:', response.data)
      console.log('User:', user)
      
      setReviews(response.data.data.reviews || [])
      setEventTitle(response.data.data.eventTitle || 'Event')
      
      // Set event data for ownership check
      // Try to get from event object first, fallback to first review's event data
      let eventInfo = response.data.data.event
      const reviews = response.data.data.reviews || []
      
      // If event is null but reviews exist, get organizerId from first review
      if (!eventInfo && reviews.length > 0 && reviews[0].event) {
        eventInfo = reviews[0].event
      }
      
      if (eventInfo && eventInfo.organizerId) {
        setEventData({
          id: eventInfo.id,
          title: response.data.data.eventTitle || 'Event',
          organizerId: eventInfo.organizerId,
          organizerName: eventInfo.organizerName || '',
          organizerFirstName: eventInfo.organizerFirstName,
          organizerLastName: eventInfo.organizerLastName,
        })
        console.log('Event Data set:', eventInfo)
      } else {
        console.log('Could not find organizerId. eventInfo:', eventInfo, 'reviews[0]:', reviews[0])
      }
      
      // Calculate average rating
      if (reviews.length > 0) {
        const total = reviews.reduce((sum: number, r: Review) => sum + r.rating, 0)
        setAvgRating(total / reviews.length)
      }
    } catch (error) {
      console.error('Failed to fetch reviews:', error)
    } finally {
      setLoading(false)
    }
  }

  const submitResponse = async (reviewId: number) => {
    if (!responseText.trim()) return

    try {
      await api.post(`/reviews/${reviewId}/respond`, { response: responseText })
      setResponseText('')
      setRespondingTo(null)
      fetchReviews()
    } catch (error) {
      console.error('Failed to submit response:', error)
    }
  }

  // Handle back navigation with state
  const handleBack = () => {
    if (location.state?.from) {
      navigate(location.state.from)
    } else {
      navigate(`/events/${slug}`)
    }
  }

  // Get reply label based on ownership
  const getReplyLabel = () => {
    console.log('getReplyLabel called, isOwner:', isOwner)
    if (isOwner) {
      return 'Anda'
    }
    // Use organizer name if available with proper capitalization
    if (eventData?.organizerFirstName && eventData?.organizerLastName) {
      const firstName = eventData.organizerFirstName.charAt(0).toUpperCase() + eventData.organizerFirstName.slice(1).toLowerCase()
      const lastName = eventData.organizerLastName.charAt(0).toUpperCase() + eventData.organizerLastName.slice(1).toLowerCase()
      return `${firstName} ${lastName}`
    }
    if (eventData?.organizerName) {
      // Capitalize each word
      return eventData.organizerName
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(' ')
    }
    return 'Balasan Organizer'
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    })
  }

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName?.[0] || ''}${lastName?.[0] || ''}`.toUpperCase()
  }

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`w-4 h-4 ${i < rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`}
      />
    ))
  }

  return (
    <div className="min-h-screen bg-[#faf4ff] pb-16 sm:pb-20 pt-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pb-8 sm:pb-12">
        {/* Back Button */}
        <button
          onClick={handleBack}
          className="flex items-center gap-2 px-3 py-2 sm:px-4 sm:py-2.5 rounded-full bg-[#e2d7ff] text-[#4e339c] font-semibold hover:bg-[#d8caff] transition-colors mb-4 sm:mb-6 text-sm sm:text-base"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="hidden sm:inline">Kembali</span>
        </button>

        {/* Page Title */}
        <div className="mb-6 sm:mb-8">
          <h1 className="text-xl sm:text-2xl font-bold text-[#32294f] mb-1 sm:mb-2">Semua Ulasan</h1>
          <p className="text-xs sm:text-sm text-[#5f557f]">{eventTitle}</p>
          {avgRating > 0 && (
            <div className="flex items-center gap-2 mt-2">
              <div className="flex gap-0.5">
                {renderStars(Math.round(avgRating))}
              </div>
              <span className="text-sm font-medium text-[#32294f]">
                {avgRating.toFixed(1)} ({reviews.length} ulasan)
              </span>
            </div>
          )}
        </div>

        {/* Reviews List */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#4a3fe2]"></div>
          </div>
        ) : reviews.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[#faf4ff] flex items-center justify-center">
              <MessageSquare className="w-8 h-8 text-[#4a3fe2]" />
            </div>
            <h3 className="text-lg font-bold text-[#32294f] mb-2">Belum ada ulasan</h3>
            <p className="text-sm text-[#5f557f]">Event ini belum mendapatkan ulasan dari peserta</p>
          </div>
        ) : (
          <div className="space-y-6">
            {reviews.map((review) => (
              <div key={review.id} className="bg-white rounded-2xl p-6 shadow-sm border border-[#e2d7ff]">
                {/* Review Header */}
                <div className="flex items-start gap-4 mb-4">
                  <div className="w-12 h-12 rounded-full bg-[#4a3fe2]/10 flex items-center justify-center text-sm font-bold text-[#4a3fe2] flex-shrink-0">
                    {review.user.profilePicture ? (
                      <img
                        src={review.user.profilePicture}
                        alt={review.user.firstName}
                        className="w-full h-full rounded-full object-cover"
                      />
                    ) : (
                      getInitials(review.user.firstName, review.user.lastName)
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-bold text-[#32294f]">
                        {review.user.firstName} {review.user.lastName}
                      </h3>
                      <div className="flex gap-0.5">
                        {renderStars(review.rating)}
                      </div>
                    </div>
                    <p className="text-xs text-[#5f557f]">{formatDate(review.createdAt)}</p>
                  </div>
                </div>

                {/* Review Comment */}
                {review.comment && (
                  <p className="text-sm text-[#32294f] mb-4 leading-relaxed">{review.comment}</p>
                )}

                {/* Organizer Response */}
                {review.response ? (
                  <div className="bg-[#f5eeff] rounded-xl p-4 mt-4">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xs font-bold text-[#4a3fe2] tracking-wider">
                        {getReplyLabel()}
                      </span>
                      <span className="text-xs text-[#5f557f]">
                        {review.respondedAt && formatDate(review.respondedAt)}
                      </span>
                    </div>
                    <p className="text-sm text-[#32294f]">{review.response}</p>
                  </div>
                ) : (
                  /* Form Balasan - Hanya untuk pemilik event */
                  isOwner && (
                    respondingTo === review.id ? (
                      <div className="mt-4">
                        <div className="relative">
                          <textarea
                            value={responseText}
                            onChange={(e) => setResponseText(e.target.value)}
                            placeholder="Tulis balasan Anda..."
                            className="w-full px-4 py-3 pr-12 rounded-xl border border-[#e2d7ff] focus:border-[#4a3fe2] focus:ring-2 focus:ring-[#4a3fe2]/20 outline-none transition-all resize-none"
                            rows={3}
                          />
                          <button
                            onClick={() => submitResponse(review.id)}
                            disabled={!responseText.trim()}
                            className="absolute right-3 bottom-3 w-8 h-8 rounded-full bg-[#4a3fe2] text-white flex items-center justify-center hover:bg-[#3d2fd6] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <Send className="w-4 h-4" />
                          </button>
                        </div>
                        <button
                          onClick={() => {
                            setRespondingTo(null)
                            setResponseText('')
                          }}
                          className="mt-2 text-xs text-[#5f557f] hover:text-[#32294f] transition-colors"
                        >
                          Batal
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setRespondingTo(review.id)}
                        className="mt-4 text-sm font-bold text-[#4a3fe2] hover:underline underline-offset-4"
                      >
                        Balas Ulasan
                      </button>
                    )
                  )
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
