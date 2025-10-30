import axios from 'axios'
import { QueryClient } from '@tanstack/react-query'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3500/api'

export const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
})

// Request interceptor: Añadir token
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Response interceptor: Manejar errores
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    // Solo redirigir a login si NO estamos en la página de login ni en el endpoint de login
    const isLoginPage = window.location.pathname === '/login'
    const isLoginEndpoint = error.config?.url?.includes('/auth/login')

    if (error.response?.status === 401 && !isLoginPage && !isLoginEndpoint) {
      localStorage.removeItem('access_token')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 5 * 60 * 1000, // 5 min
    },
  },
})
