import { Package, User, Calendar, Hash, Info } from 'lucide-react'
import type { InventoryItem } from '../types'
import Button from '../../../shared/components/ui/Button'
import Modal from '../../../shared/components/ui/Modal'

interface ViewInventoryModalProps {
  item: InventoryItem | null
  isOpen: boolean
  onClose: () => void
}

export function ViewInventoryModal({ item, isOpen, onClose }: ViewInventoryModalProps) {
  if (!item) return null

  const formatDate = (dateString?: string | null) => {
    if (!dateString) return 'N/A'
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`${item.name} - ${item.category}`}
      className="max-w-[95vw] sm:max-w-3xl"
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
                  <span className="text-gray-400">Categoría:</span>
                  <span className="text-white">{item.category}</span>
                </div>
                {item.brand && (
                  <div className="flex justify-between">
                    <span className="text-gray-400">Marca:</span>
                    <span className="text-white">{item.brand}</span>
                  </div>
                )}
                {item.model && (
                  <div className="flex justify-between">
                    <span className="text-gray-400">Modelo:</span>
                    <span className="text-white">{item.model}</span>
                  </div>
                )}
                {item.serialNumber && (
                  <div className="flex justify-between">
                    <span className="text-gray-400">Número de Serie:</span>
                    <span className="text-white font-mono">{item.serialNumber}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-gray-400">Estado:</span>
                  <span className={`font-medium ${
                    item.status === 'Disponible' ? 'text-green-400' :
                    item.status === 'Asignado' ? 'text-blue-400' :
                    item.status === 'En Reparación' ? 'text-yellow-400' :
                    'text-red-400'
                  }`}>{item.status}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Condición:</span>
                  <span className={`font-medium ${
                    item.condition === 'Nuevo' ? 'text-green-400' :
                    item.condition === 'Bueno' ? 'text-blue-400' :
                    item.condition === 'Regular' ? 'text-yellow-400' :
                    'text-red-400'
                  }`}>{item.condition}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Propiedad personal:</span>
                  <span className="text-white">{item.isPersonalProperty ? 'Sí' : 'No'}</span>
                </div>
              </div>
            </div>

            {/* Inventario y Ubicación */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                <Hash className="w-5 h-5" />
                Inventario
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">Cantidad:</span>
                  <span className="text-white font-bold text-lg">{item.quantity}</span>
                </div>
                {item.location && (
                  <div className="flex justify-between">
                    <span className="text-gray-400">Ubicación:</span>
                    <span className="text-white">{item.location}</span>
                  </div>
                )}
              </div>

              {item.assignedTo && (
                <>
                  <h3 className="text-lg font-semibold text-white flex items-center gap-2 mt-6">
                    <User className="w-5 h-5" />
                    Asignación
                  </h3>
                  <div className="bg-white/5 rounded-lg p-3">
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-blue-400" />
                      <span className="text-white font-medium">
                        {item.assignedTo.firstName} {item.assignedTo.lastName}
                      </span>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Notas */}
            {item.notes && (
              <div className="space-y-4 md:col-span-2">
                <h3 className="text-lg font-semibold text-white">Notas</h3>
                <p className="text-gray-300 text-sm bg-white/5 rounded-lg p-4 whitespace-pre-wrap">
                  {item.notes}
                </p>
              </div>
            )}

            {/* Fechas */}
            <div className="space-y-4 md:col-span-2">
              <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                Registro
              </h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">Creado:</span>
                  <span className="text-white">{formatDate(item.createdAt)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Actualizado:</span>
                  <span className="text-white">{formatDate(item.updatedAt)}</span>
                </div>
              </div>
            </div>
          </div>
    </Modal>
  )
}
