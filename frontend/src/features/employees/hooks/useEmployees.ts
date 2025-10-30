import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { employeesApi } from '../api/employees.api'
import type { EmployeeFormData, EmployeeFilters, WindowsAccountPayload, UpdateWindowsAccountPayload, QnapAccountPayload, UpdateQnapAccountPayload, CalipsoAccountPayload, UpdateCalipsoAccountPayload, EmailAccountPayload, UpdateEmailAccountPayload } from '../types'

export const useEmployees = (filters?: EmployeeFilters) => {
  return useQuery({
    queryKey: ['employees', filters],
    queryFn: () => employeesApi.getAll(filters),
  })
}

export const useEmployee = (id: number) => {
  return useQuery({
    queryKey: ['employees', id],
    queryFn: () => employeesApi.getById(id),
    enabled: !!id,
  })
}

export const useEmployeeDetailed = (id: number) => {
  return useQuery({
    queryKey: ['employees', id, 'detailed'],
    queryFn: () => employeesApi.getDetailed(id),
    enabled: !!id,
  })
}

export const useCreateEmployee = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: EmployeeFormData) => employeesApi.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'] })
    },
  })
}

export const useUpdateEmployee = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: EmployeeFormData }) => employeesApi.update(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['employees', id] })
      queryClient.invalidateQueries({ queryKey: ['employees', id, 'detailed'] })
      queryClient.invalidateQueries({ queryKey: ['employees'] })
    },
  })
}

export const useDeleteEmployee = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => employeesApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'] })
    },
  })
}

// Windows Accounts
export const useCreateWindowsAccount = (employeeId: number) => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: WindowsAccountPayload) => employeesApi.createWindowsAccount(employeeId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees', employeeId, 'detailed'] })
    },
  })
}

export const useUpdateWindowsAccount = (employeeId: number) => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ accountId, payload }: { accountId: number; payload: UpdateWindowsAccountPayload }) =>
      employeesApi.updateWindowsAccount(employeeId, accountId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees', employeeId, 'detailed'] })
    },
  })
}

export const useDeleteWindowsAccount = (employeeId: number) => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (accountId: number) => employeesApi.deleteWindowsAccount(employeeId, accountId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees', employeeId, 'detailed'] })
    },
  })
}

// QNAP Accounts
export const useCreateQnapAccount = (employeeId: number) => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: QnapAccountPayload) => employeesApi.createQnapAccount(employeeId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees', employeeId, 'detailed'] })
    },
  })
}

export const useUpdateQnapAccount = (employeeId: number) => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ accountId, payload }: { accountId: number; payload: UpdateQnapAccountPayload }) =>
      employeesApi.updateQnapAccount(employeeId, accountId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees', employeeId, 'detailed'] })
    },
  })
}

export const useDeleteQnapAccount = (employeeId: number) => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (accountId: number) => employeesApi.deleteQnapAccount(employeeId, accountId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees', employeeId, 'detailed'] })
    },
  })
}

// Calipso Accounts
export const useCreateCalipsoAccount = (employeeId: number) => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: CalipsoAccountPayload) => employeesApi.createCalipsoAccount(employeeId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees', employeeId, 'detailed'] })
    },
  })
}

export const useUpdateCalipsoAccount = (employeeId: number) => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ accountId, payload }: { accountId: number; payload: UpdateCalipsoAccountPayload }) =>
      employeesApi.updateCalipsoAccount(employeeId, accountId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees', employeeId, 'detailed'] })
    },
  })
}

export const useDeleteCalipsoAccount = (employeeId: number) => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (accountId: number) => employeesApi.deleteCalipsoAccount(employeeId, accountId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees', employeeId, 'detailed'] })
    },
  })
}

// Email Accounts
export const useCreateEmailAccount = (employeeId: number) => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: EmailAccountPayload) => employeesApi.createEmailAccount(employeeId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees', employeeId, 'detailed'] })
    },
  })
}

export const useUpdateEmailAccount = (employeeId: number) => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ accountId, payload }: { accountId: number; payload: UpdateEmailAccountPayload }) =>
      employeesApi.updateEmailAccount(employeeId, accountId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees', employeeId, 'detailed'] })
    },
  })
}

export const useDeleteEmailAccount = (employeeId: number) => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (accountId: number) => employeesApi.deleteEmailAccount(employeeId, accountId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees', employeeId, 'detailed'] })
    },
  })
}