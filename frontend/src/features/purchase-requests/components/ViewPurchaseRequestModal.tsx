import { ShoppingCart, User, DollarSign, Calendar, Package, AlertCircle, Info } from 'lucide-react'
import type { PurchaseRequest } from '../types'
import Button from '../../../shared/components/ui/Button'
import Modal from '../../../shared/components/ui/Modal'

interface ViewPurchaseRequestModalProps {
  request: PurchaseRequest | null
  isOpen: boolean
  onClose: () => void
}

export function ViewPurchaseRequestModal({ request, isOpen, onClose }: ViewPurchaseRequestModalProps) {
  if (!request) return null

  const formatDate = (dateString?: string | null) => {
    if (!dateString) return 'N/A'
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const formatCurrency = (amount?: number | null) => {
    if (!amount) return 'N/A'
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN'
    }).format(amount)
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`${request.itemName} - ${request.requestNumber ? `Solicitud #${request.requestNumber}` : 'Solicitud de Compra'}`}
      className="max-w-[95vw] sm:max-w-3xl md:max-w-4xl"
      footer={
        <div className="flex justify-end w-full">
          <Button onClick={onClose} variant="ghost" className="w-full sm:w-auto">
            Cerrar
          </Button>
        </div>
      }
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
            {/* Información General */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                <Info className="w-5 h-5" />
                Información General
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">Artículo:</span>
                  <span className="text-white font-medium">{request.itemName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Categoría:</span>
                  <span className="text-white">{request.category}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Cantidad:</span>
                  <span className="text-white">{request.quantity}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Prioridad:</span>
                  <span className={`font-medium ${
                    request.priority === 'URGENT' ? 'text-red-400' :
                    request.priority === 'HIGH' ? 'text-orange-400' :
                    request.priority === 'MEDIUM' ? 'text-yellow-400' :
                    'text-green-400'
                  }`}>{request.priority}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Estado:</span>
                  <span className={`font-medium ${
                    request.status === 'APPROVED' ? 'text-green-400' :
                    request.status === 'PENDING' ? 'text-yellow-400' :
                    request.status === 'REJECTED' ? 'text-red-400' :
                    request.status === 'COMPLETED' ? 'text-blue-400' :
                    'text-gray-400'
                  }`}>{request.status}</span>
                </div>
              </div>
            </div>

            {/* Solicitante */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                <User className="w-5 h-5" />
                Solicitante
              </h3>
              {request.requestor ? (
                <div className="bg-white/5 rounded-lg p-3">
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-blue-400" />
                    <span className="text-white font-medium">
                      {request.requestor.firstName} {request.requestor.lastName}
                    </span>
                  </div>
                  {request.requestor.area && (
                    <p className="text-gray-400 text-xs mt-1">{request.requestor.area}</p>
                  )}
                </div>
              ) : (
                <p className="text-gray-500 text-sm">No asignado</p>
              )}
            </div>

            {/* Descripción */}
            {request.description && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                  <Package className="w-5 h-5" />
                  Descripción
                </h3>
                <p className="text-gray-300 text-sm bg-white/5 rounded-lg p-4 whitespace-pre-wrap">
                  {request.description}
                </p>
              </div>
            )}

            {/* Justificación */}
            {request.justification && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                  <AlertCircle className="w-5 h-5" />
                  Justificación
                </h3>
                <p className="text-gray-300 text-sm bg-white/5 rounded-lg p-4 whitespace-pre-wrap">
                  {request.justification}
                </p>
              </div>
            )}

            {/* Información Financiera */}
            <div className="space-y-4 md:col-span-2">
              <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                <DollarSign className="w-5 h-5" />
                Información Financiera
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">Costo Estimado:</span>
                  <span className="text-white font-medium">{formatCurrency(request.estimatedCost)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Costo Real:</span>
                  <span className="text-white font-medium">{formatCurrency(request.actualCost)}</span>
                </div>
                {request.vendor && (
                  <div className="flex justify-between">
                    <span className="text-gray-400">Proveedor:</span>
                    <span className="text-white">{request.vendor}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Aprobación */}
            {request.approvedBy && (
              <div className="space-y-4 md:col-span-2">
                <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                  <User className="w-5 h-5" />
                  Aprobación
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Aprobado por:</span>
                    <span className="text-white">{request.approvedBy}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Fecha de aprobación:</span>
                    <span className="text-white">{formatDate(request.approvalDate)}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Fechas */}
            <div className="space-y-4 md:col-span-2">
              <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                Fechas Importantes
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div className="flex flex-col">
                  <span className="text-gray-400">Creación:</span>
                  <span className="text-white">{formatDate(request.createdAt)}</span>
                </div>
                {request.purchaseDate && (
                  <div className="flex flex-col">
                    <span className="text-gray-400">Compra:</span>
                    <span className="text-white">{formatDate(request.purchaseDate)}</span>
                  </div>
                )}
                {request.receivedDate && (
                  <div className="flex flex-col">
                    <span className="text-gray-400">Recepción:</span>
                    <span className="text-white">{formatDate(request.receivedDate)}</span>
                  </div>
                )}
                <div className="flex flex-col">
                  <span className="text-gray-400">Actualización:</span>
                  <span className="text-white">{formatDate(request.updatedAt)}</span>
                </div>
              </div>
            </div>

            {/* Notas */}
            {request.notes && (
              <div className="space-y-4 md:col-span-2">
                <h3 className="text-lg font-semibold text-white">Notas Adicionales</h3>
                <p className="text-gray-300 text-sm bg-white/5 rounded-lg p-4 whitespace-pre-wrap">
                  {request.notes}
                </p>
              </div>
            )}
        </div>
    </Modal>
  )
}
