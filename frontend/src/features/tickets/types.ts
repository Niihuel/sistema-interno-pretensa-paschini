export interface Ticket {
  id: number
  title: string
  description?: string | null
  status: string
  priority: string
  requestorId: number
  technicianId?: number | null
  solution?: string | null
  category?: string | null
  area?: string | null // Deprecated - for backward compatibility
  areaId?: number | null
  zoneId?: number | null
  ipAddress?: string | null
  resolutionTime?: string | null
  createdAt?: string
  closedAt?: string | null
  updatedAt?: string
  requestor?: {
    id: number
    firstName: string
    lastName: string
    area?: string | null
  }
  technician?: {
    id: number
    username: string
    firstName?: string | null
    lastName?: string | null
  }
  catalogArea?: {
    id: number
    name: string
    code?: string | null
  }
  catalogZone?: {
    id: number
    name: string
    code?: string | null
  }
  attachments?: Array<{
    id: number
    filename: string
    originalName: string
    size: number
    url: string
    createdAt?: string
  }>
}

export interface TicketsResponse {
  items: Ticket[]
  total: number
  page: number
  limit: number
}

export interface TicketFormData {
  title: string
  description?: string
  status: string
  priority: string
  requestorId: number
  technicianId?: number
  category?: string
  area?: string // Deprecated - for backward compatibility
  areaId?: string // String because it comes from select value
  zoneId?: string // String because it comes from select value
  ipAddress?: string
  solution?: string
}

export interface TicketFilters {
  status?: string
  priority?: string
  category?: string
  search?: string
}
