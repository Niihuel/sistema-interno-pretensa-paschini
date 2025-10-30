export interface Area {
  id: number
  name: string
  code: string | null
  description: string | null
  managerId: number | null
  status: 'ACTIVE' | 'INACTIVE'
  color: string | null
  icon: string | null
  createdAt: string
  updatedAt: string
  manager?: {
    id: number
    firstName: string
    lastName: string
  }
  zones?: Array<{
    id: number
    name: string
    code: string | null
    _count?: {
      employees: number
    }
  }>
  _count?: {
    employees: number
    zones: number
  }
}

export interface AreaFormData {
  name: string
  code?: string
  description?: string
  managerId?: number
  status?: string
  color?: string
  icon?: string
}

export interface AreaListItem {
  id: number
  name: string
  code: string | null
}

export interface AreasResponse {
  items: Area[]
  total: number
  page: number
  limit: number
}

export interface AreasFilters {
  name?: string
  status?: string
  page?: number
  limit?: number
}
