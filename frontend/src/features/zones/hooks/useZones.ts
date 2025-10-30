import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { zonesApi } from '../api/zones.api'
import type { ZoneFormData, ZonesFilters } from '../types'

export const useZones = (filters?: ZonesFilters) => {
  return useQuery({
    queryKey: ['zones', filters],
    queryFn: () => zonesApi.getAll(filters),
  })
}

export const useAllZones = () => {
  return useQuery({
    queryKey: ['zones', 'all'],
    queryFn: () => zonesApi.getAllZones(),
  })
}

export const useZone = (id: number) => {
  return useQuery({
    queryKey: ['zones', id],
    queryFn: () => zonesApi.getOne(id),
    enabled: !!id,
  })
}

export const useCreateZone = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: ZoneFormData) => zonesApi.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['zones'] })
    },
  })
}

export const useUpdateZone = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<ZoneFormData> }) =>
      zonesApi.update(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['zones', id] })
      queryClient.invalidateQueries({ queryKey: ['zones'] })
    },
  })
}

export const useDeleteZone = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => zonesApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['zones'] })
    },
  })
}
