import { apiClient } from '../../../api/client'
import type { Employee, EmployeesResponse, EmployeeFormData, EmployeeFilters, EmployeeDetailed, WindowsAccountPayload, UpdateWindowsAccountPayload, QnapAccountPayload, UpdateQnapAccountPayload, CalipsoAccountPayload, UpdateCalipsoAccountPayload, EmailAccountPayload, UpdateEmailAccountPayload } from '../types'

export const employeesApi = {
  getAll: async (filters?: EmployeeFilters): Promise<EmployeesResponse> => {
    const params = new URLSearchParams()
    if (filters?.search) params.append('search', filters.search)
    if (filters?.status) params.append('status', filters.status)
    if (filters?.areaId) params.append('areaId', filters.areaId.toString())
    if (filters?.zoneId) params.append('zoneId', filters.zoneId.toString())
    if (filters?.page) params.append('page', filters.page.toString())
    if (filters?.limit) params.append('limit', filters.limit.toString())

    const response = await apiClient.get(`/employees?${params.toString()}`)
    return response.data
  },

  getById: async (id: number): Promise<Employee> => {
    const response = await apiClient.get(`/employees/${id}`)
    return response.data.data
  },

  getDetailed: async (id: number): Promise<EmployeeDetailed> => {
    const response = await apiClient.get(`/employees/${id}/detailed`)
    return response.data.data
  },

  create: async (payload: EmployeeFormData): Promise<Employee> => {
    const response = await apiClient.post('/employees', payload)
    return response.data.data
  },

  update: async (id: number, payload: EmployeeFormData): Promise<Employee> => {
    const response = await apiClient.put(`/employees/${id}`, payload)
    return response.data.data
  },

  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`/employees/${id}`)
  },

  createWindowsAccount: async (employeeId: number, payload: WindowsAccountPayload) => {
    const response = await apiClient.post(`/employees/${employeeId}/windows-accounts`, payload)
    return response.data.data
  },

  updateWindowsAccount: async (employeeId: number, accountId: number, payload: UpdateWindowsAccountPayload) => {
    const response = await apiClient.put(`/employees/${employeeId}/windows-accounts/${accountId}`, payload)
    return response.data.data
  },

  deleteWindowsAccount: async (employeeId: number, accountId: number) => {
    await apiClient.delete(`/employees/${employeeId}/windows-accounts/${accountId}`)
  },

  createQnapAccount: async (employeeId: number, payload: QnapAccountPayload) => {
    const response = await apiClient.post(`/employees/${employeeId}/qnap-accounts`, payload)
    return response.data.data
  },

  updateQnapAccount: async (employeeId: number, accountId: number, payload: UpdateQnapAccountPayload) => {
    const response = await apiClient.put(`/employees/${employeeId}/qnap-accounts/${accountId}`, payload)
    return response.data.data
  },

  deleteQnapAccount: async (employeeId: number, accountId: number) => {
    await apiClient.delete(`/employees/${employeeId}/qnap-accounts/${accountId}`)
  },

  createCalipsoAccount: async (employeeId: number, payload: CalipsoAccountPayload) => {
    const response = await apiClient.post(`/employees/${employeeId}/calipso-accounts`, payload)
    return response.data.data
  },

  updateCalipsoAccount: async (employeeId: number, accountId: number, payload: UpdateCalipsoAccountPayload) => {
    const response = await apiClient.put(`/employees/${employeeId}/calipso-accounts/${accountId}`, payload)
    return response.data.data
  },

  deleteCalipsoAccount: async (employeeId: number, accountId: number) => {
    await apiClient.delete(`/employees/${employeeId}/calipso-accounts/${accountId}`)
  },

  createEmailAccount: async (employeeId: number, payload: EmailAccountPayload) => {
    const response = await apiClient.post(`/employees/${employeeId}/email-accounts`, payload)
    return response.data.data
  },

  updateEmailAccount: async (employeeId: number, accountId: number, payload: UpdateEmailAccountPayload) => {
    const response = await apiClient.put(`/employees/${employeeId}/email-accounts/${accountId}`, payload)
    return response.data.data
  },

  deleteEmailAccount: async (employeeId: number, accountId: number) => {
    await apiClient.delete(`/employees/${employeeId}/email-accounts/${accountId}`)
  },
}