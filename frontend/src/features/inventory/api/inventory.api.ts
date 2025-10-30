import { apiClient } from '../../../api/client'
import type { InventoryItem, InventoryResponse, InventoryFormData, InventoryFilters } from '../types'

export const inventoryApi = {
  getAll: async (filters?: InventoryFilters): Promise<InventoryResponse> => {
    const params = new URLSearchParams()

    if (filters?.search) params.append('search', filters.search)
    if (filters?.status) params.append('status', filters.status)
    if (filters?.category) params.append('category', filters.category)

    const response = await apiClient.get(
      `/inventory${params.toString() ? `?${params.toString()}` : ''}`
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

  getById: async (id: number): Promise<InventoryItem> => {
    const response = await apiClient.get(`/inventory/${id}`)
    // Backend returns: { success: true, data: {...item} }
    return response.data.data
  },

  create: async (itemData: InventoryFormData): Promise<InventoryItem> => {
    const response = await apiClient.post('/inventory', itemData)
    // Backend returns: { success: true, data: {...item}, message: '...' }
    return response.data.data
  },

  update: async (id: number, itemData: Partial<InventoryFormData>): Promise<InventoryItem> => {
    const response = await apiClient.put(`/inventory/${id}`, itemData)
    // Backend returns: { success: true, data: {...item}, message: '...' }
    return response.data.data
  },

  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`/inventory/${id}`)
  }
}
