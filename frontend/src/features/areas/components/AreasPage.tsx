import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { usePermissions } from '../../../providers/PermissionsProvider'
import { useAreas, useCreateArea, useUpdateArea, useDeleteArea } from '../hooks/useAreas'
import { useEmployees } from '../../employees/hooks/useEmployees'
import type { Area, AreaFormData } from '../types'
import { FadeInUp } from '../../../shared/components/ui/AnimatedContainer'
import Button from '../../../shared/components/ui/Button'
import Input from '../../../shared/components/ui/Input'
import Select from '../../../shared/components/ui/Select'
import Modal from '../../../shared/components/ui/Modal'
import ConfirmDialog from '../../../shared/components/ui/ConfirmDialog'
import { Edit2, Trash2, Search, Users, MapPin, Layers, Folder, Briefcase, Building2, UsersRound, Settings, BarChart3, Truck, Wrench, Shield, Star } from 'lucide-react'
import { useToast } from '../../../shared/components/ui/ToastContainer'
import { getErrorMessage, logError } from '../../../utils/errorHelpers'
import LoadingSpinner from '../../../shared/components/ui/LoadingSpinner'

export default function AreasPage() {
  const { can } = usePermissions()
  const toast = useToast()
  const navigate = useNavigate()

  // Filters
  const [nameFilter, setNameFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')

  // Data fetching
  const { data, isLoading } = useAreas({
    name: nameFilter || undefined,
    status: statusFilter || undefined,
  })

  const areas = data?.items || []

  // Get all employees for manager selector
  const { data: employeesData } = useEmployees({ limit: 1000 })
  const employees = employeesData?.items || []

  // Mutations
  const createMutation = useCreateArea()
  const updateMutation = useUpdateArea()
  const deleteMutation = useDeleteArea()

  // Modal state
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editing, setEditing] = useState<Area | null>(null)
  const [form, setForm] = useState<AreaFormData>({
    name: '',
    code: '',
    description: '',
    managerId: undefined,
    status: 'ACTIVE',
    color: '#3b82f6',
    icon: 'folder',
  })

  // Delete confirmation
  const [deleteId, setDeleteId] = useState<number | null>(null)

  // Handlers
  const openCreate = () => {
    setEditing(null)
    setForm({
      name: '',
      code: '',
      description: '',
      managerId: undefined,
      status: 'ACTIVE',
      color: '#3b82f6',
      icon: 'folder',
    })
    setIsFormOpen(true)
  }

  const openEdit = (area: Area) => {
    setEditing(area)
    setForm({
      name: area.name,
      code: area.code || '',
      description: area.description || '',
      managerId: area.managerId || undefined,
      status: area.status,
      color: area.color || '#3b82f6',
      icon: area.icon || 'folder',
    })
    setIsFormOpen(true)
  }

  const handleSave = async () => {
    try {
      const payload: AreaFormData = {
        name: form.name,
        code: form.code || undefined,
        description: form.description || undefined,
        managerId: form.managerId || undefined,
        status: form.status,
        color: form.color || undefined,
        icon: form.icon || undefined,
      }

      if (editing) {
        await updateMutation.mutateAsync({ id: editing.id, data: payload })
        toast.success('Área actualizada correctamente')
      } else {
        await createMutation.mutateAsync(payload)
        toast.success('Área creada correctamente')
      }
      setIsFormOpen(false)
    } catch (error) {
      logError('AreasPage:handleSave', error)
      toast.error('Error al guardar', getErrorMessage(error, 'No se pudo guardar el área'))
    }
  }

  const handleDelete = async () => {
    if (deleteId) {
      try {
        await deleteMutation.mutateAsync(deleteId)
        setDeleteId(null)
        toast.success('Área eliminada correctamente')
      } catch (error) {
        logError('AreasPage:handleDelete', error)
        toast.error('Error al eliminar', getErrorMessage(error, 'No se pudo eliminar el área'))
      }
    }
  }

  const viewZones = (areaId: number) => {
    navigate(`/zones?areaId=${areaId}`)
  }

  const statusOptions = [
    { value: '', label: 'Todos los estados' },
    { value: 'ACTIVE', label: 'Activo' },
    { value: 'INACTIVE', label: 'Inactivo' },
  ]

  const formStatusOptions = [
    { value: 'ACTIVE', label: 'Activo' },
    { value: 'INACTIVE', label: 'Inactivo' },
  ]

  const employeeOptions = [
    { value: '', label: 'Sin responsable' },
    ...employees.map((emp) => ({
      value: emp.id.toString(),
      label: `${emp.firstName} ${emp.lastName}`,
    })),
  ]

  const iconOptions = [
    { value: 'folder', label: 'Carpeta' },
    { value: 'briefcase', label: 'Maletín' },
    { value: 'building', label: 'Edificio' },
    { value: 'users', label: 'Usuarios' },
    { value: 'cog', label: 'Configuración' },
    { value: 'chart', label: 'Gráfico' },
    { value: 'truck', label: 'Camión' },
    { value: 'wrench', label: 'Herramienta' },
    { value: 'shield', label: 'Escudo' },
    { value: 'star', label: 'Estrella' },
  ]

  // Icon render helper
  const renderIcon = (iconName: string | null | undefined, className: string = 'w-5 h-5') => {
    switch (iconName) {
      case 'folder':
        return <Folder className={className} />
      case 'briefcase':
        return <Briefcase className={className} />
      case 'building':
        return <Building2 className={className} />
      case 'users':
        return <UsersRound className={className} />
      case 'cog':
        return <Settings className={className} />
      case 'chart':
        return <BarChart3 className={className} />
      case 'truck':
        return <Truck className={className} />
      case 'wrench':
        return <Wrench className={className} />
      case 'shield':
        return <Shield className={className} />
      case 'star':
        return <Star className={className} />
      default:
        return <Folder className={className} />
    }
  }

  // Check permissions
  const canCreate = can('areas', 'create')
  const canEdit = can('areas', 'update')
  const canDelete = can('areas', 'delete')
  const canViewZones = can('zones', 'view')

  if (!can('areas', 'view')) {
    return (
      <div className="text-white px-2 sm:px-0">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="text-red-400 text-xl mb-2">Acceso Denegado</div>
            <div className="text-white/60">No tienes permisos para ver áreas.</div>
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
              <h1 className="text-3xl font-semibold mb-2">Áreas</h1>
              <p className="text-white/70">Gestión organizacional de áreas y zonas</p>
            </div>
            {canCreate && (
              <Button variant="glass" onClick={openCreate}>
                Nueva Área
              </Button>
            )}
          </div>
        </div>

        <div className="mb-6 p-4 sm:p-6 rounded-xl border border-white/10 bg-white/5 backdrop-blur-sm">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input
              placeholder="Buscar por nombre..."
              value={nameFilter}
              onChange={(e) => setNameFilter(e.target.value)}
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
                setNameFilter('')
                setStatusFilter('')
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
          ) : areas.length === 0 ? (
            <div className="p-8 text-center text-white/60">No se encontraron áreas</div>
          ) : (
            <div className="overflow-x-auto">
              {/* Desktop Table */}
              <table className="hidden md:table w-full">
                <thead className="bg-white/5">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-white/70 uppercase tracking-wider">Área</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-white/70 uppercase tracking-wider">Código</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-white/70 uppercase tracking-wider">Responsable</th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-white/70 uppercase tracking-wider">Empleados</th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-white/70 uppercase tracking-wider">Zonas</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-white/70 uppercase tracking-wider">Estado</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-white/70 uppercase tracking-wider">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/10">
                  {areas.map((area) => (
                    <tr key={area.id} className="hover:bg-white/5 transition-colors">
                      <td className="px-4 py-3 text-sm">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 flex items-center justify-center text-white/70">
                            {renderIcon(area.icon, 'w-5 h-5')}
                          </div>
                          <div>
                            <div className="text-white font-medium">{area.name}</div>
                            {area.description && (
                              <div className="text-white/50 text-xs">{area.description.substring(0, 50)}{area.description.length > 50 && '...'}</div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-white/70">{area.code || '-'}</td>
                      <td className="px-4 py-3 text-sm text-white/70">
                        {area.manager ? `${area.manager.firstName} ${area.manager.lastName}` : '-'}
                      </td>
                      <td className="px-4 py-3 text-sm text-center">
                        <div className="flex items-center justify-center gap-1">
                          <Users className="w-4 h-4 text-blue-400" />
                          <span className="text-white">{area._count?.employees || 0}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-center">
                        <div className="flex items-center justify-center gap-1">
                          <Layers className="w-4 h-4 text-purple-400" />
                          <span className="text-white">{area._count?.zones || 0}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <span
                          className={`px-2 py-1 rounded-full text-xs ${
                            area.status === 'ACTIVE'
                              ? 'bg-green-500/10 text-green-400'
                              : 'bg-red-500/10 text-red-400'
                          }`}
                        >
                          {area.status === 'ACTIVE' ? 'Activo' : 'Inactivo'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <div className="flex gap-2">
                          {canViewZones && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => viewZones(area.id)}
                              className="text-xs bg-purple-500/10 hover:bg-purple-500/20 text-purple-400 border border-purple-500/20 hover:border-purple-500/40"
                            >
                              <MapPin className="w-3 h-3 mr-1" />
                              Zonas
                            </Button>
                          )}
                          {canEdit && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => openEdit(area)}
                              className="text-xs bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/20 hover:border-blue-500/40"
                            >
                              <Edit2 className="w-3 h-3 mr-1" />
                              Editar
                            </Button>
                          )}
                          {canDelete && (
                            <Button
                              size="sm"
                              onClick={() => setDeleteId(area.id)}
                              className="text-xs bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 hover:border-red-500/40"
                            >
                              <Trash2 className="w-3 h-3 mr-1" />
                              Eliminar
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Mobile Cards */}
              <div className="md:hidden space-y-4 p-4">
                {areas.map((area) => (
                  <div key={area.id} className="bg-white/5 backdrop-blur-sm rounded-lg border border-white/10 p-4">
                    <div className="flex items-start gap-3 mb-3">
                      <div className="w-12 h-12 flex items-center justify-center text-white/70">
                        {renderIcon(area.icon, 'w-6 h-6')}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-start justify-between mb-1">
                          <h3 className="text-white font-medium">{area.name}</h3>
                          <span
                            className={`px-2 py-1 rounded-full text-xs ${
                              area.status === 'ACTIVE'
                                ? 'bg-green-500/10 text-green-400'
                                : 'bg-red-500/10 text-red-400'
                            }`}
                          >
                            {area.status === 'ACTIVE' ? 'Activo' : 'Inactivo'}
                          </span>
                        </div>
                        {area.code && <p className="text-white/50 text-xs mb-1">Código: {area.code}</p>}
                        {area.description && <p className="text-white/60 text-sm mb-2">{area.description}</p>}
                        {area.manager && (
                          <p className="text-white/60 text-sm">
                            Responsable: {area.manager.firstName} {area.manager.lastName}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-4 mb-3 text-sm">
                      <div className="flex items-center gap-1">
                        <Users className="w-4 h-4 text-blue-400" />
                        <span className="text-white">{area._count?.employees || 0}</span>
                        <span className="text-white/50">empleados</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Layers className="w-4 h-4 text-purple-400" />
                        <span className="text-white">{area._count?.zones || 0}</span>
                        <span className="text-white/50">zonas</span>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      {canViewZones && (
                        <Button
                          variant="glass"
                          size="sm"
                          onClick={() => viewZones(area.id)}
                          className="flex-1"
                        >
                          <MapPin className="w-3 h-3 mr-1" />
                          Zonas
                        </Button>
                      )}
                      {canEdit && (
                        <Button
                          variant="glass"
                          size="sm"
                          onClick={() => openEdit(area)}
                          className="flex-1"
                        >
                          <Edit2 className="w-3 h-3 mr-1" />
                          Editar
                        </Button>
                      )}
                      {canDelete && (
                        <Button
                          variant="danger"
                          size="sm"
                          onClick={() => setDeleteId(area.id)}
                          className="flex-1"
                        >
                          <Trash2 className="w-3 h-3 mr-1" />
                          Eliminar
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </FadeInUp>

      {/* Create/Edit Modal */}
      <Modal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        title={editing ? 'Editar Área' : 'Nueva Área'}
        footer={
          <div className="flex gap-3">
            <Button variant="default" onClick={() => setIsFormOpen(false)} className="flex-1">
              Cancelar
            </Button>
            <Button
              variant="glass"
              onClick={handleSave}
              disabled={!form.name || createMutation.isPending || updateMutation.isPending}
              className="flex-1"
            >
              {editing ? 'Actualizar' : 'Crear'}
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          <Input
            label="Nombre *"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="Ingrese el nombre del área"
            required
          />

          <Input
            label="Código"
            value={form.code || ''}
            onChange={(e) => setForm({ ...form, code: e.target.value })}
            placeholder="Código del área (opcional)"
          />

          <Input
            label="Descripción"
            value={form.description || ''}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            placeholder="Descripción del área (opcional)"
          />

          <Select
            label="Responsable"
            value={form.managerId?.toString() || ''}
            onChange={(e) => setForm({ ...form, managerId: e.target.value ? parseInt(e.target.value) : undefined })}
            options={employeeOptions}
          />

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-white/70 mb-2">Color</label>
              <input
                type="color"
                value={form.color || '#3b82f6'}
                onChange={(e) => setForm({ ...form, color: e.target.value })}
                className="w-full h-10 rounded-lg cursor-pointer bg-white/5 border border-white/10"
              />
            </div>

            <Select
              label="Icono"
              value={form.icon || 'folder'}
              onChange={(e) => setForm({ ...form, icon: e.target.value })}
              options={iconOptions}
            />
          </div>

          <Select
            label="Estado *"
            value={form.status || 'ACTIVE'}
            onChange={(e) => setForm({ ...form, status: e.target.value })}
            options={formStatusOptions}
          />
        </div>
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={deleteId !== null}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Eliminar Área"
        message="¿Estás seguro de que deseas eliminar esta área? Esta acción no se puede deshacer. Si el área tiene zonas o empleados asignados, no podrá eliminarse."
        confirmText="Eliminar"
        cancelText="Cancelar"
        variant="danger"
      />
    </div>
  )
}
