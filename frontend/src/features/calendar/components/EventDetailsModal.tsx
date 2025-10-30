import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Clock, MapPin, Users, Tag, Edit, Trash2, Calendar as CalendarIcon, Bell, RefreshCw, CheckCircle2, AlertCircle } from 'lucide-react'
import { useDailyBackups } from '../../daily-backups/hooks/useDailyBackups'
import Modal from '../../../shared/components/ui/Modal'
import Button from '../../../shared/components/ui/Button'
import ConfirmDialog from '../../../shared/components/ui/ConfirmDialog'
import { useDeleteEvent } from '../hooks/useCalendar'
import type { CalendarEvent, DailyBackupMetadata } from '../types'
import { cn } from '../../../shared/utils/cn'

// Type guard para DailyBackupMetadata
function isDailyBackupMetadata(metadata: Record<string, unknown> | null): metadata is DailyBackupMetadata & Record<string, unknown> {
  return metadata !== null && metadata.type === 'daily-backup'
}

interface EventDetailsModalProps {
  isOpen: boolean
  onClose: () => void
  event: CalendarEvent | null
  onEdit?: (event: CalendarEvent) => void
  onSuccess?: () => void
}

export default function EventDetailsModal({
  isOpen,
  onClose,
  event,
  onEdit,
  onSuccess,
}: EventDetailsModalProps) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const navigate = useNavigate()
  const deleteEvent = useDeleteEvent()
  
  // Obtener datos en tiempo real del backup si es un evento de backup
  const { todayBackup, isLoadingToday, refetchToday } = useDailyBackups()
  
  // Auto-refresh para eventos de backup
  useEffect(() => {
    if (isOpen && isDailyBackupMetadata(event?.metadata ?? null)) {
      const interval = setInterval(() => {
        refetchToday()
      }, 10000) // Refresh cada 10 segundos

      return () => clearInterval(interval)
    }
  }, [isOpen, event?.metadata, refetchToday])

  if (!event) return null

  const startDate = new Date(event.startTime)
  const endDate = event.endTime ? new Date(event.endTime) : null

  const formatDateTime = (date: Date) => {
    return new Intl.DateTimeFormat('es-AR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: event.allDay ? undefined : '2-digit',
      minute: event.allDay ? undefined : '2-digit',
    }).format(date)
  }

  const handleDelete = async () => {
    try {
      // No permitir eliminar eventos de backup diarios
      if (isDailyBackupMetadata(event.metadata)) {
        return
      }

      await deleteEvent.mutateAsync(event.id)
      setShowDeleteConfirm(false)
      onSuccess?.()
      onClose()
    } catch {
      // Silent fail
    }
  }

  // Verificar si es un evento de backup diario
  const backupMetadata = isDailyBackupMetadata(event.metadata) ? event.metadata : null
  const isBackupEvent = backupMetadata !== null
  const isVirtualEvent = typeof event.id === 'string' && (event.id as string).startsWith('virtual-')
  const isReadonlyBackup = isBackupEvent && backupMetadata?.readonly === true
  const isBackupPast = isBackupEvent && backupMetadata?.isPast === true
  const isBackupToday = isBackupEvent && backupMetadata?.isToday === true

  const priorityColors = {
    LOW: 'bg-blue-500/20 border-blue-500/30 text-blue-300',
    NORMAL: 'bg-gray-500/20 border-gray-500/30 text-gray-300',
    HIGH: 'bg-orange-500/20 border-orange-500/30 text-orange-300',
    URGENT: 'bg-red-500/20 border-red-500/30 text-red-300',
  }

  const priorityLabels = {
    LOW: 'Baja',
    NORMAL: 'Normal',
    HIGH: 'Alta',
    URGENT: 'Urgente',
  }

  const priorityColor = priorityColors[event.priority] || priorityColors.NORMAL

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title="Detalles del Evento"
        className="max-w-2xl"
        footer={
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between w-full gap-2 sm:gap-3">
            {!isBackupEvent && !isVirtualEvent && (
              <Button
                variant="danger"
                onClick={() => setShowDeleteConfirm(true)}
                disabled={deleteEvent.isPending}
                className="w-full sm:w-auto"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Eliminar
              </Button>
            )}
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 ml-auto">
              <Button variant="ghost" onClick={onClose} className="w-full sm:w-auto">
                Cerrar
              </Button>
              {onEdit && !isBackupEvent && !isVirtualEvent && (
                <Button onClick={() => onEdit(event)} className="w-full sm:w-auto">
                  <Edit className="w-4 h-4 mr-2" />
                  Editar
                </Button>
              )}
              {isBackupEvent && (
                <div className="flex gap-2">
                  {/* Solo mostrar botón Ir a Backups si es el backup de HOY (no readonly) */}
                  {!isReadonlyBackup && (
                    <>
                      <Button
                        variant="ghost"
                        onClick={() => {
                          onClose()
                          navigate('/daily-backups')
                        }}
                        className="w-full sm:w-auto"
                      >
                        <CalendarIcon className="w-4 h-4 mr-2" />
                        Ir a Backups
                      </Button>
                      <Button
                        onClick={() => refetchToday()}
                        disabled={isLoadingToday}
                        className="w-full sm:w-auto"
                      >
                        <RefreshCw className={cn("w-4 h-4 mr-2", isLoadingToday && "animate-spin")} />
                        Actualizar
                      </Button>
                    </>
                  )}
                  {/* Para backups de días pasados, solo mostrar info */}
                  {isReadonlyBackup && (
                    <span className="text-white/60 text-sm italic">
                      Registro histórico - Solo lectura
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>
        }
      >
        <div className="space-y-6">
          {/* Title and Priority */}
          <div>
            <div className="flex items-start justify-between gap-4 mb-2">
              <h2 className="text-2xl font-bold text-white">{event.title}</h2>
              <span
                className={cn(
                  'px-3 py-1 text-sm rounded-full font-medium border flex-shrink-0',
                  priorityColor
                )}
              >
                {priorityLabels[event.priority]}
              </span>
            </div>
            {event.description && (
              <p className="text-white/70 whitespace-pre-wrap">{event.description}</p>
            )}
          </div>

          {/* Backup Event Information */}
          {isBackupEvent && (
            <>
              {/* Advertencia para backups de días pasados */}
              {isReadonlyBackup && (
                <div className="bg-orange-500/10 border border-orange-500/30 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <Bell className="w-5 h-5 text-orange-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <h3 className="text-orange-400 font-semibold mb-1">
                        {isBackupPast ? 'Backup de Día Anterior - Solo Lectura' : 'Backup de Día Futuro - Solo Lectura'}
                      </h3>
                      <p className="text-white/70 text-sm">
                        {isBackupPast
                          ? 'Este backup corresponde a un día anterior y no puede ser modificado. El estado mostrado es el final registrado para ese día.'
                          : 'Este backup corresponde a un día futuro y no puede ser modificado hasta que llegue su fecha.'}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <div className={cn(
                "rounded-lg p-4",
                isReadonlyBackup
                  ? "bg-gray-500/10 border border-gray-500/30"
                  : "bg-blue-500/10 border border-blue-500/30"
              )}>
                <div className="flex items-center justify-between mb-3">
                  <h3 className={cn(
                    "font-semibold flex items-center gap-2",
                    isReadonlyBackup ? "text-gray-400" : "text-blue-400"
                  )}>
                    <CalendarIcon className="w-4 h-4" />
                    {isReadonlyBackup
                      ? `Backup Diario - Estado Registrado`
                      : 'Backup Diario - Estado en Tiempo Real'}
                  </h3>
                  {isBackupToday && !isReadonlyBackup && (
                    <button
                      onClick={() => refetchToday()}
                      disabled={isLoadingToday}
                      className="p-1 rounded-lg hover:bg-white/10 transition-colors"
                      title="Actualizar estado"
                    >
                      <RefreshCw className={cn("w-4 h-4 text-blue-400", isLoadingToday && "animate-spin")} />
                    </button>
                  )}
                </div>
              
              {/* Si es un backup de solo lectura, mostrar datos del metadata del evento */}
              {isReadonlyBackup ? (
                <div className="space-y-3 text-sm">
                  {/* Información del disco */}
                  <div className="flex justify-between">
                    <span className="text-white/60">Disco asignado:</span>
                    <span className="text-white">{backupMetadata?.diskName || `Disco ${backupMetadata?.diskSequence || ''}`}</span>
                  </div>

                  {/* Estado de completitud */}
                  <div className="flex justify-between items-center">
                    <span className="text-white/60">Estado:</span>
                    <span className={cn(
                      "px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1.5",
                      backupMetadata?.completed
                        ? "bg-green-500/20 text-green-400"
                        : "bg-red-500/20 text-red-400"
                    )}>
                      {backupMetadata?.completed ? (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Completado
                        </>
                      ) : (
                        <>
                          <AlertCircle className="w-3.5 h-3.5" />
                          Incompleto
                        </>
                      )}
                    </span>
                  </div>

                  {/* Progreso de archivos */}
                  {backupMetadata?.files && backupMetadata.files.length > 0 && (
                    <>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-white/60">Archivos procesados:</span>
                          <span className="text-white">
                            {backupMetadata.completedFiles} de {backupMetadata.totalFiles}
                          </span>
                        </div>

                        {/* Barra de progreso */}
                        <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                          <div
                            className={cn(
                              "h-full transition-all duration-700",
                              backupMetadata.completed
                                ? "bg-gradient-to-r from-green-500 to-emerald-500"
                                : "bg-gradient-to-r from-gray-500 to-gray-600"
                            )}
                            style={{
                              width: `${((backupMetadata.completedFiles || 0) / (backupMetadata.totalFiles || 1)) * 100}%`
                            }}
                          />
                        </div>
                      </div>

                      {/* Estado de cada archivo */}
                      <div className="space-y-2 pt-2 border-t border-white/10">
                        <span className="text-white/60 text-xs">Estado de archivos:</span>
                        {backupMetadata.files.map((file, index: number) => (
                          <div key={index} className="flex justify-between items-center">
                            <span className="text-white/70 text-xs">{file.fileTypeName}</span>
                            <span className={cn(
                              "px-2 py-0.5 rounded-full text-xs font-medium",
                              file.isFinal
                                ? "bg-green-500/20 text-green-400"
                                : "bg-gray-500/20 text-gray-400"
                            )}>
                              {file.statusLabel || 'Pendiente'}
                            </span>
                          </div>
                        ))}
                      </div>
                    </>
                  )}

                  {/* Usuario que completó */}
                  {backupMetadata?.completedBy && (
                    <div className="flex justify-between pt-2 border-t border-white/10">
                      <span className="text-white/60">Completado por:</span>
                      <span className="text-white">{backupMetadata.completedBy}</span>
                    </div>
                  )}

                  {/* Fecha de completitud */}
                  {backupMetadata?.completedAt && (
                    <div className="flex justify-between">
                      <span className="text-white/60">Fecha de completitud:</span>
                      <span className="text-white text-xs">
                        {new Date(backupMetadata.completedAt).toLocaleDateString('es-AR', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                    </div>
                  )}
                </div>
              ) : (
                /* Backup del día actual - datos en tiempo real */
                <>
                  {isLoadingToday ? (
                    <div className="flex items-center justify-center py-4">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-400"></div>
                      <span className="ml-2 text-white/60">Cargando estado actual...</span>
                    </div>
                  ) : todayBackup ? (
                    <div className="space-y-3 text-sm">
                      {/* Información del disco */}
                      <div className="flex justify-between">
                        <span className="text-white/60">Disco asignado:</span>
                        <span className="text-white">{todayBackup.disk?.name || `Disco ${todayBackup.disk?.sequence}`}</span>
                      </div>

                      {/* Progreso general */}
                      {todayBackup.files && todayBackup.files.length > 0 ? (
                        <>
                          <div className="space-y-2">
                            <div className="flex justify-between">
                              <span className="text-white/60">Progreso:</span>
                              <span className="text-white">
                                {todayBackup.files.filter(f => f.status?.isFinal).length} de {todayBackup.files.length} archivos
                              </span>
                            </div>

                            {/* Barra de progreso */}
                            <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-gradient-to-r from-blue-500 to-cyan-500 transition-all duration-700"
                                style={{
                                  width: `${(todayBackup.files.filter(f => f.status?.isFinal).length / todayBackup.files.length) * 100}%`
                                }}
                              />
                            </div>
                          </div>

                          {/* Estado de cada archivo */}
                          <div className="space-y-2 pt-2 border-t border-white/10">
                            <span className="text-white/60 text-xs">Estado de archivos:</span>
                            {todayBackup.files.map((file) => (
                              <div key={file.id} className="flex justify-between items-center">
                                <span className="text-white/70 text-xs">{file.fileType.name}</span>
                                <span className={cn(
                                  "px-2 py-0.5 rounded-full text-xs font-medium",
                                  file.status?.isFinal
                                    ? "bg-green-500/20 text-green-400"
                                    : file.status?.code?.includes('PROGRESS')
                                    ? "bg-yellow-500/20 text-yellow-400"
                                    : "bg-gray-500/20 text-gray-400"
                                )}>
                                  {file.status?.label || 'Pendiente'}
                                </span>
                              </div>
                            ))}
                          </div>
                        </>
                      ) : (
                        <div className="text-center py-2 text-white/60 text-sm">
                          Usando sistema legacy - información limitada
                        </div>
                      )}

                      {/* Usuario que completó */}
                      {todayBackup.user && (
                        <div className="flex justify-between pt-2 border-t border-white/10">
                          <span className="text-white/60">Responsable:</span>
                          <span className="text-white">
                            {todayBackup.user.firstName || todayBackup.user.username}
                          </span>
                        </div>
                      )}

                      {/* Notas */}
                      {todayBackup.notes && (
                        <div className="pt-2 border-t border-white/10">
                          <span className="text-white/60 text-xs">Notas:</span>
                          <p className="text-white/80 text-sm mt-1">{todayBackup.notes}</p>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-4 text-white/60">
                      No hay backup configurado para hoy
                    </div>
                  )}
                </>
              )}
            </div>
            </>
          )}

          {/* Color indicator */}
          {event.color && (
            <div className="flex items-center gap-2">
              <div
                className="w-6 h-6 rounded-lg border border-white/20"
                style={{ backgroundColor: event.color }}
              />
              <span className="text-sm text-white/60">Color del evento</span>
            </div>
          )}

          {/* Date and Time */}
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <Clock className="w-5 h-5 text-white/60 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-white font-medium">
                  {event.allDay ? 'Todo el día' : 'Horario'}
                </p>
                <p className="text-white/70 text-sm mt-1">
                  Inicio: {formatDateTime(startDate)}
                </p>
                {endDate && (
                  <p className="text-white/70 text-sm mt-0.5">
                    Fin: {formatDateTime(endDate)}
                  </p>
                )}
              </div>
            </div>

            {/* Location */}
            {event.location && (
              <div className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-white/60 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-white font-medium">Ubicación</p>
                  <p className="text-white/70 text-sm mt-1">{event.location}</p>
                </div>
              </div>
            )}

            {/* Participants */}
            {event.participants.length > 0 && (
              <div className="flex items-start gap-3">
                <Users className="w-5 h-5 text-white/60 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-white font-medium mb-2">
                    Participantes ({event.participants.length})
                  </p>
                  <div className="space-y-1">
                    {event.participants.map((participant) => (
                      <div
                        key={participant.id}
                        className="flex items-center gap-2 text-sm text-white/70"
                      >
                        <span className={cn(
                          'px-2 py-0.5 rounded text-xs',
                          participant.role === 'ORGANIZER'
                            ? 'bg-blue-500/20 text-blue-300'
                            : 'bg-white/10 text-white/60'
                        )}>
                          {participant.role === 'ORGANIZER' ? 'Organizador' : 'Asistente'}
                        </span>
                        <span>
                          {participant.user.firstName && participant.user.lastName
                            ? `${participant.user.firstName} ${participant.user.lastName}`
                            : participant.user.username}
                        </span>
                        {participant.user.email && (
                          <span className="text-white/50">({participant.user.email})</span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Tags */}
            {event.tags.length > 0 && (
              <div className="flex items-start gap-3">
                <Tag className="w-5 h-5 text-white/60 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-white font-medium mb-2">Etiquetas</p>
                  <div className="flex flex-wrap gap-2">
                    {event.tags.map((tag) => (
                      <span
                        key={tag}
                        className="px-3 py-1 rounded-full bg-white/10 text-white/70 text-sm"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Reminders */}
            {event.reminders.length > 0 && (
              <div className="flex items-start gap-3">
                <Bell className="w-5 h-5 text-white/60 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-white font-medium mb-2">
                    Recordatorios ({event.reminders.length})
                  </p>
                  <div className="space-y-2">
                    {event.reminders.map((reminder) => (
                      <div
                        key={reminder.id}
                        className="flex items-center justify-between p-2 rounded-lg bg-white/5 border border-white/10"
                      >
                        <div className="flex items-center gap-2">
                          <span
                            className={cn(
                              'w-2 h-2 rounded-full',
                              reminder.status === 'SENT'
                                ? 'bg-green-400'
                                : reminder.status === 'FAILED'
                                ? 'bg-red-400'
                                : reminder.status === 'PROCESSING'
                                ? 'bg-yellow-400'
                                : 'bg-blue-400'
                            )}
                          />
                          <span className="text-sm text-white/70">
                            {new Date(reminder.scheduledAt).toLocaleString('es-AR', {
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        </div>
                        <span
                          className={cn(
                            'text-xs px-2 py-0.5 rounded-full',
                            reminder.status === 'SENT'
                              ? 'bg-green-500/20 text-green-300'
                              : reminder.status === 'FAILED'
                              ? 'bg-red-500/20 text-red-300'
                              : reminder.status === 'PROCESSING'
                              ? 'bg-yellow-500/20 text-yellow-300'
                              : 'bg-blue-500/20 text-blue-300'
                          )}
                        >
                          {reminder.status === 'SENT'
                            ? 'Enviado'
                            : reminder.status === 'FAILED'
                            ? 'Fallido'
                            : reminder.status === 'PROCESSING'
                            ? 'Procesando'
                            : 'Pendiente'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Metadata */}
            <div className="pt-4 border-t border-white/10">
              <div className="flex items-center gap-3 text-xs text-white/50">
                <CalendarIcon className="w-4 h-4" />
                <span>
                  Creado el{' '}
                  {new Date(event.createdAt).toLocaleDateString('es-AR', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                  })}
                </span>
              </div>
            </div>
          </div>
        </div>
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={handleDelete}
        title="Eliminar Evento"
        message={`¿Estás seguro de que deseas eliminar el evento "${event.title}"? Esta acción no se puede deshacer.`}
        confirmText="Eliminar"
        cancelText="Cancelar"
        variant="danger"
      />
    </>
  )
}
