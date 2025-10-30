import { apiClient } from '../../../api/client'
import type { User, Role, UsersResponse, RolesResponse, UserFormData, RoleFormData, AdminStats, PermissionsByCategory } from '../types'

// Backend response wrapper
interface BackendResponse<T> {
  success: boolean
  data: T
  meta?: Record<string, unknown>
  message?: string
}

export const adminApi = {
  // Users
  getUsers: async (): Promise<UsersResponse> => {
    const response = await apiClient.get<BackendResponse<User[]>>('/users')
    return {
      items: response.data.data,
      total: response.data.data.length,
      page: 1,
      limit: 100
    }
  },

  getUserById: async (id: number): Promise<User> => {
    const response = await apiClient.get<BackendResponse<User>>(`/users/${id}`)
    return response.data.data
  },

  createUser: async (userData: UserFormData): Promise<User> => {
    const response = await apiClient.post<BackendResponse<User>>('/users', userData)
    return response.data.data
  },

  updateUser: async (id: number, userData: Partial<UserFormData>): Promise<User> => {
    const response = await apiClient.put<BackendResponse<User>>(`/users/${id}`, userData)
    return response.data.data
  },

  deleteUser: async (id: number): Promise<void> => {
    await apiClient.delete(`/users/${id}`)
  },

  resetUserPassword: async (id: number, password?: string): Promise<{ tempPassword?: string }> => {
    const response = await apiClient.post<BackendResponse<{ tempPassword?: string }>>(
      `/users/${id}/reset-password`,
      password ? { password } : {}
    )
    return response.data.data
  },

  // Roles
  getRoles: async (): Promise<RolesResponse> => {
    const response = await apiClient.get<BackendResponse<Role[]>>('/rbac/roles')
    return {
      items: response.data.data,
      total: response.data.data.length,
      page: 1,
      limit: 100
    }
  },

  getRoleById: async (id: number): Promise<Role> => {
    const response = await apiClient.get<BackendResponse<Role>>(`/rbac/roles/${id}`)
    return response.data.data
  },

  createRole: async (roleData: RoleFormData): Promise<Role> => {
    const response = await apiClient.post<BackendResponse<Role>>('/rbac/roles', roleData)
    return response.data.data
  },

  updateRole: async (id: number, roleData: Partial<RoleFormData>): Promise<Role> => {
    const response = await apiClient.put<BackendResponse<Role>>(`/rbac/roles/${id}`, roleData)
    return response.data.data
  },

  deleteRole: async (id: number): Promise<void> => {
    await apiClient.delete(`/rbac/roles/${id}`)
  },

  // Stats
  getStats: async (): Promise<AdminStats> => {
    const response = await apiClient.get<BackendResponse<AdminStats>>('/admin/stats')
    return response.data.data
  },

  // Permissions
  getPermissions: async (): Promise<PermissionsByCategory> => {
    const response = await apiClient.get<BackendResponse<PermissionsByCategory>>('/rbac/permissions')
    return response.data.data
  },

  updateRolePermissions: async (id: number, permissions: string[]): Promise<Role> => {
    const response = await apiClient.put<BackendResponse<Role>>(`/rbac/roles/${id}`, { permissions })
    return response.data.data
  }
}
