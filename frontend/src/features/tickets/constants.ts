export const TICKET_STATUS = [
  "Abierto",
  "En Progreso",
  "Resuelto",
  "Cerrado"
]

export const TICKET_PRIORITIES = [
  "Baja",
  "Media",
  "Alta",
  "Urgente"
]

export const TICKET_CATEGORIES = [
  "Problemas técnicos",
  "Internet",
  "Calipso",
  "Programas",
  "Impresoras",
  "Cámaras",
  "Capacitación",
  "Qnap/Z",
  "Mail",
  "Reunión",
  "Antivirus",
  "Generador",
  "Hardware",
  "Otros"
]

// Mapear valores de BD a español
export const mapStatusToSpanish = (status: string): string => {
  switch (status?.toUpperCase()) {
    case 'OPEN': return 'Abierto'
    case 'IN_PROGRESS': return 'En Progreso'
    case 'RESOLVED': return 'Resuelto'
    case 'CLOSED': return 'Cerrado'
    default: return status
  }
}

export const mapPriorityToSpanish = (priority: string): string => {
  switch (priority?.toUpperCase()) {
    case 'LOW': return 'Baja'
    case 'MEDIUM': return 'Media'
    case 'HIGH': return 'Alta'
    case 'URGENT': return 'Urgente'
    default: return priority
  }
}

// Mapear español a valores de BD
export const mapStatusToDB = (status: string): string => {
  switch (status) {
    case 'Abierto': return 'OPEN'
    case 'En Progreso': return 'IN_PROGRESS'
    case 'Resuelto': return 'RESOLVED'
    case 'Cerrado': return 'CLOSED'
    default: return status
  }
}

export const mapPriorityToDB = (priority: string): string => {
  switch (priority) {
    case 'Baja': return 'LOW'
    case 'Media': return 'MEDIUM'
    case 'Alta': return 'HIGH'
    case 'Urgente': return 'URGENT'
    default: return priority
  }
}

export const getStatusColor = (status: string): string => {
  const normalized = status?.toLowerCase()?.trim()
  switch (normalized) {
    case 'open':
    case 'abierto':
      return 'bg-blue-500/10 text-blue-400'
    case 'in_progress':
    case 'en progreso':
      return 'bg-yellow-500/10 text-yellow-400'
    case 'resolved':
    case 'resuelto':
      return 'bg-green-500/10 text-green-400'
    case 'closed':
    case 'cerrado':
      return 'bg-gray-500/10 text-gray-400'
    default:
      return 'bg-gray-500/10 text-gray-400'
  }
}

export const getPriorityColor = (priority: string): string => {
  const normalized = priority?.toLowerCase()?.trim()
  switch (normalized) {
    case 'low':
    case 'baja':
      return 'bg-gray-500/10 text-gray-400'
    case 'medium':
    case 'media':
      return 'bg-blue-500/10 text-blue-400'
    case 'high':
    case 'alta':
      return 'bg-yellow-500/10 text-yellow-400'
    case 'urgent':
    case 'urgente':
      return 'bg-red-500/10 text-red-400'
    default:
      return 'bg-gray-500/10 text-gray-400'
  }
}
