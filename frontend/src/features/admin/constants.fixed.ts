import { Users, Shield, BarChart3, ShieldAlert, Building2, MapPin, HardDrive, Settings } from 'lucide-react'

export const ADMIN_TABS = [
  { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
  { id: 'users', label: 'Usuarios', icon: Users },
  { id: 'roles', label: 'Roles', icon: Shield },
  { id: 'permissions', label: 'Permisos', icon: Shield },
  { id: 'locked-accounts', label: 'Cuentas Bloqueadas', icon: ShieldAlert },
  { id: 'areas', label: 'Areas', icon: Building2 },
  { id: 'zones', label: 'Zonas', icon: MapPin },
  { id: 'backups', label: 'Backups del Sistema', icon: HardDrive },
  { id: 'daily-backup-config', label: 'Config Backups Diarios', icon: Settings },
] as const

export type AdminTabId = (typeof ADMIN_TABS)[number]['id']

export const USER_ROLES = [
  { value: 'ADMIN', label: 'Administrador' },
  { value: 'USER', label: 'Usuario' },
  { value: 'VIEWER', label: 'Visualizador' }
]

export const getUserStatusColor = (isActive: boolean): string => {
  return isActive
    ? 'bg-green-500/10 text-green-400'
    : 'bg-red-500/10 text-red-400'
}

export const getUserStatusLabel = (isActive: boolean): string => {
  return isActive ? 'Activo' : 'Inactivo'
}

