import { useState } from 'react'
import { usePermissions } from '../../../providers/PermissionsProvider'
import { useLockedAccounts, useUnlockAccount, useLockAccount } from '../hooks/useLockedAccounts'
import type { LockedUser } from '../types'
import { FadeInUp } from '../../../shared/components/ui/AnimatedContainer'
import Button from '../../../shared/components/ui/Button'
import Input from '../../../shared/components/ui/Input'
import Select from '../../../shared/components/ui/Select'
import ConfirmDialog from '../../../shared/components/ui/ConfirmDialog'
import { Unlock, Lock, Search, AlertTriangle, Clock, User, Shield } from 'lucide-react'
import { useToast } from '../../../shared/components/ui/ToastContainer'
import { getErrorMessage, logError } from '../../../utils/errorHelpers'
import LoadingSpinner from '../../../shared/components/ui/LoadingSpinner'

export default function LockedAccountsPage() {
  const { can } = usePermissions()
  const toast = useToast()

  // Filters
  const [searchFilter, setSearchFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  // Data fetching
  const { data: lockedUsers = [], isLoading } = useLockedAccounts()

  // Mutations
  const unlockMutation = useUnlockAccount()
  const lockMutation = useLockAccount()

  // Action confirmation
  const [unlockUserId, setUnlockUserId] = useState<number | null>(null)
  const [lockUserId, setLockUserId] = useState<number | null>(null)

  // Filter users
  const filteredUsers = lockedUsers.filter((user) => {
    const matchesSearch =
      !searchFilter ||
      user.username.toLowerCase().includes(searchFilter.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchFilter.toLowerCase()) ||
      `${user.firstName || ''} ${user.lastName || ''}`.toLowerCase().includes(searchFilter.toLowerCase())

    const matchesStatus =
      statusFilter === 'all' ||
      (statusFilter === 'locked' && user.lockedUntil && new Date(user.lockedUntil) > new Date()) ||
      (statusFilter === 'attempts' && (!user.lockedUntil || new Date(user.lockedUntil) <= new Date()) && user.failedLoginAttempts >= 3)

    return matchesSearch && matchesStatus
  })

  // Handlers
  const handleUnlock = async () => {
    if (unlockUserId) {
      try {
        await unlockMutation.mutateAsync(unlockUserId)
        setUnlockUserId(null)
        toast.success('Cuenta desbloqueada correctamente')
      } catch (error) {
        logError('LockedAccountsPage:handleUnlock', error)
        toast.error('Error al desbloquear', getErrorMessage(error, 'No se pudo desbloquear la cuenta'))
      }
    }
  }

  const handleLock = async () => {
    if (lockUserId) {
      try {
        await lockMutation.mutateAsync(lockUserId)
        setLockUserId(null)
        toast.success('Cuenta bloqueada correctamente')
      } catch (error) {
        logError('LockedAccountsPage:handleLock', error)
        toast.error('Error al bloquear', getErrorMessage(error, 'No se pudo bloquear la cuenta'))
      }
    }
  }

  const isLocked = (user: LockedUser) => {
    return user.lockedUntil && new Date(user.lockedUntil) > new Date()
  }

  const getRemainingTime = (lockedUntil: string) => {
    const now = new Date()
    const lockTime = new Date(lockedUntil)
    const diffMs = lockTime.getTime() - now.getTime()

    if (diffMs <= 0) return 'Expirado'

    const minutes = Math.floor(diffMs / 60000)
    const hours = Math.floor(minutes / 60)
    const days = Math.floor(hours / 24)

    if (days > 0) return `${days}d ${hours % 24}h`
    if (hours > 0) return `${hours}h ${minutes % 60}m`
    return `${minutes}m`
  }

  const getStatusColor = (user: LockedUser) => {
    if (isLocked(user)) return 'red'
    if (user.failedLoginAttempts >= 3) return 'yellow'
    return 'green'
  }

  const getStatusText = (user: LockedUser) => {
    if (isLocked(user)) return 'Bloqueado'
    if (user.failedLoginAttempts >= 3) return 'Advertencia'
    return 'Normal'
  }

  const statusOptions = [
    { value: 'all', label: 'Todos' },
    { value: 'locked', label: 'Bloqueados' },
    { value: 'attempts', label: 'Con intentos fallidos' },
  ]

  // Check permissions
  const canUnlock = can('users', 'update')
  const canLock = can('users', 'update')

  if (!can('users', 'view')) {
    return (
      <div className="text-white px-2 sm:px-0">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="text-red-400 text-xl mb-2">Acceso Denegado</div>
            <div className="text-white/60">No tienes permisos para ver cuentas bloqueadas.</div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="text-white px-2 sm:px-0">
      <FadeInUp>
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-semibold mb-2">Cuentas Bloqueadas</h1>
              <p className="text-white/70">Gestión de cuentas con intentos fallidos y bloqueos</p>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <div className="px-3 py-2 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400">
                <AlertTriangle className="w-4 h-4 inline mr-2" />
                {filteredUsers.filter(u => isLocked(u)).length} bloqueadas
              </div>
              <div className="px-3 py-2 bg-yellow-500/10 border border-yellow-500/20 rounded-lg text-yellow-400">
                <Shield className="w-4 h-4 inline mr-2" />
                {filteredUsers.filter(u => !isLocked(u) && u.failedLoginAttempts >= 3).length} con intentos
              </div>
            </div>
          </div>
        </div>

        <div className="mb-6 p-4 sm:p-6 rounded-xl border border-white/10 bg-white/5 backdrop-blur-sm">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input
              placeholder="Buscar por usuario, email o nombre..."
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              className="bg-white/5"
            />
            <Select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              options={statusOptions}
              className="bg-white/5"
            />
            <Button
              variant="glass"
              onClick={() => {
                setSearchFilter('')
                setStatusFilter('all')
              }}
            >
              <Search className="w-4 h-4 mr-2" />
              Limpiar Filtros
            </Button>
          </div>
        </div>

        <div className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10">
          {isLoading ? (
            <div className="p-8 flex justify-center"><LoadingSpinner size="md" /></div>
          ) : filteredUsers.length === 0 ? (
            <div className="p-8 text-center text-white/60">
              No se encontraron cuentas con problemas de acceso
            </div>
          ) : (
            <div className="overflow-x-auto">
              {/* Desktop Table */}
              <table className="hidden md:table w-full">
                <thead className="bg-white/5">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-white/70 uppercase tracking-wider">Usuario</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-white/70 uppercase tracking-wider">Email</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-white/70 uppercase tracking-wider">Roles</th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-white/70 uppercase tracking-wider">Intentos Fallidos</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-white/70 uppercase tracking-wider">Estado</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-white/70 uppercase tracking-wider">Tiempo Restante</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-white/70 uppercase tracking-wider">Último Acceso</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-white/70 uppercase tracking-wider">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/10">
                  {filteredUsers.map((user) => {
                    const locked = isLocked(user)
                    const statusColor = getStatusColor(user)
                    const statusText = getStatusText(user)

                    return (
                      <tr key={user.id} className="hover:bg-white/5 transition-colors">
                        <td className="px-4 py-3 text-sm">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 flex items-center justify-center">
                              <User className={`w-5 h-5 ${
                                locked ? 'text-red-400' : user.failedLoginAttempts >= 3 ? 'text-yellow-400' : 'text-green-400'
                              }`} />
                            </div>
                            <div>
                              <div className="text-white font-medium">{user.username}</div>
                              {user.firstName && user.lastName && (
                                <div className="text-white/50 text-xs">
                                  {user.firstName} {user.lastName}
                                </div>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm text-white/70">{user.email || '-'}</td>
                        <td className="px-4 py-3 text-sm">
                          <div className="flex flex-wrap gap-1">
                            {user.userRoles.map((ur) => (
                              <span
                                key={ur.role.id}
                                className="px-2 py-1 rounded-full text-xs"
                                style={{
                                  backgroundColor: `${ur.role.color || '#3b82f6'}20`,
                                  color: ur.role.color || '#3b82f6',
                                  border: `1px solid ${ur.role.color || '#3b82f6'}40`,
                                }}
                              >
                                {ur.role.displayName}
                              </span>
                            ))}
                            {user.userRoles.length === 0 && <span className="text-white/50">-</span>}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm text-center">
                          <div className="flex items-center justify-center gap-1">
                            <AlertTriangle
                              className={`w-4 h-4 ${
                                user.failedLoginAttempts >= 5
                                  ? 'text-red-400'
                                  : user.failedLoginAttempts >= 3
                                  ? 'text-yellow-400'
                                  : 'text-green-400'
                              }`}
                            />
                            <span className="text-white font-medium">{user.failedLoginAttempts}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm">
                          <span
                            className={`px-2 py-1 rounded-full text-xs ${
                              statusColor === 'red'
                                ? 'bg-red-500/10 text-red-400 border border-red-500/20'
                                : statusColor === 'yellow'
                                ? 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20'
                                : 'bg-green-500/10 text-green-400 border border-green-500/20'
                            }`}
                          >
                            {statusText}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm">
                          {locked && user.lockedUntil ? (
                            <div className="flex items-center gap-1 text-red-400">
                              <Clock className="w-4 h-4" />
                              <span>{getRemainingTime(user.lockedUntil)}</span>
                            </div>
                          ) : (
                            <span className="text-white/50">-</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-sm text-white/70">
                          {user.lastLoginAt
                            ? new Date(user.lastLoginAt).toLocaleString('es-ES', {
                                dateStyle: 'short',
                                timeStyle: 'short',
                              })
                            : 'Nunca'}
                        </td>
                        <td className="px-4 py-3 text-sm">
                          <div className="flex gap-2">
                            {locked && canUnlock && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setUnlockUserId(user.id)}
                                className="text-xs bg-green-500/10 hover:bg-green-500/20 text-green-400 border border-green-500/20 hover:border-green-500/40"
                              >
                                <Unlock className="w-3 h-3 mr-1" />
                                Desbloquear
                              </Button>
                            )}
                            {!locked && canLock && (
                              <Button
                                size="sm"
                                onClick={() => setLockUserId(user.id)}
                                className="text-xs bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 hover:border-red-500/40"
                              >
                                <Lock className="w-3 h-3 mr-1" />
                                Bloquear
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>

              {/* Mobile Cards */}
              <div className="md:hidden space-y-4 p-4">
                {filteredUsers.map((user) => {
                  const locked = isLocked(user)
                  const statusColor = getStatusColor(user)
                  const statusText = getStatusText(user)

                  return (
                    <div key={user.id} className="bg-white/5 backdrop-blur-sm rounded-lg border border-white/10 p-4">
                      <div className="flex items-start gap-3 mb-3">
                        <div className="w-12 h-12 flex items-center justify-center">
                          <User className={`w-7 h-7 ${
                            locked ? 'text-red-400' : user.failedLoginAttempts >= 3 ? 'text-yellow-400' : 'text-green-400'
                          }`} />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-start justify-between mb-1">
                            <div>
                              <h3 className="text-white font-medium">{user.username}</h3>
                              {user.firstName && user.lastName && (
                                <p className="text-white/60 text-sm">
                                  {user.firstName} {user.lastName}
                                </p>
                              )}
                            </div>
                            <span
                              className={`px-2 py-1 rounded-full text-xs ${
                                statusColor === 'red'
                                  ? 'bg-red-500/10 text-red-400'
                                  : statusColor === 'yellow'
                                  ? 'bg-yellow-500/10 text-yellow-400'
                                  : 'bg-green-500/10 text-green-400'
                              }`}
                            >
                              {statusText}
                            </span>
                          </div>
                          {user.email && <p className="text-white/50 text-xs mb-2">{user.email}</p>}
                          <div className="flex flex-wrap gap-1 mb-2">
                            {user.userRoles.map((ur) => (
                              <span
                                key={ur.role.id}
                                className="px-2 py-1 rounded-full text-xs"
                                style={{
                                  backgroundColor: `${ur.role.color || '#3b82f6'}20`,
                                  color: ur.role.color || '#3b82f6',
                                }}
                              >
                                {ur.role.displayName}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3 mb-3 text-sm">
                        <div>
                          <div className="text-white/50 text-xs mb-1">Intentos Fallidos</div>
                          <div className="flex items-center gap-1">
                            <AlertTriangle
                              className={`w-4 h-4 ${
                                user.failedLoginAttempts >= 5
                                  ? 'text-red-400'
                                  : user.failedLoginAttempts >= 3
                                  ? 'text-yellow-400'
                                  : 'text-green-400'
                              }`}
                            />
                            <span className="text-white font-medium">{user.failedLoginAttempts}</span>
                          </div>
                        </div>
                        {locked && user.lockedUntil && (
                          <div>
                            <div className="text-white/50 text-xs mb-1">Tiempo Restante</div>
                            <div className="flex items-center gap-1 text-red-400">
                              <Clock className="w-4 h-4" />
                              <span>{getRemainingTime(user.lockedUntil)}</span>
                            </div>
                          </div>
                        )}
                        <div className="col-span-2">
                          <div className="text-white/50 text-xs mb-1">Último Acceso</div>
                          <div className="text-white/70">
                            {user.lastLoginAt
                              ? new Date(user.lastLoginAt).toLocaleString('es-ES', {
                                  dateStyle: 'short',
                                  timeStyle: 'short',
                                })
                              : 'Nunca'}
                          </div>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        {locked && canUnlock && (
                          <Button
                            variant="glass"
                            size="sm"
                            onClick={() => setUnlockUserId(user.id)}
                            className="flex-1 bg-green-500/10 hover:bg-green-500/20 text-green-400 border border-green-500/20"
                          >
                            <Unlock className="w-3 h-3 mr-1" />
                            Desbloquear
                          </Button>
                        )}
                        {!locked && canLock && (
                          <Button
                            variant="danger"
                            size="sm"
                            onClick={() => setLockUserId(user.id)}
                            className="flex-1"
                          >
                            <Lock className="w-3 h-3 mr-1" />
                            Bloquear
                          </Button>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      </FadeInUp>

      {/* Unlock Confirmation */}
      <ConfirmDialog
        isOpen={unlockUserId !== null}
        onClose={() => setUnlockUserId(null)}
        onConfirm={handleUnlock}
        title="Desbloquear Cuenta"
        message="¿Estás seguro de que deseas desbloquear esta cuenta? Se restablecerán los intentos fallidos de inicio de sesión."
        confirmText="Desbloquear"
        cancelText="Cancelar"
        variant="default"
      />

      {/* Lock Confirmation */}
      <ConfirmDialog
        isOpen={lockUserId !== null}
        onClose={() => setLockUserId(null)}
        onConfirm={handleLock}
        title="Bloquear Cuenta"
        message="¿Estás seguro de que deseas bloquear esta cuenta manualmente? La cuenta permanecerá bloqueada durante 24 horas."
        confirmText="Bloquear"
        cancelText="Cancelar"
        variant="danger"
      />
    </div>
  )
}
