import { apiClient } from '../../../api/client'
import type { Equipment, EquipmentResponse, EquipmentFormData, EquipmentFilters } from '../types'

export const equipmentApi = {
  getAll: async (filters?: EquipmentFilters): Promise<EquipmentResponse> => {
    const params = new URLSearchParams()
    if (filters?.name) params.append('name', filters.name)
    if (filters?.type) params.append('type', filters.type)
    if (filters?.status) params.append('status', filters.status)
    if (filters?.area) params.append('area', filters.area)

    const response = await apiClient.get(
      `/equipment${params.toString() ? `?${params.toString()}` : ''}`
    )

    // Transform backend response: { success: true, data: items[], meta: {...} }
    // Frontend expects: { items: [], total, page, limit }
    return {
      items: response.data.data || [],
      total: response.data.meta?.total || 0,
      page: response.data.meta?.page || 1,
      limit: response.data.meta?.limit || 10,
    }
  },

  getById: async (id: number): Promise<Equipment> => {
    const response = await apiClient.get(`/equipment/${id}`)
    // Backend returns: { success: true, data: {...equipment} }
    return response.data.data
  },

  create: async (payload: EquipmentFormData): Promise<Equipment> => {
    const response = await apiClient.post('/equipment', payload)
    // Backend returns: { success: true, data: {...equipment}, message: '...' }
    return response.data.data
  },

  update: async (id: number, payload: EquipmentFormData): Promise<Equipment> => {
    const response = await apiClient.put(`/equipment/${id}`, payload)
    // Backend returns: { success: true, data: {...equipment}, message: '...' }
    return response.data.data
  },

  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`/equipment/${id}`)
  },
}
