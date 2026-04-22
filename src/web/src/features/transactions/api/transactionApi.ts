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

export interface Transaction {
  id: number
  userId: number
  eventId: number
  ticketCount: number
  ticketPrice: number
  subtotal: number
  pointsUsed: number
  voucherDiscount: number
  totalAmount: number
  voucherCode: string | null
  paymentProofUrl: string | null
  status: 'WAITING_PAYMENT' | 'WAITING_CONFIRMATION' | 'DONE' | 'REJECTED' | 'EXPIRED' | 'CANCELED'
  createdAt: string
  updatedAt: string
  expiredAt: string | null
  confirmedAt: string | null
  event: {
    id: number
    title: string
    imageUrl: string | null
    startDate: string
    endDate: string | null
    location: string
    organizer: {
      id: number
      firstName: string
      lastName: string
    }
  }
  review: {
    id: number
    rating: number
    comment: string
  } | null
}

export interface CreateTransactionRequest {
  eventId: number
  ticketCount: number
  pointsToUse: number
  voucherCode?: string
}

export const transactionApi = {
  // Create new transaction (checkout)
  createTransaction: async (data: CreateTransactionRequest) => {
    const response = await api.post('/transactions', data)
    return response.data
  },

  // Get user's transactions
  getMyTransactions: async (status?: string) => {
    const params = status ? `?status=${status}` : ''
    const response = await api.get(`/transactions${params}`)
    return response.data
  },

  // Get single transaction
  getTransactionById: async (id: number) => {
    const response = await api.get(`/transactions/${id}`)
    return response.data
  },

  // Upload payment proof
  uploadPaymentProof: async (transactionId: number, paymentProofUrl: string) => {
    const response = await api.put(`/transactions/${transactionId}/payment-proof`, {
      paymentProofUrl,
    })
    return response.data
  },

  // Cancel transaction
  cancelTransaction: async (transactionId: number) => {
    const response = await api.put(`/transactions/${transactionId}/cancel`)
    return response.data
  },
}
