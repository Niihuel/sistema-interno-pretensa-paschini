import { useState, useMemo } from 'react'
import { Trash2, Search, ShoppingCart, BarChart3, List, Eye } from 'lucide-react'
import ExportButtons from '../../../shared/components/export/ExportButtons'
import { ViewPurchaseRequestModal } from './ViewPurchaseRequestModal'
import PurchaseRequestsDashboardTab from './PurchaseRequestsDashboardTab'
import { usePurchaseRequests, useCreatePurchaseRequest, useUpdatePurchaseRequest, useDeletePurchaseRequest } from '../hooks/usePurchaseRequests'
import { useToast } from '../../../shared/components/ui/ToastContainer'
import type { PurchaseRequest, PurchaseRequestFormData } from '../types'
import {
  PURCHASE_REQUEST_STATUS_OPTIONS,
  PURCHASE_REQUEST_PRIORITIES,
  PURCHASE_REQUEST_CATEGORIES,
  getStatusLabel,
  getPriorityLabel,
  getCategoryLabel,
  getStatusColor,
  getPriorityColor
} from '../constants'
import Modal from '../../../shared/components/ui/Modal'
import ConfirmDialog from '../../../shared/components/ui/ConfirmDialog'
import Input from '../../../shared/components/ui/Input'
import Select from '../../../shared/components/ui/Select'
import Button from '../../../shared/components/ui/Button'
import PageHeader from '../../../shared/components/ui/PageHeader'
import { FadeInUp } from '../../../shared/components/ui/AnimatedContainer'
import Tabs, { type Tab } from '../../../shared/components/ui/Tabs'
import { getErrorMessage, logError } from '../../../utils/errorHelpers'
import { usePermissions } from '../../../providers/PermissionsProvider'
import LoadingSpinner from '../../../shared/components/ui/LoadingSpinner'

const PURCHASE_REQUEST_TABS: Tab[] = [
  { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
  { id: 'list', label: 'Listado', icon: List },
]

export default function PurchaseRequestsPage() {
  const { can } = usePermissions()
  const toast = useToast()

  // Tabs
  const [activeTab, setActiveTab] = useState('dashboard')

  // Filtros
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [priorityFilter, setPriorityFilter] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')

  // Modales
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [deleteId, setDeleteId] = useState<number | null>(null)
  const [editing, setEditing] = useState<PurchaseRequest | null>(null)
  const [viewingRequest, setViewingRequest] = useState<PurchaseRequest | null>(null)

  // Form state
  const [form, setForm] = useState<Partial<PurchaseRequestFormData>>({
    category: 'HARDWARE',
    priority: 'MEDIUM',
    status: 'PENDING',
    quantity: 1
  })

  // Queries and mutations
  const { data, isLoading } = usePurchaseRequests()
  const createMutation = useCreatePurchaseRequest()
  const updateMutation = useUpdatePurchaseRequest()
  const deleteMutation = useDeletePurchaseRequest()

  const requests = useMemo(() => data?.items ?? [], [data?.items])

  // Filtrar solicitudes
  const filteredRequests = useMemo(() => {
    let result = requests

    if (searchTerm) {
      const query = searchTerm.toLowerCase()
      result = result.filter(r =>
        r.itemName.toLowerCase().includes(query) ||
        r.requestNumber?.toLowerCase().includes(query) ||
        r.description?.toLowerCase().includes(query) ||
        r.requestor?.firstName.toLowerCase().includes(query) ||
        r.requestor?.lastName.toLowerCase().includes(query)
      )
    }

    if (statusFilter) {
      result = result.filter(r => r.status === statusFilter)
    }

    if (priorityFilter) {
      result = result.filter(r => r.priority === priorityFilter)
    }

    if (categoryFilter) {
      result = result.filter(r => r.category === categoryFilter)
    }

    return result
  }, [requests, searchTerm, statusFilter, priorityFilter, categoryFilter])

  // Estadísticas por estado
  const stats = useMemo(() => {
    return PURCHASE_REQUEST_STATUS_OPTIONS.map(status => ({
      ...status,
      count: requests.filter(r => r.status === status.value).length
    }))
  }, [requests])

  const openCreate = () => {
    setEditing(null)
    setForm({
      category: 'HARDWARE',
      priority: 'MEDIUM',
      status: 'PENDING',
      quantity: 1
    })
    setIsFormOpen(true)
  }

  const openEdit = (request: PurchaseRequest) => {
    setEditing(request)
    setForm({
      requestorId: request.requestorId || undefined,
      itemName: request.itemName,
      category: request.category,
      description: request.description || '',
      justification: request.justification || '',
      quantity: request.quantity,
      estimatedCost: request.estimatedCost || undefined,
      priority: request.priority,
      status: request.status,
      approvedBy: request.approvedBy || '',
      approvalDate: request.approvalDate ? request.approvalDate.slice(0, 10) : '',
      purchaseDate: request.purchaseDate ? request.purchaseDate.slice(0, 10) : '',
      receivedDate: request.receivedDate ? request.receivedDate.slice(0, 10) : '',
      vendor: request.vendor || '',
      actualCost: request.actualCost || undefined,
      notes: request.notes || ''
    })
    setIsFormOpen(true)
  }

  const handleSave = async () => {
    if (!form.itemName || !form.category || !form.quantity || !form.priority || !form.status) {
      alert('Por favor complete los campos requeridos')
      return
    }

    try {
      if (editing) {
        await updateMutation.mutateAsync({
          id: editing.id,
          data: form as PurchaseRequestFormData
        })
        toast.success('Solicitud actualizada', 'La solicitud de compra se ha actualizado correctamente')
      } else {
        await createMutation.mutateAsync(form as PurchaseRequestFormData)
        toast.success('Solicitud creada', 'La solicitud de compra se ha creado correctamente')
      }
      setIsFormOpen(false)
      setForm({
        category: 'HARDWARE',
        priority: 'MEDIUM',
        status: 'PENDING',
        quantity: 1
      })
      setEditing(null)
    } catch (error) {
      logError('PurchaseRequestsPage:handleSave', error)
      toast.error(
        editing ? 'Error al actualizar la solicitud' : 'Error al crear la solicitud',
        getErrorMessage(error, 'No se pudo completar la operación. Por favor, inténtelo de nuevo.')
      )
    }
  }

  const handleDelete = async () => {
    if (!deleteId) return

    try {
      await deleteMutation.mutateAsync(deleteId)
      toast.success('Solicitud eliminada', 'La solicitud de compra se ha eliminado correctamente')
      setDeleteId(null)
    } catch (error) {
      logError('PurchaseRequestsPage:handleDelete', error)
      toast.error('Error al eliminar la solicitud', getErrorMessage(error, 'No se pudo completar la operación'))
      setDeleteId(null)
    }
  }

  const clearFilters = () => {
    setSearchTerm('')
    setStatusFilter('')
    setPriorityFilter('')
    setCategoryFilter('')
  }

  const renderDashboard = () => <PurchaseRequestsDashboardTab />

  const renderList = () => (
    <>
      {/* Export Buttons */}
      <div className="mb-6">
        <ExportButtons
          data={filteredRequests}
          columns={{
            requestNumber: 'N° Solicitud',
            itemName: 'Item',
            category: 'Categoría',
            priority: 'Prioridad',
            status: 'Estado',
            quantity: 'Cantidad',
            estimatedCost: 'Costo Estimado',
            createdAt: 'Fecha Solicitud',
          }}
          pdfColumns={{
            requestNumber: 'N° Solicitud',
            itemName: 'Item',
            category: 'Categoría',
            priority: 'Prioridad',
            status: 'Estado',
          }}
          title="Reporte de Solicitudes de Compra"
          subtitle={`${filteredRequests.length} solicitudes`}
          department="Compras"
        />
      </div>

      {/* Filtros */}
      <div className="mb-6 p-4 sm:p-6 rounded-xl border border-white/10 bg-white/5 backdrop-blur-sm">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-white/40" />
            <input
              type="text"
              placeholder="Buscar por item, número, solicitante..."
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
              ...PURCHASE_REQUEST_STATUS_OPTIONS
            ]}
          />

          <Select
            label=""
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            options={[
              { value: '', label: 'Todas las prioridades' },
              ...PURCHASE_REQUEST_PRIORITIES
            ]}
          />

          <Select
            label=""
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            options={[
              { value: '', label: 'Todas las categorías' },
              ...PURCHASE_REQUEST_CATEGORIES
            ]}
          />
        </div>

        {(searchTerm || statusFilter || priorityFilter || categoryFilter) && (
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
      ) : filteredRequests.length === 0 ? (
        <div className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 py-16 text-center text-white/50">
          No hay solicitudes de compra para mostrar
        </div>
      ) : (
        <>
          {/* Vista Desktop */}
          <div className="hidden md:block bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10">
            <table className="w-full">
              <thead className="bg-white/5 border-b border-white/10">
                <tr>
                  <th className="text-left p-3 text-white/80 font-medium text-sm">Número</th>
                  <th className="text-left p-3 text-white/80 font-medium text-sm">Item</th>
                  <th className="text-left p-3 text-white/80 font-medium text-sm">Categoría</th>
                  <th className="text-left p-3 text-white/80 font-medium text-sm">Solicitante</th>
                  <th className="text-left p-3 text-white/80 font-medium text-sm">Cantidad</th>
                  <th className="text-left p-3 text-white/80 font-medium text-sm">Costo Est.</th>
                  <th className="text-left p-3 text-white/80 font-medium text-sm">Prioridad</th>
                  <th className="text-left p-3 text-white/80 font-medium text-sm">Estado</th>
                  <th className="text-left p-3 text-white/80 font-medium text-sm w-32">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filteredRequests.map(request => (
                  <tr key={request.id} className="border-t border-white/10 hover:bg-white/5 transition-colors">
                    <td className="p-3 text-white/80 text-sm">{request.requestNumber || '-'}</td>
                    <td className="p-3 text-white text-sm font-medium">{request.itemName}</td>
                    <td className="p-3 text-white/80 text-sm">{getCategoryLabel(request.category)}</td>
                    <td className="p-3 text-white/80 text-sm">
                      {request.requestor
                        ? `${request.requestor.firstName} ${request.requestor.lastName}`
                        : '-'}
                    </td>
                    <td className="p-3 text-white/80 text-sm">{request.quantity}</td>
                    <td className="p-3 text-white/80 text-sm">
                      {request.estimatedCost ? `$${request.estimatedCost.toLocaleString()}` : '-'}
                    </td>
                    <td className="p-3">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(request.priority)}`}>
                        {getPriorityLabel(request.priority)}
                      </span>
                    </td>
                    <td className="p-3">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(request.status)}`}>
                        {getStatusLabel(request.status)}
                      </span>
                    </td>
                    <td className="p-3">
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setViewingRequest(request)}
                          className="text-xs bg-green-500/10 hover:bg-green-500/20 text-green-400 border border-green-500/20 hover:border-green-500/40"
                        >
                          <Eye className="w-3 h-3 mr-1" />
                          Ver
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openEdit(request)}
                          className="text-xs bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/20 hover:border-blue-500/40"
                        >
                          Editar
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => setDeleteId(request.id)}
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
            {filteredRequests.map(request => (
              <div key={request.id} className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <ShoppingCart className="w-4 h-4 text-white/60 flex-shrink-0" />
                      <h3 className="font-medium text-white text-sm truncate">{request.itemName}</h3>
                    </div>
                    <p className="text-xs text-white/60">{request.requestNumber || 'Sin número'}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 mb-3">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getPriorityColor(request.priority)}`}>
                    {getPriorityLabel(request.priority)}
                  </span>
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(request.status)}`}>
                    {getStatusLabel(request.status)}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs mb-3">
                  <div>
                    <span className="text-white/60">Categoría:</span>
                    <div className="text-white px-2 sm:px-0">{getCategoryLabel(request.category)}</div>
                  </div>
                  <div>
                    <span className="text-white/60">Cantidad:</span>
                    <div className="text-white px-2 sm:px-0">{request.quantity}</div>
                  </div>
                  <div>
                    <span className="text-white/60">Solicitante:</span>
                    <div className="text-white truncate">
                      {request.requestor
                        ? `${request.requestor.firstName} ${request.requestor.lastName}`
                        : '-'}
                    </div>
                  </div>
                  <div>
                    <span className="text-white/60">Costo Est.:</span>
                    <div className="text-white px-2 sm:px-0">
                      {request.estimatedCost ? `$${request.estimatedCost.toLocaleString()}` : '-'}
                    </div>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => setViewingRequest(request)}
                    className="flex-1 px-3 py-2 bg-green-500/10 hover:bg-green-500/20 text-green-400 rounded-lg text-sm transition-colors flex items-center justify-center gap-1"
                  >
                    <Eye className="w-4 h-4" />
                    Ver
                  </button>
                  <button
                    onClick={() => openEdit(request)}
                    className="flex-1 px-3 py-2 bg-white/5 hover:bg-white/10 text-white rounded-lg text-sm transition-colors"
                  >
                    Editar
                  </button>
                  <button
                    onClick={() => setDeleteId(request.id)}
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
  if (!can('purchase-requests', 'view')) {
    return (
      <div className="text-white px-2 sm:px-0">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="text-red-400 text-xl mb-2">Acceso Denegado</div>
            <div className="text-white/60">No tienes permisos para ver las solicitudes de compra.</div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="text-white px-2 sm:px-0">
      <FadeInUp>
        <PageHeader
          title="Solicitudes de Compra"
          description="Gestión de solicitudes y prioridades de compra"
          icon={ShoppingCart}
        />

        {/* Tabs */}
        <Tabs tabs={PURCHASE_REQUEST_TABS} activeTab={activeTab} onChange={setActiveTab} className="mb-6" />

        {/* Header con botón Nueva Solicitud */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div>
            <h2 className="text-xl font-bold text-white">
              {activeTab === 'dashboard' ? 'Estadísticas' : 'Listado de Solicitudes'}
            </h2>
            <p className="text-white/60 text-sm">
              {activeTab === 'dashboard'
                ? 'Resumen de solicitudes por estado'
                : `${filteredRequests.length} solicitudes`}
            </p>
          </div>
          <Button onClick={openCreate} variant="glass" size="sm">
            
            Nueva Solicitud
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
            category: 'HARDWARE',
            priority: 'MEDIUM',
            status: 'PENDING',
            quantity: 1
          })
        }}
        title={editing ? 'Editar Solicitud de Compra' : 'Nueva Solicitud de Compra'}
        footer={
          <div className="flex gap-3">
            <Button variant="default" onClick={() => {
                setIsFormOpen(false)
                setEditing(null)
                setForm({
                  category: 'HARDWARE',
                  priority: 'MEDIUM',
                  status: 'PENDING',
                  quantity: 1
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
          {editing && editing.requestNumber && (
            <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
              <div className="text-xs text-blue-400 mb-1">Número de Solicitud</div>
              <div className="text-white font-medium">{editing.requestNumber}</div>
            </div>
          )}

          <Input
            label="Nombre del Item *"
            value={form.itemName || ''}
            onChange={(e) => setForm({ ...form, itemName: e.target.value })}
            placeholder="Ej: Notebook Dell Latitude 5520"
            required
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Select
              label="Categoría *"
              value={form.category || 'HARDWARE'}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
              options={PURCHASE_REQUEST_CATEGORIES}
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
              label="Costo Estimado"
              type="number"
              step="0.01"
              min="0"
              value={form.estimatedCost || ''}
              onChange={(e) => setForm({ ...form, estimatedCost: e.target.value ? parseFloat(e.target.value) : undefined })}
              placeholder="0.00"
            />

            <Select
              label="Prioridad *"
              value={form.priority || 'MEDIUM'}
              onChange={(e) => setForm({ ...form, priority: e.target.value })}
              options={PURCHASE_REQUEST_PRIORITIES}
            />

            <Select
              label="Estado *"
              value={form.status || 'PENDING'}
              onChange={(e) => setForm({ ...form, status: e.target.value })}
              options={PURCHASE_REQUEST_STATUS_OPTIONS}
            />
          </div>

          {/* Campos condicionales para estados aprobados/comprados */}
          {(form.status === 'APPROVED' || form.status === 'PURCHASED' || form.status === 'RECEIVED') && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-lg bg-blue-500/5 border border-blue-500/20">
              <Input
                label="Aprobado por"
                value={form.approvedBy || ''}
                onChange={(e) => setForm({ ...form, approvedBy: e.target.value })}
                placeholder="Nombre del aprobador"
              />

              <Input
                label="Fecha de Aprobación"
                type="date"
                value={form.approvalDate || ''}
                onChange={(e) => setForm({ ...form, approvalDate: e.target.value })}
              />
            </div>
          )}

          {(form.status === 'PURCHASED' || form.status === 'RECEIVED') && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-lg bg-purple-500/5 border border-purple-500/20">
              <Input
                label="Proveedor"
                value={form.vendor || ''}
                onChange={(e) => setForm({ ...form, vendor: e.target.value })}
                placeholder="Nombre del proveedor"
              />

              <Input
                label="Fecha de Compra"
                type="date"
                value={form.purchaseDate || ''}
                onChange={(e) => setForm({ ...form, purchaseDate: e.target.value })}
              />

              <Input
                label="Costo Real"
                type="number"
                step="0.01"
                min="0"
                value={form.actualCost || ''}
                onChange={(e) => setForm({ ...form, actualCost: e.target.value ? parseFloat(e.target.value) : undefined })}
                placeholder="0.00"
              />
            </div>
          )}

          {form.status === 'RECEIVED' && (
            <div className="p-4 rounded-lg bg-green-500/5 border border-green-500/20">
              <Input
                label="Fecha de Recepción"
                type="date"
                value={form.receivedDate || ''}
                onChange={(e) => setForm({ ...form, receivedDate: e.target.value })}
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-white/60 mb-1 uppercase tracking-wide">
              Descripción
            </label>
            <textarea
              className="w-full px-3 py-2 rounded-md bg-black/30 border border-white/10 text-white placeholder-white/40 focus:outline-none focus:border-white/20 resize-none"
              rows={3}
              value={form.description || ''}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Descripción detallada del item solicitado..."
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-white/60 mb-1 uppercase tracking-wide">
              Justificación
            </label>
            <textarea
              className="w-full px-3 py-2 rounded-md bg-black/30 border border-white/10 text-white placeholder-white/40 focus:outline-none focus:border-white/20 resize-none"
              rows={3}
              value={form.justification || ''}
              onChange={(e) => setForm({ ...form, justification: e.target.value })}
              placeholder="Justificación de la necesidad de compra..."
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-white/60 mb-1 uppercase tracking-wide">
              Observaciones
            </label>
            <textarea
              className="w-full px-3 py-2 rounded-md bg-black/30 border border-white/10 text-white placeholder-white/40 focus:outline-none focus:border-white/20 resize-none"
              rows={2}
              value={form.notes || ''}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              placeholder="Observaciones adicionales..."
            />
          </div>
        </div>
      </Modal>

      {/* Confirmación de eliminación */}
      <ConfirmDialog
        isOpen={deleteId !== null}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Eliminar Solicitud de Compra"
        message="¿Estás seguro de que quieres eliminar esta solicitud? Esta acción no se puede deshacer."
        variant="danger"
      />

      {/* View Modal */}
      <ViewPurchaseRequestModal
        request={viewingRequest}
        isOpen={viewingRequest !== null}
        onClose={() => setViewingRequest(null)}
      />
    </div>
  )
}
