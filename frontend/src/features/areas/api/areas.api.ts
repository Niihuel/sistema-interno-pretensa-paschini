import { apiClient } from '../../../api/client'
import type { AreasResponse, AreaFormData, AreasFilters, Area, AreaListItem } from '../types'

export const areasApi = {
  getAll: async (filters?: AreasFilters): Promise<AreasResponse> => {
    const params = new URLSearchParams()
    if (filters?.name) params.append('name', filters.name)
    if (filters?.status) params.append('status', filters.status)
    if (filters?.page) params.append('page', filters.page.toString())
    if (filters?.limit) params.append('limit', filters.limit.toString())

    const response = await apiClient.get(`/areas?${params.toString()}`)
    return response.data
  },

  getAllAreas: async (): Promise<AreaListItem[]> => {
    const response = await apiClient.get('/areas/all')
    return response.data.data || []
  },

  getOne: async (id: number): Promise<Area> => {
    const response = await apiClient.get(`/areas/${id}`)
    return response.data.data
  },

  create: async (data: AreaFormData): Promise<Area> => {
    const response = await apiClient.post('/areas', data)
    return response.data.data
  },

  update: async (id: number, data: Partial<AreaFormData>): Promise<Area> => {
    const response = await apiClient.put(`/areas/${id}`, data)
    return response.data.data
  },

  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`/areas/${id}`)
  },
}
