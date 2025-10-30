import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { usePermissions } from '../../../providers/PermissionsProvider'
import LoadingSpinner from '../../../shared/components/ui/LoadingSpinner'
import { useEmployees, useCreateEmployee, useUpdateEmployee, useDeleteEmployee } from '../hooks/useEmployees'
import { useAllAreas } from '../../areas/hooks/useAreas'
import { useAllZones } from '../../zones/hooks/useZones'
import { useToast } from '../../../shared/components/ui/ToastContainer'
import type { Employee, EmployeeFormData } from '../types'
import { FadeInUp } from '../../../shared/components/ui/AnimatedContainer'
import Button from '../../../shared/components/ui/Button'
import Input from '../../../shared/components/ui/Input'
import Select from '../../../shared/components/ui/Select'
import SearchableSelect from '../../../shared/components/ui/SearchableSelect'
import Modal from '../../../shared/components/ui/Modal'
import ConfirmDialog from '../../../shared/components/ui/ConfirmDialog'
import { Edit2, Trash2, Search, Eye, Building2, MapPin } from 'lucide-react'
import { getErrorMessage, logError } from '../../../utils/errorHelpers'

const STATUS_OPTIONS = [
  { value: '', label: 'Todos los estados' },
  { value: 'ACTIVE', label: 'Activo' },
  { value: 'INACTIVE', label: 'Inactivo' },
]

export default function EmployeesPage() {
  const { can } = usePermissions()
  const navigate = useNavigate()
  const toast = useToast()

  const [searchFilter, setSearchFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [areaFilter, setAreaFilter] = useState('')
  const [zoneFilter, setZoneFilter] = useState('')

  const { data, isLoading } = useEmployees({
    search: searchFilter || undefined,
    status: statusFilter || undefined,
    areaId: areaFilter ? parseInt(areaFilter) : undefined,
    zoneId: zoneFilter ? parseInt(zoneFilter) : undefined,
  })

  // Get areas and zones for selectors
  const { data: areasData } = useAllAreas()
  const areas = areasData || []

  const { data: zonesData } = useAllZones()
  const zones = Array.isArray(zonesData) ? zonesData : []

  const createMutation = useCreateEmployee()
  const updateMutation = useUpdateEmployee()
  const deleteMutation = useDeleteEmployee()

  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editing, setEditing] = useState<Employee | null>(null)
  const [form, setForm] = useState<EmployeeFormData>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    position: '',
    areaId: undefined,
    zoneId: undefined,
    status: 'ACTIVE',
  })

  const [deleteId, setDeleteId] = useState<number | null>(null)

  const openCreate = () => {
    setEditing(null)
    setForm({
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      position: '',
      areaId: undefined,
      zoneId: undefined,
      status: 'ACTIVE',
    })
    setIsFormOpen(true)
  }

  const openEdit = (employee: Employee) => {
    setEditing(employee)
    setForm({
      firstName: employee.firstName,
      lastName: employee.lastName,
      email: employee.email || '',
      phone: employee.phone || '',
      position: employee.position || '',
      areaId: employee.areaId || undefined,
      zoneId: employee.zoneId || undefined,
      status: employee.status,
    })
    setIsFormOpen(true)
  }

  const handleSave = async () => {
    try {
      if (editing) {
        await updateMutation.mutateAsync({ id: editing.id, data: form })
        toast.success('Empleado actualizado', 'El empleado se ha actualizado correctamente')
      } else {
        await createMutation.mutateAsync(form)
        toast.success('Empleado creado', 'El empleado se ha creado correctamente')
      }
      setIsFormOpen(false)
    } catch (error) {
      logError('EmployeesPage:handleSave', error)
      toast.error(
        editing ? 'Error al actualizar el empleado' : 'Error al crear el empleado',
        getErrorMessage(error, 'No se pudo completar la operación. Por favor, inténtelo de nuevo.')
      )
    }
  }

  const handleDelete = async () => {
    if (deleteId) {
      try {
        await deleteMutation.mutateAsync(deleteId)
        toast.success('Empleado eliminado', 'El empleado se ha eliminado correctamente')
        setDeleteId(null)
      } catch (error) {
        logError('EmployeesPage:handleDelete', error)
        toast.error('Error al eliminar el empleado', getErrorMessage(error, 'No se pudo completar la operación'))
        setDeleteId(null)
      }
    }
  }

  // Get zones filtered by selected area in form
  const filteredZones = form.areaId
    ? zones.filter(z => z.areaId === form.areaId)
    : zones

  const areaFilterOptions = [
    { value: '', label: 'Todas las áreas' },
    ...areas.map((area) => ({
      value: area.id.toString(),
      label: area.name,
    })),
  ]

  const zoneFilterOptions = [
    { value: '', label: 'Todas las zonas' },
    ...zones.map((zone) => ({
      value: zone.id.toString(),
      label: zone.name,
    })),
  ]

  const formAreaOptions = [
    { value: '', label: 'Sin área' },
    ...areas.map((area) => ({
      value: area.id.toString(),
      label: area.name,
    })),
  ]

  const formZoneOptions = [
    { value: '', label: 'Sin zona' },
    ...filteredZones.map((zone) => ({
      value: zone.id.toString(),
      label: zone.name,
    })),
  ]

  const canCreate = can('employees', 'create')
  const canEdit = can('employees', 'update')
  const canDelete = can('employees', 'delete')

  if (!can('employees', 'view')) {
    return (
      <div className="text-white px-2 sm:px-0">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="text-red-400 text-xl mb-2">Acceso Denegado</div>
            <div className="text-white/60">No tienes permisos para ver empleados.</div>
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
              <h1 className="text-3xl font-semibold mb-2">Empleados</h1>
              <p className="text-white/70">Gestión de empleados de la empresa</p>
            </div>
            {canCreate && (
              <Button variant="glass" onClick={openCreate}>
                Nuevo Empleado
              </Button>
            )}
          </div>
        </div>

        <div className="mb-6 p-4 sm:p-6 rounded-xl border border-white/10 bg-white/5 backdrop-blur-sm">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <Input
              placeholder="Buscar por nombre..."
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              className="bg-white/5"
            />
            <SearchableSelect
              value={areaFilter}
              onChange={(value) => setAreaFilter(value)}
              options={areaFilterOptions}
              placeholder="Todas las áreas"
              searchPlaceholder="Buscar área..."
              className="bg-white/5"
            />
            <Select
              value={zoneFilter}
              onChange={(e) => setZoneFilter(e.target.value)}
              options={zoneFilterOptions}
              className="bg-white/5"
            />
            <Select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              options={STATUS_OPTIONS}
              className="bg-white/5"
            />
            <Button
              variant="glass"
              onClick={() => {
                setSearchFilter('')
                setStatusFilter('')
                setAreaFilter('')
                setZoneFilter('')
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
          ) : !data || !data.items || data.items.length === 0 ? (
            <div className="p-8 text-center text-white/60">No se encontraron empleados</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="hidden md:table w-full">
                <thead className="bg-white/5">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-white/70 uppercase tracking-wider">Nombre</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-white/70 uppercase tracking-wider">Email</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-white/70 uppercase tracking-wider">Área</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-white/70 uppercase tracking-wider">Zona</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-white/70 uppercase tracking-wider">Puesto</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-white/70 uppercase tracking-wider">Estado</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-white/70 uppercase tracking-wider">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/10">
                  {data.items.map((employee: Employee) => (
                    <tr key={employee.id} className="hover:bg-white/5 transition-colors">
                      <td className="px-4 py-3 text-sm text-white">{employee.firstName} {employee.lastName}</td>
                      <td className="px-4 py-3 text-sm text-white/70">{employee.email || '-'}</td>
                      <td className="px-4 py-3 text-sm">
                        {employee.area ? (
                          <div className="flex items-center gap-1.5">
                            <Building2 className="w-3.5 h-3.5 text-blue-400" />
                            <span className="text-white/90">{employee.area.name}</span>
                          </div>
                        ) : (
                          <span className="text-white/50">-</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        {employee.zone ? (
                          <div className="flex items-center gap-1.5">
                            <MapPin className="w-3.5 h-3.5 text-purple-400" />
                            <span className="text-white/90">{employee.zone.name}</span>
                          </div>
                        ) : (
                          <span className="text-white/50">-</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm text-white/70">{employee.position || '-'}</td>
                      <td className="px-4 py-3 text-sm">
                        <span
                          className={`px-2 py-1 rounded-full text-xs ${
                            employee.status === 'ACTIVE'
                              ? 'bg-green-500/10 text-green-400'
                              : 'bg-red-500/10 text-red-400'
                          }`}
                        >
                          {employee.status === 'ACTIVE' ? 'Activo' : 'Inactivo'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <div className="flex gap-1">
                          <Button variant="ghost" size="sm" onClick={() => navigate(`/employees/${employee.id}`)} className="text-xs bg-gray-500/10 hover:bg-gray-500/20 text-gray-400 border border-gray-500/20 hover:border-gray-500/40">
                            <Eye className="w-3 h-3 mr-1" />
                            Ver
                          </Button>
                          {canEdit && (
                            <Button variant="ghost" size="sm" onClick={() => openEdit(employee)} className="text-xs bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/20 hover:border-blue-500/40">
                              <Edit2 className="w-3 h-3 mr-1" />
                              Editar
                            </Button>
                          )}
                          {canDelete && (
                            <Button size="sm" onClick={() => setDeleteId(employee.id)} className="text-xs bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 hover:border-red-500/40">
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

              <div className="md:hidden space-y-4 p-4">
                {data.items.map((employee: Employee) => (
                  <div key={employee.id} className="bg-white/5 backdrop-blur-sm rounded-lg border border-white/10 p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="text-white font-medium">{employee.firstName} {employee.lastName}</h3>
                        <p className="text-white/60 text-sm">{employee.position || 'Sin puesto'}</p>
                      </div>
                      <span
                        className={`px-2 py-1 rounded-full text-xs ${
                          employee.status === 'ACTIVE'
                            ? 'bg-green-500/10 text-green-400'
                            : 'bg-red-500/10 text-red-400'
                        }`}
                      >
                        {employee.status === 'ACTIVE' ? 'Activo' : 'Inactivo'}
                      </span>
                    </div>

                    <div className="space-y-1.5 mb-3 text-sm">
                      {employee.email && (
                        <p className="text-white/70">
                          <span className="text-white/50">Email:</span> {employee.email}
                        </p>
                      )}
                      {employee.area && (
                        <p className="text-white/70 flex items-center gap-1.5">
                          <Building2 className="w-3.5 h-3.5 text-blue-400" />
                          <span className="text-white/50">Área:</span> {employee.area.name}
                        </p>
                      )}
                      {employee.zone && (
                        <p className="text-white/70 flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-purple-400" />
                          <span className="text-white/50">Zona:</span> {employee.zone.name}
                        </p>
                      )}
                    </div>

                    <div className="flex gap-2">
                      <Button
                        variant="glass"
                        size="sm"
                        onClick={() => navigate(`/employees/${employee.id}`)}
                        className="flex-1"
                      >
                        <Eye className="w-3 h-3 mr-1" />
                        Ver
                      </Button>
                      {canEdit && (
                        <Button
                          variant="glass"
                          size="sm"
                          onClick={() => openEdit(employee)}
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
                          onClick={() => setDeleteId(employee.id)}
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

      <Modal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        title={editing ? 'Editar Empleado' : 'Nuevo Empleado'}
        footer={
          <div className="flex gap-3">
            <Button variant="default" onClick={() => setIsFormOpen(false)} className="flex-1">
              Cancelar
            </Button>
            <Button
              variant="glass"
              onClick={handleSave}
              disabled={!form.firstName || !form.lastName || createMutation.isPending || updateMutation.isPending}
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
              value={form.firstName}
              onChange={(e) => setForm({ ...form, firstName: e.target.value })}
              required
            />
            <Input
              label="Apellido *"
              value={form.lastName}
              onChange={(e) => setForm({ ...form, lastName: e.target.value })}
              required
            />
            <Input
              label="Email"
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
            <Input
              label="Teléfono"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
            />
            <Input
              label="Puesto"
              value={form.position}
              onChange={(e) => setForm({ ...form, position: e.target.value })}
            />
            <SearchableSelect
              label="Área"
              value={form.areaId?.toString() || ''}
              onChange={(value) => {
                const newAreaId = value ? parseInt(value) : undefined
                setForm({ ...form, areaId: newAreaId, zoneId: undefined }) // Reset zone when area changes
              }}
              options={formAreaOptions}
              placeholder="Seleccionar área"
              searchPlaceholder="Buscar área..."
            />
            <Select
              label="Zona"
              value={form.zoneId?.toString() || ''}
              onChange={(e) => setForm({ ...form, zoneId: e.target.value ? parseInt(e.target.value) : undefined })}
              options={formZoneOptions}
              disabled={!form.areaId}
            />
            <Select
              label="Estado"
              value={form.status}
              onChange={(e) => setForm({ ...form, status: e.target.value })}
              options={[
                { value: 'ACTIVE', label: 'Activo' },
                { value: 'INACTIVE', label: 'Inactivo' },
              ]}
            />
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        isOpen={deleteId !== null}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Eliminar Empleado"
        message="¿Estas seguro de que deseas eliminar este empleado? Esta acción no se puede deshacer."
        confirmText="Eliminar"
        cancelText="Cancelar"
        variant="danger"
      />
    </div>
  )
}
