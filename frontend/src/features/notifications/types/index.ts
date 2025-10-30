export interface Notification {
  id: number
  userId: number | null
  type: 'BACKUP' | 'TICKET' | 'INVENTORY' | 'SYSTEM' | 'CALENDAR'
  title: string
  message: string | null
  priority: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT'
  isRead: boolean
  readAt: string | null
  data: string | null
  createdAt: string
}

export interface NotificationsResponse {
  success: boolean
  data: Notification[]
  meta: {
    total: number
    page: number
    limit: number
    pages: number
  }
}

export interface UnreadCountResponse {
  success: boolean
  data: {
    count: number
  }
}

export interface NotificationsFilters {
  type?: string
  isRead?: boolean
  priority?: string
  page?: number
  limit?: number
}
