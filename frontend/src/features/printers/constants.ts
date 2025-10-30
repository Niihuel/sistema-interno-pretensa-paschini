export const PRINTER_STATUS = [
  "ACTIVE",
  "INACTIVE",
  "MAINTENANCE"
]

export const PRINTER_STATUS_OPTIONS = [
  { value: "ACTIVE", label: "Activa" },
  { value: "INACTIVE", label: "Inactiva" },
  { value: "MAINTENANCE", label: "En Mantenimiento" }
]

export const getStatusLabel = (status: string): string => {
  const option = PRINTER_STATUS_OPTIONS.find(opt => opt.value === status)
  return option?.label || status
}

export const getStatusColor = (status: string): string => {
  switch (status) {
    case 'ACTIVE':
      return 'bg-green-500/10 text-green-400'
    case 'INACTIVE':
      return 'bg-gray-500/10 text-gray-400'
    case 'MAINTENANCE':
      return 'bg-yellow-500/10 text-yellow-400'
    default:
      return 'bg-gray-500/10 text-gray-400'
  }
}
