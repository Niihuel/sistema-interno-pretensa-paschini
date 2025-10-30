export const EQUIPMENT_TYPES = [
  "Desktop",
  "Notebook",
  "Celular",
  "Modem",
  "Tablet",
  "Impresora",
  "Servidor",
  "Otro"
]

export const EQUIPMENT_STATUS = [
  "Activo",
  "En Almacenamiento",
  "De Baja",
  "En Reparación",
  "Finalizado"
]

export const EQUIPMENT_AREAS = [
  "RRHH",
  "sistemas",
  "compras",
  "calidad",
  "finanzas",
  "directorio",
  "tecnica pretensa",
  "tecnica paschini",
  "ventas",
  "produccion",
  "logistica",
  "laboratorio",
  "taller pretensa",
  "taller paschini",
  "pañol",
  "mantenimiento",
  "proveedores",
  "recepcion",
  "guardia",
  "planta hormigonera",
  "comedor"
]

export const EQUIPMENT_LOCATIONS = [
  "RRHH",
  "sistemas",
  "compras",
  "calidad",
  "finanzas",
  "directorio",
  "tecnica pretensa",
  "tecnica paschini",
  "ventas",
  "produccion",
  "logistica",
  "laboratorio",
  "taller pretensa",
  "taller paschini",
  "pañol",
  "mantenimiento",
  "proveedores",
  "recepcion",
  "guardia",
  "planta hormigonera",
  "comedor"
]

export const OPERATING_SYSTEMS = [
  "Windows 10 Pro",
  "Windows 10 Home",
  "Windows 11 Pro",
  "Windows 11 Home",
  "Windows Server 2019",
  "Windows Server 2022",
  "Ubuntu 20.04",
  "Ubuntu 22.04",
  "CentOS 7",
  "CentOS 8",
  "macOS Monterey",
  "macOS Ventura"
]

export const getStatusStyle = (status: string) => {
  const normalizedStatus = status?.toLowerCase()?.trim()
  switch (normalizedStatus) {
    case 'activo':
      return 'bg-green-500/10 text-green-400'
    case 'en almacenamiento':
      return 'bg-blue-500/10 text-blue-400'
    case 'en reparación':
    case 'en reparacion':
      return 'bg-yellow-500/10 text-yellow-400'
    case 'de baja':
    case 'finalizado':
      return 'bg-red-500/10 text-red-400'
    default:
      return 'bg-gray-500/10 text-gray-400'
  }
}

export const getStatusLabel = (status: string) => {
  const normalizedStatus = status?.toLowerCase()?.trim()
  switch (normalizedStatus) {
    case 'activo':
      return 'Activo'
    case 'en almacenamiento':
      return 'En Almacenamiento'
    case 'en reparación':
    case 'en reparacion':
      return 'En Reparación'
    case 'de baja':
      return 'De Baja'
    case 'finalizado':
      return 'Finalizado'
    default:
      return status
  }
}
