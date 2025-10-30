import { HardDrive, Calendar, AlertTriangle, Clock, Users, CheckCircle, Circle, Loader } from 'lucide-react'
import { cn } from '../../../shared/utils/cn'
import type { CalendarEvent, DailyBackupMetadata } from '../types'

interface EventChipProps {
  event: CalendarEvent
  variant?: 'default' | 'compact' | 'minimal'
  onClick?: (e?: React.MouseEvent) => void
  className?: string
}

// Type guard para DailyBackupMetadata
function isDailyBackupMetadata(metadata: Record<string, unknown> | null): metadata is DailyBackupMetadata & Record<string, unknown> {
  return metadata !== null && metadata.type === 'daily-backup'
}

export default function EventChip({
  event,
  variant = 'default',
  onClick,
  className
}: EventChipProps) {
  const backupMetadata = isDailyBackupMetadata(event.metadata) ? event.metadata : null
  const isBackupEvent = backupMetadata !== null
  const isCompleted = backupMetadata?.completed ?? false
  const isPending = backupMetadata?.isPending ?? false
  const isPast = backupMetadata?.isPast ?? false
  const isOverdue = isBackupEvent && isPast && !isCompleted // Backup vencido: día pasado sin completar
  const isVirtual = typeof event.id === 'string' && (event.id as string).startsWith('virtual-')

  const handleClick = (e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation()
    }
    
    // No permitir clicks en eventos virtuales - redirigir a daily-backups
    if (isVirtual && isBackupEvent) {
      window.location.href = '/daily-backups'
      return
    }
    
    // Llamar al onClick solo para eventos reales
    if (!isVirtual && onClick) {
      onClick(e)
    }
  }

  const getEventIcon = () => {
    if (isBackupEvent) {
      return <HardDrive className="w-3 h-3 flex-shrink-0" />
    }
    if (event.participants?.length > 0) {
      return <Users className="w-3 h-3 flex-shrink-0" />
    }
    if (event.allDay) {
      return <Calendar className="w-3 h-3 flex-shrink-0" />
    }
    return <Clock className="w-3 h-3 flex-shrink-0" />
  }

  const getEventTitle = () => {
    if (isBackupEvent) {
      // Para el variant minimal, retornar null (usaremos un icono en su lugar)
      if (variant === 'minimal') {
        return null
      }
      // Títulos profesionales sin emojis
      if (isOverdue) {
        return 'Backup No Realizado'
      }
      if (isCompleted) {
        return 'Backup Completo'
      }
      if (isPending) {
        return 'Backup Pendiente'
      }
      // En progreso
      const completedFiles = backupMetadata?.completedFiles ?? 0
      const totalFiles = backupMetadata?.totalFiles ?? 0
      if (totalFiles > 0 && completedFiles > 0) {
        return `Backup ${completedFiles}/${totalFiles}`
      }
      return 'Backup en Progreso'
    }
    return event.title
  }

  const getBackupIcon = () => {
    if (isOverdue) {
      return <AlertTriangle className="w-3 h-3 flex-shrink-0 animate-pulse" />
    }
    if (isCompleted) {
      return <CheckCircle className="w-3 h-3 flex-shrink-0" />
    }
    if (isPending) {
      return <Circle className="w-3 h-3 flex-shrink-0" />
    }
    return <Loader className="w-3 h-3 flex-shrink-0 animate-spin" />
  }

  const getEventColors = () => {
    if (isBackupEvent) {
      if (isOverdue) {
        return {
          bg: 'bg-red-500/20 hover:bg-red-500/30',
          border: 'border-red-500/40',
          text: 'text-red-200',
          icon: 'text-red-400'
        }
      }
      if (isCompleted) {
        return {
          bg: 'bg-green-500/20 hover:bg-green-500/30',
          border: 'border-green-500/40',
          text: 'text-green-200',
          icon: 'text-green-400'
        }
      }
      if (isPending) {
        return {
          bg: 'bg-gray-500/20 hover:bg-gray-500/30',
          border: 'border-gray-500/40',
          text: 'text-gray-200',
          icon: 'text-gray-400'
        }
      }
      return {
        bg: 'bg-orange-500/20 hover:bg-orange-500/30',
        border: 'border-orange-500/40',
        text: 'text-orange-200',
        icon: 'text-orange-400'
      }
    }

    return {
      bg: 'bg-white/10 hover:bg-white/20',
      border: 'border-white/20',
      text: 'text-white',
      icon: 'text-current'
    }
  }

  const colors = getEventColors()

  if (variant === 'minimal') {
    return (
      <div
        className={cn(
          "cursor-pointer transition-all hover:scale-110",
          isBackupEvent ? (
            isOverdue
              ? "text-red-400"
              : isCompleted
              ? "text-green-400"
              : isPending
              ? "text-gray-400"
              : "text-orange-400"
          ) : "text-blue-400",
          className
        )}
        onClick={handleClick}
        title={event.title}
      >
        {isBackupEvent ? (
          getBackupIcon()
        ) : (
          <div
            className="w-2 h-2 rounded-full"
            style={{
              backgroundColor: event.color || '#3b82f6'
            }}
          />
        )}
      </div>
    )
  }

  if (variant === 'compact') {
    return (
      <div
        className={cn(
          "flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] cursor-pointer transition-all",
          "border backdrop-blur-sm",
          colors.bg,
          colors.border,
          colors.text,
          className
        )}
        onClick={handleClick}
        style={{
          backgroundColor: !isBackupEvent ? `${event.color || '#3b82f6'}20` : undefined,
          borderColor: !isBackupEvent ? `${event.color || '#3b82f6'}40` : undefined,
        }}
      >
        <div className={colors.icon}>
          {isBackupEvent ? getBackupIcon() : <div className="w-1.5 h-1.5 rounded-full" />}
        </div>
        <span className="truncate max-w-[60px]">{getEventTitle()}</span>
      </div>
    )
  }

  return (
    <div
      className={cn(
        "group relative rounded-md px-2 py-1 text-xs cursor-pointer transition-all",
        "border backdrop-blur-sm hover:scale-[1.02]",
        colors.bg,
        colors.border,
        colors.text,
        event.priority === 'URGENT' && "ring-1 ring-red-400/50",
        className
      )}
      onClick={handleClick}
      style={{
        backgroundColor: !isBackupEvent ? `${event.color || '#3b82f6'}20` : undefined,
        borderColor: !isBackupEvent ? `${event.color || '#3b82f6'}40` : undefined,
      }}
    >
      <div className="flex items-center gap-1.5 min-w-0">
        <div className={colors.icon}>
          {isBackupEvent ? getBackupIcon() : getEventIcon()}
        </div>

        <div className="flex flex-col min-w-0 flex-1">
          <span className="truncate font-medium leading-tight">
            {getEventTitle()}
          </span>
          {isBackupEvent && backupMetadata?.diskName && (
            <span className="text-[10px] opacity-70 truncate flex items-center gap-1">
              <HardDrive className="w-2.5 h-2.5" />
              {backupMetadata.diskName}
            </span>
          )}
          {!isBackupEvent && !event.allDay && (
            <span className="text-[10px] opacity-70">
              {new Date(event.startTime).toLocaleTimeString('es-AR', {
                hour: '2-digit',
                minute: '2-digit'
              })}
            </span>
          )}
        </div>

        {event.priority === 'URGENT' && !isBackupEvent && (
          <AlertTriangle className="w-3 h-3 text-red-400 flex-shrink-0 animate-pulse" />
        )}
      </div>
      
      {/* Status indicator line */}
      {isBackupEvent && (
        <div 
          className={cn(
            "absolute left-0 top-0 bottom-0 w-0.5 rounded-r-full",
            isOverdue
              ? "bg-red-400"
              : isCompleted 
              ? "bg-green-400"
              : isPending
              ? "bg-gray-400"
              : "bg-orange-400"
          )}
        />
      )}
      
      {/* Hover overlay */}
      <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity rounded-md" />
    </div>
  )
}