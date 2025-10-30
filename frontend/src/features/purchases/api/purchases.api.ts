import { apiClient } from '../../../api/client'
import type { PurchasesResponse, PurchaseFormData, PurchasesFilters } from '../types'

export const purchasesApi = {
  getAll: async (filters?: PurchasesFilters): Promise<PurchasesResponse> => {
    const params = new URLSearchParams()
    if (filters?.orderNumber) params.append('orderNumber', filters.orderNumber)
    if (filters?.supplier) params.append('supplier', filters.supplier)
    if (filters?.status) params.append('status', filters.status)
    if (filters?.startDate) params.append('startDate', filters.startDate)
    if (filters?.endDate) params.append('endDate', filters.endDate)
    if (filters?.page) params.append('page', filters.page.toString())
    if (filters?.limit) params.append('limit', filters.limit.toString())

    const response = await apiClient.get(`/purchases?${params.toString()}`)

    // Transform backend response: { success: true, data: items[], meta: {...} }
    // Frontend expects: { items: [], total, page, limit }
    return {
      items: response.data.data || [],
      total: response.data.meta?.total || 0,
      page: response.data.meta?.page || 1,
      limit: response.data.meta?.limit || 10,
    }
  },

  getOne: async (id: number) => {
    const response = await apiClient.get(`/purchases/${id}`)
    // Backend returns: { success: true, data: {...purchase} }
    return response.data.data
  },

  create: async (data: PurchaseFormData) => {
    const response = await apiClient.post('/purchases', data)
    // Backend returns: { success: true, data: {...purchase}, message: '...' }
    return response.data.data
  },

  update: async (id: number, data: PurchaseFormData) => {
    const response = await apiClient.patch(`/purchases/${id}`, data)
    // Backend returns: { success: true, data: {...purchase}, message: '...' }
    return response.data.data
  },

  delete: async (id: number) => {
    await apiClient.delete(`/purchases/${id}`)
  },
}
