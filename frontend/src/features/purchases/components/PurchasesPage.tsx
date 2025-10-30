import { useState } from 'react'
import { usePermissions } from '../../../providers/PermissionsProvider'
import LoadingSpinner from '../../../shared/components/ui/LoadingSpinner'
import { usePurchases, useCreatePurchase, useUpdatePurchase, useDeletePurchase } from '../hooks/usePurchases'
import { useToast } from '../../../shared/components/ui/ToastContainer'
import type { Purchase, PurchaseFormData } from '../types'
import AnimatedContainer, { FadeInUp } from '../../../shared/components/ui/AnimatedContainer'
import Button from '../../../shared/components/ui/Button'
import Input from '../../../shared/components/ui/Input'
import Select from '../../../shared/components/ui/Select'
import Modal from '../../../shared/components/ui/Modal'
import ConfirmDialog from '../../../shared/components/ui/ConfirmDialog'
import ExportButtons from '../../../shared/components/export/ExportButtons'
import { Edit2, Trash2, Plus, Search, ShoppingCart, Package, CheckCircle, XCircle } from 'lucide-react'
import { getErrorMessage, logError } from '../../../utils/errorHelpers'

export default function PurchasesPage() {
  const { can } = usePermissions()
  const toast = useToast()

  // Filters
  const [orderNumberFilter, setOrderNumberFilter] = useState('')
  const [supplierFilter, setSupplierFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')

  // Data fetching
  const { data, isLoading } = usePurchases({
    orderNumber: orderNumberFilter || undefined,
    supplier: supplierFilter || undefined,
    status: statusFilter || undefined,
  })

  const purchases = data?.items || []

  // Mutations
  const createMutation = useCreatePurchase()
  const updateMutation = useUpdatePurchase()
  const deleteMutation = useDeletePurchase()

  // Modal state
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editing, setEditing] = useState<Purchase | null>(null)
  const [form, setForm] = useState<PurchaseFormData>({
    orderNumber: '',
    supplier: '',
    totalAmount: 0,
    status: 'PENDING',
    orderDate: new Date().toISOString().split('T')[0],
    expectedDeliveryDate: '',
    actualDeliveryDate: '',
    notes: '',
  })

  // Delete confirmation
  const [deleteId, setDeleteId] = useState<number | null>(null)

  // Handlers
  const openCreate = () => {
    setEditing(null)
    setForm({
      orderNumber: '',
      supplier: '',
      totalAmount: 0,
      status: 'PENDING',
      orderDate: new Date().toISOString().split('T')[0],
      expectedDeliveryDate: '',
      actualDeliveryDate: '',
      notes: '',
    })
    setIsFormOpen(true)
  }

  const openEdit = (purchase: Purchase) => {
    setEditing(purchase)
    setForm({
      orderNumber: purchase.orderNumber,
      supplier: purchase.supplier,
      totalAmount: purchase.totalAmount,
      status: purchase.status,
      orderDate: purchase.orderDate.split('T')[0],
      expectedDeliveryDate: purchase.expectedDeliveryDate?.split('T')[0] || '',
      actualDeliveryDate: purchase.actualDeliveryDate?.split('T')[0] || '',
      notes: purchase.notes || '',
    })
    setIsFormOpen(true)
  }

  const handleSave = async () => {
    try {
      if (editing) {
        await updateMutation.mutateAsync({ id: editing.id, data: form })
        toast.success('Compra actualizada', 'La compra se ha actualizado correctamente')
      } else {
        await createMutation.mutateAsync(form)
        toast.success('Compra creada', 'La compra se ha creado correctamente')
      }
      setIsFormOpen(false)
    } catch (error) {
      logError('PurchasesPage:handleSave', error)
      toast.error(
        editing ? 'Error al actualizar la compra' : 'Error al crear la compra',
        getErrorMessage(error, 'No se pudo completar la operación. Por favor, inténtelo de nuevo.')
      )
    }
  }

  const handleDelete = async () => {
    if (deleteId) {
      try {
        await deleteMutation.mutateAsync(deleteId)
        toast.success('Compra eliminada', 'La compra se ha eliminado correctamente')
        setDeleteId(null)
      } catch (error) {
        logError('PurchasesPage:handleDelete', error)
        toast.error('Error al eliminar la compra', getErrorMessage(error, 'No se pudo completar la operación'))
        setDeleteId(null)
      }
    }
  }

  const statusOptions = [
    { value: '', label: 'Todos los estados' },
    { value: 'PENDING', label: 'Pendiente' },
    { value: 'ORDERED', label: 'Ordenada' },
    { value: 'RECEIVED', label: 'Recibida' },
    { value: 'CANCELLED', label: 'Cancelada' },
  ]

  const formStatusOptions = [
    { value: 'PENDING', label: 'Pendiente' },
    { value: 'ORDERED', label: 'Ordenada' },
    { value: 'RECEIVED', label: 'Recibida' },
    { value: 'CANCELLED', label: 'Cancelada' },
  ]

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'PENDING':
        return <ShoppingCart className="w-3 h-3" />
      case 'ORDERED':
        return <Package className="w-3 h-3" />
      case 'RECEIVED':
        return <CheckCircle className="w-3 h-3" />
      case 'CANCELLED':
        return <XCircle className="w-3 h-3" />
      default:
        return null
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 'bg-yellow-500/10 text-yellow-400'
      case 'ORDERED':
        return 'bg-blue-500/10 text-blue-400'
      case 'RECEIVED':
        return 'bg-green-500/10 text-green-400'
      case 'CANCELLED':
        return 'bg-red-500/10 text-red-400'
      default:
        return 'bg-gray-500/10 text-gray-400'
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 'Pendiente'
      case 'ORDERED':
        return 'Ordenada'
      case 'RECEIVED':
        return 'Recibida'
      case 'CANCELLED':
        return 'Cancelada'
      default:
        return status
    }
  }

  // Check permissions
  const canCreate = can('purchases', 'create')
  const canEdit = can('purchases', 'update')
  const canDelete = can('purchases', 'delete')

  if (!can('purchases', 'view')) {
    return (
      <AnimatedContainer className="text-white px-2 sm:px-0">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="text-red-400 text-xl mb-2">Acceso Denegado</div>
            <div className="text-white/60">No tienes permisos para ver órdenes de compra.</div>
          </div>
        </div>
      </AnimatedContainer>
    )
  }

  return (
    <AnimatedContainer className="text-white px-2 sm:px-0">
      <FadeInUp delay={0.05}>
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-semibold mb-2">Órdenes de Compra</h1>
              <p className="text-white/70">Gestión de pedidos y órdenes de compra</p>
            </div>
            {canCreate && (
              <Button variant="glass" onClick={openCreate}>
                <Plus className="w-4 h-4 mr-2" />
                Nueva Orden
              </Button>
            )}
          </div>

          {/* Export Buttons */}
          <ExportButtons
            data={purchases}
            columns={{
              orderNumber: 'Número de Orden',
              supplier: 'Proveedor',
              totalAmount: 'Monto Total',
              status: 'Estado',
              orderDate: 'Fecha Orden',
              expectedDeliveryDate: 'Fecha Entrega Estimada',
              actualDeliveryDate: 'Fecha Entrega Real',
            }}
            title="Órdenes de Compra"
            subtitle={`${purchases.length} órdenes registradas`}
            department="Compras"
            author="Sistema"
          />
        </div>
      </FadeInUp>

      {/* Filters */}
      <FadeInUp delay={0.15}>
        <div className="glass-strong rounded-xl p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Input
              placeholder="Buscar por número de orden..."
              value={orderNumberFilter}
              onChange={(e) => setOrderNumberFilter(e.target.value)}
              className="bg-white/5"
            />
            <Input
              placeholder="Buscar por proveedor..."
              value={supplierFilter}
              onChange={(e) => setSupplierFilter(e.target.value)}
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
                setOrderNumberFilter('')
                setSupplierFilter('')
                setStatusFilter('')
              }}
            >
              <Search className="w-4 h-4 mr-2" />
              Limpiar Filtros
            </Button>
          </div>
        </div>
      </FadeInUp>

      {/* Table */}
      <FadeInUp delay={0.25}>
        <div className="glass-strong rounded-xl">
          {isLoading ? (
            <div className="p-8 flex justify-center"><LoadingSpinner size="md" /></div>
          ) : purchases.length === 0 ? (
            <div className="p-8 text-center text-white/60">No se encontraron órdenes de compra</div>
          ) : (
            <div className="overflow-x-auto">
              {/* Desktop Table */}
              <table className="hidden md:table w-full">
                <thead className="bg-white/5">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-white/70 uppercase tracking-wider">Número</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-white/70 uppercase tracking-wider">Proveedor</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-white/70 uppercase tracking-wider">Monto</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-white/70 uppercase tracking-wider">Estado</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-white/70 uppercase tracking-wider">Fecha Orden</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-white/70 uppercase tracking-wider">Entrega Estimada</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-white/70 uppercase tracking-wider">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/10">
                  {purchases.map((purchase) => (
                    <tr key={purchase.id} className="hover:bg-white/5 transition-colors">
                      <td className="px-4 py-3 text-sm text-white font-mono">{purchase.orderNumber}</td>
                      <td className="px-4 py-3 text-sm text-white/70">{purchase.supplier}</td>
                      <td className="px-4 py-3 text-sm text-white font-medium">
                        ${purchase.totalAmount.toFixed(2)}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <span className={`px-2 py-1 rounded-full text-xs flex items-center gap-1 w-fit ${getStatusColor(purchase.status)}`}>
                          {getStatusIcon(purchase.status)}
                          {getStatusLabel(purchase.status)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-white/70">
                        {new Date(purchase.orderDate).toLocaleDateString('es-ES')}
                      </td>
                      <td className="px-4 py-3 text-sm text-white/70">
                        {purchase.expectedDeliveryDate
                          ? new Date(purchase.expectedDeliveryDate).toLocaleDateString('es-ES')
                          : '-'}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <div className="flex gap-2">
                          {canEdit && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => openEdit(purchase)}
                              className="text-xs bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/20 hover:border-blue-500/40"
                            >
                              Editar
                            </Button>
                          )}
                          {canDelete && (
                            <Button
                              size="sm"
                              onClick={() => setDeleteId(purchase.id)}
                              className="text-xs bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 hover:border-red-500/40"
                            >
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
                {purchases.map((purchase) => (
                  <div key={purchase.id} className="glass rounded-lg p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="text-white font-medium font-mono">{purchase.orderNumber}</h3>
                        <p className="text-white/60 text-sm">{purchase.supplier}</p>
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs flex items-center gap-1 ${getStatusColor(purchase.status)}`}>
                        {getStatusIcon(purchase.status)}
                      </span>
                    </div>

                    <div className="space-y-1 mb-3 text-sm">
                      <p className="text-white/70">
                        <span className="text-white/50">Monto:</span> ${purchase.totalAmount.toFixed(2)}
                      </p>
                      <p className="text-white/70">
                        <span className="text-white/50">Fecha Orden:</span>{' '}
                        {new Date(purchase.orderDate).toLocaleDateString('es-ES')}
                      </p>
                      {purchase.expectedDeliveryDate && (
                        <p className="text-white/70">
                          <span className="text-white/50">Entrega Estimada:</span>{' '}
                          {new Date(purchase.expectedDeliveryDate).toLocaleDateString('es-ES')}
                        </p>
                      )}
                      {purchase.notes && (
                        <p className="text-white/60 text-xs mt-2 italic">{purchase.notes}</p>
                      )}
                    </div>

                    <div className="flex gap-2">
                      {canEdit && (
                        <Button
                          variant="glass"
                          size="sm"
                          onClick={() => openEdit(purchase)}
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
                          onClick={() => setDeleteId(purchase.id)}
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
        title={editing ? 'Editar Orden de Compra' : 'Nueva Orden de Compra'}
        footer={
          <div className="flex gap-3">
            <Button variant="default" onClick={() => setIsFormOpen(false)} className="flex-1">
              Cancelar
            </Button>
            <Button
              variant="glass"
              onClick={handleSave}
              disabled={!form.orderNumber || !form.supplier || createMutation.isPending || updateMutation.isPending}
              className="flex-1"
            >
              {editing ? 'Actualizar' : 'Crear'}
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          <Input
            label="Número de Orden *"
            value={form.orderNumber}
            onChange={(e) => setForm({ ...form, orderNumber: e.target.value })}
            placeholder="Ej: OC-2024-001"
            required
          />

          <Input
            label="Proveedor *"
            value={form.supplier}
            onChange={(e) => setForm({ ...form, supplier: e.target.value })}
            placeholder="Nombre del proveedor"
            required
          />

          <Input
            label="Monto Total *"
            type="number"
            step="0.01"
            value={form.totalAmount}
            onChange={(e) => setForm({ ...form, totalAmount: parseFloat(e.target.value) || 0 })}
            placeholder="0.00"
            required
          />

          <Select
            label="Estado *"
            value={form.status}
            onChange={(e) => setForm({ ...form, status: e.target.value })}
            options={formStatusOptions}
          />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input
              label="Fecha Orden *"
              type="date"
              value={form.orderDate}
              onChange={(e) => setForm({ ...form, orderDate: e.target.value })}
              required
            />

            <Input
              label="Entrega Estimada"
              type="date"
              value={form.expectedDeliveryDate || ''}
              onChange={(e) => setForm({ ...form, expectedDeliveryDate: e.target.value })}
            />

            <Input
              label="Entrega Real"
              type="date"
              value={form.actualDeliveryDate || ''}
              onChange={(e) => setForm({ ...form, actualDeliveryDate: e.target.value })}
            />
          </div>

          <Input
            label="Notas"
            value={form.notes || ''}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
            placeholder="Notas adicionales (opcional)"
          />
        </div>
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={deleteId !== null}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Eliminar Orden de Compra"
        message="¿Estás seguro de que deseas eliminar esta orden de compra? Esta acción no se puede deshacer."
        confirmText="Eliminar"
        cancelText="Cancelar"
        variant="danger"
      />
    </AnimatedContainer>
  )
}
