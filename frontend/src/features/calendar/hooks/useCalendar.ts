import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { calendarApi } from '../api/calendar.api'
import type {
  CreateEventDto,
  UpdateEventDto,
  QueryEventsParams,
} from '../types'

// Query keys
export const calendarKeys = {
  all: ['calendar'] as const,
  events: () => [...calendarKeys.all, 'events'] as const,
  event: (id: number) => [...calendarKeys.all, 'event', id] as const,
  dateRange: (start: string, end: string) => [...calendarKeys.all, 'dateRange', start, end] as const,
  upcoming: (limit?: number) => [...calendarKeys.all, 'upcoming', limit] as const,
}

// Hook to get all events
export const useCalendarEvents = (params?: QueryEventsParams) => {
  return useQuery({
    queryKey: [...calendarKeys.events(), params],
    queryFn: () => calendarApi.getEvents(params),
  })
}

// Hook to get a single event
export const useCalendarEvent = (id: number) => {
  return useQuery({
    queryKey: calendarKeys.event(id),
    queryFn: () => calendarApi.getEvent(id),
    enabled: !!id,
  })
}

// Hook to get events by date range
export const useCalendarEventsByDateRange = (start: string, end: string) => {
  return useQuery({
    queryKey: calendarKeys.dateRange(start, end),
    queryFn: () => calendarApi.getEventsByDateRange(start, end),
    enabled: !!start && !!end,
    staleTime: 0, // Sin caché - siempre considerar datos obsoletos para reflejar cambios de backup
    refetchOnWindowFocus: true, // Refetch cuando la ventana gane foco
    refetchOnMount: true, // Refetch al montar el componente
    refetchInterval: 10 * 1000, // Refetch automático cada 10 segundos para tiempo real
  })
}

// Hook to get upcoming events
export const useUpcomingEvents = (limit?: number) => {
  return useQuery({
    queryKey: calendarKeys.upcoming(limit),
    queryFn: () => calendarApi.getUpcomingEvents(limit),
  })
}

// Hook to create an event
export const useCreateEvent = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: CreateEventDto) => calendarApi.createEvent(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: calendarKeys.events() })
      queryClient.invalidateQueries({ queryKey: calendarKeys.upcoming() })
    },
  })
}

// Hook to update an event
export const useUpdateEvent = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateEventDto }) =>
      calendarApi.updateEvent(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: calendarKeys.events() })
      queryClient.invalidateQueries({ queryKey: calendarKeys.event(id) })
      queryClient.invalidateQueries({ queryKey: calendarKeys.upcoming() })
    },
  })
}

// Hook to delete an event
export const useDeleteEvent = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: number) => calendarApi.deleteEvent(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: calendarKeys.events() })
      queryClient.invalidateQueries({ queryKey: calendarKeys.upcoming() })
    },
  })
}

// Main hook that combines all functionality
export const useCalendar = () => {
  const createEvent = useCreateEvent()
  const updateEvent = useUpdateEvent()
  const deleteEvent = useDeleteEvent()

  return {
    createEvent,
    updateEvent,
    deleteEvent,
  }
}
