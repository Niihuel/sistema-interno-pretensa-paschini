import { useState } from 'react'
import { usePermissions } from '../../../providers/PermissionsProvider'
import { useZones, useCreateZone, useUpdateZone, useDeleteZone } from '../hooks/useZones'
import type { Zone, ZoneFormData } from '../types'
import { FadeInUp } from '../../../shared/components/ui/AnimatedContainer'
import Button from '../../../shared/components/ui/Button'
import Input from '../../../shared/components/ui/Input'
import Select from '../../../shared/components/ui/Select'
import SearchableSelect from '../../../shared/components/ui/SearchableSelect'
import Modal from '../../../shared/components/ui/Modal'
import ConfirmDialog from '../../../shared/components/ui/ConfirmDialog'
import { Edit2, Trash2, Search, Users, Building, MapPin, Box, Warehouse, Store, Factory, Map, Navigation, LayoutGrid, Square } from 'lucide-react'
import { useToast } from '../../../shared/components/ui/ToastContainer'
import { getErrorMessage, logError } from '../../../utils/errorHelpers'
import LoadingSpinner from '../../../shared/components/ui/LoadingSpinner'

export default function ZonesPage() {
  const { can } = usePermissions()
  const toast = useToast()

  // Filters
  const [searchFilter, setSearchFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')

  // Data fetching
  const { data, isLoading } = useZones({
    search: searchFilter || undefined,
    status: statusFilter || undefined,
  })

  const zones = data?.items || []

  // Mutations
  const createMutation = useCreateZone()
  const updateMutation = useUpdateZone()
  const deleteMutation = useDeleteZone()

  // Modal state
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editing, setEditing] = useState<Zone | null>(null)
  const [form, setForm] = useState<ZoneFormData>({
    name: '',
    code: '',
    description: '',
    status: 'ACTIVE',
    color: '#8b5cf6',
    icon: 'map-pin',
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
      status: 'ACTIVE',
      color: '#8b5cf6',
      icon: 'map-pin',
    })
    setIsFormOpen(true)
  }

  const openEdit = (zone: Zone) => {
    setEditing(zone)
    setForm({
      name: zone.name,
      code: zone.code || '',
      description: zone.description || '',
      status: zone.status,
      color: zone.color || '#8b5cf6',
      icon: zone.icon || 'map-pin',
    })
    setIsFormOpen(true)
  }

  const handleSave = async () => {
    try {
      const payload: ZoneFormData = {
        name: form.name,
        code: form.code || undefined,
        description: form.description || undefined,
        status: form.status,
        color: form.color || undefined,
        icon: form.icon || undefined,
      }

      if (editing) {
        await updateMutation.mutateAsync({ id: editing.id, data: payload })
        toast.success('Zona actualizada correctamente')
      } else {
        await createMutation.mutateAsync(payload)
        toast.success('Zona creada correctamente')
      }
      setIsFormOpen(false)
    } catch (error) {
      logError('ZonesPage:handleSave', error)
      toast.error('Error al guardar', getErrorMessage(error, 'No se pudo guardar la zona'))
    }
  }

  const handleDelete = async () => {
    if (deleteId) {
      try {
        await deleteMutation.mutateAsync(deleteId)
        setDeleteId(null)
        toast.success('Zona eliminada correctamente')
      } catch (error) {
        logError('ZonesPage:handleDelete', error)
        toast.error('Error al eliminar', getErrorMessage(error, 'No se pudo eliminar la zona'))
      }
    }
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

  const iconOptions = [
    { value: 'map-pin', label: 'Pin' },
    { value: 'box', label: 'Caja' },
    { value: 'warehouse', label: 'Almacén' },
    { value: 'store', label: 'Tienda' },
    { value: 'building', label: 'Oficina' },
    { value: 'factory', label: 'Fábrica' },
    { value: 'map', label: 'Mapa' },
    { value: 'navigation', label: 'Navegación' },
    { value: 'layout-grid', label: 'Cuadrícula' },
    { value: 'square', label: 'Sector' },
  ]

  // Icon render helper
  const renderIcon = (iconName: string | null | undefined, className: string = 'w-5 h-5') => {
    switch (iconName) {
      case 'map-pin':
        return <MapPin className={className} />
      case 'box':
        return <Box className={className} />
      case 'warehouse':
        return <Warehouse className={className} />
      case 'store':
        return <Store className={className} />
      case 'building':
        return <Building className={className} />
      case 'factory':
        return <Factory className={className} />
      case 'map':
        return <Map className={className} />
      case 'navigation':
        return <Navigation className={className} />
      case 'layout-grid':
        return <LayoutGrid className={className} />
      case 'square':
        return <Square className={className} />
      default:
        return <MapPin className={className} />
    }
  }

  // Check permissions
  const canCreate = can('zones', 'create')
  const canEdit = can('zones', 'update')
  const canDelete = can('zones', 'delete')

  if (!can('zones', 'view')) {
    return (
      <div className="text-white px-2 sm:px-0">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="text-red-400 text-xl mb-2">Acceso Denegado</div>
            <div className="text-white/60">No tienes permisos para ver zonas.</div>
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
              <h1 className="text-3xl font-semibold mb-2">Zonas</h1>
              <p className="text-white/70">Gestión de zonas por área organizacional</p>
            </div>
            {canCreate && (
              <Button variant="glass" onClick={openCreate}>
                Nueva Zona
              </Button>
            )}
          </div>
        </div>

        <div className="mb-6 p-4 sm:p-6 rounded-xl border border-white/10 bg-white/5 backdrop-blur-sm">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input
              placeholder="Buscar por nombre..."
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
                setStatusFilter('')
              }}
            >
              <Search className="w-4 h-4 mr-2" />
              Limpiar
            </Button>
          </div>
        </div>

        <div className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10">
          {isLoading ? (
            <div className="p-8 flex justify-center"><LoadingSpinner size="md" /></div>
          ) : zones.length === 0 ? (
            <div className="p-8 text-center text-white/60">No se encontraron zonas</div>
          ) : (
            <div className="overflow-x-auto">
              {/* Desktop Table */}
              <table className="hidden md:table w-full">
                <thead className="bg-white/5">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-white/70 uppercase tracking-wider">Zona</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-white/70 uppercase tracking-wider">Código</th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-white/70 uppercase tracking-wider">Empleados</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-white/70 uppercase tracking-wider">Estado</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-white/70 uppercase tracking-wider">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/10">
                  {zones.map((zone) => (
                    <tr key={zone.id} className="hover:bg-white/5 transition-colors">
                      <td className="px-4 py-3 text-sm">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 flex items-center justify-center text-white/70">
                            {renderIcon(zone.icon, 'w-5 h-5')}
                          </div>
                          <div>
                            <div className="text-white font-medium">{zone.name}</div>
                            {zone.description && (
                              <div className="text-white/50 text-xs">{zone.description.substring(0, 50)}{zone.description.length > 50 && '...'}</div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-white/70">{zone.code || '-'}</td>
                      <td className="px-4 py-3 text-sm text-center">
                        <div className="flex items-center justify-center gap-1">
                          <Users className="w-4 h-4 text-blue-400" />
                          <span className="text-white">{zone._count?.employees || 0}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <span
                          className={`px-2 py-1 rounded-full text-xs ${
                            zone.status === 'ACTIVE'
                              ? 'bg-green-500/10 text-green-400'
                              : 'bg-red-500/10 text-red-400'
                          }`}
                        >
                          {zone.status === 'ACTIVE' ? 'Activo' : 'Inactivo'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <div className="flex gap-2">
                          {canEdit && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => openEdit(zone)}
                              className="text-xs bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/20 hover:border-blue-500/40"
                            >
                              <Edit2 className="w-3 h-3 mr-1" />
                              Editar
                            </Button>
                          )}
                          {canDelete && (
                            <Button
                              size="sm"
                              onClick={() => setDeleteId(zone.id)}
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
                {zones.map((zone) => (
                  <div key={zone.id} className="bg-white/5 backdrop-blur-sm rounded-lg border border-white/10 p-4">
                    <div className="flex items-start gap-3 mb-3">
                      <div className="w-12 h-12 flex items-center justify-center text-white/70">
                        {renderIcon(zone.icon, 'w-6 h-6')}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-start justify-between mb-1">
                          <h3 className="text-white font-medium">{zone.name}</h3>
                          <span
                            className={`px-2 py-1 rounded-full text-xs ${
                              zone.status === 'ACTIVE'
                                ? 'bg-green-500/10 text-green-400'
                                : 'bg-red-500/10 text-red-400'
                            }`}
                          >
                            {zone.status === 'ACTIVE' ? 'Activo' : 'Inactivo'}
                          </span>
                        </div>
                        {zone.code && <p className="text-white/50 text-xs mb-1">Código: {zone.code}</p>}
                        {zone.description && <p className="text-white/60 text-sm mb-2">{zone.description}</p>}
                      </div>
                    </div>

                    <div className="flex items-center gap-4 mb-3 text-sm">
                      <div className="flex items-center gap-1">
                        <Users className="w-4 h-4 text-blue-400" />
                        <span className="text-white">{zone._count?.employees || 0}</span>
                        <span className="text-white/50">empleados</span>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      {canEdit && (
                        <Button
                          variant="glass"
                          size="sm"
                          onClick={() => openEdit(zone)}
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
                          onClick={() => setDeleteId(zone.id)}
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
        title={editing ? 'Editar Zona' : 'Nueva Zona'}
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
            placeholder="Ingrese el nombre de la zona"
            required
          />

          <Input
            label="Código"
            value={form.code || ''}
            onChange={(e) => setForm({ ...form, code: e.target.value })}
            placeholder="Código de la zona (opcional)"
          />

          <Input
            label="Descripción"
            value={form.description || ''}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            placeholder="Descripción de la zona (opcional)"
          />

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-white/70 mb-2">Color</label>
              <input
                type="color"
                value={form.color || '#8b5cf6'}
                onChange={(e) => setForm({ ...form, color: e.target.value })}
                className="w-full h-10 rounded-lg cursor-pointer bg-white/5 border border-white/10"
              />
            </div>

            <Select
              label="Icono"
              value={form.icon || 'map-pin'}
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
        title="Eliminar Zona"
        message="¿Estás seguro de que deseas eliminar esta zona? Esta acción no se puede deshacer. Si la zona tiene empleados asignados, no podrá eliminarse."
        confirmText="Eliminar"
        cancelText="Cancelar"
        variant="danger"
      />
    </div>
  )
}
