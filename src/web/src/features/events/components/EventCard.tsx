import { Calendar, MapPin, Users, Ticket } from 'lucide-react'
import { Event } from '../api/eventApi'

interface EventCardProps {
  event: Event
  onClick?: () => void
}

export function EventCard({ event, onClick }: EventCardProps) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
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

  return (
    <div
      onClick={onClick}
      className="bg-white rounded-lg shadow-md overflow-hidden cursor-pointer hover:shadow-lg transition-shadow duration-200"
    >
      {/* Image */}
      <div className="h-48 bg-gray-200 relative">
        {event.imageUrl ? (
          <img
            src={event.imageUrl}
            alt={event.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-400 to-purple-500">
            <span className="text-white text-lg font-semibold">{event.title[0]}</span>
          </div>
        )}
        {/* Category Badge */}
        <span className="absolute top-3 left-3 bg-white/90 px-3 py-1 rounded-full text-xs font-medium text-gray-700">
          {event.category}
        </span>
        {/* Price Badge */}
        <span className="absolute top-3 right-3 bg-green-500 text-white px-3 py-1 rounded-full text-xs font-medium">
          {formatPrice(event.price)}
        </span>
      </div>

      {/* Content */}
      <div className="p-4">
        <h3 className="text-lg font-semibold text-gray-900 line-clamp-2 mb-2">
          {event.title}
        </h3>

        <div className="space-y-2 text-sm text-gray-600">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            <span>{formatDate(event.startDate)}</span>
          </div>
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4" />
            <span className="line-clamp-1">{event.location}</span>
          </div>
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4" />
            <span>{event.availableSeats} kursi tersedia</span>
          </div>
          <div className="flex items-center gap-2">
            <Ticket className="w-4 h-4" />
            <span>{event._count.transactions} terjual</span>
          </div>
        </div>

        {/* Organizer */}
        <div className="mt-4 pt-4 border-t border-gray-100 flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center text-sm font-medium text-gray-600">
            {event.organizer.firstName[0]}
          </div>
          <span className="text-sm text-gray-700">
            {event.organizer.firstName} {event.organizer.lastName}
          </span>
        </div>
      </div>
    </div>
  )
}
