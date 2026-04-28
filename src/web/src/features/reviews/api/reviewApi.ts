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

export interface Review {
  id: number
  transactionId: number
  eventId: number
  userId: number
  rating: number
  comment: string | null
  createdAt: string
  user: {
    id: number
    firstName: string
    lastName: string
    profilePicture: string | null
  }
}

export interface CreateReviewRequest {
  transactionId: number
  rating: number
  comment?: string
}

export const reviewApi = {
  // Create review
  createReview: async (data: CreateReviewRequest) => {
    const response = await api.post('/reviews', data)
    return response.data
  },

  // Get user's reviews
  getMyReviews: async () => {
    const response = await api.get('/reviews/my-reviews')
    return response.data
  },

  // Get event reviews (public)
  getEventReviews: async (eventId: number) => {
    const response = await api.get(`/reviews/event/${eventId}`)
    return response.data
  },

  // Check if can review
  canReview: async (transactionId: number) => {
    const response = await api.get(`/reviews/can-review/${transactionId}`)
    return response.data
  },

  // Update review
  updateReview: async (reviewId: number, data: { rating: number; comment?: string }) => {
    const response = await api.put(`/reviews/${reviewId}`, data)
    return response.data
  },

  // Delete review
  deleteReview: async (reviewId: number) => {
    const response = await api.delete(`/reviews/${reviewId}`)
    return response.data
  },
}
