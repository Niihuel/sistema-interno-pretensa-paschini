export interface User {
  id: number
  username: string
  email?: string | null
  firstName?: string | null
  lastName?: string | null
  role?: string | null  // Legacy field - deprecated
  isActive: boolean
  lastLoginAt?: string | null
  createdAt?: string
  updatedAt?: string
  userRoles?: Array<{
    role: {
      id: number
      name: string
      displayName: string
      color: string | null
      level: number
    }
  }>
}

export interface Role {
  id: number
  name: string
  displayName: string
  description?: string | null
  color?: string | null
  level?: number | null
  priority?: number | null
  isActive?: boolean
  isSystem?: boolean
  permissions?: string[]
  _count?: {
    userRoles: number
  }
}

export interface UsersResponse {
  items: User[]
  total: number
  page: number
  limit: number
}

export interface RolesResponse {
  items: Role[]
  total: number
  page: number
  limit: number
}

export interface UserFormData {
  username: string
  email?: string
  firstName?: string
  lastName?: string
  roleIds?: number[]
  isActive: boolean
  password?: string
}

export interface RoleFormData {
  name: string
  displayName: string
  description?: string
  color?: string
  level?: number
  priority?: number
  permissions?: string[]
  isActive?: boolean
}

export interface Permission {
  id: number
  resource: string
  action: string
  scope: string
  description?: string | null
  category?: string | null
}

export interface PermissionsByCategory {
  [category: string]: Permission[]
}

export interface AdminStats {
  totalUsers: number
  activeUsers: number
  inactiveUsers: number
  totalRoles: number
}
