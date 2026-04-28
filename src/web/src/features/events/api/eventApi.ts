import axios from 'axios'

const API_URL = (import.meta as any).env?.VITE_API_URL || 'http://localhost:8000/api'

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
  slug: string
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
    username: string
  }
  vouchers?: {
    code: string
    discount: number
    expiresAt: string
  }[]
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

  // Get single event details by slug (public)
  getEventBySlug: async (slug: string) => {
    const response = await api.get(`/events/${slug}`)
    return response.data.data
  },

  // Get event categories
  getCategories: async () => {
    const response = await api.get('/categories')
    return response.data
  },

  // Get public platform statistics
  getPublicStats: async () => {
    const response = await api.get('/events/stats')
    return response.data
  },

  // Get event reviews by slug (public)
  getEventReviews: async (eventSlug: string) => {
    const response = await api.get(`/reviews/event/${eventSlug}`)
    return response.data
  },

  // Get organizer profile by username (public)
  getOrganizerProfile: async (username: string) => {
    const response = await api.get(`/organizers/${username}`)
    return response.data
  },

  // Get popular events sorted by transaction count (most popular first)
  getPopularEvents: async (limit: number = 8) => {
    const response = await api.get(`/events/popular?limit=${limit}`)
    return response.data
  },
}
