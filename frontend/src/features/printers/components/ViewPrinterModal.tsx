import { Printer as PrinterIcon, MapPin, Calendar, Network, Info } from 'lucide-react'
import type { Printer } from '../types'
import Button from '../../../shared/components/ui/Button'
import Modal from '../../../shared/components/ui/Modal'

interface ViewPrinterModalProps {
  printer: Printer | null
  isOpen: boolean
  onClose: () => void
}

export function ViewPrinterModal({ printer, isOpen, onClose }: ViewPrinterModalProps) {
  if (!printer) return null

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
      title={`${printer.model} - Impresora`}
      className="max-w-[95vw] sm:max-w-2xl"
      footer={
        <div className="flex justify-end w-full">
          <Button onClick={onClose} variant="ghost" className="w-full sm:w-auto">
            Cerrar
          </Button>
        </div>
      }
    >
      <div className="space-y-4 sm:space-y-6">
            {/* Información General */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                <Info className="w-5 h-5" />
                Información General
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">Modelo:</span>
                  <span className="text-white font-medium">{printer.model}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Número de Serie:</span>
                  <span className="text-white font-mono">{printer.serialNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Estado:</span>
                  <span className={`font-medium ${
                    printer.status === 'Activo' ? 'text-green-400' :
                    printer.status === 'Inactivo' ? 'text-red-400' :
                    printer.status === 'Mantenimiento' ? 'text-yellow-400' :
                    'text-gray-400'
                  }`}>{printer.status}</span>
                </div>
              </div>
            </div>

            {/* Ubicación */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                <MapPin className="w-5 h-5" />
                Ubicación
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">Área:</span>
                  <span className="text-white">{printer.area}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Ubicación:</span>
                  <span className="text-white">{printer.location}</span>
                </div>
              </div>
            </div>

            {/* Red */}
            {printer.ip && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                  <Network className="w-5 h-5" />
                  Configuración de Red
                </h3>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Dirección IP:</span>
                  <span className="text-white font-mono">{printer.ip}</span>
                </div>
              </div>
            )}

            {/* Fechas */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                Registro
              </h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">Creado:</span>
                  <span className="text-white">{formatDate(printer.createdAt)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Actualizado:</span>
                  <span className="text-white">{formatDate(printer.updatedAt)}</span>
                </div>
              </div>
            </div>
          </div>
    </Modal>
  )
}
