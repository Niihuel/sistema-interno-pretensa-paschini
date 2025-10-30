import { apiClient } from '../../../api/client'
import type { Printer, PrintersResponse, PrinterFormData, PrinterFilters } from '../types'

export const printersApi = {
  getAll: async (filters?: PrinterFilters): Promise<PrintersResponse> => {
    const params = new URLSearchParams()

    if (filters?.search) params.append('search', filters.search)
    if (filters?.status) params.append('status', filters.status)
    if (filters?.area) params.append('area', filters.area)

    const response = await apiClient.get(
      `/printers${params.toString() ? `?${params.toString()}` : ''}`
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

  getById: async (id: number): Promise<Printer> => {
    const response = await apiClient.get(`/printers/${id}`)
    // Backend returns: { success: true, data: {...printer} }
    return response.data.data
  },

  create: async (printerData: PrinterFormData): Promise<Printer> => {
    const response = await apiClient.post('/printers', printerData)
    // Backend returns: { success: true, data: {...printer}, message: '...' }
    return response.data.data
  },

  update: async (id: number, printerData: Partial<PrinterFormData>): Promise<Printer> => {
    const response = await apiClient.put(`/printers/${id}`, printerData)
    // Backend returns: { success: true, data: {...printer}, message: '...' }
    return response.data.data
  },

  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`/printers/${id}`)
  }
}
