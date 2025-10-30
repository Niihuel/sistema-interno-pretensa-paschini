import { apiClient } from '../../../api/client'
import type { ReplacementsResponse, ReplacementFormData, ReplacementsFilters } from '../types'

export const replacementsApi = {
  getAll: async (filters?: ReplacementsFilters): Promise<ReplacementsResponse> => {
    const params = new URLSearchParams()
    if (filters?.printerId) params.append('printerId', filters.printerId.toString())
    if (filters?.consumableId) params.append('consumableId', filters.consumableId.toString())
    if (filters?.startDate) params.append('startDate', filters.startDate)
    if (filters?.endDate) params.append('endDate', filters.endDate)
    if (filters?.page) params.append('page', filters.page.toString())
    if (filters?.limit) params.append('limit', filters.limit.toString())

    const response = await apiClient.get(`/replacements?${params.toString()}`)
    return response.data
  },

  getOne: async (id: number) => {
    const response = await apiClient.get(`/replacements/${id}`)
    return response.data
  },

  create: async (data: ReplacementFormData) => {
    const response = await apiClient.post('/replacements', data)
    return response.data
  },

  update: async (id: number, data: ReplacementFormData) => {
    const response = await apiClient.patch(`/replacements/${id}`, data)
    return response.data
  },

  delete: async (id: number) => {
    const response = await apiClient.delete(`/replacements/${id}`)
    return response.data
  },
}
