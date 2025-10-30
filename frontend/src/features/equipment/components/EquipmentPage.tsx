import { useState, useMemo } from 'react'
import { usePermissions } from '../../../providers/PermissionsProvider'
import LoadingSpinner from '../../../shared/components/ui/LoadingSpinner'
import { useEquipment, useCreateEquipment, useUpdateEquipment, useDeleteEquipment } from '../hooks/useEquipment'
import { useToast } from '../../../shared/components/ui/ToastContainer'
import type { Equipment, EquipmentFormData } from '../types'
import { FadeInUp } from '../../../shared/components/ui/AnimatedContainer'
import Button from '../../../shared/components/ui/Button'
import Input from '../../../shared/components/ui/Input'
import Select from '../../../shared/components/ui/Select'
import Modal from '../../../shared/components/ui/Modal'
import ConfirmDialog from '../../../shared/components/ui/ConfirmDialog'
import SearchableSelect from '../../../shared/components/ui/SearchableSelect'
import { EQUIPMENT_TYPES, EQUIPMENT_STATUS, getStatusStyle, getStatusLabel } from '../constants'
import { Edit2, Trash2, Search, FileSpreadsheet, FileText, Eye } from 'lucide-react'
import { exportToProfessionalExcel, exportToProfessionalPDF, prepareDataForExport } from '../../../lib/professional-export'
import { ViewEquipmentModal } from './ViewEquipmentModal'
import { useEmployees } from '../../employees/hooks/useEmployees'
import { getErrorMessage, logError } from '../../../utils/errorHelpers'
import { useAllAreas } from '../../areas/hooks/useAreas'
import { useAllZones } from '../../zones/hooks/useZones'

export default function EquipmentPage() {
  const { can } = usePermissions()
  const toast = useToast()

  // Filters
  const [nameFilter, setNameFilter] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [areaFilter, setAreaFilter] = useState<number | undefined>(undefined)

  // Data fetching - Areas and Zones
  const { data: areasData } = useAllAreas()
  const areas = areasData || []

  const { data: zonesData } = useAllZones()
  const zones = Array.isArray(zonesData) ? zonesData : []

  // Data fetching - Equipment
  const { data: equipmentData, isLoading } = useEquipment({
    name: nameFilter || undefined,
    type: typeFilter || undefined,
    status: statusFilter || undefined,
    areaId: areaFilter || undefined,
  })
  const equipment = equipmentData?.items || []

  const { data: employeesResponse } = useEmployees({ status: 'ACTIVE', limit: 200 })
  const employeeOptions = useMemo(() => {
    const items = employeesResponse?.items || []
    return items
      .map((emp) => {
        const label = `${emp.firstName} ${emp.lastName}`.trim() || emp.email || `Empleado #${emp.id}`
        const subLabelParts = [emp.area, emp.position].filter(Boolean)
        const subLabel = subLabelParts.length ? subLabelParts.join(' · ') : undefined
        return {
          value: String(emp.id),
          label,
          subLabel,
        }
      })
      .sort((a, b) => a.label.localeCompare(b.label, 'es'))
  }, [employeesResponse])

  const assignmentOptions = useMemo(() => [
    { value: 'none', label: 'Sin asignar' },
    ...employeeOptions,
  ], [employeeOptions])

  // Mutations
  const createMutation = useCreateEquipment()
  const updateMutation = useUpdateEquipment()
  const deleteMutation = useDeleteEquipment()

  // Modal state
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editing, setEditing] = useState<Equipment | null>(null)
  const [form, setForm] = useState<EquipmentFormData>({
    name: '',
    type: 'Desktop',
    status: 'Activo',
    location: '',
    areaId: undefined,
    zoneId: undefined,
    serialNumber: '',
    brand: '',
    model: '',
    assignedToId: null,
  })

  // Delete confirmation
  const [deleteId, setDeleteId] = useState<number | null>(null)

  // View modal
  const [viewingEquipment, setViewingEquipment] = useState<Equipment | null>(null)

  // Handlers
  const openCreate = () => {
    setEditing(null)
    setForm({
      name: '',
      type: 'Desktop',
      status: 'Activo',
      location: '',
      areaId: undefined,
      zoneId: undefined,
      serialNumber: '',
      brand: '',
      model: '',
      assignedToId: null,
    })
    setIsFormOpen(true)
  }

  const openEdit = (equip: Equipment) => {
    setEditing(equip)
    setForm({
      name: equip.name,
      type: equip.type,
      status: equip.status,
      location: equip.location || '',
      areaId: equip.areaId?.toString() || undefined,
      zoneId: equip.zoneId?.toString() || undefined,
      serialNumber: equip.serialNumber || '',
      brand: equip.brand || '',
      model: equip.model || '',
      ip: equip.ip || '',
      macAddress: equip.macAddress || '',
      processor: equip.processor || '',
      ram: equip.ram || '',
      storage: equip.storage || '',
      operatingSystem: equip.operatingSystem || '',
      assignedToId: equip.assignedToId ?? null,
    })
    setIsFormOpen(true)
  }

  const handleSave = async () => {
    try {
      if (editing) {
        await updateMutation.mutateAsync({ id: editing.id, data: form })
        toast.success('Equipo actualizado', 'El equipo se ha actualizado correctamente')
      } else {
        await createMutation.mutateAsync(form)
        toast.success('Equipo creado', 'El equipo se ha creado correctamente')
      }
      setIsFormOpen(false)
    } catch (error) {
      logError('EquipmentPage:handleSave', error)
      toast.error(
        editing ? 'Error al actualizar el equipo' : 'Error al crear el equipo',
        getErrorMessage(error, 'No se pudo completar la operación. Por favor, inténtelo de nuevo.')
      )
    }
  }

  const handleDelete = async () => {
    if (deleteId) {
      try {
        await deleteMutation.mutateAsync(deleteId)
        toast.success('Equipo eliminado', 'El equipo se ha eliminado correctamente')
        setDeleteId(null)
      } catch (error) {
        logError('EquipmentPage:handleDelete', error)
        toast.error('Error al eliminar el equipo', getErrorMessage(error, 'No se pudo completar la operación'))
        setDeleteId(null)
      }
    }
  }

  const typeOptions = [
    { value: '', label: 'Todos los tipos' },
    ...EQUIPMENT_TYPES.map(type => ({ value: type, label: type })),
  ]

  const statusOptions = [
    { value: '', label: 'Todos los estados' },
    ...EQUIPMENT_STATUS.map(status => ({ value: status, label: status })),
  ]

  // Area and Zone options
  const areaOptions = useMemo(() => areas.map(area => ({ value: area.id.toString(), label: area.name })), [areas])
  const areaFilterOptions = useMemo(() => [{ value: '', label: 'Todas las areas' }, ...areaOptions], [areaOptions])
  const areaFormOptions = useMemo(() => [{ value: '', label: 'Selecciona un area' }, ...areaOptions], [areaOptions])

  // Filter zones by selected area in form
  const filteredZones = form.areaId
    ? zones.filter(z => z.areaId === parseInt(form.areaId || '0'))
    : []

  const zoneOptions = useMemo(() =>
    filteredZones.map(zone => ({ value: zone.id.toString(), label: zone.name })),
    [filteredZones]
  )
  const zoneFormOptions = useMemo(() => [
    { value: '', label: 'Selecciona una zona' },
    ...zoneOptions
  ], [zoneOptions])

  // Export handlers
  const handleExportExcel = async () => {
    const exportRows = equipment.map((item: Equipment) => ({
      ...item,
      status: getStatusLabel(item.status),
      area: item.areaRelation?.name || item.area || 'Sin area',
      zone: item.zoneRelation?.name || 'Sin zona',
      location: item.location || 'Sin ubicación',
      assignedToName: item.assignedTo ? `${item.assignedTo.firstName} ${item.assignedTo.lastName}` : 'Sin asignar',
    }))

    const exportData = prepareDataForExport(
      exportRows,
      {
        name: 'Nombre',
        type: 'Tipo',
        status: 'Estado',
        area: 'Área',
        zone: 'Zona',
        location: 'Ubicación',
        assignedToName: 'Asignado a',
        serialNumber: 'N° Serie',
        brand: 'Marca',
        model: 'Modelo',
        createdAt: 'Fecha Creación',
      },
      {
        title: 'Reporte de Equipos',
        subtitle: `${equipment.length} equipos registrados`,
        department: 'Sistemas',
        author: 'Sistema',
      }
    )
    await exportToProfessionalExcel(exportData)
  }

  const handleExportPDF = async () => {
    const exportRows = equipment.map((item: Equipment) => ({
      ...item,
      status: getStatusLabel(item.status),
      area: item.areaRelation?.name || item.area || 'Sin area',
      zone: item.zoneRelation?.name || 'Sin zona',
      assignedToName: item.assignedTo ? `${item.assignedTo.firstName} ${item.assignedTo.lastName}` : 'Sin asignar',
    }))

    const exportData = prepareDataForExport(
      exportRows,
      {
        name: 'Nombre',
        type: 'Tipo',
        status: 'Estado',
        area: 'Área',
        assignedToName: 'Asignado a',
        serialNumber: 'N° Serie',
        brand: 'Marca',
      },
      {
        title: 'Reporte de Equipos',
        subtitle: `${equipment.length} equipos registrados`,
        department: 'Sistemas',
        author: 'Sistema',
      }
    )
    await exportToProfessionalPDF(exportData)
  }

  // Check permissions
  const canCreate = can('equipment', 'create')
  const canEdit = can('equipment', 'update')
  const canDelete = can('equipment', 'delete')

  if (!can('equipment', 'view')) {
    return (
      <div className="text-white px-2 sm:px-0">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="text-red-400 text-xl mb-2">Acceso Denegado</div>
            <div className="text-white/60">No tienes permisos para ver equipos.</div>
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
              <h1 className="text-3xl font-semibold mb-2">Equipos</h1>
              <p className="text-white/70">Gestión de equipos IT de la empresa</p>
            </div>
            {canCreate && (
              <Button variant="glass" onClick={openCreate}>
                Nuevo Equipo
              </Button>
            )}
          </div>

          {/* Export Buttons */}
          <div className="flex gap-2">
            <Button variant="glass" size="sm" onClick={handleExportExcel}>
              <FileSpreadsheet className="w-4 h-4 mr-2" />
              Exportar Excel
            </Button>
            <Button variant="glass" size="sm" onClick={handleExportPDF}>
              <FileText className="w-4 h-4 mr-2" />
              Exportar PDF
            </Button>
          </div>
        </div>

        {/* Filters */}
        <div className="mb-6 p-4 sm:p-6 rounded-xl border border-white/10 bg-white/5 backdrop-blur-sm">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <Input
              placeholder="Buscar por nombre..."
              value={nameFilter}
              onChange={(e) => setNameFilter(e.target.value)}
              className="bg-white/5"
            />
            <Select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              options={typeOptions}
              className="bg-white/5"
            />
            <Select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              options={statusOptions}
              className="bg-white/5"
            />
            <SearchableSelect
              value={areaFilter?.toString() || ''}
              onChange={(value) => setAreaFilter(value ? parseInt(value) : undefined)}
              options={areaFilterOptions}
              placeholder="Todas las areas"
            />
            <Button
              variant="glass"
              onClick={() => {
                setNameFilter('')
                setTypeFilter('')
                setStatusFilter('')
                setAreaFilter(undefined)
              }}
            >
              <Search className="w-4 h-4 mr-2" />
              Limpiar
            </Button>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10">
          {isLoading ? (
            <div className="p-8 flex justify-center"><LoadingSpinner size="md" /></div>
          ) : equipment.length === 0 ? (
            <div className="p-8 text-center text-white/60">No se encontraron equipos</div>
          ) : (
            <div className="overflow-x-auto">
              {/* Desktop Table */}
              <table className="hidden md:table w-full">
                <thead className="bg-white/5">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-white/70 uppercase tracking-wider">Nombre</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-white/70 uppercase tracking-wider">Tipo</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-white/70 uppercase tracking-wider">Marca/Modelo</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-white/70 uppercase tracking-wider">Serial</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-white/70 uppercase tracking-wider">Área</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-white/70 uppercase tracking-wider">Asignado</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-white/70 uppercase tracking-wider">Estado</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-white/70 uppercase tracking-wider">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/10">
                  {equipment.map((equip: Equipment) => (
                    <tr key={equip.id} className="hover:bg-white/5 transition-colors">
                      <td className="px-4 py-3 text-sm text-white">{equip.name}</td>
                      <td className="px-4 py-3 text-sm text-white/70">{equip.type}</td>
                      <td className="px-4 py-3 text-sm text-white/70">
                        {equip.brand && equip.model ? `${equip.brand} ${equip.model}` : equip.brand || equip.model || '-'}
                      </td>
                      <td className="px-4 py-3 text-sm text-white/70 font-mono text-xs">{equip.serialNumber || '-'}</td>
                      <td className="px-4 py-3 text-sm text-white/70">
                        {equip.areaRelation?.name || equip.area || '-'}
                        {equip.zoneRelation && (
                          <div className="text-xs text-white/50">{equip.zoneRelation.name}</div>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm text-white/70">{equip.assignedTo ? `${equip.assignedTo.firstName} ${equip.assignedTo.lastName}` : 'Sin asignar'}</td>
                      <td className="px-4 py-3 text-sm">
                        <span className={`px-2 py-1 rounded-full text-xs ${getStatusStyle(equip.status)}`}>
                          {getStatusLabel(equip.status)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <div className="flex gap-1">
                          <Button variant="ghost" size="sm" onClick={() => setViewingEquipment(equip)} className="text-xs bg-green-500/10 hover:bg-green-500/20 text-green-400 border border-green-500/20 hover:border-green-500/40">
                            <Eye className="w-3 h-3 mr-1" />
                            Ver
                          </Button>
                          {canEdit && (
                            <Button variant="ghost" size="sm" onClick={() => openEdit(equip)} className="text-xs bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/20 hover:border-blue-500/40">
                              Editar
                            </Button>
                          )}
                          {canDelete && (
                            <Button size="sm" onClick={() => setDeleteId(equip.id)} className="text-xs bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 hover:border-red-500/40">
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
                {equipment.map((equip: Equipment) => (
                  <div key={equip.id} className="bg-white/5 backdrop-blur-sm rounded-lg border border-white/10 p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="text-white font-medium">{equip.name}</h3>
                        <p className="text-white/60 text-sm">{equip.type}</p>
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs ${getStatusStyle(equip.status)}`}>
                        {getStatusLabel(equip.status)}
                      </span>
                    </div>

                    <div className="space-y-1 mb-3 text-sm">
                      {(equip.brand || equip.model) && (
                        <p className="text-white/70">
                          <span className="text-white/50">Marca/Modelo:</span>{' '}
                          {equip.brand && equip.model ? `${equip.brand} ${equip.model}` : equip.brand || equip.model}
                        </p>
                      )}
                      {equip.serialNumber && (
                        <p className="text-white/70 font-mono text-xs">
                          <span className="text-white/50">Serial:</span> {equip.serialNumber}
                        </p>
                      )}
                      {(equip.areaRelation || equip.area) && (
                        <p className="text-white/70">
                          <span className="text-white/50">Área:</span> {equip.areaRelation?.name || equip.area}
                          {equip.zoneRelation && (
                            <span className="text-white/50"> · Zona: {equip.zoneRelation.name}</span>
                          )}
                        </p>
                      )}
                      <p className="text-white/70">
                        <span className="text-white/50">Asignado:</span> {equip.assignedTo ? `${equip.assignedTo.firstName} ${equip.assignedTo.lastName}` : 'Sin asignar'}
                      </p>
                    </div>

                    <div className="flex gap-2">
                      <Button
                        variant="glass"
                        size="sm"
                        onClick={() => setViewingEquipment(equip)}
                        className="flex-1"
                      >
                        <Eye className="w-3 h-3 mr-1" />
                        Ver
                      </Button>
                      {canEdit && (
                        <Button
                          variant="glass"
                          size="sm"
                          onClick={() => openEdit(equip)}
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
                          onClick={() => setDeleteId(equip.id)}
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
        title={editing ? 'Editar Equipo' : 'Nuevo Equipo'}
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Nombre *"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Ej: PC-001"
              required
              className="md:col-span-2"
            />

            <Select
              label="Tipo *"
              value={form.type}
              onChange={(e) => setForm({ ...form, type: e.target.value })}
              options={EQUIPMENT_TYPES.map(type => ({ value: type, label: type }))}
            />

            <Select
              label="Estado *"
              value={form.status}
              onChange={(e) => setForm({ ...form, status: e.target.value })}
              options={EQUIPMENT_STATUS.map(status => ({ value: status, label: status }))}
            />

            <Input
              label="Marca"
              value={form.brand || ''}
              onChange={(e) => setForm({ ...form, brand: e.target.value })}
              placeholder="Ej: Dell, HP, Lenovo"
            />

            <Input
              label="Modelo"
              value={form.model || ''}
              onChange={(e) => setForm({ ...form, model: e.target.value })}
              placeholder="Ej: Latitude 5420"
            />

            <Input
              label="Número de Serie"
              value={form.serialNumber || ''}
              onChange={(e) => setForm({ ...form, serialNumber: e.target.value })}
              placeholder="Ej: SN123456789"
              className="md:col-span-2"
            />

            <SearchableSelect
              label="Área"
              value={form.areaId || ''}
              onChange={(value) => {
                const newAreaId = value || undefined
                setForm({ ...form, areaId: newAreaId, zoneId: undefined }) // Reset zone when area changes
              }}
              options={areaFormOptions}
              placeholder="Selecciona un area"
            />

            <Select
              label="Zona"
              value={form.zoneId || ''}
              onChange={(e) => setForm({ ...form, zoneId: e.target.value || undefined })}
              options={zoneFormOptions}
              disabled={!form.areaId}
            />

            <SearchableSelect
              label="Asignar a"
              value={form.assignedToId ? String(form.assignedToId) : 'none'}
              onChange={(value) => setForm({ ...form, assignedToId: value === 'none' ? null : Number(value) })}
              options={assignmentOptions}
              placeholder="Selecciona un empleado"
              className="md:col-span-2"
            />

            <Input
              label="Dirección IP"
              value={form.ip || ''}
              onChange={(e) => setForm({ ...form, ip: e.target.value })}
              placeholder="192.168.1.100"
            />

            <Input
              label="Dirección MAC"
              value={form.macAddress || ''}
              onChange={(e) => setForm({ ...form, macAddress: e.target.value })}
              placeholder="00:00:00:00:00:00"
            />

            <Input
              label="Procesador"
              value={form.processor || ''}
              onChange={(e) => setForm({ ...form, processor: e.target.value })}
              placeholder="Ej: Intel i5-11400"
            />

            <Input
              label="RAM"
              value={form.ram || ''}
              onChange={(e) => setForm({ ...form, ram: e.target.value })}
              placeholder="Ej: 8GB DDR4"
            />

            <Input
              label="Almacenamiento"
              value={form.storage || ''}
              onChange={(e) => setForm({ ...form, storage: e.target.value })}
              placeholder="Ej: 256GB SSD"
              className="md:col-span-2"
            />

            <Input
              label="Sistema Operativo"
              value={form.operatingSystem || ''}
              onChange={(e) => setForm({ ...form, operatingSystem: e.target.value })}
              placeholder="Ej: Windows 11 Pro"
              className="md:col-span-2"
            />
          </div>
        </div>
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={deleteId !== null}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Eliminar Equipo"
        message="¿Estas seguro de que deseas eliminar este equipo? Esta acción no se puede deshacer."
        confirmText="Eliminar"
        cancelText="Cancelar"
        variant="danger"
      />

      {/* View Modal */}
      <ViewEquipmentModal
        equipment={viewingEquipment}
        isOpen={viewingEquipment !== null}
        onClose={() => setViewingEquipment(null)}
      />
    </div>
  )
}
