import { useState, useMemo } from 'react'
import { Trash2, Search, Package, BarChart3, List, Eye } from 'lucide-react'
import PageHeader from '../../../shared/components/ui/PageHeader'
import ExportButtons from '../../../shared/components/export/ExportButtons'
import { ViewInventoryModal } from './ViewInventoryModal'
import { useInventory, useCreateInventory, useUpdateInventory, useDeleteInventory } from '../hooks/useInventory'
import { useToast } from '../../../shared/components/ui/ToastContainer'
import type { InventoryItem, InventoryFormData } from '../types'
import {
  INVENTORY_CATEGORIES,
  INVENTORY_STATUS,
  INVENTORY_CONDITION,
  getCategoryLabel,
  getStatusLabel,
  getConditionLabel,
  getStatusColor,
  getConditionColor
} from '../constants'
import Modal from '../../../shared/components/ui/Modal'
import ConfirmDialog from '../../../shared/components/ui/ConfirmDialog'
import Input from '../../../shared/components/ui/Input'
import Select from '../../../shared/components/ui/Select'
import Button from '../../../shared/components/ui/Button'
import { FadeInUp } from '../../../shared/components/ui/AnimatedContainer'
import Tabs, { type Tab } from '../../../shared/components/ui/Tabs'
import { getErrorMessage, logError } from '../../../utils/errorHelpers'
import InventoryDashboardTab from './InventoryDashboardTab'
import { usePermissions } from '../../../providers/PermissionsProvider'
import LoadingSpinner from '../../../shared/components/ui/LoadingSpinner'

const INVENTORY_TABS: Tab[] = [
  { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
  { id: 'list', label: 'Listado', icon: List },
]

export default function InventoryPage() {
  const { can } = usePermissions()
  const toast = useToast()

  // Tabs
  const [activeTab, setActiveTab] = useState('dashboard')

  // Filtros
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')

  // Modales
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [deleteId, setDeleteId] = useState<number | null>(null)
  const [editing, setEditing] = useState<InventoryItem | null>(null)
  const [viewingItem, setViewingItem] = useState<InventoryItem | null>(null)

  // Form state
  const [form, setForm] = useState<Partial<InventoryFormData>>({
    category: 'KEYBOARD',
    status: 'AVAILABLE',
    condition: 'NEW',
    quantity: 1,
    isPersonalProperty: false
  })

  // Queries and mutations
  const { data, isLoading } = useInventory()
  const createMutation = useCreateInventory()
  const updateMutation = useUpdateInventory()
  const deleteMutation = useDeleteInventory()

  const items = useMemo(() => data?.items ?? [], [data?.items])

  // Filtrar items
  const filteredItems = useMemo(() => {
    let result = items

    if (searchTerm) {
      const query = searchTerm.toLowerCase()
      result = result.filter(item =>
        item.name.toLowerCase().includes(query) ||
        item.brand?.toLowerCase().includes(query) ||
        item.model?.toLowerCase().includes(query) ||
        item.serialNumber?.toLowerCase().includes(query)
      )
    }

    if (statusFilter) {
      result = result.filter(item => item.status === statusFilter)
    }

    if (categoryFilter) {
      result = result.filter(item => item.category === categoryFilter)
    }

    return result
  }, [items, searchTerm, statusFilter, categoryFilter])

  // Estadísticas por estado
  const stats = useMemo(() => {
    return INVENTORY_STATUS.map(status => ({
      ...status,
      count: items.filter(item => item.status === status.value).length
    }))
  }, [items])

  const openCreate = () => {
    setEditing(null)
    setForm({
      category: 'KEYBOARD',
      status: 'AVAILABLE',
      condition: 'NEW',
      quantity: 1,
      isPersonalProperty: false
    })
    setIsFormOpen(true)
  }

  const openEdit = (item: InventoryItem) => {
    setEditing(item)
    setForm({
      name: item.name,
      category: item.category,
      brand: item.brand || '',
      model: item.model || '',
      serialNumber: item.serialNumber || '',
      quantity: item.quantity,
      location: item.location || '',
      status: item.status,
      condition: item.condition,
      notes: item.notes || '',
      assignedToId: item.assignedToId || undefined,
      isPersonalProperty: item.isPersonalProperty || false
    })
    setIsFormOpen(true)
  }

  const handleSave = async () => {
    if (!form.name || !form.category || !form.quantity || !form.status || !form.condition) {
      alert('Por favor complete los campos requeridos')
      return
    }

    // Validación: si está asignado, debe tener usuario asignado
    if (form.status === 'ASSIGNED' && !form.assignedToId) {
      alert('Si el estado es "Asignado", debe seleccionar un empleado')
      return
    }

    // Validación: si es propiedad personal, debe estar asignado
    if (form.isPersonalProperty && !form.assignedToId) {
      alert('Si es propiedad personal, debe estar asignado a un empleado')
      return
    }

    try {
      if (editing) {
        await updateMutation.mutateAsync({
          id: editing.id,
          data: form as InventoryFormData
        })
        toast.success('Item actualizado', 'El item de inventario se ha actualizado correctamente')
      } else {
        await createMutation.mutateAsync(form as InventoryFormData)
        toast.success('Item creado', 'El item de inventario se ha creado correctamente')
      }
      setIsFormOpen(false)
      setForm({
        category: 'KEYBOARD',
        status: 'AVAILABLE',
        condition: 'NEW',
        quantity: 1,
        isPersonalProperty: false
      })
      setEditing(null)
    } catch (error) {
      logError('InventoryPage:handleSave', error)
      toast.error(
        editing ? 'Error al actualizar el item' : 'Error al crear el item',
        getErrorMessage(error, 'No se pudo completar la operación. Por favor, inténtelo de nuevo.')
      )
    }
  }

  const handleDelete = async () => {
    if (!deleteId) return

    try {
      await deleteMutation.mutateAsync(deleteId)
      toast.success('Item eliminado', 'El item de inventario se ha eliminado correctamente')
      setDeleteId(null)
    } catch (error) {
      logError('InventoryPage:handleDelete', error)
      toast.error('Error al eliminar el item', getErrorMessage(error, 'No se pudo completar la operación'))
      setDeleteId(null)
    }
  }

  const clearFilters = () => {
    setSearchTerm('')
    setStatusFilter('')
    setCategoryFilter('')
  }

  const renderDashboard = () => <InventoryDashboardTab />

  const renderList = () => (
    <>
      {/* Export Buttons */}
      <div className="mb-6">
        <ExportButtons
          data={filteredItems}
          columns={{
            name: 'Nombre',
            category: 'Categoría',
            brand: 'Marca',
            model: 'Modelo',
            quantity: 'Cantidad',
            status: 'Estado',
            condition: 'Condición',
            location: 'Ubicación',
            createdAt: 'Fecha Creación',
          }}
          pdfColumns={{
            name: 'Nombre',
            category: 'Categoría',
            quantity: 'Cantidad',
            status: 'Estado',
            location: 'Ubicación',
          }}
          title="Reporte de Inventario"
          subtitle={`${filteredItems.length} items`}
          department="Sistemas"
        />
      </div>

      {/* Filtros */}
      <div className="mb-6 p-4 sm:p-6 rounded-xl border border-white/10 bg-white/5 backdrop-blur-sm">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-white/40" />
            <input
              type="text"
              placeholder="Buscar por nombre, marca, modelo, serie..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-3 py-2 rounded-md bg-black/30 border border-white/10 text-white placeholder-white/40 focus:outline-none focus:border-white/20"
            />
          </div>

          <Select
            label=""
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            options={[
              { value: '', label: 'Todos los estados' },
              ...INVENTORY_STATUS
            ]}
          />

          <Select
            label=""
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            options={[
              { value: '', label: 'Todas las categorías' },
              ...INVENTORY_CATEGORIES
            ]}
          />
        </div>

        {(searchTerm || statusFilter || categoryFilter) && (
          <div className="flex flex-wrap gap-2">
            <Button onClick={clearFilters} variant="glass" size="sm">
              Limpiar Filtros
            </Button>
          </div>
        )}
      </div>

      {/* Tabla Desktop */}
      {isLoading ? (
        <div className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-8 flex justify-center">
          <LoadingSpinner size="md" />
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 py-16 text-center text-white/50">
          No hay items de inventario para mostrar
        </div>
      ) : (
        <>
          {/* Vista Desktop */}
          <div className="hidden md:block bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10">
            <table className="w-full">
              <thead className="bg-white/5 border-b border-white/10">
                <tr>
                  <th className="text-left p-3 text-white/80 font-medium text-sm">Nombre</th>
                  <th className="text-left p-3 text-white/80 font-medium text-sm">Categoría</th>
                  <th className="text-left p-3 text-white/80 font-medium text-sm">Marca/Modelo</th>
                  <th className="text-left p-3 text-white/80 font-medium text-sm">Serial</th>
                  <th className="text-left p-3 text-white/80 font-medium text-sm">Cantidad</th>
                  <th className="text-left p-3 text-white/80 font-medium text-sm">Estado</th>
                  <th className="text-left p-3 text-white/80 font-medium text-sm">Condición</th>
                  <th className="text-left p-3 text-white/80 font-medium text-sm w-32">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filteredItems.map(item => (
                  <tr key={item.id} className="border-t border-white/10 hover:bg-white/5 transition-colors">
                    <td className="p-3 text-white text-sm font-medium">{item.name}</td>
                    <td className="p-3 text-white/80 text-sm">{getCategoryLabel(item.category)}</td>
                    <td className="p-3 text-white/80 text-sm">
                      {[item.brand, item.model].filter(Boolean).join(' ') || '-'}
                    </td>
                    <td className="p-3 text-white/80 text-sm font-mono">{item.serialNumber || '-'}</td>
                    <td className="p-3 text-white/80 text-sm">{item.quantity}</td>
                    <td className="p-3">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(item.status)}`}>
                        {getStatusLabel(item.status)}
                      </span>
                    </td>
                    <td className="p-3">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getConditionColor(item.condition)}`}>
                        {getConditionLabel(item.condition)}
                      </span>
                    </td>
                    <td className="p-3">
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setViewingItem(item)}
                          className="text-xs bg-green-500/10 hover:bg-green-500/20 text-green-400 border border-green-500/20 hover:border-green-500/40"
                        >
                          <Eye className="w-3 h-3 mr-1" />
                          Ver
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openEdit(item)}
                          className="text-xs bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/20 hover:border-blue-500/40"
                        >
                          Editar
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => setDeleteId(item.id)}
                          className="text-xs bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 hover:border-red-500/40"
                        >
                          Eliminar
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Vista Mobile */}
          <div className="md:hidden space-y-3">
            {filteredItems.map(item => (
              <div key={item.id} className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Package className="w-4 h-4 text-white/60 flex-shrink-0" />
                      <h3 className="font-medium text-white text-sm truncate">{item.name}</h3>
                    </div>
                    <p className="text-xs text-white/60">{getCategoryLabel(item.category)}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 mb-3">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(item.status)}`}>
                    {getStatusLabel(item.status)}
                  </span>
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getConditionColor(item.condition)}`}>
                    {getConditionLabel(item.condition)}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs mb-3">
                  {(item.brand || item.model) && (
                    <div>
                      <span className="text-white/60">Marca/Modelo:</span>
                      <div className="text-white truncate">
                        {[item.brand, item.model].filter(Boolean).join(' ')}
                      </div>
                    </div>
                  )}
                  <div>
                    <span className="text-white/60">Cantidad:</span>
                    <div className="text-white px-2 sm:px-0">{item.quantity}</div>
                  </div>
                  {item.serialNumber && (
                    <div className="col-span-2">
                      <span className="text-white/60">Serial:</span>
                      <div className="text-white font-mono text-xs truncate">{item.serialNumber}</div>
                    </div>
                  )}
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => setViewingItem(item)}
                    className="flex-1 px-3 py-2 bg-green-500/10 hover:bg-green-500/20 text-green-400 rounded-lg text-sm transition-colors flex items-center justify-center gap-1"
                  >
                    <Eye className="w-4 h-4" />
                    Ver
                  </button>
                  <button
                    onClick={() => openEdit(item)}
                    className="flex-1 px-3 py-2 bg-white/5 hover:bg-white/10 text-white rounded-lg text-sm transition-colors"
                  >
                    Editar
                  </button>
                  <button
                    onClick={() => setDeleteId(item.id)}
                    className="px-3 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg text-sm transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </>
  )

  // Check permissions
  if (!can('inventory', 'view')) {
    return (
      <div className="text-white px-2 sm:px-0">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="text-red-400 text-xl mb-2">Acceso Denegado</div>
            <div className="text-white/60">No tienes permisos para ver el inventario.</div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="text-white px-2 sm:px-0">
      <FadeInUp>
        <PageHeader
          title="Inventario"
          description="Gestión de periféricos y componentes"
          icon={Package}
        />

        {/* Tabs */}
        <Tabs tabs={INVENTORY_TABS} activeTab={activeTab} onChange={setActiveTab} className="mb-6" />

        {/* Header con botón Nuevo Item */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div>
            <h2 className="text-xl font-bold text-white">
              {activeTab === 'dashboard' ? 'Estadísticas' : 'Listado de Inventario'}
            </h2>
            <p className="text-white/60 text-sm">
              {activeTab === 'dashboard'
                ? 'Resumen de items por estado'
                : `${filteredItems.length} items`}
            </p>
          </div>
          <Button onClick={openCreate} variant="glass" size="sm">
            
            Nuevo Item
          </Button>
        </div>

        {/* Content */}
        <div className="min-h-[500px]">
          {activeTab === 'dashboard' && renderDashboard()}
          {activeTab === 'list' && renderList()}
        </div>
      </FadeInUp>

      {/* Modal de formulario */}
      <Modal
        isOpen={isFormOpen}
        onClose={() => {
          setIsFormOpen(false)
          setEditing(null)
          setForm({
            category: 'KEYBOARD',
            status: 'AVAILABLE',
            condition: 'NEW',
            quantity: 1,
            isPersonalProperty: false
          })
        }}
        title={editing ? 'Editar Item de Inventario' : 'Nuevo Item de Inventario'}
        footer={
          <div className="flex gap-3">
            <Button variant="default" onClick={() => {
                setIsFormOpen(false)
                setEditing(null)
                setForm({
                  category: 'KEYBOARD',
                  status: 'AVAILABLE',
                  condition: 'NEW',
                  quantity: 1,
                  isPersonalProperty: false
                })
              }} className="flex-1">
              Cancelar
            </Button>
            <Button variant="glass" onClick={handleSave} className="flex-1">
              {editing ? 'Actualizar' : 'Crear'}
            </Button>
          </div>
        }
      >
        <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
          <Input
            label="Nombre *"
            value={form.name || ''}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="Ej: Teclado Mecánico RGB"
            required
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Select
              label="Categoría *"
              value={form.category || 'KEYBOARD'}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
              options={INVENTORY_CATEGORIES}
            />

            <Input
              label="Cantidad *"
              type="number"
              min="1"
              value={form.quantity || 1}
              onChange={(e) => setForm({ ...form, quantity: parseInt(e.target.value) || 1 })}
              required
            />

            <Input
              label="Marca"
              value={form.brand || ''}
              onChange={(e) => setForm({ ...form, brand: e.target.value })}
              placeholder="Ej: Logitech"
            />

            <Input
              label="Modelo"
              value={form.model || ''}
              onChange={(e) => setForm({ ...form, model: e.target.value })}
              placeholder="Ej: G Pro X"
            />

            <Input
              label="Número de Serie"
              value={form.serialNumber || ''}
              onChange={(e) => setForm({ ...form, serialNumber: e.target.value })}
              placeholder="SN-123456"
            />

            <Input
              label="Ubicación"
              value={form.location || ''}
              onChange={(e) => setForm({ ...form, location: e.target.value })}
              placeholder="Ej: Depósito, Estante A3"
            />

            <Select
              label="Estado *"
              value={form.status || 'AVAILABLE'}
              onChange={(e) => setForm({ ...form, status: e.target.value })}
              options={INVENTORY_STATUS}
            />

            <Select
              label="Condición *"
              value={form.condition || 'NEW'}
              onChange={(e) => setForm({ ...form, condition: e.target.value })}
              options={INVENTORY_CONDITION}
            />
          </div>

          <div className="flex items-center gap-2 p-3 rounded-lg bg-white/5 border border-white/10">
            <input
              type="checkbox"
              id="isPersonalProperty"
              checked={form.isPersonalProperty || false}
              onChange={(e) => setForm({ ...form, isPersonalProperty: e.target.checked })}
              className="w-4 h-4 rounded border-white/20 bg-black/30"
            />
            <label htmlFor="isPersonalProperty" className="text-sm text-white/80 cursor-pointer">
              Propiedad Personal del Empleado
            </label>
          </div>

          <div>
            <label className="block text-xs font-medium text-white/60 mb-1 uppercase tracking-wide">
              Notas
            </label>
            <textarea
              className="w-full px-3 py-2 rounded-md bg-black/30 border border-white/10 text-white placeholder-white/40 focus:outline-none focus:border-white/20 resize-none"
              rows={3}
              value={form.notes || ''}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              placeholder="Notas adicionales sobre el item..."
            />
          </div>
        </div>
      </Modal>

      {/* Confirmación de eliminación */}
      <ConfirmDialog
        isOpen={deleteId !== null}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Eliminar Item de Inventario"
        message="¿Estás seguro de que quieres eliminar este item? Esta acción no se puede deshacer."
        variant="danger"
      />

      {/* View Modal */}
      <ViewInventoryModal
        item={viewingItem}
        isOpen={viewingItem !== null}
        onClose={() => setViewingItem(null)}
      />
    </div>
  )
}
