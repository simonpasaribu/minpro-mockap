import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api'

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

export const authService = {
  login: async (credentials: { email: string; password: string }) => {
    const { data } = await api.post('/auth/login', credentials)
    console.log('API login response:', data)
    return data.data
  },

  register: async (userData: {
    email: string
    password: string
    firstName: string
    lastName: string
    referralCode?: string
  }) => {
    const { data } = await api.post('/auth/register', userData)
    console.log('API register response:', data)
    return data.data
  },

  getProfile: async () => {
    const { data } = await api.get('/auth/profile')
    console.log('API getProfile response:', data)
    return data.data
  },

  logout: () => {
    localStorage.removeItem('token')
  }
}

export default api
