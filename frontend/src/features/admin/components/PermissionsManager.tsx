import { useState, useEffect, useCallback, useRef } from 'react'
import { Shield, Check, AlertCircle } from 'lucide-react'
import { useRoles, usePermissions, useUpdateRolePermissions } from '../hooks/useAdmin'
import type { Role, Permission } from '../types'
import { FadeInUp } from '../../../shared/components/ui/AnimatedContainer'
import { useToast } from '../../../shared/components/ui/ToastContainer'
import { useBlocker } from 'react-router-dom'
import { translateCategory, translateAction, translateScope, translateResource } from '../i18n/permissions'
import { getErrorMessage, logError } from '../../../utils/errorHelpers'

interface PermissionsManagerProps {
  onHasChanges?: (hasChanges: boolean) => void
}

export default function PermissionsManager({ onHasChanges }: PermissionsManagerProps = {}) {
  const { data: rolesData, isLoading: rolesLoading, refetch: refetchRoles } = useRoles()
  const { data: permissionsData, isLoading: permissionsLoading } = usePermissions()
  const updatePermissionsMutation = useUpdateRolePermissions()
  const toast = useToast()

  const roles = rolesData?.items || []
  const permissionsByCategory = permissionsData || {}

  const [selectedRole, setSelectedRole] = useState<Role | null>(null)
  const [selectedPermissions, setSelectedPermissions] = useState<Set<string>>(new Set())
  const [originalPermissions, setOriginalPermissions] = useState<Set<string>>(new Set())
  const [hasChanges, setHasChanges] = useState(false)
  const [mobileView, setMobileView] = useState<'roles' | 'permissions'>('roles')
  const toastRef = useRef<HTMLDivElement>(null)

  // Cuando se selecciona un rol, cargar sus permisos actuales
  useEffect(() => {
    if (selectedRole) {
      const rolePerms = selectedRole.permissions || []
      setSelectedPermissions(new Set(rolePerms))
      setOriginalPermissions(new Set(rolePerms))
      setHasChanges(false)
    }
  }, [selectedRole])

  // Animación Discord-style: pulso/bounce sutil para llamar la atención
  const bounceToast = useCallback(() => {
    if (toastRef.current) {
      toastRef.current.classList.add('discord-bounce')
      setTimeout(() => {
        toastRef.current?.classList.remove('discord-bounce')
      }, 600)
    }
  }, [])

  // Prevenir navegación del navegador si hay cambios sin guardar
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasChanges) {
        e.preventDefault()
        e.returnValue = ''
      }
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [hasChanges])

  // Bloquear navegación de React Router cuando hay cambios sin guardar
  const blocker = useBlocker(
    ({ currentLocation, nextLocation }) =>
      hasChanges && currentLocation.pathname !== nextLocation.pathname
  )

  // Cuando intenta navegar, hacer bounce en el toast
  useEffect(() => {
    if (blocker.state === 'blocked') {
      setTimeout(() => bounceToast(), 10)
    }
  }, [blocker.state, bounceToast])

  const getPermissionKey = (permission: Permission): string => {
    return `${permission.resource}:${permission.action}:${permission.scope}`
  }

  // Notificar al padre cuando cambia hasChanges
  useEffect(() => {
    onHasChanges?.(hasChanges)
  }, [hasChanges, onHasChanges])

  const togglePermission = (permissionKey: string) => {
    const newPermissions = new Set(selectedPermissions)
    if (newPermissions.has(permissionKey)) {
      newPermissions.delete(permissionKey)
    } else {
      newPermissions.add(permissionKey)
    }
    setSelectedPermissions(newPermissions)
    setHasChanges(true)
  }

  const toggleAllInCategory = (category: string) => {
    const categoryPermissions = permissionsByCategory[category] || []
    const categoryKeys = categoryPermissions.map(getPermissionKey)

    const allSelected = categoryKeys.every(key => selectedPermissions.has(key))

    const newPermissions = new Set(selectedPermissions)
    if (allSelected) {
      // Desmarcar todos
      categoryKeys.forEach(key => newPermissions.delete(key))
    } else {
      // Marcar todos
      categoryKeys.forEach(key => newPermissions.add(key))
    }

    setSelectedPermissions(newPermissions)
    setHasChanges(true)
  }

  const handleSave = async () => {
    if (!selectedRole) return

    try {
      await updatePermissionsMutation.mutateAsync({
        id: selectedRole.id,
        permissions: Array.from(selectedPermissions)
      })

      // Actualizar el estado original para reflejar los nuevos permisos guardados
      setOriginalPermissions(new Set(selectedPermissions))
      setHasChanges(false)

      // Refetch roles para actualizar el contador
      await refetchRoles()

      toast.success('Permisos actualizados correctamente')
    } catch (error) {
      logError('PermissionsManager:updateRolePermissions', error)
      toast.error('Error', getErrorMessage(error, 'Error al guardar los permisos'))
    }
  }

  const handleRestore = () => {
    setSelectedPermissions(new Set(originalPermissions))
    setHasChanges(false)
    toast.info('Cambios restaurados')
  }

  const handleRoleChange = (role: Role) => {
    if (hasChanges) {
      // Aplicar bounce para llamar la atención del usuario
      setTimeout(() => bounceToast(), 10)
      return
    }
    setSelectedRole(role)
    // En móvil, cambiar automáticamente a la vista de permisos
    setMobileView('permissions')
  }

  const handleMobileTabChange = (view: 'roles' | 'permissions') => {
    if (hasChanges) {
      // Aplicar bounce para llamar la atención del usuario
      setTimeout(() => bounceToast(), 10)
      return
    }
    setMobileView(view)
  }

  if (rolesLoading || permissionsLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-white/70">Cargando permisos...</div>
      </div>
    )
  }

  return (
    <>
      <style>{`
        @keyframes discord-bounce {
          0% { transform: scale(1) translateX(-50%); }
          25% { transform: scale(1.05) translateX(-50%) translateY(-5px); }
          50% { transform: scale(1) translateX(-50%); }
          75% { transform: scale(1.02) translateX(-50%) translateY(-2px); }
          100% { transform: scale(1) translateX(-50%); }
        }
        .discord-bounce {
          animation: discord-bounce 0.6s ease-in-out;
        }
      `}</style>

      {/* Navegación móvil - Solo visible en pantallas pequeñas */}
      <div className="lg:hidden mb-4">
        <div className="glass rounded-xl border border-white/10 p-1 flex">
          <button
            onClick={() => handleMobileTabChange('roles')}
            className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-medium transition-all ${
              mobileView === 'roles'
                ? 'bg-blue-500/20 text-white border border-blue-500/50'
                : 'text-white/60 hover:text-white hover:bg-white/5'
            }`}
          >
            <Shield className="w-4 h-4 inline mr-2" />
            Roles {selectedRole && `(${roles.find(r => r.id === selectedRole.id)?.displayName})`}
          </button>
          <button
            onClick={() => handleMobileTabChange('permissions')}
            disabled={!selectedRole}
            className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
              mobileView === 'permissions'
                ? 'bg-blue-500/20 text-white border border-blue-500/50'
                : 'text-white/60 hover:text-white hover:bg-white/5'
            }`}
          >
            <Check className="w-4 h-4 inline mr-2" />
            Permisos
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-[calc(100vh-250px)]">
        {/* Lista de roles - Sidebar con scroll independiente y altura automática */}
        <div className={`lg:col-span-1 flex flex-col ${mobileView === 'permissions' ? 'hidden lg:flex' : ''}`}>
          <FadeInUp>
            <div className="glass rounded-xl border border-white/10 flex flex-col max-h-[calc(100vh-250px)] lg:max-h-[calc(100vh-250px)]">
              {/* Header fijo */}
              <div className="p-4 border-b border-white/10 flex-shrink-0">
                <h3 className="text-lg font-semibold text-white flex items-center">
                  <Shield className="w-5 h-5 mr-2 text-blue-400" />
                  Roles
                </h3>
              </div>

              {/* Lista con scroll automático */}
              <div className="overflow-y-auto p-4">
                <div className="space-y-2">
                  {roles.map((role) => (
                    <button
                      key={role.id}
                      onClick={() => handleRoleChange(role)}
                      className={`w-full text-left p-3 rounded-lg transition-all ${
                        selectedRole?.id === role.id
                          ? 'bg-blue-500/20 border border-blue-500/50 text-white'
                          : 'bg-white/5 border border-white/5 text-white/70 hover:bg-white/10 hover:text-white'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{role.displayName}</span>
                        {role.permissions && (
                          <span className="text-xs bg-white/10 px-2 py-1 rounded">
                            {role.permissions.length}
                          </span>
                        )}
                      </div>
                      {role.description && (
                        <p className="text-xs text-white/50 mt-1">{role.description}</p>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </FadeInUp>
        </div>

      {/* Panel de permisos con scroll independiente y altura fija */}
      <div className={`lg:col-span-3 flex flex-col ${mobileView === 'roles' ? 'hidden lg:flex' : ''}`}>
        <FadeInUp delay={0.1}>
          {selectedRole ? (
            <div className="glass rounded-xl border border-white/10 flex flex-col h-[calc(100vh-250px)] lg:h-[calc(100vh-250px)]">
              {/* Header fijo */}
              <div className="p-6 border-b border-white/10 flex-shrink-0">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-xl font-semibold text-white">
                    Permisos de {selectedRole.displayName}
                  </h3>
                </div>
                <p className="text-white/60 text-sm">
                  Selecciona los permisos que tendrá este rol
                </p>
                {selectedRole.isSystem && (
                  <div className="mt-3 flex items-center gap-2 text-yellow-400 text-sm bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-2">
                    <AlertCircle className="w-4 h-4" />
                    Rol del sistema - Ten cuidado al modificar permisos
                  </div>
                )}
              </div>

              {/* Permisos por categoría con scroll */}
              <div className="flex-1 overflow-y-auto p-4 lg:p-6 space-y-4 lg:space-y-6">
                {Object.entries(permissionsByCategory).map(([category, permissions]) => {
                  const categoryKeys = permissions.map(getPermissionKey)
                  const selectedCount = categoryKeys.filter(key => selectedPermissions.has(key)).length
                  const allSelected = selectedCount === categoryKeys.length

                  return (
                    <div key={category} className="space-y-3">
                      {/* Header de categoría */}
                      <div className="flex items-center justify-between pb-2 border-b border-white/10">
                        <div>
                          <h4 className="text-white font-semibold uppercase text-sm tracking-wide">
                            {translateCategory(category)}
                          </h4>
                          <p className="text-white/50 text-xs mt-0.5">
                            {selectedCount} de {categoryKeys.length} seleccionados
                          </p>
                        </div>
                        <button
                          onClick={() => toggleAllInCategory(category)}
                          className="text-blue-400 hover:text-blue-300 text-sm font-medium transition-colors"
                        >
                          {allSelected ? 'Desmarcar todos' : 'Marcar todos'}
                        </button>
                      </div>

                      {/* Lista de permisos */}
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-2">
                        {permissions.map((permission) => {
                          const permKey = getPermissionKey(permission)
                          const isSelected = selectedPermissions.has(permKey)

                          return (
                            <button
                              key={permission.id}
                              onClick={() => togglePermission(permKey)}
                              className={`p-3 rounded-lg border transition-all text-left active:scale-95 ${
                                isSelected
                                  ? 'bg-blue-500/20 border-blue-500/50 hover:bg-blue-500/30'
                                  : 'bg-white/5 border-white/10 hover:bg-white/10'
                              }`}
                            >
                              <div className="flex items-start justify-between">
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2">
                                    <span className="text-white font-medium text-sm">
                                      {translateAction(permission.action)}
                                    </span>
                                    <span className="text-white/40 text-xs">
                                      ({translateScope(permission.scope)})
                                    </span>
                                  </div>
                                  <p className="text-white/50 text-xs mt-1">
                                    {translateResource(permission.resource)}
                                  </p>
                                  {permission.description && (
                                    <p className="text-white/40 text-xs mt-1">
                                      {permission.description}
                                    </p>
                                  )}
                                </div>
                                <div className={`flex-shrink-0 w-5 h-5 rounded flex items-center justify-center ${
                                  isSelected ? 'bg-blue-500' : 'bg-white/10'
                                }`}>
                                  {isSelected && <Check className="w-3 h-3 text-white" />}
                                </div>
                              </div>
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          ) : (
            <div className="glass rounded-xl border border-white/10 h-full flex items-center justify-center p-6">
              <div className="text-center">
                <Shield className="w-12 h-12 lg:w-16 lg:h-16 text-white/20 mx-auto mb-3 lg:mb-4" />
                <h3 className="text-white text-base lg:text-lg font-semibold mb-1 lg:mb-2">
                  Selecciona un rol
                </h3>
                <p className="text-white/60 text-xs lg:text-sm">
                  {window.innerWidth < 1024 ? 'Usa el tab "Roles" para seleccionar' : 'Selecciona un rol de la lista para gestionar sus permisos'}
                </p>
              </div>
            </div>
          )}
        </FadeInUp>
      </div>

      {/* Toast persistente cuando hay cambios - Estilo Discord con animación bounce - Responsive */}
      {hasChanges && (
        <div
          ref={toastRef}
          className="fixed left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-bottom-3 w-[95%] max-w-2xl"
          style={{
            bottom: 'calc(var(--safe-area-bottom) + 1.25rem)'
          }}
        >
          <div className="glass rounded-lg border border-white/10 px-3 lg:px-4 py-2 lg:py-2.5 shadow-2xl">
            <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-4">
              <span className="text-white/90 text-xs sm:text-sm font-medium text-center sm:text-left">
                Tienes cambios sin guardar
              </span>

              <div className="flex gap-2 w-full sm:w-auto">
                <button
                  onClick={handleRestore}
                  className="flex-1 sm:flex-initial text-white/80 hover:text-white text-xs sm:text-sm font-medium transition-colors px-3 py-1.5 sm:py-1 rounded hover:bg-white/10 active:scale-95"
                >
                  Restaurar
                </button>
                <button
                  onClick={handleSave}
                  disabled={updatePermissionsMutation.isPending}
                  className="flex-1 sm:flex-initial bg-green-600 hover:bg-green-700 disabled:bg-green-600/50 text-white text-xs sm:text-sm font-medium px-4 py-1.5 sm:py-1 rounded transition-colors disabled:cursor-not-allowed active:scale-95"
                >
                  {updatePermissionsMutation.isPending ? 'Guardando...' : 'Guardar cambios'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      </div>
    </>
  )
}
