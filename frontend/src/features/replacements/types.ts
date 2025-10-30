export interface Replacement {
  id: number
  printerId: number
  consumableId: number
  oldConsumableId?: number | null
  replacementDate: string
  pageCountAtReplacement?: number | null
  performedBy: number
  notes?: string | null
  createdAt: string
  printer?: {
    id: number
    brand: string
    model: string
    serialNumber: string
  }
  consumable?: {
    id: number
    name: string
    type: string
  }
  oldConsumable?: {
    id: number
    name: string
    type: string
  } | null
}

export interface ReplacementFormData {
  printerId: number
  consumableId: number
  oldConsumableId?: number | null
  replacementDate: string
  pageCountAtReplacement?: number
  notes?: string
}

export interface ReplacementsResponse {
  items: Replacement[]
  total: number
  page: number
  limit: number
}

export interface ReplacementsFilters {
  printerId?: number
  consumableId?: number
  startDate?: string
  endDate?: string
  page?: number
  limit?: number
}
