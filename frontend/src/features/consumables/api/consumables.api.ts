import { apiClient } from '../../../api/client'
import type {
  Consumable,
  ConsumableType,
  PrinterConsumableCompat,
  ConsumablesResponse,
  ConsumableTypeFormData,
  ConsumableFormData,
  CompatibilityFormData,
  StockMovementFormData,
  ConsumableTypeFilters,
  ConsumableFilters,
  StockSummary,
  ConsumableStockMovement,
} from '../types'

const BASE_URL = '/consumables'

// ============================================================================
// CONSUMABLE TYPES
// ============================================================================

export const consumableTypesApi = {
  getAll: async (filters?: ConsumableTypeFilters): Promise<ConsumableType[]> => {
    const params = new URLSearchParams()
    if (filters?.search) params.append('search', filters.search)
    if (filters?.type) params.append('type', filters.type)
    if (filters?.brand) params.append('brand', filters.brand)
    if (filters?.isActive !== undefined) params.append('isActive', String(filters.isActive))

    const response = await apiClient.get(`${BASE_URL}/types?${params}`)
    return response.data
  },

  getOne: async (id: number): Promise<ConsumableType> => {
    const response = await apiClient.get(`${BASE_URL}/types/${id}`)
    return response.data
  },

  create: async (data: ConsumableTypeFormData): Promise<ConsumableType> => {
    const response = await apiClient.post(`${BASE_URL}/types`, data)
    return response.data
  },

  update: async (id: number, data: Partial<ConsumableTypeFormData>): Promise<ConsumableType> => {
    const response = await apiClient.put(`${BASE_URL}/types/${id}`, data)
    return response.data
  },

  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`${BASE_URL}/types/${id}`)
  },
}

// ============================================================================
// COMPATIBILITY
// ============================================================================

export const compatibilityApi = {
  create: async (data: CompatibilityFormData): Promise<PrinterConsumableCompat> => {
    const response = await apiClient.post(`${BASE_URL}/compatibility`, {
      ...data,
      consumableTypeId: parseInt(data.consumableTypeId),
    })
    return response.data
  },

  getForPrinter: async (printerModel: string): Promise<PrinterConsumableCompat[]> => {
    const response = await apiClient.get(`${BASE_URL}/compatibility/printer/${encodeURIComponent(printerModel)}`)
    return response.data
  },

  getForConsumableType: async (consumableTypeId: number): Promise<PrinterConsumableCompat[]> => {
    const response = await apiClient.get(`${BASE_URL}/compatibility/consumable-type/${consumableTypeId}`)
    return response.data
  },

  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`${BASE_URL}/compatibility/${id}`)
  },
}

// ============================================================================
// CONSUMABLES (Inventario)
// ============================================================================

export const consumablesApi = {
  getAll: async (filters?: ConsumableFilters): Promise<ConsumablesResponse> => {
    const params = new URLSearchParams()
    if (filters?.search) params.append('search', filters.search)
    if (filters?.consumableTypeId) params.append('consumableTypeId', String(filters.consumableTypeId))
    if (filters?.ownershipType) params.append('ownershipType', filters.ownershipType)
    if (filters?.status) params.append('status', filters.status)
    if (filters?.page) params.append('page', String(filters.page))
    if (filters?.limit) params.append('limit', String(filters.limit))

    const response = await apiClient.get(`${BASE_URL}?${params}`)
    return response.data
  },

  getOne: async (id: number): Promise<Consumable> => {
    const response = await apiClient.get(`${BASE_URL}/${id}`)
    return response.data
  },

  create: async (data: ConsumableFormData): Promise<Consumable> => {
    const response = await apiClient.post(BASE_URL, {
      ...data,
      consumableTypeId: parseInt(data.consumableTypeId),
      quantityAvailable: Number(data.quantityAvailable),
      minimumStock: data.minimumStock ? Number(data.minimumStock) : undefined,
      unitPrice: data.unitPrice ? Number(data.unitPrice) : undefined,
    })
    return response.data
  },

  update: async (id: number, data: Partial<ConsumableFormData>): Promise<Consumable> => {
    const response = await apiClient.put(`${BASE_URL}/${id}`, {
      ...data,
      consumableTypeId: data.consumableTypeId ? parseInt(data.consumableTypeId) : undefined,
      quantityAvailable: data.quantityAvailable !== undefined ? Number(data.quantityAvailable) : undefined,
      minimumStock: data.minimumStock !== undefined ? Number(data.minimumStock) : undefined,
      unitPrice: data.unitPrice !== undefined ? Number(data.unitPrice) : undefined,
    })
    return response.data
  },

  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`${BASE_URL}/${id}`)
  },

  getLowStock: async (): Promise<Consumable[]> => {
    const response = await apiClient.get(`${BASE_URL}/low-stock`)
    return response.data
  },

  getExpiring: async (daysAhead = 30): Promise<Consumable[]> => {
    const response = await apiClient.get(`${BASE_URL}/expiring?daysAhead=${daysAhead}`)
    return response.data
  },

  getSummary: async (): Promise<StockSummary> => {
    const response = await apiClient.get(`${BASE_URL}/summary`)
    return response.data
  },
}

// ============================================================================
// STOCK MOVEMENTS
// ============================================================================

export const stockMovementsApi = {
  create: async (data: StockMovementFormData): Promise<ConsumableStockMovement> => {
    const response = await apiClient.post(`${BASE_URL}/stock-movements`, {
      ...data,
      quantity: Number(data.quantity),
    })
    return response.data
  },

  getForConsumable: async (consumableId: number, limit = 100): Promise<ConsumableStockMovement[]> => {
    const response = await apiClient.get(`${BASE_URL}/${consumableId}/stock-movements?limit=${limit}`)
    return response.data
  },
}
