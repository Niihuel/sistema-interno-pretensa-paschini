export interface Printer {
  id: number
  model: string
  serialNumber: string
  area: string // Deprecated - for backward compatibility
  areaId?: number | null
  zoneId?: number | null
  location: string
  ip?: string | null
  status: string
  createdAt?: string
  updatedAt?: string
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
}

export interface PrintersResponse {
  items: Printer[]
  total: number
  page: number
  limit: number
}

export interface PrinterFormData {
  model: string
  serialNumber: string
  area: string // Deprecated - for backward compatibility
  areaId?: string // String because it comes from select value
  zoneId?: string // String because it comes from select value
  location: string
  ip?: string
  status: string
}

export interface PrinterFilters {
  search?: string
  status?: string
  area?: string
}
