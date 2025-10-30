import { apiClient } from '../../../api/client'
import type { ZonesResponse, ZoneFormData, ZonesFilters, Zone, ZoneListItem } from '../types'

export const zonesApi = {
  getAll: async (filters?: ZonesFilters): Promise<ZonesResponse> => {
    const params = new URLSearchParams()
    if (filters?.search) params.append('search', filters.search)
    if (filters?.status) params.append('status', filters.status)
    if (filters?.page) params.append('page', filters.page.toString())
    if (filters?.limit) params.append('limit', filters.limit.toString())

    const response = await apiClient.get(`/zones?${params.toString()}`)
    // Backend returns: { success, data: [...], meta: { total, page, limit } }
    // Transform to: { items: [...], total, page, limit }
    return {
      items: response.data.data || [],
      total: response.data.meta?.total || 0,
      page: response.data.meta?.page || 1,
      limit: response.data.meta?.limit || 50,
    }
  },

  getAllZones: async (): Promise<ZoneListItem[]> => {
    const response = await apiClient.get(`/zones/all`)
    return response.data
  },

  getOne: async (id: number): Promise<Zone> => {
    const response = await apiClient.get(`/zones/${id}`)
    return response.data
  },

  create: async (data: ZoneFormData): Promise<Zone> => {
    const response = await apiClient.post('/zones', data)
    return response.data
  },

  update: async (id: number, data: Partial<ZoneFormData>): Promise<Zone> => {
    const response = await apiClient.put(`/zones/${id}`, data)
    return response.data
  },

  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`/zones/${id}`)
  },
}
