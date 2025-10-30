import { apiClient } from '../../../api/client'
import type { BackupsResponse, BackupsFilters } from '../types'

export const backupsApi = {
  getAll: async (filters?: BackupsFilters): Promise<BackupsResponse> => {
    const params = new URLSearchParams()
    if (filters?.backupType) params.append('backupType', filters.backupType)
    if (filters?.status) params.append('status', filters.status)
    if (filters?.startDate) params.append('startDate', filters.startDate)
    if (filters?.endDate) params.append('endDate', filters.endDate)
    if (filters?.page) params.append('page', filters.page.toString())
    if (filters?.limit) params.append('limit', filters.limit.toString())

    const response = await apiClient.get(`/backups?${params.toString()}`)

    // Transform backend response to match frontend types
    // Backend: { success: true, data: items[], meta: { total, page, limit } }
    // Frontend expects: { items: [], total, page, limit }
    return {
      items: response.data.data || [],
      total: response.data.meta?.total || 0,
      page: response.data.meta?.page || 1,
      limit: response.data.meta?.limit || 10,
    }
  },

  getOne: async (id: number) => {
    const response = await apiClient.get(`/backups/${id}`)
    return response.data
  },

  getStats: async () => {
    const response = await apiClient.get('/backups/stats')
    // Backend returns: { success: true, data: {...stats} }
    // Frontend expects: {...stats}
    return response.data.data
  },

  createBackup: async () => {
    const response = await apiClient.post('/backups/create')
    return response.data
  },

  restoreBackup: async (id: number) => {
    const response = await apiClient.post(`/backups/${id}/restore`)
    return response.data
  },

  deleteBackup: async (id: number) => {
    const response = await apiClient.delete(`/backups/${id}`)
    return response.data
  },
}
