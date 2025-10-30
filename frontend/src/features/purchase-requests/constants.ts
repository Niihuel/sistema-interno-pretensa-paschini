export const PURCHASE_REQUEST_STATUS = [
  "PENDING",
  "APPROVED",
  "REJECTED",
  "PURCHASED",
  "RECEIVED"
]

export const PURCHASE_REQUEST_STATUS_OPTIONS = [
  { value: "PENDING", label: "Pendiente" },
  { value: "APPROVED", label: "Aprobada" },
  { value: "REJECTED", label: "Rechazada" },
  { value: "PURCHASED", label: "Comprada" },
  { value: "RECEIVED", label: "Recibida" }
]

export const PURCHASE_REQUEST_PRIORITIES = [
  { value: "LOW", label: "Baja" },
  { value: "MEDIUM", label: "Media" },
  { value: "HIGH", label: "Alta" },
  { value: "URGENT", label: "Urgente" }
]

export const PURCHASE_REQUEST_CATEGORIES = [
  { value: "HARDWARE", label: "Hardware" },
  { value: "SOFTWARE", label: "Software" },
  { value: "CONSUMABLE", label: "Consumible" },
  { value: "SERVICE", label: "Servicio" },
  { value: "OTHER", label: "Otro" }
]

export const getStatusLabel = (status: string): string => {
  const option = PURCHASE_REQUEST_STATUS_OPTIONS.find(opt => opt.value === status)
  return option?.label || status
}

export const getPriorityLabel = (priority: string): string => {
  const option = PURCHASE_REQUEST_PRIORITIES.find(opt => opt.value === priority)
  return option?.label || priority
}

export const getCategoryLabel = (category: string): string => {
  const option = PURCHASE_REQUEST_CATEGORIES.find(opt => opt.value === category)
  return option?.label || category
}

export const getStatusColor = (status: string): string => {
  switch (status) {
    case 'PENDING':
      return 'bg-yellow-500/10 text-yellow-400'
    case 'APPROVED':
      return 'bg-blue-500/10 text-blue-400'
    case 'REJECTED':
      return 'bg-red-500/10 text-red-400'
    case 'PURCHASED':
      return 'bg-purple-500/10 text-purple-400'
    case 'RECEIVED':
      return 'bg-green-500/10 text-green-400'
    default:
      return 'bg-gray-500/10 text-gray-400'
  }
}

export const getPriorityColor = (priority: string): string => {
  switch (priority) {
    case 'LOW':
      return 'bg-green-500/10 text-green-400'
    case 'MEDIUM':
      return 'bg-yellow-500/10 text-yellow-400'
    case 'HIGH':
      return 'bg-orange-500/10 text-orange-400'
    case 'URGENT':
      return 'bg-red-500/10 text-red-400'
    default:
      return 'bg-gray-500/10 text-gray-400'
  }
}
