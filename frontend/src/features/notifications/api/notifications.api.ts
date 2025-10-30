import { apiClient } from '../../../api/client'
import type { NotificationsResponse, NotificationsFilters, UnreadCountResponse } from '../types'

export const notificationsApi = {
  getAll: async (filters?: NotificationsFilters): Promise<NotificationsResponse> => {
    const params = new URLSearchParams()
    if (filters?.type) params.append('type', filters.type)
    if (filters?.isRead !== undefined) params.append('isRead', filters.isRead.toString())
    if (filters?.priority) params.append('priority', filters.priority)
    if (filters?.page) params.append('page', filters.page.toString())
    if (filters?.limit) params.append('limit', filters.limit.toString())

    const response = await apiClient.get(`/notifications?${params.toString()}`)
    return response.data
  },

  getUnreadCount: async (): Promise<UnreadCountResponse> => {
    const response = await apiClient.get('/notifications/unread-count')
    return response.data
  },

  markAsRead: async (id: number) => {
    const response = await apiClient.post(`/notifications/${id}/mark-as-read`)
    return response.data
  },

  markAllAsRead: async () => {
    const response = await apiClient.post('/notifications/mark-all-as-read')
    return response.data
  },

  delete: async (id: number) => {
    const response = await apiClient.delete(`/notifications/${id}`)
    return response.data
  },
}
