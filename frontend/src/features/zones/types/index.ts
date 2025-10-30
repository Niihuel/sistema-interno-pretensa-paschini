export interface Zone {
  id: number
  name: string
  code: string | null
  description: string | null
  managerId: number | null
  status: string
  color: string | null
  icon: string | null
  createdAt: string
  updatedAt: string
  manager?: {
    id: number
    firstName: string
    lastName: string
  }
  _count?: {
    employees: number
  }
}

export interface ZoneFormData {
  name: string
  code?: string
  description?: string
  areaId?: number
  status?: string
  color?: string
  icon?: string
}

export interface ZonesFilters {
  search?: string
  status?: string
  page?: number
  limit?: number
}

export interface ZonesResponse {
  items: Zone[]
  total: number
  page: number
  limit: number
}

export interface ZoneListItem {
  id: number
  name: string
  code: string | null
  areaId: number | null
}
