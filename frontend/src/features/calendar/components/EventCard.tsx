import type { MouseEvent } from 'react'
import { MapPin } from 'lucide-react'
import type { CalendarEvent } from '../types'
import { cn } from '../../../shared/utils/cn'

interface EventCardProps {
  event: CalendarEvent
  onClick?: (e?: MouseEvent) => void
  compact?: boolean
  className?: string
}

export default function EventCard({ event, onClick, compact = false, className }: EventCardProps) {

  const startDate = new Date(event.startTime)

  const formatTime = (date: Date) => {
    return new Intl.DateTimeFormat('es-AR', {
      hour: '2-digit',
      minute: '2-digit',
    }).format(date)
  }

  const priorityColors = {
    LOW: 'bg-blue-500/20 border-blue-500/30 text-blue-300',
    NORMAL: 'bg-gray-500/20 border-gray-500/30 text-gray-300',
    HIGH: 'bg-orange-500/20 border-orange-500/30 text-orange-300',
    URGENT: 'bg-red-500/20 border-red-500/30 text-red-300',
  }

  const priorityColor = priorityColors[event.priority] || priorityColors.NORMAL

  return (
    <div
      className={cn(
        'relative group cursor-pointer transition-all duration-200',
        'rounded-lg border border-white/10 p-3',
        'hover:border-white/30 hover:shadow-lg hover:scale-[1.02]',
        event.color ? `bg-[${event.color}]/10` : 'bg-white/5',
        priorityColor,
        className
      )}
      onClick={onClick}
      style={event.color ? {
        backgroundColor: `${event.color}20`,
        borderColor: `${event.color}40`
      } : undefined}
    >
      {/* Main Content */}
      <div className="flex items-start gap-2">
        {!event.allDay && (
          <div className="flex-shrink-0 text-xs text-white/60 font-medium min-w-[60px]">
            {formatTime(startDate)}
          </div>
        )}
        <div className="flex-1 min-w-0">
          <h3 className={cn(
            'font-medium truncate',
            compact ? 'text-xs' : 'text-sm'
          )}>
            {event.title}
          </h3>
          {!compact && event.location && (
            <p className="text-xs text-white/50 truncate flex items-center gap-1 mt-1">
              <MapPin className="w-3 h-3" />
              {event.location}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
