import { useMemo, useState, type MouseEvent } from 'react'
import { ChevronLeft, ChevronRight, Clock, MapPin } from 'lucide-react'
import type { CalendarEvent } from '../types'
import { cn } from '../../../shared/utils/cn'
import Modal from '../../../shared/components/ui/Modal'
import EventChip from './EventChip'
import '../styles/calendar.css'

interface CalendarMonthViewProps {
  currentDate: Date
  events: CalendarEvent[]
  onEventClick: (event: CalendarEvent) => void
  onDateClick?: (date: Date) => void
  onMonthChange: (date: Date) => void
  selectedDate?: Date
}

interface DayCell {
  date: Date
  isCurrentMonth: boolean
  isToday: boolean
  isSelected: boolean
  events: CalendarEvent[]
}

export default function CalendarMonthView({
  currentDate,
  events,
  onEventClick,
  onDateClick,
  onMonthChange,
  selectedDate,
}: CalendarMonthViewProps) {
  const [showAllEventsModal, setShowAllEventsModal] = useState(false)
  const [selectedDayEvents, setSelectedDayEvents] = useState<{ date: Date; events: CalendarEvent[] } | null>(null)

  const handleShowAllEvents = (date: Date, dayEvents: CalendarEvent[], e: MouseEvent<HTMLDivElement>) => {
    e.stopPropagation() // Prevent triggering date click
    setSelectedDayEvents({ date, events: dayEvents })
    setShowAllEventsModal(true)
  }

  const handleCloseModal = () => {
    setShowAllEventsModal(false)
    setSelectedDayEvents(null)
  }

  // Generate calendar grid
  const calendarDays = useMemo(() => {
    const year = currentDate.getFullYear()
    const month = currentDate.getMonth()

    // First day of the month
    const firstDay = new Date(year, month, 1)
    // Last day of the month
    const lastDay = new Date(year, month + 1, 0)

    // Get the day of week for first day (0 = Sunday, 1 = Monday, etc.)
    // Adjust so Monday = 0
    let startDayOfWeek = firstDay.getDay() - 1
    if (startDayOfWeek < 0) startDayOfWeek = 6

    // Days to show from previous month
    const daysFromPrevMonth = startDayOfWeek

    // Days to show from next month to complete 6 weeks (42 days)
    const totalDays = 42
    const daysInMonth = lastDay.getDate()
    const daysFromNextMonth = totalDays - daysFromPrevMonth - daysInMonth

    const days: DayCell[] = []
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    // Previous month days
    const prevMonthLastDay = new Date(year, month, 0)
    const prevMonthDays = prevMonthLastDay.getDate()

    for (let i = daysFromPrevMonth - 1; i >= 0; i--) {
      const date = new Date(year, month - 1, prevMonthDays - i)
      date.setHours(0, 0, 0, 0)
      days.push({
        date,
        isCurrentMonth: false,
        isToday: date.getTime() === today.getTime(),
        isSelected: selectedDate ? date.getTime() === selectedDate.getTime() : false,
        events: getEventsForDate(date, events),
      })
    }

    // Current month days
    for (let i = 1; i <= daysInMonth; i++) {
      const date = new Date(year, month, i)
      date.setHours(0, 0, 0, 0)
      days.push({
        date,
        isCurrentMonth: true,
        isToday: date.getTime() === today.getTime(),
        isSelected: selectedDate ? date.getTime() === selectedDate.getTime() : false,
        events: getEventsForDate(date, events),
      })
    }

    // Next month days
    for (let i = 1; i <= daysFromNextMonth; i++) {
      const date = new Date(year, month + 1, i)
      date.setHours(0, 0, 0, 0)
      days.push({
        date,
        isCurrentMonth: false,
        isToday: date.getTime() === today.getTime(),
        isSelected: selectedDate ? date.getTime() === selectedDate.getTime() : false,
        events: getEventsForDate(date, events),
      })
    }

    return days
  }, [currentDate, events, selectedDate])

  const weekDays = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom']

  const monthName = currentDate.toLocaleDateString('es-AR', { month: 'long', year: 'numeric' })

  const handlePrevMonth = () => {
    const newDate = new Date(currentDate)
    newDate.setMonth(newDate.getMonth() - 1)
    onMonthChange(newDate)
  }

  const handleNextMonth = () => {
    const newDate = new Date(currentDate)
    newDate.setMonth(newDate.getMonth() + 1)
    onMonthChange(newDate)
  }

  const handleToday = () => {
    onMonthChange(new Date())
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 px-2">
        <div className="flex items-center gap-4">
          <h2 className="text-2xl font-semibold text-white capitalize">{monthName}</h2>
          <button
            onClick={handleToday}
            className="px-3 py-1 text-sm rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors"
          >
            Hoy
          </button>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handlePrevMonth}
            className="p-2 rounded-lg hover:bg-white/10 transition-colors"
            aria-label="Mes anterior"
          >
            <ChevronLeft className="w-5 h-5 text-white" />
          </button>
          <button
            onClick={handleNextMonth}
            className="p-2 rounded-lg hover:bg-white/10 transition-colors"
            aria-label="Mes siguiente"
          >
            <ChevronRight className="w-5 h-5 text-white" />
          </button>
        </div>
      </div>

      {/* Week day headers */}
      <div className="grid grid-cols-7 gap-2 mb-2 px-2">
        {weekDays.map((day) => (
          <div
            key={day}
            className="text-center text-sm font-medium text-white/60 py-2"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-2 flex-1 px-2">
        {calendarDays.map((day, index) => (
          <div
            key={`day-${day.date}-${index}`}
            className={cn(
              'calendar-day relative border rounded-lg overflow-hidden transition-all flex flex-col',
              'hover:border-white/30 cursor-pointer',
              'min-h-[120px] md:min-h-[140px]',
              day.isCurrentMonth ? 'border-white/10 bg-white/5' : 'border-white/5 bg-white/[0.02]',
              day.isToday && 'ring-2 ring-blue-500/50 border-blue-500/30',
              day.isSelected && 'ring-2 ring-white/50'
            )}
            onClick={() => onDateClick?.(day.date)}
          >
            {/* Day number */}
            <div className="p-2">
              <span
                className={cn(
                  'text-sm font-medium',
                  day.isCurrentMonth ? 'text-white' : 'text-white/30',
                  day.isToday && 'bg-blue-500 px-2 py-0.5 rounded-full text-white'
                )}
              >
                {day.date.getDate()}
              </span>
            </div>

            {/* Modern Event Cards */}
            {day.events.length > 0 && (
              <div className="px-1.5 pb-1.5 space-y-1 flex-1 overflow-hidden">
                {day.events.slice(0, 3).map((event) => (
                  <EventChip
                    key={event.id}
                    event={event}
                    variant="default"
                    onClick={(e) => {
                      e?.stopPropagation()
                      onEventClick(event)
                    }}
                    className="calendar-event-card"
                  />
                ))}
                
                {/* Show more indicator */}
                {day.events.length > 3 && (
                  <div
                    className="text-center py-1 text-[10px] text-white/50 hover:text-white/70 cursor-pointer transition-colors rounded-md hover:bg-white/5"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleShowAllEvents(day.date, day.events, e)
                    }}
                  >
                    +{day.events.length - 3} más
                  </div>
                )}
                
                {/* Quick status summary for backup events */}
                {day.events.some(e => e.metadata?.type === 'daily-backup') && (
                  <div className="mt-auto pt-1 border-t border-white/5">
                    <div className="flex justify-center">
                      {day.events
                        .filter(e => e.metadata?.type === 'daily-backup')
                        .slice(0, 1)
                        .map((backup, backupIndex) => {
                          const isOverdue = backup.metadata?.isPast && !backup.metadata?.completed
                          return (
                            <div 
                              key={`backup-${backup.id}-${backupIndex}`}
                              className={cn(
                                "w-2 h-2 rounded-full",
                                isOverdue
                                  ? "bg-red-400"
                                  : backup.metadata?.completed 
                                  ? "bg-green-400"
                                  : backup.metadata?.isPending
                                  ? "bg-gray-400"
                                  : "bg-orange-400"
                              )}
                              title={`Backup: ${isOverdue ? 'No Realizado' : backup.metadata?.completed ? 'Completado' : backup.metadata?.isPending ? 'Pendiente' : 'En progreso'}`}
                            />
                          )
                        })
                      }
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Modal for all events in a day */}
      {selectedDayEvents && (
        <Modal
          isOpen={showAllEventsModal}
          onClose={handleCloseModal}
          title={`Eventos del ${selectedDayEvents.date.toLocaleDateString('es-AR', {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
            year: 'numeric'
          })}`}
          className="max-w-2xl"
        >
          <div className="space-y-2 max-h-[60vh] overflow-y-auto">
            {selectedDayEvents.events.map((event) => {
              const startDate = new Date(event.startTime)
              const endDate = event.endTime ? new Date(event.endTime) : null

              return (
                <div
                  key={event.id}
                  onClick={() => {
                    handleCloseModal()
                    onEventClick(event)
                  }}
                  className={cn(
                    'p-4 rounded-lg cursor-pointer transition-all',
                    'border border-white/10 hover:border-white/30',
                    'hover:bg-white/5 hover:scale-[1.02]'
                  )}
                  style={{
                    backgroundColor: event.color ? `${event.color}20` : 'rgba(255, 255, 255, 0.05)',
                    borderLeftWidth: '4px',
                    borderLeftColor: event.color || '#3b82f6'
                  }}
                >
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <h3 className="font-semibold text-white text-base flex-1">{event.title}</h3>
                    <span className={cn(
                      'text-xs px-2 py-0.5 rounded-full flex-shrink-0',
                      event.priority === 'URGENT' && 'bg-red-500/20 text-red-300',
                      event.priority === 'HIGH' && 'bg-orange-500/20 text-orange-300',
                      event.priority === 'NORMAL' && 'bg-gray-500/20 text-gray-300',
                      event.priority === 'LOW' && 'bg-blue-500/20 text-blue-300'
                    )}>
                      {event.priority}
                    </span>
                  </div>

                  {event.description && (
                    <p className="text-sm text-white/70 mb-3 line-clamp-2">{event.description}</p>
                  )}

                  <div className="flex flex-wrap gap-3 text-sm text-white/60">
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-4 h-4" />
                      <span>
                        {event.allDay ? 'Todo el día' : (
                          <>
                            {new Intl.DateTimeFormat('es-AR', {
                              hour: '2-digit',
                              minute: '2-digit',
                            }).format(startDate)}
                            {endDate && ` - ${new Intl.DateTimeFormat('es-AR', {
                              hour: '2-digit',
                              minute: '2-digit',
                            }).format(endDate)}`}
                          </>
                        )}
                      </span>
                    </div>

                    {event.location && (
                      <div className="flex items-center gap-1.5">
                        <MapPin className="w-4 h-4" />
                        <span>{event.location}</span>
                      </div>
                    )}
                  </div>

                  {event.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-3">
                      {event.tags.map((tag) => (
                        <span
                          key={tag}
                          className="text-xs px-2 py-0.5 rounded-full bg-white/10 text-white/70"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </Modal>
      )}
    </div>
  )
}

// Helper function to get events for a specific date
function getEventsForDate(date: Date, events: CalendarEvent[]): CalendarEvent[] {
  const dateStart = new Date(date)
  dateStart.setHours(0, 0, 0, 0)

  const dateEnd = new Date(date)
  dateEnd.setHours(23, 59, 59, 999)

  return events.filter((event) => {
    // Para eventos de todo el día, parsear la fecha como local sin conversión de timezone
    let eventStart: Date
    let eventEnd: Date

    if (event.allDay && typeof event.startTime === 'string' && event.startTime.match(/^\d{4}-\d{2}-\d{2}$/)) {
      // Formato YYYY-MM-DD sin hora → parsear como fecha local
      const [year, month, day] = event.startTime.split('-').map(Number)
      eventStart = new Date(year, month - 1, day, 0, 0, 0, 0)
      eventEnd = event.endTime && typeof event.endTime === 'string' && event.endTime.match(/^\d{4}-\d{2}-\d{2}$/)
        ? (() => {
            const [y, m, d] = event.endTime.split('-').map(Number)
            return new Date(y, m - 1, d, 23, 59, 59, 999)
          })()
        : new Date(year, month - 1, day, 23, 59, 59, 999)
    } else {
      // Fechas con hora o formato ISO completo → conversión normal
      eventStart = new Date(event.startTime)
      eventEnd = event.endTime ? new Date(event.endTime) : eventStart
    }

    // Check if event overlaps with this date
    return eventStart <= dateEnd && eventEnd >= dateStart
  })
}
