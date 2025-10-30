import { useState, useMemo, useEffect } from 'react'
import { Calendar as CalendarIcon, List } from 'lucide-react'
import { useCalendarEventsByDateRange } from '../hooks/useCalendar'
import CalendarMonthView from '../components/CalendarMonthView'
import CalendarTimelineView from '../components/CalendarTimelineView'
import CreateEventModal from '../components/CreateEventModal'
import EventDetailsModal from '../components/EventDetailsModal'
import Button from '../../../shared/components/ui/Button'
import Tabs from '../../../shared/components/ui/Tabs'
import { FadeInUp } from '../../../shared/components/ui/AnimatedContainer'
import type { CalendarEvent } from '../types'
import { usePermissions } from '../../../providers/PermissionsProvider'

export default function CalendarPage() {
  const { can } = usePermissions()
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState<Date>()
  const [activeTab, setActiveTab] = useState<'month' | 'timeline'>('month')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showDetailsModal, setShowDetailsModal] = useState(false)
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null)
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null)

  // Calculate date range for current month
  const dateRange = useMemo(() => {
    const year = currentDate.getFullYear()
    const month = currentDate.getMonth()

    // Get first and last day of the month, extended to include surrounding weeks
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)

    // Extend to start of first week
    const startDate = new Date(firstDay)
    const startDayOfWeek = firstDay.getDay()
    const daysToSubtract = startDayOfWeek === 0 ? 6 : startDayOfWeek - 1
    startDate.setDate(startDate.getDate() - daysToSubtract)

    // Extend to end of last week
    const endDate = new Date(lastDay)
    const endDayOfWeek = lastDay.getDay()
    const daysToAdd = endDayOfWeek === 0 ? 0 : 7 - endDayOfWeek
    endDate.setDate(endDate.getDate() + daysToAdd)

    return {
      start: startDate.toISOString(),
      end: endDate.toISOString(),
    }
  }, [currentDate])

  // Fetch events for the current date range
  const { data: eventsData, isLoading, error, refetch } = useCalendarEventsByDateRange(
    dateRange.start,
    dateRange.end
  )

  const events = eventsData || []

  // El auto-refresh ya está configurado en el hook useCalendarEventsByDateRange
  // Solo mantener el refetch cuando la ventana gana foco
  useEffect(() => {
    const handleFocus = () => {
      refetch()
    }

    window.addEventListener('focus', handleFocus)

    return () => {
      window.removeEventListener('focus', handleFocus)
    }
  }, [refetch])

  const handleEventClick = (event: CalendarEvent) => {
    try {
      console.log('📅 Calendar event clicked:', event)
      console.log('📅 Event metadata:', event.metadata)
      console.log('📅 Is backup event:', event.metadata?.type === 'daily-backup')
      console.log('📅 Event ID type:', typeof event.id, event.id)
      
      setSelectedEvent(event)
      setShowDetailsModal(true)
      
      console.log('✅ Modal should be opening...')
    } catch (error) {
      console.error('❌ Error in handleEventClick:', error)
    }
  }

  const handleDateClick = (date: Date) => {
    setSelectedDate(date)
    setShowCreateModal(true)
  }

  const handleCreateEvent = () => {
    setSelectedDate(new Date())
    setEditingEvent(null)
    setShowCreateModal(true)
  }

  const handleEditEvent = (event: CalendarEvent) => {
    setEditingEvent(event)
    setShowDetailsModal(false)
    setShowCreateModal(true)
  }

  const handleModalClose = () => {
    setShowCreateModal(false)
    setEditingEvent(null)
    setSelectedDate(undefined)
  }

  const handleDetailsModalClose = () => {
    setShowDetailsModal(false)
    setSelectedEvent(null)
  }

  const handleSuccess = () => {
    refetch()
  }

  const tabs = [
    {
      id: 'month',
      label: 'Mes',
      icon: CalendarIcon,
    },
    {
      id: 'timeline',
      label: 'Timeline',
      icon: List,
    },
  ]

  // Check permissions
  if (!can('calendar', 'view')) {
    return (
      <div className="text-white px-2 sm:px-0">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="text-red-400 text-xl mb-2">Acceso Denegado</div>
            <div className="text-white/60">No tienes permisos para ver el calendario.</div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="text-white px-2 sm:px-0 h-full flex flex-col">
      <FadeInUp>
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <div className="flex-1">
            <h1 className="text-2xl sm:text-3xl font-semibold mb-2">Calendario</h1>
            <p className="text-white/70 text-sm sm:text-base">
              Gestiona tus eventos, reuniones y recordatorios
            </p>
          </div>
          {can('calendar', 'create') && (
            <Button onClick={handleCreateEvent} className="w-full sm:w-auto whitespace-nowrap px-6">
              Nuevo Evento
            </Button>
          )}
        </div>

        {/* Tabs */}
        <div className="mb-6">
          <Tabs
            tabs={tabs}
            activeTab={activeTab}
            onChange={(tabId) => setActiveTab(tabId as 'month' | 'timeline')}
          />
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
              <p className="text-white/60">Cargando eventos...</p>
            </div>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="text-red-400 text-xl mb-2">Error</div>
              <div className="text-white/60 mb-4">No se pudieron cargar los eventos</div>
              <Button onClick={() => refetch()}>Reintentar</Button>
            </div>
          </div>
        )}

        {/* Calendar Views */}
        {!isLoading && !error && (
          <div className="flex-1 overflow-hidden">
            {activeTab === 'month' && (
              <CalendarMonthView
                currentDate={currentDate}
                events={events}
                onEventClick={handleEventClick}
                onDateClick={handleDateClick}
                onMonthChange={setCurrentDate}
                selectedDate={selectedDate}
              />
            )}
            {activeTab === 'timeline' && (
              <CalendarTimelineView
                currentDate={currentDate}
                events={events}
                onEventClick={handleEventClick}
              />
            )}
          </div>
        )}

        {/* Modals */}
        <CreateEventModal
          isOpen={showCreateModal}
          onClose={handleModalClose}
          onSuccess={handleSuccess}
          initialDate={selectedDate}
          event={editingEvent}
        />

        <EventDetailsModal
          isOpen={showDetailsModal}
          onClose={handleDetailsModalClose}
          event={selectedEvent}
          onEdit={handleEditEvent}
          onSuccess={handleSuccess}
        />
      </FadeInUp>
    </div>
  )
}
