import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { eventApi, Event, EventFilters } from '../../features/events/api/eventApi'
import { EventCard } from '../../features/events/components/EventCard'
import { EventSearch } from '../../features/events/components/EventSearch'
import { Loader2 } from 'lucide-react'

export default function LandingPage() {
  const navigate = useNavigate()
  const [events, setEvents] = useState<Event[]>([])
  const [categories, setCategories] = useState<string[]>([])
  const [filters, setFilters] = useState<EventFilters>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Fetch events - Nomor 1-A: Landing Page & Event Browsing
  useEffect(() => {
    const fetchEvents = async () => {
      try {
        setLoading(true)
        const response = await eventApi.getEvents(filters)
        setEvents(response.data)
        setError(null)
      } catch (err) {
        setError('Failed to load events')
      } finally {
        setLoading(false)
      }
    }

    fetchEvents()
  }, [filters])

  // Fetch categories on mount
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await eventApi.getCategories()
        setCategories(response.data)
      } catch (err) {
        console.error('Failed to load categories')
      }
    }

    fetchCategories()
  }, [])

  const handleEventClick = (eventId: number) => {
    navigate(`/events/${eventId}`)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">EventHub</h1>
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/login')}
              className="text-gray-600 hover:text-gray-900"
            >
              Login
            </button>
            <button
              onClick={() => navigate('/register')}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
            >
              Daftar
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold mb-4">
            Temukan Event Menarik
          </h2>
          <p className="text-xl opacity-90">
            Jelajahi berbagai event seru dan daftar sekarang!
          </p>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <EventSearch
          filters={filters}
          categories={categories}
          onFilterChange={setFilters}
        />
      </div>

      {/* Events Grid - Responsive Grid Layout */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <p className="text-red-600">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="mt-4 text-blue-600 hover:underline"
            >
              Coba lagi
            </button>
          </div>
        ) : events.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500">Tidak ada event yang ditemukan</p>
          </div>
        ) : (
          <>
            <p className="text-gray-600 mb-4">
              Menampilkan {events.length} event
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {events.map((event) => (
                <EventCard
                  key={event.id}
                  event={event}
                  onClick={() => handleEventClick(event.id)}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
