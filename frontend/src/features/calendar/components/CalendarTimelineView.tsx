import { useMemo, useRef, useEffect, useState } from 'react'
import { Calendar as CalendarIcon, Filter } from 'lucide-react'
import type { CalendarEvent } from '../types'
import EventCard from './EventCard'
import { cn } from '../../../shared/utils/cn'

interface CalendarTimelineViewProps {
  currentDate: Date
  events: CalendarEvent[]
  onEventClick: (event: CalendarEvent) => void
}

interface TimelineDay {
  date: Date
  events: CalendarEvent[]
  isToday: boolean
}

export default function CalendarTimelineView({
  currentDate,
  events,
  onEventClick,
}: CalendarTimelineViewProps) {
  const [filterPriority, setFilterPriority] = useState<string | null>(null)
  const [showFilters, setShowFilters] = useState(false)
  const todayRef = useRef<HTMLDivElement>(null)

  // Get start and end of month for current view
  const monthStart = useMemo(() => {
    const start = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1)
    start.setHours(0, 0, 0, 0)
    return start
  }, [currentDate])

  const monthEnd = useMemo(() => {
    const end = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0)
    end.setHours(23, 59, 59, 999)
    return end
  }, [currentDate])

  // Filter events
  const filteredEvents = useMemo(() => {
    let filtered = events

    if (filterPriority) {
      filtered = filtered.filter((event) => event.priority === filterPriority)
    }

    return filtered
  }, [events, filterPriority])

  // Group events by date
  const timelineDays = useMemo(() => {
    const days: TimelineDay[] = []
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    // Generate all days in the month
    const currentDay = new Date(monthStart)

    while (currentDay <= monthEnd) {
      const dayEvents = getEventsForDate(currentDay, filteredEvents)

      days.push({
        date: new Date(currentDay),
        events: dayEvents,
        isToday: currentDay.getTime() === today.getTime(),
      })

      currentDay.setDate(currentDay.getDate() + 1)
    }

    return days
  }, [monthStart, monthEnd, filteredEvents])

  // Scroll to today on mount and when month changes
  useEffect(() => {
    // Delay to ensure DOM is fully rendered
    const timer = setTimeout(() => {
      if (todayRef.current) {
        // Scroll with smooth animation
        todayRef.current.scrollIntoView({
          behavior: 'smooth',
          block: 'center',
          inline: 'nearest'
        })
      }
    }, 100) // Small delay for smooth rendering

    return () => clearTimeout(timer)
  }, [currentDate])

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('es-AR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
    }).format(date)
  }

  const priorities = [
    { value: 'LOW', label: 'Baja', color: 'bg-blue-500' },
    { value: 'NORMAL', label: 'Normal', color: 'bg-gray-500' },
    { value: 'HIGH', label: 'Alta', color: 'bg-orange-500' },
    { value: 'URGENT', label: 'Urgente', color: 'bg-red-500' },
  ]

  return (
    <div className="flex flex-col h-full">
      {/* Header with filters */}
      <div className="flex items-center justify-between mb-6 px-2">
        <div className="flex items-center gap-3">
          <CalendarIcon className="w-6 h-6 text-white/60" />
          <h2 className="text-2xl font-semibold text-white">Vista Timeline</h2>
        </div>

        <button
          onClick={() => setShowFilters(!showFilters)}
          className={cn(
            'flex items-center gap-2 px-4 py-2 rounded-lg transition-colors',
            'border border-white/10',
            showFilters ? 'bg-white/20' : 'bg-white/5 hover:bg-white/10'
          )}
        >
          <Filter className="w-4 h-4" />
          <span className="text-sm">Filtros</span>
        </button>
      </div>

      {/* Filters panel */}
      {showFilters && (
        <div className="mb-4 px-2">
          <div className="p-4 rounded-lg border border-white/10 bg-white/5">
            <p className="text-sm text-white/60 mb-3">Filtrar por prioridad:</p>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setFilterPriority(null)}
                className={cn(
                  'px-3 py-1.5 text-sm rounded-lg transition-colors',
                  'border',
                  !filterPriority
                    ? 'border-white/30 bg-white/20 text-white'
                    : 'border-white/10 bg-white/5 text-white/70 hover:bg-white/10'
                )}
              >
                Todas
              </button>
              {priorities.map((priority) => (
                <button
                  key={priority.value}
                  onClick={() => setFilterPriority(priority.value)}
                  className={cn(
                    'px-3 py-1.5 text-sm rounded-lg transition-colors',
                    'border flex items-center gap-2',
                    filterPriority === priority.value
                      ? 'border-white/30 bg-white/20 text-white'
                      : 'border-white/10 bg-white/5 text-white/70 hover:bg-white/10'
                  )}
                >
                  <span className={cn('w-2 h-2 rounded-full', priority.color)} />
                  {priority.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Timeline scroll container */}
      <div className="flex-1 overflow-y-auto px-2 space-y-1">
        {timelineDays.map((day, index) => (
          <div
            key={index}
            ref={day.isToday ? todayRef : null}
            className={cn(
              'relative border rounded-lg p-4 transition-all',
              day.isToday
                ? 'border-blue-500/50 bg-blue-500/5 shadow-lg shadow-blue-500/10'
                : 'border-white/10 bg-white/5',
              day.events.length === 0 && 'opacity-50'
            )}
          >
            {/* Date header */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className={cn(
                  'flex flex-col items-center justify-center w-16 h-16 rounded-lg',
                  day.isToday
                    ? 'bg-blue-500/20 border-2 border-blue-500/50'
                    : 'bg-white/10 border border-white/10'
                )}>
                  <span className={cn(
                    'text-xs font-medium',
                    day.isToday ? 'text-blue-300' : 'text-white/60'
                  )}>
                    {day.date.toLocaleDateString('es-AR', { weekday: 'short' }).toUpperCase()}
                  </span>
                  <span className={cn(
                    'text-2xl font-bold',
                    day.isToday ? 'text-white' : 'text-white/80'
                  )}>
                    {day.date.getDate()}
                  </span>
                </div>
                <div>
                  <h3 className={cn(
                    'text-lg font-semibold capitalize',
                    day.isToday ? 'text-white' : 'text-white/80'
                  )}>
                    {formatDate(day.date)}
                  </h3>
                  <p className="text-sm text-white/50">
                    {day.events.length === 0
                      ? 'Sin eventos'
                      : `${day.events.length} evento${day.events.length !== 1 ? 's' : ''}`
                    }
                  </p>
                </div>
              </div>

              {day.isToday && (
                <span className="px-3 py-1 text-xs font-medium rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30">
                  HOY
                </span>
              )}
            </div>

            {/* Events list */}
            {day.events.length > 0 && (
              <div className="space-y-2">
                {day.events.map((event) => (
                  <EventCard
                    key={event.id}
                    event={event}
                    onClick={() => onEventClick(event)}
                  />
                ))}
              </div>
            )}
          </div>
        ))}

        {timelineDays.length === 0 && (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <CalendarIcon className="w-12 h-12 text-white/20 mx-auto mb-3" />
              <p className="text-white/60">No hay días para mostrar</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// Helper function to get events for a specific date
function getEventsForDate(date: Date, events: CalendarEvent[]): CalendarEvent[] {
  const dateStart = new Date(date)
  dateStart.setHours(0, 0, 0, 0)

  const dateEnd = new Date(date)
  dateEnd.setHours(23, 59, 59, 999)

  const parseEventDate = (dateString: string | Date, isAllDay: boolean): Date => {
    if (isAllDay && typeof dateString === 'string' && dateString.match(/^\d{4}-\d{2}-\d{2}$/)) {
      // Formato YYYY-MM-DD sin hora → parsear como fecha local
      const [year, month, day] = dateString.split('-').map(Number)
      return new Date(year, month - 1, day, 0, 0, 0, 0)
    }
    return new Date(dateString)
  }

  return events.filter((event) => {
    const eventStart = parseEventDate(event.startTime, event.allDay)
    const eventEnd = event.endTime
      ? parseEventDate(event.endTime, event.allDay)
      : eventStart

    // Check if event overlaps with this date
    return eventStart <= dateEnd && eventEnd >= dateStart
  }).sort((a, b) => {
    // Sort by start time
    const aStart = parseEventDate(a.startTime, a.allDay)
    const bStart = parseEventDate(b.startTime, b.allDay)
    return aStart.getTime() - bStart.getTime()
  })
}
