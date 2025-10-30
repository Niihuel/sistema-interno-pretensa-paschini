export interface Equipment {
  id: number
  name: string
  type: string
  status: string
  location?: string | null
  area?: string | null
  areaId?: number | null
  areaRelation?: {
    id: number
    name: string
  } | null
  zoneId?: number | null
  zoneRelation?: {
    id: number
    name: string
    areaId: number
  } | null
  serialNumber?: string | null
  ip?: string | null
  macAddress?: string | null
  // Campos específicos para computadoras/laptops
  cpuNumber?: string | null
  motherboard?: string | null
  processor?: string | null
  ram?: string | null
  storage?: string | null
  operatingSystem?: string | null
  brand?: string | null
  model?: string | null
  assignedToId?: number | null
  assignedTo?: {
    id: number
    firstName: string
    lastName: string
    area?: string | null
    position?: string | null
  } | null
  // Campos adicionales
  storageType?: string | null
  storageCapacity?: string | null
  ipAddress?: string | null
  screenSize?: string | null
  dvdUnit?: boolean
  purchaseDate?: string | null
  notes?: string | null
  isPersonalProperty?: boolean
  createdAt?: string
  updatedAt?: string
}

export interface EquipmentResponse {
  items: Equipment[]
  total: number
  page: number
  limit: number
}

export interface EquipmentFormData {
  name: string
  type: string
  status: string
  location?: string | null
  area?: string | null
  areaId?: string | null
  zoneId?: string | null
  serialNumber?: string | null
  ip?: string | null
  macAddress?: string | null
  cpuNumber?: string | null
  motherboard?: string | null
  processor?: string | null
  ram?: string | null
  storage?: string | null
  operatingSystem?: string | null
  brand?: string | null
  model?: string | null
  assignedToId?: number | null
  storageType?: string | null
  storageCapacity?: string | null
  ipAddress?: string | null
  screenSize?: string | null
  dvdUnit?: boolean
  purchaseDate?: string | null
  notes?: string | null
  isPersonalProperty?: boolean
}

export interface EquipmentFilters {
  name?: string
  type?: string
  status?: string
  area?: string
  areaId?: number
}
