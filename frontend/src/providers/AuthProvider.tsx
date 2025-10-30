import { createContext, useContext, useState, useEffect } from 'react'
import type { ReactNode } from 'react'
import { apiClient } from '../api/client'
import { notificationsWS } from '../services/notifications-websocket.service'

interface Role {
  id: number
  name: string
  displayName: string
  level: number
}

interface User {
  id: number
  username: string
  email: string | null
  firstName: string | null
  lastName: string | null
  roles?: Role[]
  permissions?: string[]
}

interface AuthContextType {
  user: User | null
  isAuthenticated: boolean
  loading: boolean
  login: (username: string, password: string) => Promise<void>
  logout: () => void
  refetch: () => Promise<void>
  hasPermission: (permission: string) => boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchUser = async () => {
    try {
      const token = localStorage.getItem('access_token')
      if (!token) {
        setUser(null)
        // Disconnect WebSocket if logged out
        notificationsWS.disconnect()
        return
      }

      const { data } = await apiClient.get('/auth/me')
      setUser(data)

      // Connect to WebSocket for real-time notifications
      notificationsWS.connect(token)

      // Request browser notification permission
      notificationsWS.requestNotificationPermission().then((permission) => {
        console.log('[Auth] Browser notification permission:', permission)
      })
    } catch (error) {
      setUser(null)
      localStorage.removeItem('access_token')
      notificationsWS.disconnect()
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchUser()

    // Cleanup: Disconnect WebSocket when component unmounts
    return () => {
      notificationsWS.disconnect()
    }
  }, [])

  const login = async (username: string, password: string) => {
    const { data } = await apiClient.post('/auth/login', { username, password })
    localStorage.setItem('access_token', data.access_token)
    setUser(data.user)

    // Connect to WebSocket after login
    notificationsWS.connect(data.access_token)

    // Request browser notification permission
    notificationsWS.requestNotificationPermission()
  }

  const logout = () => {
    // Disconnect WebSocket before logout
    notificationsWS.disconnect()

    localStorage.removeItem('access_token')
    setUser(null)
    window.location.href = '/login'
  }

  const hasPermission = (permission: string): boolean => {
    if (!user || !user.permissions) return false
    return user.permissions.includes(permission)
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        loading,
        login,
        logout,
        refetch: fetchUser,
        hasPermission,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used within AuthProvider')
  return context
}
