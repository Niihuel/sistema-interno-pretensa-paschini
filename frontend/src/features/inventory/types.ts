export interface InventoryItem {
  id: number
  name: string
  category: string
  brand?: string | null
  model?: string | null
  serialNumber?: string | null
  quantity: number
  location?: string | null
  status: string
  condition: string
  notes?: string | null
  isPersonalProperty?: boolean
  assignedToId?: number | null
  assignedTo?: {
    id: number
    firstName: string
    lastName: string
  }
  createdAt?: string
  updatedAt?: string
}

export interface InventoryResponse {
  items: InventoryItem[]
  total: number
  page: number
  limit: number
}

export interface InventoryFormData {
  name: string
  category: string
  brand?: string
  model?: string
  serialNumber?: string
  quantity: number
  location?: string
  status: string
  condition: string
  notes?: string
  assignedToId?: number
  isPersonalProperty?: boolean
}

export interface InventoryFilters {
  search?: string
  status?: string
  category?: string
}
