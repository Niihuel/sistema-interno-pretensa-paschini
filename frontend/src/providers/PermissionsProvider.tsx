import { createContext, useContext, useState, useEffect } from 'react'
import type { ReactNode } from 'react'
import { useAuth } from './AuthProvider'
import { apiClient } from '../api/client'

interface PermissionsContextType {
  permissions: Set<string>
  loading: boolean
  can: (resource: string, action: string, scope?: string) => boolean
  hasRole: (roleName: string) => boolean
}

const PermissionsContext = createContext<PermissionsContextType | undefined>(undefined)

export function PermissionsProvider({ children }: { children: ReactNode }) {
  const { user, isAuthenticated } = useAuth()
  const [permissions, setPermissions] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchPermissions() {
      if (!isAuthenticated || !user) {
        setPermissions(new Set())
        setLoading(false)
        return
      }

      try {
        const { data } = await apiClient.get(`/rbac/users/${user.id}/permissions`)
        const permsSet = new Set<string>(data.data.map((p: any) =>
          `${p.resource}:${p.action}:${p.scope || 'all'}`
        ))
        setPermissions(permsSet)
      } catch (error) {
        setPermissions(new Set())
      } finally {
        setLoading(false)
      }
    }

    fetchPermissions()
  }, [user, isAuthenticated])

  const can = (resource: string, action: string, scope: string = 'all') => {
    if (!isAuthenticated) return false
    if (user?.roles?.some(r => r.name === 'SuperAdmin')) return true

    const key = `${resource}:${action}:${scope}`
    return permissions.has(key) || permissions.has('*:*:*')
  }

  const hasRole = (roleName: string) => {
    return user?.roles?.some(r => r.name === roleName) || false
  }

  return (
    <PermissionsContext.Provider value={{ permissions, loading, can, hasRole }}>
      {children}
    </PermissionsContext.Provider>
  )
}

export const usePermissions = () => {
  const context = useContext(PermissionsContext)
  if (!context) throw new Error('usePermissions must be used within PermissionsProvider')
  return context
}
