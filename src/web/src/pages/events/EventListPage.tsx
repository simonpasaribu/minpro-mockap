import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { eventApi, Event, EventFilters } from '../../features/events/api/eventApi'
import { EventCard } from '../../features/events/components/EventCard'
import { Loader2, Grid3X3, List, ChevronLeft, ChevronRight } from 'lucide-react'

export default function EventListPage() {
  const navigate = useNavigate()
  const [events, setEvents] = useState<Event[]>([])
  const [categories, setCategories] = useState<string[]>([])
  const [filters, setFilters] = useState<EventFilters>({})
  const [searchInput, setSearchInput] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [currentPage, setCurrentPage] = useState(1)
  const eventsPerPage = 12

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setFilters(prev => {
        const newSearch = searchInput || undefined
        // Only update if search value actually changed
        if (prev.search === newSearch) return prev
        return { ...prev, search: newSearch }
      })
    }, 300)

    return () => clearTimeout(timer)
  }, [searchInput])

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [])

  // Fetch events and categories
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        const [eventsResponse, categoriesResponse] = await Promise.all([
          eventApi.getEvents(filters),
          eventApi.getCategories()
        ])
        setEvents(eventsResponse.data || eventsResponse)
        setCategories(categoriesResponse.data || categoriesResponse || [])
        setError(null)
        setCurrentPage(1)
      } catch (err) {
        setError('Failed to load events')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [filters])

  const handleEventClick = (slug: string) => {
    navigate(`/events/${slug}`)
  }

  const handleSearch = (searchFilters: EventFilters) => {
    setFilters(searchFilters)
  }

  const handleCategoryChange = (category: string) => {
    setFilters(prev => ({
      ...prev,
      category: category === 'all' ? undefined : category
    }))
  }

  // Pagination
  const totalPages = Math.ceil(events.length / eventsPerPage)
  const paginatedEvents = events.slice(
    (currentPage - 1) * eventsPerPage,
    currentPage * eventsPerPage
  )

  return (
    <main className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 pt-20">
      {/* Search & Filter Section - Ergonomic Design */}
      <section className="mx-auto max-w-7xl px-3 sm:px-6 py-3 sm:py-6">
        {/* Scrollbar Hide CSS for mobile filter scroll */}
        <style>{`
          .scrollbar-hide::-webkit-scrollbar {
            display: none;
          }
          .scrollbar-hide {
            -ms-overflow-style: none;
            scrollbar-width: none;
          }
        `}</style>
        {/* Main Search Bar */}
        <div className="relative mb-3 sm:mb-4">
          <div className="absolute inset-y-0 left-0 pl-3 sm:pl-4 flex items-center pointer-events-none">
            <svg className="h-4 w-4 sm:h-5 sm:w-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <input
            type="text"
            placeholder="Cari event..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="block w-full pl-9 sm:pl-11 pr-4 py-2.5 sm:py-3.5 bg-white border border-slate-200 rounded-xl text-sm sm:text-base text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent shadow-sm transition-all"
          />
          {searchInput && (
            <button
              onClick={() => {
                setSearchInput('')
                setFilters(prev => ({ ...prev, search: undefined }))
              }}
              className="absolute inset-y-0 right-0 pr-3 sm:pr-4 flex items-center text-slate-400 hover:text-slate-600"
            >
              <svg className="h-4 w-4 sm:h-5 sm:w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>

        {/* Quick Filters Bar - Mobile: Horizontal Scroll, Desktop: Flex Wrap */}
        <div className="flex sm:flex-wrap items-center gap-2 mb-3 sm:mb-4 overflow-x-auto pb-1 sm:pb-0 scrollbar-hide -mx-3 px-3 sm:mx-0 sm:px-0">
          {/* Price Quick Filter */}
          <button
            onClick={() => handleSearch({ ...filters, isFree: filters.isFree ? undefined : true })}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
              filters.isFree
                ? 'bg-green-100 text-green-700 border border-green-200'
                : 'bg-white text-slate-600 border border-slate-200 hover:border-slate-300'
            }`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Gratis
          </button>

          <div className="w-px h-6 bg-slate-200 mx-1" />

          {/* Category Quick Filters */}
          <button
            onClick={() => handleCategoryChange('all')}
            className={`flex-shrink-0 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
              !filters.category
                ? 'bg-indigo-600 text-white'
                : 'bg-white text-slate-600 border border-slate-200 hover:border-slate-300'
            }`}
          >
            Semua
          </button>
          {Array.isArray(categories) && categories.map((category) => (
            <button
              key={category}
              onClick={() => handleCategoryChange(category)}
              className={`flex-shrink-0 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                filters.category === category
                  ? 'bg-indigo-600 text-white'
                  : 'bg-white text-slate-600 border border-slate-200 hover:border-slate-300'
              }`}
            >
              {category}
            </button>
          ))}

          {/* Clear Filters */}
          {(filters.search || filters.category || filters.isFree) && (
            <>
              <div className="w-px h-6 bg-slate-200 mx-1" />
              <button
                onClick={() => {
                  setFilters({})
                  handleSearch({})
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 transition-all"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                Reset
              </button>
            </>
          )}
        </div>

        {/* Active Filters Tags */}
        {(filters.search || filters.category || filters.isFree) && (
          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 mb-3 sm:mb-4">
            <span className="text-xs text-slate-500 whitespace-nowrap">Filter:</span>
            {searchInput && (
              <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-slate-100 text-slate-700 text-xs">
                "{searchInput}"
                <button onClick={() => {
                  setSearchInput('')
                  setFilters(prev => ({ ...prev, search: undefined }))
                }} className="hover:text-slate-900">
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </span>
            )}
            {filters.category && (
              <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-indigo-100 text-indigo-700 text-xs">
                {filters.category}
                <button onClick={() => handleCategoryChange('all')} className="hover:text-indigo-900">
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </span>
            )}
            {filters.isFree && (
              <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-green-100 text-green-700 text-xs">
                Gratis
                <button onClick={() => handleSearch({ ...filters, isFree: undefined })} className="hover:text-green-900">
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </span>
            )}
          </div>
        )}

        {/* Results Header with View Toggle */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 mb-4 sm:mb-6">
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-slate-900">
              {loading ? 'Memuat event...' : `${events.length} Event Tersedia`}
            </h2>
          </div>

          {/* View Mode Toggle */}
          <div className="flex items-center gap-1 bg-white rounded-lg shadow-sm border border-slate-200 p-1">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-md transition ${
                viewMode === 'grid'
                  ? 'bg-indigo-100 text-indigo-600'
                  : 'text-slate-400 hover:text-slate-600'
              }`}
              title="Grid view"
            >
              <Grid3X3 className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-md transition ${
                viewMode === 'list'
                  ? 'bg-indigo-100 text-indigo-600'
                  : 'text-slate-400 hover:text-slate-600'
              }`}
              title="List view"
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-16">
            <Loader2 className="w-10 h-10 animate-spin text-indigo-600 mb-4" />
            <p className="text-slate-500">Memuat event...</p>
          </div>
        )}

        {/* Error State */}
        {!loading && error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-8 text-center">
            <p className="text-red-600 font-medium">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
            >
              Coba Lagi
            </button>
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && events.length === 0 && (
          <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-12 text-center">
            <p className="text-lg font-medium text-slate-900 mb-2">
              Tidak ada event ditemukan
            </p>
            <p className="text-slate-500 mb-4">
              Coba ubah filter pencarian atau kategori
            </p>
            <button
              onClick={() => setFilters({})}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
            >
              Reset Filter
            </button>
          </div>
        )}

        {/* Events Grid/List */}
        {!loading && !error && events.length > 0 && (
          <>
            {viewMode === 'grid' ? (
              <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
                {paginatedEvents.map((event) => (
                  <EventCard
                    key={event.id}
                    event={event}
                    onClick={() => handleEventClick(event.slug)}
                  />
                ))}
              </div>
            ) : (
              <div className="flex flex-col gap-3 sm:gap-4">
                {paginatedEvents.map((event) => (
                  <div
                    key={event.id}
                    onClick={() => handleEventClick(event.slug)}
                    className="flex gap-3 sm:gap-4 p-3 sm:p-4 bg-white rounded-xl shadow-sm border border-slate-200 hover:shadow-md hover:border-indigo-200 active:scale-[0.995] transition cursor-pointer group"
                  >
                    {/* Image - Larger on desktop */}
                    <div className="w-20 h-20 sm:w-28 sm:h-20 lg:w-32 lg:h-24 flex-shrink-0">
                      <img
                        src={event.imageUrl || '/default-event.jpg'}
                        alt={event.title}
                        className="w-full h-full object-cover rounded-lg"
                        loading="lazy"
                      />
                    </div>

                    {/* Content - Flex layout for better space usage */}
                    <div className="flex-1 min-w-0 flex flex-col justify-between">
                      {/* Top: Title and Category Badge */}
                      <div className="min-w-0">
                        <div className="flex items-start gap-2 mb-1">
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-600 flex-shrink-0">
                            {event.category}
                          </span>
                          {event.price === 0 && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-700 flex-shrink-0">
                              Gratis
                            </span>
                          )}
                        </div>
                        <h3 className="font-bold text-slate-900 text-sm sm:text-base leading-tight line-clamp-2 group-hover:text-indigo-600 transition">
                          {event.title}
                        </h3>
                      </div>

                      {/* Bottom: Date, Location, Price */}
                      <div className="flex items-end justify-between gap-2 mt-1">
                        <div className="flex flex-col sm:flex-row sm:items-center gap-0.5 sm:gap-3 text-xs text-slate-500">
                          <span className="flex items-center gap-1">
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            {new Date(event.startDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                          </span>
                          {event.location && (
                            <span className="hidden sm:flex items-center gap-1 truncate max-w-[150px]">
                              <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                              </svg>
                              <span className="truncate">{event.location}</span>
                            </span>
                          )}
                        </div>

                        {/* Price - Right aligned */}
                        <p className="text-sm sm:text-base font-bold text-indigo-600 flex-shrink-0 tabular-nums">
                          {event.price === 0 ? 'Gratis' : new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(event.price)}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Pagination with Info */}
            {events.length > 0 && (
              <div className="mt-6 sm:mt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
                {/* Results Info - Left */}
                <p className="text-xs sm:text-sm text-slate-500">
                  Menampilkan {(currentPage - 1) * eventsPerPage + 1} - {Math.min(currentPage * eventsPerPage, events.length)} dari {events.length} event
                </p>

                {/* Pagination - Right */}
                <div className="flex items-center gap-1 sm:gap-2">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                    className="p-2 rounded-full border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>

                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => {
                    // Show limited page numbers on mobile
                    const showPage = totalPages <= 5 ||
                      page === 1 ||
                      page === totalPages ||
                      (page >= currentPage - 1 && page <= currentPage + 1)

                    if (!showPage) return null

                    return (
                      <button
                        key={page}
                        onClick={() => setCurrentPage(page)}
                        className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full font-medium text-sm sm:text-base transition ${
                          currentPage === page
                            ? 'bg-indigo-600 text-white'
                            : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        {page}
                      </button>
                    )
                  })}

                  <button
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                    className="p-2 rounded-full border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </section>
    </main>
  )
}
