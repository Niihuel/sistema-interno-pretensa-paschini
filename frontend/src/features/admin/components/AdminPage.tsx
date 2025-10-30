import { useState, useRef } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Shield, UserPlus, ShieldPlus, Trash2, Key, Eye, EyeOff, AlertCircle, Info } from 'lucide-react'
import PageHeader from '../../../shared/components/ui/PageHeader'
import { useUsers, useRoles, useCreateUser, useUpdateUser, useDeleteUser, useCreateRole, useUpdateRole, useDeleteRole, useResetUserPassword } from '../hooks/useAdmin'
import { usersApi } from '../../../api/users.api'
import type { User, Role, UserFormData, RoleFormData } from '../types'
import { ADMIN_TABS, getUserStatusColor, getUserStatusLabel, type AdminTabId } from '../constants'
import Modal from '../../../shared/components/ui/Modal'
import ConfirmDialog from '../../../shared/components/ui/ConfirmDialog'
import Input from '../../../shared/components/ui/Input'
import Select from '../../../shared/components/ui/Select'
import Button from '../../../shared/components/ui/Button'
import { FadeInUp } from '../../../shared/components/ui/AnimatedContainer'
import MobileTable from '../../../shared/components/ui/MobileTable'
import Tabs from '../../../shared/components/ui/Tabs'
import PermissionsManager from './PermissionsManager'
import AdminDashboardTab from './AdminDashboardTab'
import { useToast } from '../../../shared/components/ui/ToastContainer'
import { getErrorMessage, logError } from '../../../utils/errorHelpers'
import LockedAccountsPage from '../../users/components/LockedAccountsPage'
import AreasPage from '../../areas/components/AreasPage'
import ZonesPage from '../../zones/components/ZonesPage'
import SystemBackupsTab from './SystemBackupsTab'
import DailyBackupConfigTab from './DailyBackupConfigTab'
import { usePermissions } from '../../../providers/PermissionsProvider'
import LoadingSpinner from '../../../shared/components/ui/LoadingSpinner'

export default function AdminPage() {
  const toast = useToast()
  const { can } = usePermissions()
  const [activeTab, setActiveTab] = useState<AdminTabId>('dashboard')
  const hasUnsavedChanges = useRef(false)

  const handleTabChange = (tabId: AdminTabId) => {
    if (hasUnsavedChanges.current) {
      // El PermissionsManager manejará la animación del toast
      return
    }
    setActiveTab(tabId)
  }

  const handleHasChanges = (hasChanges: boolean) => {
    hasUnsavedChanges.current = hasChanges
  }

  // Users state
  const [isUserModalOpen, setIsUserModalOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [deleteUserId, setDeleteUserId] = useState<number | null>(null)
  const [userForm, setUserForm] = useState<Partial<UserFormData>>({
    isActive: true
  })
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false)
  const [viewingPasswordUser, setViewingPasswordUser] = useState<User | null>(null)
  const [temporaryPassword, setTemporaryPassword] = useState<string | null>(null)
  const [manualPassword, setManualPassword] = useState<string>('')
  const [passwordMode, setPasswordMode] = useState<'auto' | 'manual'>('auto')
  const [showManualPassword, setShowManualPassword] = useState(false)

  // Roles state
  const [isRoleModalOpen, setIsRoleModalOpen] = useState(false)
  const [editingRole, setEditingRole] = useState<Role | null>(null)
  const [deleteRoleId, setDeleteRoleId] = useState<number | null>(null)
  const [roleForm, setRoleForm] = useState<Partial<RoleFormData>>({})

  // Queries
  const { data: usersData, isLoading: usersLoading } = useUsers()
  const { data: rolesData, isLoading: rolesLoading } = useRoles()

  // Load available roles for user assignment
  const { data: availableRoles = [] } = useQuery({
    queryKey: ['available-roles'],
    queryFn: () => usersApi.getAvailableRoles(),
    staleTime: 5 * 60 * 1000, // 5 minutes
  })

  // Mutations
  const createUserMutation = useCreateUser()
  const updateUserMutation = useUpdateUser()
  const deleteUserMutation = useDeleteUser()
  const resetPasswordMutation = useResetUserPassword()
  const createRoleMutation = useCreateRole()
  const updateRoleMutation = useUpdateRole()
  const deleteRoleMutation = useDeleteRole()

  const users = usersData?.items || []
  const roles = rolesData?.items || []

  // Helper function to format user roles
  const formatUserRoles = (user: User): string => {
    if (!user.userRoles || user.userRoles.length === 0) {
      return 'Sin rol'
    }
    return user.userRoles.map(ur => ur.role.displayName).join(', ')
  }

  // User handlers
  const openCreateUser = () => {
    setEditingUser(null)
    setUserForm({ isActive: true })
    setIsUserModalOpen(true)
  }

  const openEditUser = (user: User) => {
    setEditingUser(user)
    setUserForm({
      username: user.username,
      email: user.email || '',
      firstName: user.firstName || '',
      lastName: user.lastName || '',
      roleIds: user.userRoles?.map(ur => ur.role.id) || [],
      isActive: user.isActive
    })
    setIsUserModalOpen(true)
  }

  const handleSaveUser = async () => {
    if (!userForm.username) {
      toast.error('Campo requerido', 'El nombre de usuario es requerido')
      return
    }

    try {
      if (editingUser) {
        await updateUserMutation.mutateAsync({
          id: editingUser.id,
          data: userForm as UserFormData
        })
        toast.success('Usuario actualizado', 'El usuario se ha actualizado correctamente')
      } else {
        await createUserMutation.mutateAsync(userForm as UserFormData)
        toast.success('Usuario creado', 'El usuario se ha creado correctamente')
      }
      setIsUserModalOpen(false)
      setUserForm({ isActive: true })
      setEditingUser(null)
    } catch (error) {
      logError('AdminPage:handleSaveUser', error)
      toast.error('Error', getErrorMessage(error, 'No se pudo guardar el usuario'))
    }
  }

  const handleDeleteUser = async () => {
    if (!deleteUserId) return

    try {
      await deleteUserMutation.mutateAsync(deleteUserId)
      toast.success('Usuario eliminado', 'El usuario se ha eliminado correctamente')
      setDeleteUserId(null)
    } catch (error) {
      logError('AdminPage:handleDeleteUser', error)
      toast.error('Error', getErrorMessage(error, 'No se pudo eliminar el usuario'))
    }
  }

  const openPasswordModal = (user: User) => {
    setViewingPasswordUser(user)
    setIsPasswordModalOpen(true)
    setPasswordMode('auto')
    setManualPassword('')
    setTemporaryPassword(null)
    setShowManualPassword(false)
  }

  const handleResetPassword = async () => {
    if (!viewingPasswordUser) return

    if (passwordMode === 'manual' && !manualPassword) {
      toast.error('Campo requerido', 'Por favor ingresa una contraseña')
      return
    }

    try {
      const result = await resetPasswordMutation.mutateAsync({
        id: viewingPasswordUser.id,
        password: passwordMode === 'manual' ? manualPassword : undefined
      })

      if (result.tempPassword) {
        setTemporaryPassword(result.tempPassword)
      } else {
        toast.success('Contraseña establecida', 'La contraseña se ha establecido correctamente')
        closePasswordModal()
      }
    } catch (error) {
      logError('AdminPage:handleResetPassword', error)
      toast.error('Error', getErrorMessage(error, 'No se pudo resetear la contraseña'))
    }
  }

  const closePasswordModal = () => {
    setIsPasswordModalOpen(false)
    setViewingPasswordUser(null)
    setTemporaryPassword(null)
    setManualPassword('')
    setPasswordMode('auto')
    setShowManualPassword(false)
  }

  const copyPasswordToClipboard = () => {
    if (temporaryPassword) {
      navigator.clipboard.writeText(temporaryPassword)
      toast.success('Copiado', 'Contraseña copiada al portapapeles')
    }
  }

  // Role handlers
  const openCreateRole = () => {
    setEditingRole(null)
    setRoleForm({})
    setIsRoleModalOpen(true)
  }

  const openEditRole = (role: Role) => {
    setEditingRole(role)
    setRoleForm({
      name: role.name,
      displayName: role.displayName,
      description: role.description || '',
      color: role.color || '#3B82F6',
      level: role.level || 1,
      priority: role.priority || 1,
      isActive: role.isActive
    })
    setIsRoleModalOpen(true)
  }

  const handleSaveRole = async () => {
    if (!roleForm.name || !roleForm.displayName) {
      toast.error('Campos requeridos', 'El nombre y nombre de visualización son requeridos')
      return
    }

    try {
      if (editingRole) {
        await updateRoleMutation.mutateAsync({
          id: editingRole.id,
          data: roleForm as RoleFormData
        })
        toast.success('Rol actualizado', 'El rol se ha actualizado correctamente')
      } else {
        await createRoleMutation.mutateAsync(roleForm as RoleFormData)
        toast.success('Rol creado', 'El rol se ha creado correctamente')
      }
      setIsRoleModalOpen(false)
      setRoleForm({})
      setEditingRole(null)
    } catch (error) {
      logError('AdminPage:handleSaveRole', error)
      toast.error('Error', getErrorMessage(error, 'No se pudo guardar el rol'))
    }
  }

  const handleDeleteRole = async () => {
    if (!deleteRoleId) return

    try {
      await deleteRoleMutation.mutateAsync(deleteRoleId)
      toast.success('Rol eliminado', 'El rol se ha eliminado correctamente')
      setDeleteRoleId(null)
    } catch (error) {
      logError('AdminPage:handleDeleteRole', error)
      toast.error('Error', getErrorMessage(error, 'No se pudo eliminar el rol'))
    }
  }

  // Render tabs
  const renderDashboard = () => <AdminDashboardTab />

  const mobileUsersColumns = [
    { key: "username", label: "Usuario" },
    { key: "email", label: "Email", render: (value: unknown) => String(value || "-") },
    {
      key: "name",
      label: "Nombre",
      render: (_: unknown, item: Record<string, unknown>) => {
        const user = item as unknown as User
        return [user.firstName, user.lastName].filter(Boolean).join(' ') || '-'
      }
    },
    { key: "role", label: "Rol", render: (_: unknown, item: Record<string, unknown>) => formatUserRoles(item as unknown as User) },
    {
      key: "isActive",
      label: "Estado",
      render: (value: unknown) => (
        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getUserStatusColor(Boolean(value))}`}>
          {getUserStatusLabel(Boolean(value))}
        </span>
      )
    },
    {
      key: "actions",
      label: "Acciones",
      render: (_: unknown, item: Record<string, unknown>) => (
        <div className="flex gap-1 justify-end flex-wrap">
          {can('users', 'update') && (
            <Button onClick={() => openEditUser(item as unknown as User)} variant="ghost" size="sm" className="text-xs bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/20 hover:border-blue-500/40">
              Editar
            </Button>
          )}
          {can('users', 'update') && (
            <Button onClick={() => openPasswordModal(item as unknown as User)} variant="ghost" size="sm" className="text-xs bg-yellow-500/10 hover:bg-yellow-500/20 text-yellow-400 border border-yellow-500/20 hover:border-yellow-500/40">
              <Key className="w-3 h-3" />
            </Button>
          )}
          {can('users', 'delete') && (
            <Button onClick={() => setDeleteUserId((item as unknown as User).id)} size="sm" className="text-xs bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 hover:border-red-500/40">
              Eliminar
            </Button>
          )}
        </div>
      )
    }
  ]

  const renderUsers = () => (
    <div className="space-y-6">
      <FadeInUp>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div>
            <h2 className="text-2xl font-bold text-white mb-1">Gestión de Usuarios</h2>
            <p className="text-white/60 text-sm">Administra usuarios del sistema</p>
          </div>
          {can('users', 'create') && (
            <Button onClick={openCreateUser} variant="glass" size="sm">
              <UserPlus className="w-4 h-4 mr-1" />
              Nuevo Usuario
            </Button>
          )}
        </div>

        {/* Desktop Table */}
        <div className="hidden md:block">
          {usersLoading ? (
            <div className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-8 flex justify-center">
              <LoadingSpinner size="md" />
            </div>
          ) : users.length === 0 ? (
            <div className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 py-16 text-center text-white/50">
              No hay usuarios registrados
            </div>
          ) : (
            <div className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10">
              <table className="w-full text-sm">
                <thead className="bg-white/5 border-b border-white/10">
                  <tr>
                    <th className="text-left p-3 text-white/80 font-medium">Usuario</th>
                    <th className="text-left p-3 text-white/80 font-medium">Email</th>
                    <th className="text-left p-3 text-white/80 font-medium">Nombre</th>
                    <th className="text-left p-3 text-white/80 font-medium">Rol</th>
                    <th className="text-left p-3 text-white/80 font-medium">Estado</th>
                    <th className="text-left p-3 text-white/80 font-medium w-32">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map(user => (
                    <tr key={user.id} className="border-t border-white/10 hover:bg-white/5 transition-colors">
                      <td className="p-3 text-white font-medium">{user.username}</td>
                      <td className="p-3 text-white/80">{user.email || '-'}</td>
                      <td className="p-3 text-white/80">
                        {[user.firstName, user.lastName].filter(Boolean).join(' ') || '-'}
                      </td>
                      <td className="p-3 text-white/80">{formatUserRoles(user)}</td>
                      <td className="p-3">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getUserStatusColor(user.isActive)}`}>
                          {getUserStatusLabel(user.isActive)}
                        </span>
                      </td>
                      <td className="p-3">
                        <div className="flex gap-1">
                          {can('users', 'update') && (
                            <Button onClick={() => openEditUser(user)} variant="ghost" size="sm" className="text-xs bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/20 hover:border-blue-500/40">
                              Editar
                            </Button>
                          )}
                          {can('users', 'update') && (
                            <Button onClick={() => openPasswordModal(user)} variant="ghost" size="sm" className="text-xs bg-yellow-500/10 hover:bg-yellow-500/20 text-yellow-400 border border-yellow-500/20 hover:border-yellow-500/40" title="Resetear contraseña">
                              <Key className="w-3 h-3" />
                            </Button>
                          )}
                          {can('users', 'delete') && (
                            <Button onClick={() => setDeleteUserId(user.id)} size="sm" className="text-xs bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 hover:border-red-500/40">
                              Eliminar
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Mobile Table */}
        <div className="md:hidden">
          <MobileTable
            data={users as unknown as Record<string, unknown>[]}
            columns={mobileUsersColumns}
            loading={usersLoading}
            emptyMessage="No hay usuarios registrados"
          />
        </div>
      </FadeInUp>
    </div>
  )

  const renderRoles = () => (
    <div className="space-y-6">
      <FadeInUp>
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-2xl font-bold text-white mb-1">Gestión de Roles</h2>
            <p className="text-white/60 text-sm">Administra roles y permisos</p>
          </div>
          {can('roles', 'create') && (
            <Button onClick={openCreateRole} variant="glass" size="sm">
              <ShieldPlus className="w-4 h-4 mr-1" />
              Nuevo Rol
            </Button>
          )}
        </div>

        {rolesLoading ? (
          <div className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-8 flex justify-center">
            <LoadingSpinner size="md" />
          </div>
        ) : roles.length === 0 ? (
          <div className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 py-16 text-center text-white/50">
            No hay roles registrados
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {roles.map(role => (
              <div key={role.id} className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-lg flex items-center justify-center"
                      style={{ backgroundColor: `${role.color || '#3B82F6'}20` }}
                    >
                      <Shield className="w-5 h-5" style={{ color: role.color || '#3B82F6' }} />
                    </div>
                    <div>
                      <h3 className="font-medium text-white text-sm">{role.displayName}</h3>
                      <p className="text-xs text-white/60">{role.name}</p>
                    </div>
                  </div>
                </div>

                {role.description && (
                  <p className="text-xs text-white/60 mb-3 line-clamp-2">{role.description}</p>
                )}

                <div className="flex items-center justify-between text-xs text-white/60 mb-3">
                  <span>Nivel: {role.level || 1}</span>
                  <span>Usuarios: {role._count?.userRoles || 0}</span>
                </div>

                <div className="flex gap-2">
                  {can('roles', 'update') && (
                    <button
                      onClick={() => openEditRole(role)}
                      className="flex-1 px-3 py-2 bg-white/5 hover:bg-white/10 text-white rounded-lg text-sm transition-colors"
                    >
                      Editar
                    </button>
                  )}
                  {can('roles', 'delete') && !role.isSystem && (
                    <button
                      onClick={() => setDeleteRoleId(role.id)}
                      className="px-3 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg text-sm transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </FadeInUp>
    </div>
  )

  // Check permissions
  if (!can('admin', 'access')) {
    return (
      <div className="text-white px-2 sm:px-0">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="text-red-400 text-xl mb-2">Acceso Denegado</div>
            <div className="text-white/60">No tienes permisos para acceder al panel de administración.</div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="text-white px-2 sm:px-0">
      <FadeInUp>
        <PageHeader
          title="Panel de Administración"
          description="Gestiona usuarios, roles y configuración del sistema"
          icon={Shield}
        />

        {/* Tabs */}
        <Tabs
          tabs={[...ADMIN_TABS]}
          activeTab={activeTab}
          onChange={(tabId: string) => handleTabChange(tabId as AdminTabId)}
          className="mb-6"
        />

        {/* Content */}
        <div className="min-h-[500px]">
          {activeTab === 'dashboard' && renderDashboard()}
          {activeTab === 'users' && renderUsers()}
          {activeTab === 'roles' && renderRoles()}
          {activeTab === 'permissions' && <PermissionsManager onHasChanges={handleHasChanges} />}
          {activeTab === 'locked-accounts' && <LockedAccountsPage />}
          {activeTab === 'areas' && <AreasPage />}
          {activeTab === 'zones' && <ZonesPage />}
          {activeTab === 'backups' && <SystemBackupsTab />}
          {activeTab === 'daily-backup-config' && <DailyBackupConfigTab />}
        </div>
      </FadeInUp>

      {/* User Modal */}
      <Modal
        isOpen={isUserModalOpen}
        onClose={() => {
          setIsUserModalOpen(false)
          setEditingUser(null)
          setUserForm({ isActive: true })
        }}
        title={editingUser ? 'Editar Usuario' : 'Nuevo Usuario'}
        footer={
          <div className="flex gap-3">
            <Button variant="default" onClick={() => {
                setIsUserModalOpen(false)
                setEditingUser(null)
                setUserForm({ isActive: true })
              }} className="flex-1">
              Cancelar
            </Button>
            <Button variant="glass" onClick={handleSaveUser} className="flex-1">
              {editingUser ? 'Actualizar' : 'Crear'}
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          <Input
            label="Nombre de Usuario *"
            value={userForm.username || ''}
            onChange={(e) => setUserForm({ ...userForm, username: e.target.value })}
            placeholder="usuario123"
            required
          />

          <Input
            label="Email"
            type="email"
            value={userForm.email || ''}
            onChange={(e) => setUserForm({ ...userForm, email: e.target.value })}
            placeholder="usuario@ejemplo.com"
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Nombre"
              value={userForm.firstName || ''}
              onChange={(e) => setUserForm({ ...userForm, firstName: e.target.value })}
              placeholder="Juan"
            />

            <Input
              label="Apellido"
              value={userForm.lastName || ''}
              onChange={(e) => setUserForm({ ...userForm, lastName: e.target.value })}
              placeholder="Pérez"
            />
          </div>

          <Select
            label="Rol *"
            value={userForm.roleIds?.[0]?.toString() || ''}
            onChange={(e) => {
              const roleId = e.target.value ? parseInt(e.target.value) : undefined
              setUserForm({ ...userForm, roleIds: roleId ? [roleId] : [] })
            }}
            options={[
              { value: '', label: 'Seleccionar rol' },
              ...availableRoles.map(role => ({
                value: role.id.toString(),
                label: `${role.displayName} (Nivel ${role.level})`
              }))
            ]}
            required
          />

          {!editingUser && (
            <Input
              label="Contraseña *"
              type="password"
              value={userForm.password || ''}
              onChange={(e) => setUserForm({ ...userForm, password: e.target.value })}
              placeholder="••••••••"
              required
            />
          )}

          <div className="flex items-center gap-2 p-3 rounded-lg bg-white/5 border border-white/10">
            <input
              type="checkbox"
              id="isActive"
              checked={userForm.isActive || false}
              onChange={(e) => setUserForm({ ...userForm, isActive: e.target.checked })}
              className="w-4 h-4 rounded border-white/20 bg-black/30"
            />
            <label htmlFor="isActive" className="text-sm text-white/80 cursor-pointer">
              Usuario Activo
            </label>
          </div>
        </div>
      </Modal>

      {/* Role Modal */}
      <Modal
        isOpen={isRoleModalOpen}
        onClose={() => {
          setIsRoleModalOpen(false)
          setEditingRole(null)
          setRoleForm({})
        }}
        title={editingRole ? 'Editar Rol' : 'Nuevo Rol'}
        footer={
          <div className="flex gap-3">
            <Button variant="default" onClick={() => {
                setIsRoleModalOpen(false)
                setEditingRole(null)
                setRoleForm({})
              }} className="flex-1">
              Cancelar
            </Button>
            <Button variant="glass" onClick={handleSaveRole} className="flex-1">
              {editingRole ? 'Actualizar' : 'Crear'}
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          <Input
            label="Nombre (ID) *"
            value={roleForm.name || ''}
            onChange={(e) => setRoleForm({ ...roleForm, name: e.target.value })}
            placeholder="admin"
            required
          />

          <Input
            label="Nombre de Visualización *"
            value={roleForm.displayName || ''}
            onChange={(e) => setRoleForm({ ...roleForm, displayName: e.target.value })}
            placeholder="Administrador"
            required
          />

          <div>
            <label className="block text-xs font-medium text-white/60 mb-1 uppercase tracking-wide">
              Descripción
            </label>
            <textarea
              className="w-full px-3 py-2 rounded-md bg-black/30 border border-white/10 text-white placeholder-white/40 focus:outline-none focus:border-white/20 resize-none"
              rows={3}
              value={roleForm.description || ''}
              onChange={(e) => setRoleForm({ ...roleForm, description: e.target.value })}
              placeholder="Descripción del rol..."
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Input
              label="Color"
              type="color"
              value={roleForm.color || '#3B82F6'}
              onChange={(e) => setRoleForm({ ...roleForm, color: e.target.value })}
            />

            <Input
              label="Nivel"
              type="number"
              min="1"
              value={roleForm.level || 1}
              onChange={(e) => setRoleForm({ ...roleForm, level: parseInt(e.target.value) || 1 })}
            />

            <Input
              label="Prioridad"
              type="number"
              min="1"
              value={roleForm.priority || 1}
              onChange={(e) => setRoleForm({ ...roleForm, priority: parseInt(e.target.value) || 1 })}
            />
          </div>

          {editingRole && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-white/5 border border-white/10">
              <input
                type="checkbox"
                id="roleIsActive"
                checked={roleForm.isActive !== undefined ? roleForm.isActive : true}
                onChange={(e) => setRoleForm({ ...roleForm, isActive: e.target.checked })}
                className="w-4 h-4 rounded border-white/20 bg-black/30"
              />
              <label htmlFor="roleIsActive" className="text-sm text-white/80 cursor-pointer">
                Rol Activo
              </label>
            </div>
          )}
        </div>
      </Modal>

      {/* Delete Dialogs */}
      <ConfirmDialog
        isOpen={deleteUserId !== null}
        onClose={() => setDeleteUserId(null)}
        onConfirm={handleDeleteUser}
        title="Eliminar Usuario"
        message="¿Estás seguro de que quieres eliminar este usuario? Esta acción no se puede deshacer."
        variant="danger"
      />

      <ConfirmDialog
        isOpen={deleteRoleId !== null}
        onClose={() => setDeleteRoleId(null)}
        onConfirm={handleDeleteRole}
        title="Eliminar Rol"
        message="¿Estás seguro de que quieres eliminar este rol? Esta acción no se puede deshacer."
        variant="danger"
      />

      {/* Password Reset Modal */}
      <Modal
        isOpen={isPasswordModalOpen}
        onClose={closePasswordModal}
        title={temporaryPassword ? "Contraseña Temporal Generada" : "Resetear Contraseña"}
        footer={
          temporaryPassword ? (
            <div className="flex gap-3">
              <Button variant="glass" onClick={copyPasswordToClipboard} className="flex-1">
                Copiar Contraseña
              </Button>
              <Button variant="default" onClick={closePasswordModal} className="flex-1">
                Cerrar
              </Button>
            </div>
          ) : (
            <div className="flex gap-3">
              <Button variant="default" onClick={closePasswordModal} className="flex-1">
                Cancelar
              </Button>
              <Button variant="glass" onClick={handleResetPassword} className="flex-1">
                {passwordMode === 'auto' ? 'Generar Temporal' : 'Establecer Contraseña'}
              </Button>
            </div>
          )
        }
      >
        <div className="space-y-4">
          {temporaryPassword ? (
            <>
              <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-yellow-400 mb-1">
                      Importante
                    </p>
                    <p className="text-sm text-white/80">
                      Se ha generado una contraseña temporal para el usuario <strong>{viewingPasswordUser?.username}</strong>.
                      Esta contraseña expirará en <strong>24 horas</strong> y el usuario deberá cambiarla al iniciar sesión.
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white/5 border border-white/10 rounded-lg p-4">
                <label className="block text-xs font-medium text-white/60 mb-2 uppercase tracking-wide">
                  Contraseña Temporal
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={temporaryPassword || ''}
                    className="flex-1 px-3 py-2 rounded-md bg-black/30 border border-white/10 text-white font-mono text-lg"
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={copyPasswordToClipboard}
                    className="bg-white/5 hover:bg-white/10"
                  >
                    Copiar
                  </Button>
                </div>
              </div>

              <div className="bg-white/5 border border-white/10 rounded-lg p-4">
                <p className="text-xs text-white/60">
                  <strong>Nota de seguridad:</strong> Asegúrate de entregar esta contraseña al usuario de forma segura
                  (por ejemplo, en persona o mediante un canal cifrado). Esta contraseña solo se muestra una vez.
                </p>
              </div>
            </>
          ) : (
            <>
              <div className="bg-white/5 border border-white/10 rounded-lg p-4">
                <p className="text-sm text-white/80 mb-2">
                  Resetear contraseña para: <strong>{viewingPasswordUser?.username}</strong>
                </p>
              </div>

              <div className="space-y-3">
                <label className="block text-xs font-medium text-white/60 mb-2 uppercase tracking-wide">
                  Tipo de Contraseña
                </label>

                <div className="flex gap-3">
                  <button
                    onClick={() => setPasswordMode('auto')}
                    className={`flex-1 px-4 py-3 rounded-lg border transition-all ${
                      passwordMode === 'auto'
                        ? 'bg-blue-500/20 border-blue-500/40 text-blue-400'
                        : 'bg-white/5 border-white/10 text-white/60 hover:bg-white/10'
                    }`}
                  >
                    <div className="text-sm font-medium">Automática</div>
                    <div className="text-xs mt-1">Genera contraseña temporal (24h)</div>
                  </button>

                  <button
                    onClick={() => setPasswordMode('manual')}
                    className={`flex-1 px-4 py-3 rounded-lg border transition-all ${
                      passwordMode === 'manual'
                        ? 'bg-blue-500/20 border-blue-500/40 text-blue-400'
                        : 'bg-white/5 border-white/10 text-white/60 hover:bg-white/10'
                    }`}
                  >
                    <div className="text-sm font-medium">Manual</div>
                    <div className="text-xs mt-1">Define contraseña permanente</div>
                  </button>
                </div>
              </div>

              {passwordMode === 'manual' && (
                <div className="bg-white/5 border border-white/10 rounded-lg p-4">
                  <label className="block text-xs font-medium text-white/60 mb-2 uppercase tracking-wide">
                    Nueva Contraseña *
                  </label>
                  <div className="relative">
                    <input
                      type={showManualPassword ? 'text' : 'password'}
                      value={manualPassword}
                      onChange={(e) => setManualPassword(e.target.value)}
                      className="w-full px-3 py-2 pr-12 rounded-md bg-black/30 border border-white/10 text-white placeholder-white/40 focus:outline-none focus:border-white/20"
                      placeholder="Ingresa la contraseña"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowManualPassword(!showManualPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-white/50 hover:text-white/70 transition-colors"
                    >
                      {showManualPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                  <p className="text-xs text-white/60 mt-2">
                    Esta contraseña será permanente y el usuario podrá usarla inmediatamente.
                  </p>
                </div>
              )}

              {passwordMode === 'auto' && (
                <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
                  <div className="flex items-start gap-2">
                    <Info className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                    <p className="text-xs text-blue-400">
                      Se generará una contraseña aleatoria de 12 caracteres que expirará en 24 horas.
                    </p>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </Modal>
    </div>
  )
}



