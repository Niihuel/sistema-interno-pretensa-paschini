// Enums
export const ConsumableTypeEnum = {
  TONER: 'TONER',
  INK_CARTRIDGE: 'INK_CARTRIDGE',
  DRUM: 'DRUM',
  FUSER: 'FUSER',
  MAINTENANCE_KIT: 'MAINTENANCE_KIT',
} as const

export type ConsumableTypeEnum = typeof ConsumableTypeEnum[keyof typeof ConsumableTypeEnum]

export const ConsumableColorEnum = {
  BLACK: 'BLACK',
  CYAN: 'CYAN',
  MAGENTA: 'MAGENTA',
  YELLOW: 'YELLOW',
  TRI_COLOR: 'TRI_COLOR',
  PHOTO_BLACK: 'PHOTO_BLACK',
  LIGHT_CYAN: 'LIGHT_CYAN',
  LIGHT_MAGENTA: 'LIGHT_MAGENTA',
} as const

export type ConsumableColorEnum = typeof ConsumableColorEnum[keyof typeof ConsumableColorEnum]

export const OwnershipTypeEnum = {
  COMPANY: 'COMPANY',
  THIRD_PARTY: 'THIRD_PARTY',
} as const

export type OwnershipTypeEnum = typeof OwnershipTypeEnum[keyof typeof OwnershipTypeEnum]

export const ConsumableStatusEnum = {
  AVAILABLE: 'AVAILABLE',
  LOW_STOCK: 'LOW_STOCK',
  OUT_OF_STOCK: 'OUT_OF_STOCK',
  EXPIRED: 'EXPIRED',
} as const

export type ConsumableStatusEnum = typeof ConsumableStatusEnum[keyof typeof ConsumableStatusEnum]

export const MovementTypeEnum = {
  IN: 'IN',
  OUT: 'OUT',
  ADJUSTMENT: 'ADJUSTMENT',
} as const

export type MovementTypeEnum = typeof MovementTypeEnum[keyof typeof MovementTypeEnum]

// Types
export interface ConsumableType {
  id: number
  name: string
  type: ConsumableTypeEnum
  color?: ConsumableColorEnum | null
  brand: string
  model: string
  productCode?: string | null
  description?: string | null
  avgYield?: number | null
  isActive: boolean
  createdAt: string
  updatedAt: string
  consumables?: Consumable[]
  compatiblePrinters?: PrinterConsumableCompat[]
}

export interface PrinterConsumableCompat {
  id: number
  printerModel: string
  printerBrand?: string | null
  consumableTypeId: number
  isRecommended: boolean
  notes?: string | null
  createdAt: string
  consumableType?: ConsumableType
  printersUsingThis?: Array<{
    id: number
    model: string
    brand?: string | null
  }>
}

export interface Consumable {
  id: number
  consumableTypeId: number
  ownershipType: OwnershipTypeEnum
  ownerCompany?: string | null
  purchaseDate?: string | null
  expirationDate?: string | null
  quantityAvailable: number
  minimumStock: number
  unitPrice?: number | null
  supplier?: string | null
  location?: string | null
  status: ConsumableStatusEnum
  notes?: string | null
  createdAt: string
  updatedAt: string
  consumableType?: ConsumableType
  stockMovements?: ConsumableStockMovement[]
  replacements?: any[]
}

export interface ConsumableStockMovement {
  id: number
  consumableId: number
  movementType: MovementTypeEnum
  quantity: number
  previousStock: number
  newStock: number
  reason?: string | null
  reference?: string | null
  performedBy?: string | null
  notes?: string | null
  createdAt: string
  consumable?: Consumable
}

// Response types
export interface ConsumablesResponse {
  items: Consumable[]
  total: number
  page: number
  limit: number
}

export interface StockSummary {
  total: number
  lowStock: number
  outOfStock: number
  expired: number
  byOwnership: Array<{
    ownershipType: string
    _count: number
    _sum: {
      quantityAvailable: number | null
    }
  }>
  byType: Array<{
    consumableTypeId: number
    _count: number
    _sum: {
      quantityAvailable: number | null
    }
  }>
}

// Form Data types
export interface ConsumableTypeFormData {
  name: string
  type: ConsumableTypeEnum
  color?: ConsumableColorEnum
  brand: string
  model: string
  productCode?: string
  description?: string
  avgYield?: number
  isActive?: boolean
}

export interface ConsumableFormData {
  consumableTypeId: string // String because it comes from select
  ownershipType: OwnershipTypeEnum
  ownerCompany?: string
  purchaseDate?: string
  expirationDate?: string
  quantityAvailable: number
  minimumStock?: number
  unitPrice?: number
  supplier?: string
  location?: string
  status?: ConsumableStatusEnum
  notes?: string
}

export interface CompatibilityFormData {
  printerModel: string
  printerBrand?: string
  consumableTypeId: string // String because it comes from select
  isRecommended?: boolean
  notes?: string
}

export interface StockMovementFormData {
  consumableId: number
  movementType: MovementTypeEnum
  quantity: number
  reason?: string
  reference?: string
  performedBy?: string
  notes?: string
}

// Filter types
export interface ConsumableTypeFilters {
  search?: string
  type?: ConsumableTypeEnum
  brand?: string
  isActive?: boolean
}

export interface ConsumableFilters {
  search?: string
  consumableTypeId?: number
  ownershipType?: OwnershipTypeEnum
  status?: ConsumableStatusEnum
  page?: number
  limit?: number
}

// Constants
export const CONSUMABLE_TYPE_LABELS: Record<ConsumableTypeEnum, string> = {
  [ConsumableTypeEnum.TONER]: 'Toner',
  [ConsumableTypeEnum.INK_CARTRIDGE]: 'Cartucho de Tinta',
  [ConsumableTypeEnum.DRUM]: 'Tambor',
  [ConsumableTypeEnum.FUSER]: 'Fusor',
  [ConsumableTypeEnum.MAINTENANCE_KIT]: 'Kit de Mantenimiento',
}

export const CONSUMABLE_COLOR_LABELS: Record<ConsumableColorEnum, string> = {
  [ConsumableColorEnum.BLACK]: 'Negro',
  [ConsumableColorEnum.CYAN]: 'Cian',
  [ConsumableColorEnum.MAGENTA]: 'Magenta',
  [ConsumableColorEnum.YELLOW]: 'Amarillo',
  [ConsumableColorEnum.TRI_COLOR]: 'Tricolor',
  [ConsumableColorEnum.PHOTO_BLACK]: 'Negro Fotográfico',
  [ConsumableColorEnum.LIGHT_CYAN]: 'Cian Claro',
  [ConsumableColorEnum.LIGHT_MAGENTA]: 'Magenta Claro',
}

export const OWNERSHIP_TYPE_LABELS: Record<OwnershipTypeEnum, string> = {
  [OwnershipTypeEnum.COMPANY]: 'Empresa',
  [OwnershipTypeEnum.THIRD_PARTY]: 'Terceros',
}

export const CONSUMABLE_STATUS_LABELS: Record<ConsumableStatusEnum, string> = {
  [ConsumableStatusEnum.AVAILABLE]: 'Disponible',
  [ConsumableStatusEnum.LOW_STOCK]: 'Stock Bajo',
  [ConsumableStatusEnum.OUT_OF_STOCK]: 'Agotado',
  [ConsumableStatusEnum.EXPIRED]: 'Vencido',
}

export const MOVEMENT_TYPE_LABELS: Record<MovementTypeEnum, string> = {
  [MovementTypeEnum.IN]: 'Entrada',
  [MovementTypeEnum.OUT]: 'Salida',
  [MovementTypeEnum.ADJUSTMENT]: 'Ajuste',
}
