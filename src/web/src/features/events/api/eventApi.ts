import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api'

const api = axios.create({
  baseURL: API_URL,
})

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

export interface Event {
  id: number
  title: string
  description: string | null
  location: string
  category: string
  price: number
  totalSeats: number
  availableSeats: number
  startDate: string
  endDate: string | null
  registrationDeadline: string | null
  imageUrl: string | null
  isPublished: boolean
  createdAt: string
  updatedAt: string
  organizerId: number
  organizer: {
    id: number
    firstName: string
    lastName: string
    profilePicture: string | null
  }
  _count: {
    transactions: number
    reviews: number
  }
}

export interface EventFilters {
  category?: string
  location?: string
  search?: string
  isFree?: boolean
  startDate?: string
  endDate?: string
}

export const eventApi = {
  // Get all published events (public)
  getEvents: async (filters?: EventFilters) => {
    const params = new URLSearchParams()
    if (filters?.category) params.append('category', filters.category)
    if (filters?.location) params.append('location', filters.location)
    if (filters?.search) params.append('search', filters.search)
    if (filters?.isFree) params.append('isFree', 'true')
    if (filters?.startDate) params.append('startDate', filters.startDate)
    if (filters?.endDate) params.append('endDate', filters.endDate)

    const response = await api.get(`/events?${params.toString()}`)
    return response.data
  },

  // Get single event details (public)
  getEventById: async (id: number) => {
    const response = await api.get(`/events/${id}`)
    return response.data
  },

  // Get event categories
  getCategories: async () => {
    const response = await api.get('/categories')
    return response.data
  },

  // Get event reviews (public)
  getEventReviews: async (eventId: number) => {
    const response = await api.get(`/reviews/event/${eventId}`)
    return response.data
  },

  // Get organizer profile (public)
  getOrganizerProfile: async (organizerId: number) => {
    const response = await api.get(`/organizers/${organizerId}`)
    return response.data
  },
}
