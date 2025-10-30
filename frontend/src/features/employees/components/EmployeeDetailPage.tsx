import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useEmployeeDetailed, useCreateWindowsAccount, useUpdateWindowsAccount, useDeleteWindowsAccount, useCreateQnapAccount, useUpdateQnapAccount, useDeleteQnapAccount, useCreateCalipsoAccount, useUpdateCalipsoAccount, useDeleteCalipsoAccount, useCreateEmailAccount, useUpdateEmailAccount, useDeleteEmailAccount } from '../hooks/useEmployees'
import { useAuth } from '../../../providers/AuthProvider'
import { useToast } from '../../../shared/components/ui/ToastContainer'
import { FadeInUp } from '../../../shared/components/ui/AnimatedContainer'
import Modal from '../../../shared/components/ui/Modal'
import Input from '../../../shared/components/ui/Input'
import Select from '../../../shared/components/ui/Select'
import ConfirmDialog from '../../../shared/components/ui/ConfirmDialog'
import Button from '../../../shared/components/ui/Button'
import Tabs from '../../../shared/components/ui/Tabs'
import { ArrowLeft, User, Monitor, HardDrive, Database, Mail, Laptop, Package, Ticket, ShoppingCart, Eye, EyeOff, Plus, Edit2, Trash2, MapPin, Cpu, Info, Calendar } from 'lucide-react'
import type { WindowsAccount, QnapAccount, CalipsoAccount, EmailAccount, WindowsAccountPayload, UpdateWindowsAccountPayload, QnapAccountPayload, UpdateQnapAccountPayload, CalipsoAccountPayload, UpdateCalipsoAccountPayload, EmailAccountPayload, UpdateEmailAccountPayload, EmployeeAccount, EquipmentAssignment, InventoryAssignment, TicketSummary, PurchaseRequestSummary } from '../types'
import { getErrorMessage, logError } from '../../../utils/errorHelpers'

type AccountType = 'windows' | 'qnap' | 'calipso' | 'email'

interface AccountFormState {
  username: string
  password: string
  domain?: string
  userGroup?: string
  folderPermissions?: string
  quotaLimit?: string
  permissions?: string
  email?: string
  accountType?: string
  notes?: string
  isActive: boolean
}

interface AccountModalState {
  type: AccountType
  mode: 'create' | 'edit'
  accountId?: number
  accountData?: EmployeeAccount
}

const getAccountLabel = (type: AccountType) => {
  switch (type) {
    case 'windows':
      return 'Windows'
    case 'qnap':
      return 'QNAP'
    case 'calipso':
      return 'Calipso'
    case 'email':
      return 'Email'
    default:
      return 'Cuenta'
  }
}

const getDefaultAccountForm = (type: AccountType): AccountFormState => {
  const base: AccountFormState = {
    username: '',
    password: '',
    domain: 'PRETENSA',
    userGroup: '',
    folderPermissions: '',
    quotaLimit: '',
    permissions: '',
    email: '',
    accountType: 'Personal',
    notes: '',
    isActive: true,
  }

  switch (type) {
    case 'windows':
      return { ...base, domain: 'PRETENSA' }
    case 'email':
      return { ...base, accountType: 'Personal' }
    default:
      return base
  }
}

const mapAccountToForm = (type: AccountType, account: Partial<EmployeeAccount> = {}): AccountFormState => {
  const base = getDefaultAccountForm(type)

  switch (type) {
    case 'windows':
      return {
        ...base,
        username: (account as Partial<WindowsAccount>).username || '',
        domain: (account as Partial<WindowsAccount>).domain || 'PRETENSA',
        notes: (account as Partial<WindowsAccount>).notes || '',
        isActive: (account as Partial<WindowsAccount>).isActive ?? true,
      }
    case 'qnap':
      return {
        ...base,
        username: (account as Partial<QnapAccount>).username || '',
        userGroup: (account as Partial<QnapAccount>).userGroup || '',
        folderPermissions: (account as Partial<QnapAccount>).folderPermissions || '',
        quotaLimit: (account as Partial<QnapAccount>).quotaLimit || '',
        notes: (account as Partial<QnapAccount>).notes || '',
        isActive: (account as Partial<QnapAccount>).isActive ?? true,
      }
    case 'calipso':
      return {
        ...base,
        username: (account as Partial<CalipsoAccount>).username || '',
        permissions: (account as Partial<CalipsoAccount>).permissions || '',
        notes: (account as Partial<CalipsoAccount>).notes || '',
        isActive: (account as Partial<CalipsoAccount>).isActive ?? true,
      }
    case 'email':
      return {
        ...base,
        email: (account as Partial<EmailAccount>).email || '',
        accountType: (account as Partial<EmailAccount>).accountType || 'Personal',
        notes: (account as Partial<EmailAccount>).notes || '',
        isActive: (account as Partial<EmailAccount>).isActive ?? true,
      }
    default:
      return base
  }
}

export default function EmployeeDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { hasPermission } = useAuth()
  const employeeId = Number(id) || 0
  const toast = useToast()
  const [activeTab, setActiveTab] = useState('general')
  const [showPasswords, setShowPasswords] = useState<Record<string, boolean>>({})
  const [showFormPassword, setShowFormPassword] = useState(false)
  const [accountModal, setAccountModal] = useState<AccountModalState | null>(null)
  const [accountForm, setAccountForm] = useState<AccountFormState>(getDefaultAccountForm('windows'))
  const [accountToDelete, setAccountToDelete] = useState<{ type: AccountType; accountId: number } | null>(null)

  const { data: employee, isLoading, error } = useEmployeeDetailed(employeeId)

  // Permisos granulares para gestión de cuentas
  const canManageWindowsAccounts = hasPermission('employees:manage-windows-accounts:all') || hasPermission('employees:update:all')
  const canManageQnapAccounts = hasPermission('employees:manage-qnap-accounts:all') || hasPermission('employees:update:all')
  const canManageCalipsoAccounts = hasPermission('employees:manage-calipso-accounts:all') || hasPermission('employees:update:all')
  const canManageEmailAccounts = hasPermission('employees:manage-email-accounts:all') || hasPermission('employees:update:all')
  const canViewPasswords = hasPermission('employees:view-passwords:all')

  const createWindowsAccount = useCreateWindowsAccount(employeeId)
  const updateWindowsAccount = useUpdateWindowsAccount(employeeId)
  const deleteWindowsAccount = useDeleteWindowsAccount(employeeId)
  const createQnapAccount = useCreateQnapAccount(employeeId)
  const updateQnapAccount = useUpdateQnapAccount(employeeId)
  const deleteQnapAccount = useDeleteQnapAccount(employeeId)
  const createCalipsoAccount = useCreateCalipsoAccount(employeeId)
  const updateCalipsoAccount = useUpdateCalipsoAccount(employeeId)
  const deleteCalipsoAccount = useDeleteCalipsoAccount(employeeId)
  const createEmailAccount = useCreateEmailAccount(employeeId)
  const updateEmailAccount = useUpdateEmailAccount(employeeId)
  const deleteEmailAccount = useDeleteEmailAccount(employeeId)

  const isSavingAccount =
    createWindowsAccount.isPending ||
    updateWindowsAccount.isPending ||
    createQnapAccount.isPending ||
    updateQnapAccount.isPending ||
    createCalipsoAccount.isPending ||
    updateCalipsoAccount.isPending ||
    createEmailAccount.isPending ||
    updateEmailAccount.isPending

  const isDeletingAccount =
    deleteWindowsAccount.isPending ||
    deleteQnapAccount.isPending ||
    deleteCalipsoAccount.isPending ||
    deleteEmailAccount.isPending

  const togglePassword = (accountId: string) => {
    setShowPasswords(prev => ({
      ...prev,
      [accountId]: !prev[accountId]
    }))
  }

  const openAccountModal = (type: AccountType, mode: 'create' | 'edit', account?: EmployeeAccount) => {
    if (mode === 'edit' && account) {
      setAccountForm(mapAccountToForm(type, account))
      setAccountModal({ type, mode, accountId: account.id, accountData: account })
    } else {
      setAccountForm(getDefaultAccountForm(type))
      setAccountModal({ type, mode })
    }
  }

  const handleCloseAccountModal = () => {
    if (isSavingAccount) return
    setAccountModal(null)
    setAccountForm(getDefaultAccountForm('windows'))
    setShowFormPassword(false)
  }

  const handleConfirmDelete = (type: AccountType, accountId: number) => {
    setAccountToDelete({ type, accountId })
  }

  const handleAccountSubmit = async () => {
    if (!accountModal || isSavingAccount) return

    const { type, mode, accountId } = accountModal
    const label = getAccountLabel(type)
    const trim = (value?: string | null) => {
      if (value === undefined || value === null) return undefined
      const trimmed = value.trim()
      return trimmed.length ? trimmed : undefined
    }

    try {
      switch (type) {
        case 'windows': {
          if (!accountForm.username.trim()) {
            toast.error('Datos incompletos', 'El usuario es obligatorio.')
            return
          }
          const base: WindowsAccountPayload = {
            username: accountForm.username.trim(),
            domain: trim(accountForm.domain) ?? 'PRETENSA',
            notes: trim(accountForm.notes) ?? '',
            isActive: accountForm.isActive,
          }

          if (mode === 'create') {
            if (!accountForm.password.trim()) {
              toast.error('Datos incompletos', 'La contraseña es obligatoria.')
              return
            }
            await createWindowsAccount.mutateAsync({
              ...base,
              password: accountForm.password,
            })
          } else if (accountId) {
            const payload: UpdateWindowsAccountPayload = { ...base, password: accountForm.password.trim() ? accountForm.password : undefined }
            await updateWindowsAccount.mutateAsync({ accountId, payload })
          }
          break
        }
        case 'qnap': {
          if (!accountForm.username.trim()) {
            toast.error('Datos incompletos', 'El usuario es obligatorio.')
            return
          }
          const base: QnapAccountPayload = {
            username: accountForm.username.trim(),
            password: trim(accountForm.password),
            userGroup: trim(accountForm.userGroup) ?? '',
            folderPermissions: trim(accountForm.folderPermissions) ?? '',
            quotaLimit: trim(accountForm.quotaLimit) ?? '',
            notes: trim(accountForm.notes) ?? '',
            isActive: accountForm.isActive,
          }

          if (mode === 'create') {
            await createQnapAccount.mutateAsync(base)
          } else if (accountId) {
            const payload: UpdateQnapAccountPayload = { ...base }
            if (!trim(accountForm.password)) {
              delete payload.password
            }
            await updateQnapAccount.mutateAsync({ accountId, payload })
          }
          break
        }
        case 'calipso': {
          if (!accountForm.username.trim()) {
            toast.error('Datos incompletos', 'El usuario es obligatorio.')
            return
          }
          const base: CalipsoAccountPayload = {
            username: accountForm.username.trim(),
            password: trim(accountForm.password),
            permissions: trim(accountForm.permissions) ?? '',
            notes: trim(accountForm.notes) ?? '',
            isActive: accountForm.isActive,
          }

          if (mode === 'create') {
            await createCalipsoAccount.mutateAsync(base)
          } else if (accountId) {
            const payload: UpdateCalipsoAccountPayload = { ...base }
            if (!trim(accountForm.password)) {
              delete payload.password
            }
            await updateCalipsoAccount.mutateAsync({ accountId, payload })
          }
          break
        }
        case 'email': {
          if (!accountForm.email || !accountForm.email.trim()) {
            toast.error('Datos incompletos', 'El email es obligatorio.')
            return
          }
          const base: EmailAccountPayload = {
            email: accountForm.email.trim(),
            password: trim(accountForm.password),
            accountType: accountForm.accountType || 'Personal',
            notes: trim(accountForm.notes) ?? '',
            isActive: accountForm.isActive,
          }

          if (mode === 'create') {
            await createEmailAccount.mutateAsync(base)
          } else if (accountId) {
            const payload: UpdateEmailAccountPayload = { ...base }
            if (!trim(accountForm.password)) {
              delete payload.password
            }
            await updateEmailAccount.mutateAsync({ accountId, payload })
          }
          break
        }
        default:
          break
      }

      toast.success(
        mode === 'create' ? `Cuenta ${label} creada` : `Cuenta ${label} actualizada`,
        mode === 'create' ? 'La cuenta se guardó correctamente.' : 'La cuenta se actualizó correctamente.'
      )

      setAccountForm(getDefaultAccountForm(type))
      setAccountModal(null)
      setShowFormPassword(false)
    } catch (error) {
      logError('EmployeeDetailPage:handleAccountSubmit', error)
      toast.error('Error al guardar la cuenta', getErrorMessage(error, 'No se pudo completar la operación.'))
    }
  }

  const handleDeleteAccount = async () => {
    if (!accountToDelete || isDeletingAccount) return

    const { type, accountId } = accountToDelete
    const label = getAccountLabel(type)

    try {
      switch (type) {
        case 'windows':
          await deleteWindowsAccount.mutateAsync(accountId)
          break
        case 'qnap':
          await deleteQnapAccount.mutateAsync(accountId)
          break
        case 'calipso':
          await deleteCalipsoAccount.mutateAsync(accountId)
          break
        case 'email':
          await deleteEmailAccount.mutateAsync(accountId)
          break
        default:
          break
      }

      toast.success(`Cuenta ${label} eliminada`, 'La cuenta se eliminó correctamente.')
      setAccountToDelete(null)
    } catch (error) {
      logError('EmployeeDetailPage:handleDeleteAccount', error)
      toast.error('Error al eliminar la cuenta', getErrorMessage(error, 'No se pudo completar la operación.'))
    }
  }

  const renderAccountForm = () => {
    if (!accountModal || !employee) return null

    const state = accountForm
    const statusOptions = [
      { value: 'true', label: 'Activa' },
      { value: 'false', label: 'Inactiva' },
    ]

    // Campo de empleado bloqueado (común a todos los formularios)
    const employeeField = (
      <div className="md:col-span-2 mb-4 p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
        <label className="block text-sm font-medium text-white/80 mb-2">
          Empleado
        </label>
        <div className="flex items-center gap-3">
          <User className="w-5 h-5 text-blue-400" />
          <div>
            <p className="text-white font-medium">
              {employee.firstName} {employee.lastName}
            </p>
            <p className="text-white/60 text-sm">
              {employee.position || 'Sin puesto'} - {employee.area?.name || 'Sin área'}
            </p>
          </div>
        </div>
      </div>
    )

    switch (accountModal.type) {
      case 'windows':
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {employeeField}
            <Input
              label="Usuario *"
              value={state.username}
              onChange={(e) => setAccountForm({ ...state, username: e.target.value })}
              disabled={isSavingAccount}
            />
            <Input
              label="Dominio"
              value={state.domain || ''}
              onChange={(e) => setAccountForm({ ...state, domain: e.target.value })}
              disabled={isSavingAccount}
            />
            <div>
              <label className="block text-sm font-medium text-white/80 mb-2">
                {accountModal.mode === 'edit' ? 'Contraseña (opcional)' : 'Contraseña *'}
              </label>
              <div className="relative">
                <input
                  type={showFormPassword ? 'text' : 'password'}
                  value={state.password}
                  onChange={(e) => setAccountForm({ ...state, password: e.target.value })}
                  disabled={isSavingAccount}
                  className="w-full px-4 py-2 pr-12 rounded-lg bg-white/10 border border-white/20 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-white/40 disabled:opacity-50 disabled:cursor-not-allowed"
                />
                <button
                  type="button"
                  onClick={() => setShowFormPassword(!showFormPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/60 hover:text-white transition-colors"
                  disabled={isSavingAccount}
                >
                  {showFormPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>
            <Select
              label="Estado"
              value={state.isActive ? 'true' : 'false'}
              onChange={(e) => setAccountForm({ ...state, isActive: e.target.value === 'true' })}
              options={statusOptions}
              disabled={isSavingAccount}
            />
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-white/80 mb-2">Notas</label>
              <textarea
                className="w-full min-h-[100px] px-4 py-2 rounded-lg bg-white/10 border border-white/20 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-white/40"
                value={state.notes || ''}
                onChange={(e) => setAccountForm({ ...state, notes: e.target.value })}
                disabled={isSavingAccount}
              />
            </div>
          </div>
        )
      case 'qnap':
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {employeeField}
            <Input
              label="Usuario *"
              value={state.username}
              onChange={(e) => setAccountForm({ ...state, username: e.target.value })}
              disabled={isSavingAccount}
            />
            <div>
              <label className="block text-sm font-medium text-white/80 mb-2">
                {accountModal.mode === 'edit' ? 'Contraseña (opcional)' : 'Contraseña'}
              </label>
              <div className="relative">
                <input
                  type={showFormPassword ? 'text' : 'password'}
                  value={state.password}
                  onChange={(e) => setAccountForm({ ...state, password: e.target.value })}
                  disabled={isSavingAccount}
                  className="w-full px-4 py-2 pr-12 rounded-lg bg-white/10 border border-white/20 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-white/40 disabled:opacity-50 disabled:cursor-not-allowed"
                />
                <button
                  type="button"
                  onClick={() => setShowFormPassword(!showFormPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/60 hover:text-white transition-colors"
                  disabled={isSavingAccount}
                >
                  {showFormPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>
            <Input
              label="Grupo"
              value={state.userGroup || ''}
              onChange={(e) => setAccountForm({ ...state, userGroup: e.target.value })}
              disabled={isSavingAccount}
            />
            <Input
              label="Permisos de carpeta"
              value={state.folderPermissions || ''}
              onChange={(e) => setAccountForm({ ...state, folderPermissions: e.target.value })}
              disabled={isSavingAccount}
            />
            <Input
              label="Cuota"
              value={state.quotaLimit || ''}
              onChange={(e) => setAccountForm({ ...state, quotaLimit: e.target.value })}
              disabled={isSavingAccount}
            />
            <Select
              label="Estado"
              value={state.isActive ? 'true' : 'false'}
              onChange={(e) => setAccountForm({ ...state, isActive: e.target.value === 'true' })}
              options={statusOptions}
              disabled={isSavingAccount}
            />
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-white/80 mb-2">Notas</label>
              <textarea
                className="w-full min-h-[100px] px-4 py-2 rounded-lg bg-white/10 border border-white/20 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-white/40"
                value={state.notes || ''}
                onChange={(e) => setAccountForm({ ...state, notes: e.target.value })}
                disabled={isSavingAccount}
              />
            </div>
          </div>
        )
      case 'calipso':
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {employeeField}
            <Input
              label="Usuario *"
              value={state.username}
              onChange={(e) => setAccountForm({ ...state, username: e.target.value })}
              disabled={isSavingAccount}
            />
            <div>
              <label className="block text-sm font-medium text-white/80 mb-2">
                {accountModal.mode === 'edit' ? 'Contraseña (opcional)' : 'Contraseña'}
              </label>
              <div className="relative">
                <input
                  type={showFormPassword ? 'text' : 'password'}
                  value={state.password}
                  onChange={(e) => setAccountForm({ ...state, password: e.target.value })}
                  disabled={isSavingAccount}
                  className="w-full px-4 py-2 pr-12 rounded-lg bg-white/10 border border-white/20 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-white/40 disabled:opacity-50 disabled:cursor-not-allowed"
                />
                <button
                  type="button"
                  onClick={() => setShowFormPassword(!showFormPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/60 hover:text-white transition-colors"
                  disabled={isSavingAccount}
                >
                  {showFormPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>
            <Input
              label="Permisos"
              value={state.permissions || ''}
              onChange={(e) => setAccountForm({ ...state, permissions: e.target.value })}
              disabled={isSavingAccount}
            />
            <Select
              label="Estado"
              value={state.isActive ? 'true' : 'false'}
              onChange={(e) => setAccountForm({ ...state, isActive: e.target.value === 'true' })}
              options={statusOptions}
              disabled={isSavingAccount}
            />
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-white/80 mb-2">Notas</label>
              <textarea
                className="w-full min-h-[100px] px-4 py-2 rounded-lg bg-white/10 border border-white/20 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-white/40"
                value={state.notes || ''}
                onChange={(e) => setAccountForm({ ...state, notes: e.target.value })}
                disabled={isSavingAccount}
              />
            </div>
          </div>
        )
      case 'email':
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {employeeField}
            <Input
              label="Email *"
              type="email"
              value={state.email || ''}
              onChange={(e) => setAccountForm({ ...state, email: e.target.value })}
              disabled={isSavingAccount}
            />
            <div>
              <label className="block text-sm font-medium text-white/80 mb-2">
                {accountModal.mode === 'edit' ? 'Contraseña (opcional)' : 'Contraseña'}
              </label>
              <div className="relative">
                <input
                  type={showFormPassword ? 'text' : 'password'}
                  value={state.password}
                  onChange={(e) => setAccountForm({ ...state, password: e.target.value })}
                  disabled={isSavingAccount}
                  className="w-full px-4 py-2 pr-12 rounded-lg bg-white/10 border border-white/20 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-white/40 disabled:opacity-50 disabled:cursor-not-allowed"
                />
                <button
                  type="button"
                  onClick={() => setShowFormPassword(!showFormPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/60 hover:text-white transition-colors"
                  disabled={isSavingAccount}
                >
                  {showFormPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>
            <Select
              label="Tipo"
              value={state.accountType || 'Personal'}
              onChange={(e) => setAccountForm({ ...state, accountType: e.target.value })}
              options={[
                { value: 'Personal', label: 'Personal' },
                { value: 'Compartida', label: 'Compartida' },
                { value: 'Servicio', label: 'Servicio' },
              ]}
              disabled={isSavingAccount}
            />
            <Select
              label="Estado"
              value={state.isActive ? 'true' : 'false'}
              onChange={(e) => setAccountForm({ ...state, isActive: e.target.value === 'true' })}
              options={statusOptions}
              disabled={isSavingAccount}
            />
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-white/80 mb-2">Notas</label>
              <textarea
                className="w-full min-h-[100px] px-4 py-2 rounded-lg bg-white/10 border border-white/20 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-white/40"
                value={state.notes || ''}
                onChange={(e) => setAccountForm({ ...state, notes: e.target.value })}
                disabled={isSavingAccount}
              />
            </div>
          </div>
        )
      default:
        return null
    }
  }

  const tabs = [
    { id: 'general', label: 'General', icon: User },
    { id: 'equipment', label: 'Equipos', icon: Laptop },
    { id: 'windows', label: 'Windows', icon: Monitor },
    { id: 'qnap', label: 'QNAP', icon: HardDrive },
    { id: 'calipso', label: 'Calipso', icon: Database },
    { id: 'email', label: 'Email', icon: Mail },
    { id: 'inventory', label: 'Inventario', icon: Package },
    { id: 'tickets', label: 'Tickets', icon: Ticket },
    { id: 'purchases', label: 'Compras', icon: ShoppingCart },
  ]

  if (isLoading) {
    return (
      <div className="text-white px-2 sm:px-0">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-white/60">Cargando información del empleado...</div>
        </div>
      </div>
    )
  }

  if (error || !employee) {
    return (
      <div className="text-white px-2 sm:px-0">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="text-red-400 text-xl mb-2">Error al cargar empleado</div>
            <div className="text-white/60 mb-4">No se pudo obtener la información del empleado.</div>
            <Button variant="glass" onClick={() => navigate('/employees')}>
              Volver a Empleados
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="text-white px-2 sm:px-0">
      <FadeInUp>
        {/* Header */}
        <div className="mb-6">
          <Button variant="glass" size="sm" onClick={() => navigate('/employees')} className="mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver
          </Button>

          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-semibold mb-2">
                {employee.firstName} {employee.lastName}
              </h1>
              <p className="text-white/70">{employee.position || 'Sin puesto asignado'} - {employee.area?.name || 'Sin área'}</p>
            </div>
            <span
              className={`px-4 py-2 rounded-full text-sm font-medium ${
                employee.status === 'ACTIVE'
                  ? 'bg-green-500/10 text-green-400 border border-green-500/20'
                  : 'bg-red-500/10 text-red-400 border border-red-500/20'
              }`}
            >
              {employee.status === 'ACTIVE' ? 'Activo' : 'Inactivo'}
            </span>
          </div>
        </div>

        {/* Tabs */}
        <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} className="mb-6" />

        {/* Tab Content */}
        <div className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-6 min-h-[400px]">
          {activeTab === 'general' && (
            <div className="space-y-6">
              {/* Información General */}
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <User className="w-5 h-5 text-blue-400" />
                  <h2 className="text-xl font-semibold">Información General</h2>
                </div>
                <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <InfoItem label="Nombre completo" value={`${employee.firstName} ${employee.lastName}`} />
                    <InfoItem label="Estado" value={employee.status === 'ACTIVE' ? 'Activo' : 'Inactivo'} />
                    <InfoItem label="Email" value={employee.email || 'No registrado'} />
                    <InfoItem label="Teléfono" value={employee.phone || 'No registrado'} />
                    <InfoItem label="Área" value={employee.area?.name || 'No asignada'} />
                    <InfoItem label="Puesto" value={employee.position || 'No asignado'} />
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'equipment' && (
            <div>
              <h2 className="text-xl font-semibold mb-4">Equipos Asignados</h2>
              {employee.equipmentAssigned.length === 0 ? (
                <EmptyState message="No hay equipos asignados" />
              ) : (
                <div className="space-y-6">
                  {employee.equipmentAssigned.map((equipment: EquipmentAssignment) => (
                    <div key={equipment.id} className="bg-white/5 rounded-lg border border-white/10 p-6">
                      {/* Header del equipo */}
                      <div className="flex items-center justify-between mb-4 pb-4 border-b border-white/10">
                        <div>
                          <h3 className="text-xl font-semibold text-white flex items-center gap-2">
                            <Monitor className="w-6 h-6 text-blue-400" />
                            {equipment.name}
                          </h3>
                          <p className="text-gray-400 mt-1">{equipment.type}</p>
                        </div>
                        <StatusBadge status={equipment.status} />
                      </div>

                      {/* Contenido en grid similar al modal */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Información General */}
                        <div className="space-y-4">
                          <h4 className="text-lg font-semibold text-white flex items-center gap-2">
                            <Info className="w-5 h-5" />
                            Información General
                          </h4>
                          <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                              <span className="text-gray-400">Estado:</span>
                              <span className={`font-medium ${
                                equipment.status === 'Activo' ? 'text-green-400' :
                                equipment.status === 'Inactivo' ? 'text-red-400' :
                                'text-yellow-400'
                              }`}>{equipment.status}</span>
                            </div>
                            {equipment.serialNumber && (
                              <div className="flex justify-between">
                                <span className="text-gray-400">Serie:</span>
                                <span className="text-white font-mono">{equipment.serialNumber}</span>
                              </div>
                            )}
                            {equipment.brand && (
                              <div className="flex justify-between">
                                <span className="text-gray-400">Marca:</span>
                                <span className="text-white">{equipment.brand}</span>
                              </div>
                            )}
                            {equipment.model && (
                              <div className="flex justify-between">
                                <span className="text-gray-400">Modelo:</span>
                                <span className="text-white">{equipment.model}</span>
                              </div>
                            )}
                            {equipment.purchaseDate && (
                              <div className="flex justify-between">
                                <span className="text-gray-400">Fecha de compra:</span>
                                <span className="text-white">{new Date(equipment.purchaseDate).toLocaleDateString('es-ES', {
                                  year: 'numeric',
                                  month: 'long',
                                  day: 'numeric'
                                })}</span>
                              </div>
                            )}
                            <div className="flex justify-between">
                              <span className="text-gray-400">Propiedad personal:</span>
                              <span className="text-white">{equipment.isPersonalProperty ? 'Sí' : 'No'}</span>
                            </div>
                          </div>
                        </div>

                        {/* Ubicación */}
                        <div className="space-y-4">
                          <h4 className="text-lg font-semibold text-white flex items-center gap-2">
                            <MapPin className="w-5 h-5" />
                            Ubicación
                          </h4>
                          <div className="space-y-2 text-sm">
                            {equipment.location && (
                              <div className="flex justify-between">
                                <span className="text-gray-400">Ubicación:</span>
                                <span className="text-white">{equipment.location}</span>
                              </div>
                            )}
                            {equipment.area && (
                              <div className="flex justify-between">
                                <span className="text-gray-400">Área:</span>
                                <span className="text-white">{equipment.area}</span>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Especificaciones Técnicas */}
                        {(equipment.processor || equipment.ram || equipment.storage || equipment.operatingSystem) && (
                          <div className="space-y-4">
                            <h4 className="text-lg font-semibold text-white flex items-center gap-2">
                              <Cpu className="w-5 h-5" />
                              Especificaciones Técnicas
                            </h4>
                            <div className="space-y-2 text-sm">
                              {equipment.processor && (
                                <div className="flex justify-between">
                                  <span className="text-gray-400">Procesador:</span>
                                  <span className="text-white">{equipment.processor}</span>
                                </div>
                              )}
                              {equipment.ram && (
                                <div className="flex justify-between">
                                  <span className="text-gray-400">RAM:</span>
                                  <span className="text-white">{equipment.ram}</span>
                                </div>
                              )}
                              {equipment.storage && (
                                <div className="flex justify-between">
                                  <span className="text-gray-400">Almacenamiento:</span>
                                  <span className="text-white">{equipment.storage}</span>
                                </div>
                              )}
                              {equipment.storageType && (
                                <div className="flex justify-between">
                                  <span className="text-gray-400">Tipo de almacenamiento:</span>
                                  <span className="text-white">{equipment.storageType}</span>
                                </div>
                              )}
                              {equipment.storageCapacity && (
                                <div className="flex justify-between">
                                  <span className="text-gray-400">Capacidad:</span>
                                  <span className="text-white">{equipment.storageCapacity}</span>
                                </div>
                              )}
                              {equipment.motherboard && (
                                <div className="flex justify-between">
                                  <span className="text-gray-400">Placa madre:</span>
                                  <span className="text-white">{equipment.motherboard}</span>
                                </div>
                              )}
                              {equipment.operatingSystem && (
                                <div className="flex justify-between">
                                  <span className="text-gray-400">Sistema operativo:</span>
                                  <span className="text-white">{equipment.operatingSystem}</span>
                                </div>
                              )}
                              {equipment.screenSize && (
                                <div className="flex justify-between">
                                  <span className="text-gray-400">Tamaño de pantalla:</span>
                                  <span className="text-white">{equipment.screenSize}</span>
                                </div>
                              )}
                              {equipment.dvdUnit !== undefined && (
                                <div className="flex justify-between">
                                  <span className="text-gray-400">Unidad DVD:</span>
                                  <span className="text-white">{equipment.dvdUnit ? 'Sí' : 'No'}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Configuración de Red */}
                        {(equipment.ip || equipment.ipAddress || equipment.macAddress) && (
                          <div className="space-y-4">
                            <h4 className="text-lg font-semibold text-white flex items-center gap-2">
                              <HardDrive className="w-5 h-5" />
                              Configuración de Red
                            </h4>
                            <div className="space-y-2 text-sm">
                              {equipment.ip && (
                                <div className="flex justify-between">
                                  <span className="text-gray-400">IP:</span>
                                  <span className="text-white font-mono">{equipment.ip}</span>
                                </div>
                              )}
                              {equipment.ipAddress && equipment.ipAddress !== equipment.ip && (
                                <div className="flex justify-between">
                                  <span className="text-gray-400">Dirección IP:</span>
                                  <span className="text-white font-mono">{equipment.ipAddress}</span>
                                </div>
                              )}
                              {equipment.macAddress && (
                                <div className="flex justify-between">
                                  <span className="text-gray-400">MAC:</span>
                                  <span className="text-white font-mono">{equipment.macAddress}</span>
                                </div>
                              )}
                              {equipment.cpuNumber && (
                                <div className="flex justify-between">
                                  <span className="text-gray-400">CPU #:</span>
                                  <span className="text-white font-mono">{equipment.cpuNumber}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Notas */}
                        {equipment.notes && (
                          <div className="space-y-4 md:col-span-2">
                            <h4 className="text-lg font-semibold text-white">Notas</h4>
                            <p className="text-gray-300 text-sm bg-white/5 rounded-lg p-4 whitespace-pre-wrap">
                              {equipment.notes}
                            </p>
                          </div>
                        )}

                        {/* Registro */}
                        <div className="space-y-4 md:col-span-2">
                          <h4 className="text-lg font-semibold text-white flex items-center gap-2">
                            <Calendar className="w-5 h-5" />
                            Registro
                          </h4>
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            {equipment.createdAt && (
                              <div className="flex justify-between">
                                <span className="text-gray-400">Creado:</span>
                                <span className="text-white">{new Date(equipment.createdAt).toLocaleDateString('es-ES', {
                                  year: 'numeric',
                                  month: 'long',
                                  day: 'numeric'
                                })}</span>
                              </div>
                            )}
                            {equipment.updatedAt && (
                              <div className="flex justify-between">
                                <span className="text-gray-400">Actualizado:</span>
                                <span className="text-white">{new Date(equipment.updatedAt).toLocaleDateString('es-ES', {
                                  year: 'numeric',
                                  month: 'long',
                                  day: 'numeric'
                                })}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'windows' && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold">Cuentas de Windows</h2>
                {canManageWindowsAccounts && (
                  <Button variant="glass" size="sm" onClick={() => openAccountModal('windows', 'create')}>
                    <Plus className="w-4 h-4 mr-1" />
                    Nueva cuenta
                  </Button>
                )}
              </div>
              {employee.windowsAccounts.length === 0 ? (
                <EmptyState message="No hay cuentas de Windows registradas" />
              ) : (
                <div className="space-y-4">
                  {employee.windowsAccounts.map((account: WindowsAccount) => (
                    <div key={account.id} className="bg-white/5 rounded-lg p-4 border border-white/10">
                      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
                        <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <p className="text-white/50 text-xs mb-1">Usuario</p>
                            <p className="text-white font-medium text-lg">{account.username}</p>
                            <p className="text-white/40 text-xs mt-1">{account.domain || 'Sin dominio'}</p>
                          </div>
                          {canViewPasswords && account.password && (
                            <div>
                              <p className="text-white/50 text-xs mb-1">Contraseña</p>
                              <div className="flex items-center gap-2">
                                <p className="text-white font-mono text-sm flex-1">
                                  {showPasswords[`windows-${account.id}`] ? account.password : '••••••••'}
                                </p>
                                <button
                                  type="button"
                                  onClick={() => togglePassword(`windows-${account.id}`)}
                                  className="text-white/60 hover:text-white transition-colors p-1"
                                >
                                  {showPasswords[`windows-${account.id}`] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-1 rounded-full text-xs border whitespace-nowrap ${account.isActive ? 'border-green-500/20 bg-green-500/10 text-green-400' : 'border-red-500/20 bg-red-500/10 text-red-400'}`}>
                            {account.isActive ? 'Activa' : 'Inactiva'}
                          </span>
                          {canManageWindowsAccounts && (
                            <div className="flex items-center gap-2">
                              <Button variant="ghost" size="sm" onClick={() => openAccountModal('windows', 'edit', account)}>
                                <Edit2 className="w-4 h-4" />
                              </Button>
                              <Button variant="danger" size="sm" onClick={() => handleConfirmDelete('windows', account.id)}>
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                      {account.notes && (
                        <p className="text-white/60 text-sm mt-2 bg-white/5 rounded-md p-3">{account.notes}</p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
          {activeTab === 'qnap' && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold">Cuentas QNAP</h2>
                {canManageQnapAccounts && (
                  <Button variant="glass" size="sm" onClick={() => openAccountModal('qnap', 'create')}>
                    <Plus className="w-4 h-4 mr-1" />
                    Nueva cuenta
                  </Button>
                )}
              </div>
              {employee.qnapAccounts.length === 0 ? (
                <EmptyState message="No hay cuentas QNAP registradas" />
              ) : (
                <div className="space-y-4">
                  {employee.qnapAccounts.map((account: QnapAccount) => (
                    <div key={account.id} className="bg-white/5 rounded-lg p-4 border border-white/10">
                      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
                        <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <p className="text-white/50 text-xs mb-1">Usuario</p>
                            <p className="text-white font-medium text-lg">{account.username}</p>
                            <p className="text-white/40 text-xs mt-1">{account.userGroup || 'Sin grupo'}</p>
                          </div>
                          {canViewPasswords && account.password && (
                            <div>
                              <p className="text-white/50 text-xs mb-1">Contraseña</p>
                              <div className="flex items-center gap-2">
                                <p className="text-white font-mono text-sm flex-1">
                                  {showPasswords[`qnap-${account.id}`] ? account.password : '••••••••'}
                                </p>
                                <button
                                  type="button"
                                  onClick={() => togglePassword(`qnap-${account.id}`)}
                                  className="text-white/60 hover:text-white transition-colors p-1"
                                >
                                  {showPasswords[`qnap-${account.id}`] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-1 rounded-full text-xs border whitespace-nowrap ${account.isActive ? 'border-green-500/20 bg-green-500/10 text-green-400' : 'border-red-500/20 bg-red-500/10 text-red-400'}`}>
                            {account.isActive ? 'Activa' : 'Inactiva'}
                          </span>
                          {canManageQnapAccounts && (
                            <div className="flex items-center gap-2">
                              <Button variant="ghost" size="sm" onClick={() => openAccountModal('qnap', 'edit', account)}>
                                <Edit2 className="w-4 h-4" />
                              </Button>
                              <Button variant="danger" size="sm" onClick={() => handleConfirmDelete('qnap', account.id)}>
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                      {account.notes && (
                        <p className="text-white/60 text-sm mt-2 bg-white/5 rounded-md p-3">{account.notes}</p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
          {activeTab === 'calipso' && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold">Cuentas Calipso</h2>
                {canManageCalipsoAccounts && (
                  <Button variant="glass" size="sm" onClick={() => openAccountModal('calipso', 'create')}>
                    <Plus className="w-4 h-4 mr-1" />
                    Nueva cuenta
                  </Button>
                )}
              </div>
              {employee.calipsoAccounts.length === 0 ? (
                <EmptyState message="No hay cuentas Calipso registradas" />
              ) : (
                <div className="space-y-4">
                  {employee.calipsoAccounts.map((account: CalipsoAccount) => (
                    <div key={account.id} className="bg-white/5 rounded-lg p-4 border border-white/10">
                      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
                        <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <p className="text-white/50 text-xs mb-1">Usuario</p>
                            <p className="text-white font-medium text-lg">{account.username}</p>
                            <p className="text-white/40 text-xs mt-1">{account.permissions || 'Sin permisos'}</p>
                          </div>
                          {canViewPasswords && account.password && (
                            <div>
                              <p className="text-white/50 text-xs mb-1">Contraseña</p>
                              <div className="flex items-center gap-2">
                                <p className="text-white font-mono text-sm flex-1">
                                  {showPasswords[`calipso-${account.id}`] ? account.password : '••••••••'}
                                </p>
                                <button
                                  type="button"
                                  onClick={() => togglePassword(`calipso-${account.id}`)}
                                  className="text-white/60 hover:text-white transition-colors p-1"
                                >
                                  {showPasswords[`calipso-${account.id}`] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-1 rounded-full text-xs border whitespace-nowrap ${account.isActive ? 'border-green-500/20 bg-green-500/10 text-green-400' : 'border-red-500/20 bg-red-500/10 text-red-400'}`}>
                            {account.isActive ? 'Activa' : 'Inactiva'}
                          </span>
                          {canManageCalipsoAccounts && (
                            <div className="flex items-center gap-2">
                              <Button variant="ghost" size="sm" onClick={() => openAccountModal('calipso', 'edit', account)}>
                                <Edit2 className="w-4 h-4" />
                              </Button>
                              <Button variant="danger" size="sm" onClick={() => handleConfirmDelete('calipso', account.id)}>
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                      {account.notes && (
                        <p className="text-white/60 text-sm mt-2 bg-white/5 rounded-md p-3">{account.notes}</p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
          {activeTab === 'email' && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold">Cuentas de Email</h2>
                {canManageEmailAccounts && (
                  <Button variant="glass" size="sm" onClick={() => openAccountModal('email', 'create')}>
                    <Plus className="w-4 h-4 mr-1" />
                    Nueva cuenta
                  </Button>
                )}
              </div>
              {employee.emailAccounts.length === 0 ? (
                <EmptyState message="No hay cuentas de email registradas" />
              ) : (
                <div className="space-y-4">
                  {employee.emailAccounts.map((account: EmailAccount) => (
                    <div key={account.id} className="bg-white/5 rounded-lg p-4 border border-white/10">
                      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
                        <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <p className="text-white/50 text-xs mb-1">Email</p>
                            <p className="text-white font-medium text-lg">{account.email}</p>
                            <p className="text-white/40 text-xs mt-1">{account.accountType || 'Sin tipo'}</p>
                          </div>
                          {canViewPasswords && account.password && (
                            <div>
                              <p className="text-white/50 text-xs mb-1">Contraseña</p>
                              <div className="flex items-center gap-2">
                                <p className="text-white font-mono text-sm flex-1">
                                  {showPasswords[`email-${account.id}`] ? account.password : '••••••••'}
                                </p>
                                <button
                                  type="button"
                                  onClick={() => togglePassword(`email-${account.id}`)}
                                  className="text-white/60 hover:text-white transition-colors p-1"
                                >
                                  {showPasswords[`email-${account.id}`] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-1 rounded-full text-xs border whitespace-nowrap ${account.isActive ? 'border-green-500/20 bg-green-500/10 text-green-400' : 'border-red-500/20 bg-red-500/10 text-red-400'}`}>
                            {account.isActive ? 'Activa' : 'Inactiva'}
                          </span>
                          {canManageEmailAccounts && (
                            <div className="flex items-center gap-2">
                              <Button variant="ghost" size="sm" onClick={() => openAccountModal('email', 'edit', account)}>
                                <Edit2 className="w-4 h-4" />
                              </Button>
                              <Button variant="danger" size="sm" onClick={() => handleConfirmDelete('email', account.id)}>
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                      {account.notes && (
                        <p className="text-white/60 text-sm mt-2 bg-white/5 rounded-md p-3">{account.notes}</p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
          {activeTab === 'inventory' && (
            <div>
              <h2 className="text-xl font-semibold mb-4">Inventario Asignado</h2>
              {employee.inventoryAssigned.length === 0 ? (
                <EmptyState message="No hay items de inventario asignados" />
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-white/5">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-white/70 uppercase">Nombre</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-white/70 uppercase">Categoría</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-white/70 uppercase">Cantidad</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/10">
                      {employee.inventoryAssigned.map((item: InventoryAssignment) => (
                        <tr key={item.id} className="hover:bg-white/5">
                          <td className="px-4 py-3 text-sm">{item.name}</td>
                          <td className="px-4 py-3 text-sm text-white/70">{item.category || '-'}</td>
                          <td className="px-4 py-3 text-sm text-white/70">{item.quantity}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {activeTab === 'tickets' && (
            <div>
              <h2 className="text-xl font-semibold mb-4">Tickets Solicitados</h2>
              {employee.ticketsRequested.length === 0 ? (
                <EmptyState message="No hay tickets solicitados" />
              ) : (
                <div className="space-y-4">
                  {employee.ticketsRequested.map((ticket: TicketSummary) => (
                    <div key={ticket.id} className="bg-white/5 rounded-lg p-4 border border-white/10">
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="text-white font-medium">{ticket.title}</h3>
                        <div className="flex gap-2">
                          <StatusBadge status={ticket.status} />
                          <PriorityBadge priority={ticket.priority} />
                        </div>
                      </div>
                      {ticket.description && (
                        <p className="text-white/60 text-sm">{ticket.description}</p>
                      )}
                      {ticket.createdAt && (
                        <p className="text-white/40 text-xs mt-2">
                          Creado: {new Date(ticket.createdAt).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'purchases' && (
            <div>
              <h2 className="text-xl font-semibold mb-4">Solicitudes de Compra</h2>
              {employee.purchaseRequests.length === 0 ? (
                <EmptyState message="No hay solicitudes de compra" />
              ) : (
                <div className="space-y-4">
                  {employee.purchaseRequests.map((request: PurchaseRequestSummary) => (
                    <div key={request.id} className="bg-white/5 rounded-lg p-4 border border-white/10">
                      <div className="flex items-start justify-between mb-2">
                        <p className="text-white">{request.description}</p>
                        <StatusBadge status={request.status} />
                      </div>
                      {request.createdAt && (
                        <p className="text-white/40 text-xs">
                          Creado: {new Date(request.createdAt).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

      </FadeInUp>

      <Modal
        isOpen={!!accountModal}
        onClose={handleCloseAccountModal}
        title={`${accountModal?.mode === 'create' ? 'Nueva' : 'Editar'} cuenta ${accountModal ? getAccountLabel(accountModal.type) : ''}`}
        footer={
          <div className="flex gap-3">
            <Button
              variant="default"
              onClick={handleCloseAccountModal}
              disabled={isSavingAccount}
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button
              variant="glass"
              onClick={handleAccountSubmit}
              disabled={isSavingAccount}
              className="flex-1"
            >
              {accountModal?.mode === 'create' ? 'Crear cuenta' : 'Guardar cambios'}
            </Button>
          </div>
        }
      >
        {renderAccountForm()}
      </Modal>

      <ConfirmDialog
        isOpen={accountToDelete !== null}
        onClose={() => setAccountToDelete(null)}
        onConfirm={handleDeleteAccount}
        title={`Eliminar cuenta ${accountToDelete ? getAccountLabel(accountToDelete.type) : ''}`}
        message="¿Estás seguro de eliminar esta cuenta? Esta acción no se puede deshacer."
        variant="danger"
      />
    </div>
  )
}

// Helper components
function InfoItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-white/50 text-sm mb-1">{label}</p>
      <p className="text-white">{value}</p>
    </div>
  )
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="text-center py-12 text-white/60">
      {message}
    </div>
  )
}

function StatusBadge({ status }: { status: string }) {
  const getStatusColor = (status: string) => {
    const statusLower = status.toLowerCase()
    if (statusLower.includes('activ') || statusLower.includes('completed') || statusLower.includes('approved')) {
      return 'bg-green-500/10 text-green-400 border-green-500/20'
    }
    if (statusLower.includes('pending') || statusLower.includes('in_progress')) {
      return 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20'
    }
    if (statusLower.includes('inactive') || statusLower.includes('rejected') || statusLower.includes('cancelled')) {
      return 'bg-red-500/10 text-red-400 border-red-500/20'
    }
    return 'bg-blue-500/10 text-blue-400 border-blue-500/20'
  }

  return (
    <span className={`px-2 py-1 rounded-full text-xs border ${getStatusColor(status)}`}>
      {status}
    </span>
  )
}

function PriorityBadge({ priority }: { priority: string }) {
  const getPriorityColor = (priority: string) => {
    const priorityLower = priority.toLowerCase()
    if (priorityLower.includes('high') || priorityLower.includes('urgent')) {
      return 'bg-red-500/10 text-red-400 border-red-500/20'
    }
    if (priorityLower.includes('medium')) {
      return 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20'
    }
    return 'bg-blue-500/10 text-blue-400 border-blue-500/20'
  }

  return (
    <span className={`px-2 py-1 rounded-full text-xs border ${getPriorityColor(priority)}`}>
      {priority}
    </span>
  )
}
