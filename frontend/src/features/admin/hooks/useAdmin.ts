import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { adminApi } from '../api/admin.api'
import type { UserFormData, RoleFormData } from '../types'

// Users
export function useUsers() {
  return useQuery({
    queryKey: ['users'],
    queryFn: () => adminApi.getUsers(),
    staleTime: 30000,
  })
}

export function useUserById(id: number) {
  return useQuery({
    queryKey: ['users', id],
    queryFn: () => adminApi.getUserById(id),
    enabled: !!id,
  })
}

export function useCreateUser() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: UserFormData) => adminApi.createUser(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
      queryClient.invalidateQueries({ queryKey: ['admin-stats'] })
    },
  })
}

export function useUpdateUser() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<UserFormData> }) =>
      adminApi.updateUser(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
      queryClient.invalidateQueries({ queryKey: ['admin-stats'] })
    },
  })
}

export function useDeleteUser() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: number) => adminApi.deleteUser(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
      queryClient.invalidateQueries({ queryKey: ['admin-stats'] })
    },
  })
}

export function useResetUserPassword() {
  return useMutation({
    mutationFn: ({ id, password }: { id: number; password?: string }) =>
      adminApi.resetUserPassword(id, password),
  })
}

// Roles
export function useRoles() {
  return useQuery({
    queryKey: ['roles'],
    queryFn: () => adminApi.getRoles(),
    staleTime: 30000,
  })
}

export function useRoleById(id: number) {
  return useQuery({
    queryKey: ['roles', id],
    queryFn: () => adminApi.getRoleById(id),
    enabled: !!id,
  })
}

export function useCreateRole() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: RoleFormData) => adminApi.createRole(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roles'] })
      queryClient.invalidateQueries({ queryKey: ['admin-stats'] })
    },
  })
}

export function useUpdateRole() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<RoleFormData> }) =>
      adminApi.updateRole(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roles'] })
    },
  })
}

export function useDeleteRole() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: number) => adminApi.deleteRole(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roles'] })
      queryClient.invalidateQueries({ queryKey: ['admin-stats'] })
    },
  })
}

// Stats
export function useAdminStats() {
  return useQuery({
    queryKey: ['admin-stats'],
    queryFn: () => adminApi.getStats(),
    staleTime: 60000,
  })
}

// Permissions
export function usePermissions() {
  return useQuery({
    queryKey: ['permissions'],
    queryFn: () => adminApi.getPermissions(),
    staleTime: 300000, // 5 minutos - los permisos cambian raramente
  })
}

export function useUpdateRolePermissions() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, permissions }: { id: number; permissions: string[] }) =>
      adminApi.updateRolePermissions(id, permissions),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roles'] })
      queryClient.invalidateQueries({ queryKey: ['permissions'] })
    },
  })
}
