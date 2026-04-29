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

export interface Statistics {
  totalEvents: number
  totalTransactions: number
  totalRevenue: number
  totalAttendees: number
  avgRating: number
}

export interface DashboardFilters {
  startDate?: string
  endDate?: string
}

export interface OrganizerEvent {
  id: number
  slug: string
  title: string
  description: string | null
  location: string
  category: string
  price: number
  totalSeats: number
  availableSeats: number
  soldTickets?: number
  startDate: string
  endDate: string | null
  registrationDeadline: string | null
  imageUrl: string | null
  isPublished: boolean
  isArchived?: boolean
  createdAt: string
  updatedAt: string
  _count: {
    transactions: number
    reviews: number
  }
}

export interface EventFormData {
  title: string
  description: string
  location: string
  category: string
  price: number
  totalSeats: number
  startDate: string
  endDate?: string
  registrationDeadline?: string
  imageUrl?: string
  isPublished: boolean
}

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
  status: string
  createdAt: string
  updatedAt: string
  expiredAt: string | null
  confirmedAt: string | null
  user: {
    id: number
    firstName: string
    lastName: string
    email: string
    profilePicture?: string
  }
  event: {
    id: number
    title: string
    startDate: string
  }
}

export interface Attendee {
  transactionId: number
  user: {
    id: number
    firstName: string
    lastName: string
    email: string
    phone: string | null
  }
  participant: {
    firstName: string
    lastName: string
    email: string
    phone: string | null
  }
  ticketCount: number
  ticketPrice: number
  totalAmount: number
  purchasedAt: string
}

export interface Voucher {
  id: number
  eventId: number
  code: string
  discount: number
  quota: number
  usedCount: number
  expiresAt: string
  createdAt: string
}

export interface VoucherFormData {
  code: string
  discount: number
  quota: number
  expiresAt: string
}

export interface ChartData {
  date: string
  label: string
  revenue: number
  attendees: number
  transactionCount: number
  prevRevenue: number
  prevAttendees: number
  revenueChange: number
  attendeesChange: number
}

export interface ChartSummary {
  totalRevenue: number
  totalAttendees: number
  totalTransactions: number
  avgRevenue: number
  avgAttendees: number
  avgOrderValue: number
  revenueGrowth: number
  attendeesGrowth: number
  bestRevenuePeriod: string | null
  bestRevenueAmount: number
  worstRevenuePeriod: string | null
  worstRevenueAmount: number
  bestAttendeesPeriod: string | null
  bestAttendeesCount: number
}

export interface ChartResponse {
  chartData: ChartData[]
  summary: ChartSummary
}

export interface TopBuyer {
  userId: number
  firstName: string
  lastName: string
  email: string
  totalAmount: number
  totalTickets: number
  transactionCount: number
}

export const organizerApi = {
  // Get statistics
  getStatistics: async (filters?: DashboardFilters) => {
    const params = new URLSearchParams()
    if (filters?.startDate) params.append('startDate', filters.startDate)
    if (filters?.endDate) params.append('endDate', filters.endDate)

    const response = await api.get(`/organizer/statistics?${params.toString()}`)
    return response.data.data as Statistics
  },

  // Get organizer's events
  getEvents: async () => {
    const response = await api.get('/organizer/events')
    return (response.data.data || response.data || []) as OrganizerEvent[]
  },

  // Get event by slug
  getEventBySlug: async (slug: string) => {
    const response = await api.get(`/organizer/events/${slug}`)
    return (response.data.data || response.data) as OrganizerEvent
  },

  // Create event
  createEvent: async (data: EventFormData) => {
    const response = await api.post('/organizer/events', data)
    return (response.data.data || response.data) as OrganizerEvent
  },

  // Update event by slug
  updateEvent: async (slug: string, data: Partial<EventFormData>) => {
    const response = await api.put(`/organizer/events/${slug}`, data)
    return (response.data.data || response.data) as OrganizerEvent
  },

  // Delete event by slug
  deleteEvent: async (slug: string) => {
    const response = await api.delete(`/organizer/events/${slug}`)
    return response.data
  },

  // Get pending transactions
  getPendingTransactions: async () => {
    const response = await api.get('/organizer/pending-transactions')
    return (response.data.data || response.data || []) as Transaction[]
  },

  // Get all transactions
  getTransactions: async (status?: string) => {
    const params = new URLSearchParams()
    if (status) params.append('status', status)

    const response = await api.get(`/organizer/transactions?${params.toString()}`)
    return (response.data.data || response.data || []) as Transaction[]
  },

  // Get single transaction by ID
  getTransactionById: async (transactionId: number) => {
    const response = await api.get(`/organizer/transactions/${transactionId}`)
    return response.data
  },

  // Accept transaction
  acceptTransaction: async (transactionId: number) => {
    const response = await api.put(`/organizer/transactions/${transactionId}/accept`)
    return response.data
  },

  // Reject transaction
  rejectTransaction: async (transactionId: number) => {
    const response = await api.put(`/organizer/transactions/${transactionId}/reject`)
    return response.data
  },

  // Get event attendees by slug
  getEventAttendees: async (slug: string) => {
    const response = await api.get(`/organizer/events/${slug}/attendees`)
    return (response.data.data || response.data || []) as Attendee[]
  },

  // Get event vouchers by slug
  getEventVouchers: async (slug: string) => {
    const response = await api.get(`/organizer/events/${slug}/vouchers`)
    return response.data.data as Voucher[]
  },

  // Create voucher by slug
  createVoucher: async (slug: string, data: VoucherFormData) => {
    const response = await api.post(`/organizer/events/${slug}/vouchers`, data)
    return response.data.data as Voucher
  },

  // Delete voucher by slug
  deleteVoucher: async (slug: string, voucherId: number) => {
    const response = await api.delete(`/organizer/events/${slug}/vouchers/${voucherId}`)
    return response.data
  },

  // Get chart statistics
  getChartStatistics: async (filter: 'year' | 'month' | 'day' = 'month'): Promise<ChartResponse> => {
    const response = await api.get(`/organizer/statistics-chart?filter=${filter}`)
    return response.data.data
  },

  // Get top buyers
  getTopBuyers: async (): Promise<TopBuyer[]> => {
    const response = await api.get('/organizer/top-buyers')
    return response.data.data
  },

  // Get daily revenue report
  getDailyRevenueReport: async () => {
    const response = await api.get('/organizer/daily-revenue-report')
    return response.data.data || response.data
  },
}
