import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../features/auth/components/AuthContext'
import { eventApi, Event } from '../../features/events/api/eventApi'

interface Stats {
  totalEvents: number
  ticketBooks: number
  activeOrganizers: number
}

// Format date helper
const formatDate = (dateString: string) => {
  const date = new Date(dateString)
  return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
}

export default function LandingPage() {
  const { user } = useAuth()
  const [events, setEvents] = useState<Event[]>([])
  const [popularEvents, setPopularEvents] = useState<Event[]>([])
  const [stats, setStats] = useState<Stats | null>(null)

  // Fetch events on mount
  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const [eventsRes, popularRes] = await Promise.all([
          eventApi.getEvents({}),
          eventApi.getPopularEvents(6)
        ])
        setEvents(eventsRes.data || eventsRes)
        setPopularEvents(popularRes.data || popularRes)
      } catch (err) {
        console.error('Failed to load events:', err)
      }
    }
    fetchEvents()
  }, [])

  // Fetch stats on mount
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await eventApi.getPublicStats()
        setStats(response.data || response)
      } catch (err) {
        console.error('Failed to load stats:', err)
      }
    }

    fetchStats()
  }, [])

  // Compute newest events at component level
  const newestEvents = getNewestEvents(events)

  // Carousel 1 for 6 popular events with navigation arrows + auto-scroll
  function PopularEventsCarousel() {
    const [activeIndex, setActiveIndex] = useState(0)
    const [visibleCount, setVisibleCount] = useState(3)
    const sectionEvents = popularEvents.slice(0, 6)

    // Update visible count based on screen size
    useEffect(() => {
      const updateVisibleCount = () => {
        if (window.innerWidth < 640) {
          setVisibleCount(1)
        } else if (window.innerWidth < 1024) {
          setVisibleCount(2)
        } else {
          setVisibleCount(3)
        }
      }

      updateVisibleCount()
      window.addEventListener('resize', updateVisibleCount)
      return () => window.removeEventListener('resize', updateVisibleCount)
    }, [])

    // Auto-scroll every 3 seconds
    useEffect(() => {
      if (sectionEvents.length <= visibleCount) return

      const interval = setInterval(() => {
        setActiveIndex((prev) => (prev + 1) % (sectionEvents.length - visibleCount + 1))
      }, 3000)

      return () => clearInterval(interval)
    }, [sectionEvents.length, visibleCount])

    const getVisibleEvents = () => {
      return sectionEvents.slice(activeIndex, activeIndex + visibleCount)
    }

    const handlePrev = () => {
      setActiveIndex((prev) => Math.max(0, prev - 1))
    }

    const handleNext = () => {
      setActiveIndex((prev) => Math.min(sectionEvents.length - visibleCount, prev + 1))
    }

    return (
      <>
        <div className="mt-8 grid gap-4 sm:gap-6 md:gap-10 md:grid-cols-2 xl:grid-cols-3 transition-all duration-500 ease-in-out">
          {getVisibleEvents().map((event) => (
            <Link
              key={event.id}
              to={`/events/${event.slug}`}
              className="group block overflow-hidden rounded-xl shadow-sm hover:shadow-xl transition-all cursor-pointer"
            >
              <div className="relative aspect-[4/5] overflow-hidden rounded-xl">
                <img
                  src={event.imageUrl || 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=800&q=80'}
                  alt={event.title}
                  className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement
                    target.src = 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=800&q=80'
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex flex-col justify-end p-8">
                  <h3 className="text-2xl font-bold text-white mb-2">{event.title}</h3>
                  <p className="text-white/90 text-sm mb-1">{formatDate(event.startDate)}</p>
                  <p className="text-white/70 text-sm">{event.location}</p>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* Navigation Arrows + Dots */}
        <div className="mt-6 sm:mt-10 flex items-center justify-between">
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handlePrev}
              disabled={activeIndex === 0}
              className="p-3 sm:p-4 rounded-full bg-[#e8deff] hover:bg-[#d8caff] transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              aria-label="Previous events"
            >
              <svg className="w-5 h-5 sm:w-6 sm:h-6 text-[#32294f]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <button
              type="button"
              onClick={handleNext}
              disabled={activeIndex >= sectionEvents.length - visibleCount}
              className="p-3 sm:p-4 rounded-full bg-[#e8deff] hover:bg-[#d8caff] transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              aria-label="Next events"
            >
              <svg className="w-5 h-5 sm:w-6 sm:h-6 text-[#32294f]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>

          {sectionEvents.length > visibleCount && (
            <div className="flex items-center justify-center gap-2 sm:gap-3">
              {sectionEvents.map((event, index) => (
                <button
                  key={event.id}
                  type="button"
                  aria-label={`Go to carousel page ${index + 1}`}
                  onClick={() => setActiveIndex(index)}
                  className={`h-1.5 rounded-full transition-all ${
                    index === activeIndex
                      ? 'w-8 sm:w-12 bg-[#4a3fe2]'
                      : 'w-1.5 bg-[#b2a6d5] opacity-40'
                  }`}
                />
              ))}
            </div>
          )}
        </div>
      </>
    )
  }

  // Newest Events Grid (replaces carousel)
  function NewestEventsGrid() {
    const sectionEvents = newestEvents.slice(0, 6)

    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
        {sectionEvents.map((event) => (
          <Link
            key={event.id}
            to={`/events/${event.slug}`}
            className="group"
          >
            <div className="relative h-64 mb-6 rounded-xl overflow-hidden">
              <img
                src={event.imageUrl || 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=800&q=80'}
                alt={event.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                onError={(e) => {
                  const target = e.target as HTMLImageElement
                  target.src = 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=800&q=80'
                }}
              />
            </div>
            <div className="space-y-2">
              {/* Event Title */}
              <h4 className="text-lg font-bold text-[#32294f] leading-tight group-hover:text-[#4a3fe2] transition-colors line-clamp-2">
                {event.title}
              </h4>
              
              {/* Date */}
              <div className="flex items-center gap-1.5 text-xs text-[#5f557f]">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span className="font-medium">{new Date(event.startDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}</span>
              </div>
              
              {/* Location */}
              {event.location && (
                <div className="flex items-center gap-1 text-xs text-[#5f557f]">
                  <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <span className="truncate">{event.location}</span>
                </div>
              )}
              
              {/* Price */}
              <span className={`text-sm font-bold ${event.price === 0 ? 'text-green-600' : 'text-[#4a3fe2]'}`}>
                {event.price === 0 ? 'Gratis' : new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(event.price)}
              </span>
            </div>
          </Link>
        ))}
      </div>
    )
  }

  return (
    <main className="bg-[#faf4ff] pb-20">
      {/* ================================
          HERO SECTION - Split Layout
         ================================ */}
      <section className="min-h-screen flex flex-col md:flex-row overflow-hidden">
        {/* LEFT - Purple Side with Image */}
        <div className="relative w-full md:w-[45%] h-[300px] md:h-auto overflow-hidden">
          <img
            alt="Learning background"
            className="absolute inset-0 w-full h-full object-cover"
            src="https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1800&q=80"
          />
          <div className="absolute inset-0 bg-gradient-to-br from-[#4a3fe2]/90 to-[#3d2fd6]/70 flex flex-col justify-end p-6 md:p-12 text-white">
            <span className="text-[10px] md:text-xs font-bold tracking-[0.2em] uppercase mb-2 md:mb-4 opacity-80">Pengetahuan Redefinisi</span>
            <h2 className="text-2xl md:text-5xl font-black leading-tight tracking-tighter mb-4 md:mb-6">
              Belajar tanpa batas, berkembang tanpa batasan.
            </h2>
          </div>
        </div>

        {/* RIGHT - Content Side */}
        <div className="w-full md:w-[55%] flex items-center bg-[#faf4ff] px-6 py-12 md:px-8 md:py-16 md:p-24">
          <div className="max-w-xl mx-auto md:mx-0">
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-7xl font-black text-[#32294f] leading-[1.1] md:leading-[1] tracking-[-0.04em] mb-6 md:mb-8">
              Masa depan pembelajaran <span className="text-[#4a3fe2] italic">editorial</span>.
            </h1>
            <p className="text-base md:text-xl text-[#5f557f] leading-relaxed mb-8 md:mb-12 max-w-lg">
              Bergabunglah dengan komunitas eksklusif kreator dan pemimpin industri. Akses workshop kurasi dan event berdampak tinggi yang dirancang untuk pertumbuhan profesional.
            </p>
            <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-4 mb-10 md:mb-16">
              <Link
                to="/events"
                className="w-full sm:w-auto px-8 py-4 md:px-10 md:py-5 bg-[#4a3fe2] text-white rounded-full font-extrabold shadow-xl shadow-[#4a3fe2]/30 hover:translate-y-[-2px] transition-all text-center text-sm md:text-base"
              >
                Jelajahi Event
              </Link>
              <Link
                to={user ? '/profile' : '/register'}
                className="w-full sm:w-auto px-8 py-4 md:px-10 md:py-5 bg-[#d8caff] text-[#4e339c] rounded-full font-extrabold hover:bg-[#cbbaff] transition-all text-center text-sm md:text-base"
              >
                {user ? 'Profil Saya' : 'Gabung Gratis'}
              </Link>
              {user?.role === 'ORGANIZER' && (
                <Link
                  to="/events/create"
                  className="px-4 py-3 md:px-6 md:py-4 text-[#4a3fe2] font-bold hover:underline underline-offset-4 transition-all text-sm md:text-base"
                >
                  Buat Event
                </Link>
              )}
            </div>

            {/* Stats */}
            <div className="flex items-center justify-between gap-4 md:gap-12 border-t border-[#e8deff] pt-8 md:pt-12">
              <div className="text-center md:text-left">
                <div className="text-3xl md:text-4xl font-black text-[#32294f] mb-1">{stats?.totalEvents ?? 0}+</div>
                <div className="text-[9px] md:text-[10px] font-bold uppercase tracking-[0.2em] text-[#5f557f]">Event Diselenggarakan</div>
              </div>
              <div className="hidden md:block w-px h-12 bg-[#e8deff]"></div>
              <div className="text-center md:text-left">
                <div className="text-3xl md:text-4xl font-black text-[#32294f] mb-1">{stats?.ticketBooks ?? 0}+</div>
                <div className="text-[9px] md:text-[10px] font-bold uppercase tracking-[0.2em] text-[#5f557f]">Tiket Terjual</div>
              </div>
              <div className="hidden md:block w-px h-12 bg-[#e8deff]"></div>
              <div className="text-center md:text-left">
                <div className="text-3xl md:text-4xl font-black text-[#32294f] mb-1">{stats?.activeOrganizers ?? 0}+</div>
                <div className="text-[9px] md:text-[10px] font-bold uppercase tracking-[0.2em] text-[#5f557f]">Penyelenggara</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ================================
          POPULAR EVENTS CAROUSEL
         ================================ */}
      <section className="bg-[#faf4ff] pt-8 sm:pt-16 pb-6 sm:pb-10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#4a3fe2]">
                Event Populer
              </p>
              <h2 className="mt-1 text-lg sm:text-xl md:text-2xl font-bold text-[#32294f]">
                Event dengan Peminat Terbanyak
              </h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-[#5f557f]">
                Events yang paling banyak diminati oleh peserta.
              </p>
            </div>
          </div>

          {popularEvents.length > 0 ? (
            <PopularEventsCarousel />
          ) : (
            <div className="mt-6 rounded-2xl border border-dashed border-[#d1d5db] bg-[#f5eeff]/50 p-8 text-center">
              <p className="text-base font-semibold text-[#32294f]">Belum ada event populer</p>
              <p className="mt-1 text-sm text-[#5f557f]">Event populer akan muncul di sini.</p>
            </div>
          )}
        </div>
      </section>

      {/* ================================
          NEWEST EVENTS GRID
         ================================ */}
      <section className="py-12 sm:py-24 bg-[#f5eeff]">
        <div className="max-w-7xl mx-auto px-4 sm:px-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 sm:gap-6 mb-8 sm:mb-16">
            <div>
              <h2 className="text-2xl sm:text-4xl md:text-6xl font-black tracking-tighter mb-2 sm:mb-4 text-[#32294f]">Rilis Terbaru</h2>
              <p className="text-sm sm:text-base text-[#5f557f] max-w-lg">Perspektif segar, sesi baru yang diumumkan, dan kelas eksklusif yang hadir di platform hari ini.</p>
            </div>
            <Link
              to="/events"
              className="text-[#4a3fe2] font-bold flex items-center gap-2 group text-sm sm:text-base"
            >
              Jelajahi semua event
              <svg className="w-4 h-4 sm:w-5 sm:h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </Link>
          </div>

          {newestEvents.length > 0 ? (
            <NewestEventsGrid />
          ) : (
            <div className="rounded-2xl border border-dashed border-[#d1d5db] bg-white/70 p-8 text-center shadow-sm">
              <p className="text-base font-semibold text-[#32294f]">Belum ada event baru</p>
              <p className="mt-1 text-sm text-[#5f557f]">Cek lagi nanti untuk update.</p>
            </div>
          )}
        </div>
      </section>

    </main>
  )
}

function getNewestEvents(events: Event[]) {
  return [...events]
    .sort(
      (firstEvent, secondEvent) =>
        new Date(secondEvent.createdAt).getTime() -
        new Date(firstEvent.createdAt).getTime()
    )
    .slice(0, 6)
}

