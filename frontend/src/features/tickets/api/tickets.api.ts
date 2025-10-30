import { apiClient } from '../../../api/client'
import type { Ticket, TicketsResponse, TicketFormData, TicketFilters } from '../types'

export const ticketsApi = {
  getAll: async (filters?: TicketFilters): Promise<TicketsResponse> => {
    const params = new URLSearchParams()

    if (filters?.status) params.append('status', filters.status)
    if (filters?.priority) params.append('priority', filters.priority)
    if (filters?.category) params.append('category', filters.category)
    if (filters?.search) params.append('search', filters.search)

    const { data } = await apiClient.get<TicketsResponse>(
      `/tickets${params.toString() ? `?${params.toString()}` : ''}`
    )
    return data
  },

  getById: async (id: number): Promise<Ticket> => {
    const { data } = await apiClient.get<Ticket>(`/tickets/${id}`)
    return data
  },

  create: async (ticketData: TicketFormData): Promise<Ticket> => {
    const { data } = await apiClient.post<Ticket>('/tickets', ticketData)
    return data
  },

  update: async (id: number, ticketData: Partial<TicketFormData>): Promise<Ticket> => {
    const { data } = await apiClient.put<Ticket>(`/tickets/${id}`, ticketData)
    return data
  },

  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`/tickets/${id}`)
  },

  // Attachment methods
  getAttachments: async (ticketId: number) => {
    const { data } = await apiClient.get(`/tickets/${ticketId}/attachments`)
    return data
  },

  uploadAttachments: async (ticketId: number, files: File[]) => {
    const formData = new FormData()
    files.forEach(file => {
      formData.append('files', file)
    })

    const { data } = await apiClient.post(`/tickets/${ticketId}/attachments`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
    return data
  },

  deleteAttachment: async (attachmentId: number): Promise<void> => {
    await apiClient.delete(`/tickets/attachments/${attachmentId}`)
  }
}
