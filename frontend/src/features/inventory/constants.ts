export const INVENTORY_CATEGORIES = [
  { value: "KEYBOARD", label: "Teclados" },
  { value: "MOUSE", label: "Mouse" },
  { value: "CAMERA", label: "Cámaras" },
  { value: "MICROPHONE", label: "Micrófonos" },
  { value: "CABLE", label: "Cables" },
  { value: "COMPONENT", label: "Componentes" },
  { value: "ACCESSORY", label: "Accesorios" },
  { value: "OTHER", label: "Otros" }
]

export const INVENTORY_STATUS = [
  { value: "AVAILABLE", label: "Disponible" },
  { value: "ASSIGNED", label: "Asignado" },
  { value: "STORAGE", label: "En Almacenamiento" },
  { value: "REPAIR", label: "En Reparación" },
  { value: "RETIRED", label: "Retirado" }
]

export const INVENTORY_CONDITION = [
  { value: "NEW", label: "Nuevo" },
  { value: "USED", label: "Usado" },
  { value: "REFURBISHED", label: "Reacondicionado" },
  { value: "DAMAGED", label: "Dañado" }
]

export const getCategoryLabel = (category: string): string => {
  const option = INVENTORY_CATEGORIES.find(opt => opt.value === category)
  return option?.label || category
}

export const getStatusLabel = (status: string): string => {
  const option = INVENTORY_STATUS.find(opt => opt.value === status)
  return option?.label || status
}

export const getConditionLabel = (condition: string): string => {
  const option = INVENTORY_CONDITION.find(opt => opt.value === condition)
  return option?.label || condition
}

export const getStatusColor = (status: string): string => {
  switch (status) {
    case 'AVAILABLE':
      return 'bg-green-500/10 text-green-400'
    case 'ASSIGNED':
      return 'bg-blue-500/10 text-blue-400'
    case 'STORAGE':
      return 'bg-gray-500/10 text-gray-400'
    case 'REPAIR':
      return 'bg-yellow-500/10 text-yellow-400'
    case 'RETIRED':
      return 'bg-red-500/10 text-red-400'
    default:
      return 'bg-gray-500/10 text-gray-400'
  }
}

export const getConditionColor = (condition: string): string => {
  switch (condition) {
    case 'NEW':
      return 'bg-green-500/10 text-green-400'
    case 'USED':
      return 'bg-blue-500/10 text-blue-400'
    case 'REFURBISHED':
      return 'bg-yellow-500/10 text-yellow-400'
    case 'DAMAGED':
      return 'bg-red-500/10 text-red-400'
    default:
      return 'bg-gray-500/10 text-gray-400'
  }
}
