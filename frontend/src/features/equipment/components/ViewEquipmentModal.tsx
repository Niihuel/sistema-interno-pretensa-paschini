import { User, MapPin, Calendar, HardDrive, Cpu, Info } from 'lucide-react'
import type { Equipment } from '../types'
import Button from '../../../shared/components/ui/Button'
import Modal from '../../../shared/components/ui/Modal'

interface ViewEquipmentModalProps {
  equipment: Equipment | null
  isOpen: boolean
  onClose: () => void
}

export function ViewEquipmentModal({ equipment, isOpen, onClose }: ViewEquipmentModalProps) {
  if (!equipment) return null

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
      title={`${equipment.name} - ${equipment.type}`}
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
                    <span className="text-white">{formatDate(equipment.purchaseDate)}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-gray-400">Propiedad personal:</span>
                  <span className="text-white">{equipment.isPersonalProperty ? 'Sí' : 'No'}</span>
                </div>
              </div>
            </div>

            {/* Ubicación y Asignación */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                <MapPin className="w-5 h-5" />
                Ubicación y Asignación
              </h3>
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
                {equipment.assignedTo ? (
                  <div className="flex flex-col gap-1">
                    <span className="text-gray-400">Asignado a:</span>
                    <div className="bg-white/5 rounded-lg p-3">
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-blue-400" />
                        <span className="text-white font-medium">
                          {equipment.assignedTo.firstName} {equipment.assignedTo.lastName}
                        </span>
                      </div>
                      {equipment.assignedTo.position && (
                        <p className="text-gray-400 text-xs mt-1">{equipment.assignedTo.position}</p>
                      )}
                      {equipment.assignedTo.area && (
                        <p className="text-gray-400 text-xs">{equipment.assignedTo.area}</p>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="flex justify-between">
                    <span className="text-gray-400">Asignado a:</span>
                    <span className="text-gray-500">No asignado</span>
                  </div>
                )}
              </div>
            </div>

            {/* Especificaciones Técnicas */}
            {(equipment.processor || equipment.ram || equipment.storage || equipment.operatingSystem) && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                  <Cpu className="w-5 h-5" />
                  Especificaciones Técnicas
                </h3>
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

            {/* Red */}
            {(equipment.ip || equipment.ipAddress || equipment.macAddress) && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                  <HardDrive className="w-5 h-5" />
                  Configuración de Red
                </h3>
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
                <h3 className="text-lg font-semibold text-white">Notas</h3>
                <p className="text-gray-300 text-sm bg-white/5 rounded-lg p-4 whitespace-pre-wrap">
                  {equipment.notes}
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
                  <span className="text-white">{formatDate(equipment.createdAt)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Actualizado:</span>
                  <span className="text-white">{formatDate(equipment.updatedAt)}</span>
                </div>
              </div>
            </div>
          </div>
    </Modal>
  )
}
