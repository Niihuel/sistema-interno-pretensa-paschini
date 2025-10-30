import { apiClient } from '../../../api/client'
import type {
  CalendarEvent,
  CreateEventDto,
  UpdateEventDto,
  QueryEventsParams,
  EventsResponse,
} from '../types'

const BASE_URL = '/calendar/events'

export const calendarApi = {
  // Get all events with filters
  getEvents: async (params?: QueryEventsParams): Promise<EventsResponse> => {
    const response = await apiClient.get(BASE_URL, { params })
    return response.data
  },

  // Get a single event by ID
  getEvent: async (id: number): Promise<CalendarEvent> => {
    const response = await apiClient.get(`${BASE_URL}/${id}`)
    return response.data.data
  },

  // Create a new event
  createEvent: async (data: CreateEventDto): Promise<CalendarEvent> => {
    const response = await apiClient.post(BASE_URL, data)
    return response.data.data
  },

  // Update an existing event
  updateEvent: async (id: number, data: UpdateEventDto): Promise<CalendarEvent> => {
    const response = await apiClient.put(`${BASE_URL}/${id}`, data)
    return response.data.data
  },

  // Delete an event
  deleteEvent: async (id: number): Promise<void> => {
    await apiClient.delete(`${BASE_URL}/${id}`)
  },

  // Get events for a specific date range
  getEventsByDateRange: async (start: string, end: string): Promise<CalendarEvent[]> => {
    const startDate = new Date(start)
    const endDate = new Date(end)

    // Obtener eventos de calendario regulares
    const eventsResponse = await apiClient.get(BASE_URL, {
      params: { start, end },
    })
    const events = eventsResponse.data.data || []

    // Obtener backups diarios como eventos para todos los meses en el rango
    const backups: CalendarEvent[] = []
    
    try {
      // Iterar por cada mes en el rango de fechas
      const currentDate = new Date(startDate.getFullYear(), startDate.getMonth(), 1)
      const endMonth = new Date(endDate.getFullYear(), endDate.getMonth(), 1)

      while (currentDate <= endMonth) {
        const year = currentDate.getFullYear()
        const month = currentDate.getMonth() + 1

        try {
          const backupsResponse = await apiClient.get(`/daily-backups/calendar/${year}/${month}`)
          const monthBackups = backupsResponse.data || []
          backups.push(...monthBackups)
        } catch (monthError) {
          console.warn(`Error fetching backups for ${year}/${month}:`, monthError)
        }

        // Avanzar al siguiente mes
        currentDate.setMonth(currentDate.getMonth() + 1)
      }

      // Combinar eventos regulares con backups y deduplicar
      const allEvents = [...events, ...backups]
      
      // Deduplicar por ID (mantener el último evento en caso de duplicados)
      const uniqueEvents = allEvents.reduce((acc, event) => {
        const existingIndex = acc.findIndex((e: CalendarEvent) => e.id === event.id)
        if (existingIndex >= 0) {
          // Reemplazar el evento existente con el más reciente
          acc[existingIndex] = event
        } else {
          acc.push(event)
        }
        return acc
      }, [] as CalendarEvent[])
      
      return uniqueEvents
    } catch (error) {
      console.error('Error fetching daily backups for calendar:', error)
      // Si falla la llamada a backups, solo devolver eventos regulares
      return events
    }
  },

  // Get upcoming events
  getUpcomingEvents: async (limit?: number): Promise<CalendarEvent[]> => {
    const response = await apiClient.get(BASE_URL, {
      params: { onlyUpcoming: 'true', limit },
    })
    return response.data.data
  },
}
