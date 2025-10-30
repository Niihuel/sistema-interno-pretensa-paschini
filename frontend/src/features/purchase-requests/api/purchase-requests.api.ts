import { apiClient } from '../../../api/client'
import type { PurchaseRequest, PurchaseRequestsResponse, PurchaseRequestFormData, PurchaseRequestFilters } from '../types'

export const purchaseRequestsApi = {
  getAll: async (filters?: PurchaseRequestFilters): Promise<PurchaseRequestsResponse> => {
    const params = new URLSearchParams()

    if (filters?.search) params.append('search', filters.search)
    if (filters?.status) params.append('status', filters.status)
    if (filters?.priority) params.append('priority', filters.priority)
    if (filters?.category) params.append('category', filters.category)

    const response = await apiClient.get(
      `/purchase-requests${params.toString() ? `?${params.toString()}` : ''}`
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

  getById: async (id: number): Promise<PurchaseRequest> => {
    const response = await apiClient.get(`/purchase-requests/${id}`)
    // Backend returns: { success: true, data: {...request} }
    return response.data.data
  },

  create: async (requestData: PurchaseRequestFormData): Promise<PurchaseRequest> => {
    const response = await apiClient.post('/purchase-requests', requestData)
    // Backend returns: { success: true, data: {...request}, message: '...' }
    return response.data.data
  },

  update: async (id: number, requestData: Partial<PurchaseRequestFormData>): Promise<PurchaseRequest> => {
    const response = await apiClient.put(`/purchase-requests/${id}`, requestData)
    // Backend returns: { success: true, data: {...request}, message: '...' }
    return response.data.data
  },

  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`/purchase-requests/${id}`)
  }
}
