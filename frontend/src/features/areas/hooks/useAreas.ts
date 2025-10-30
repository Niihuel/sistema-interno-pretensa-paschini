import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { areasApi } from '../api/areas.api'
import type { AreasFilters, AreaFormData } from '../types'

export const useAreas = (filters?: AreasFilters) => {
  return useQuery({
    queryKey: ['areas', filters],
    queryFn: () => areasApi.getAll(filters),
    staleTime: 0, // Siempre considerar datos como stale
    refetchOnMount: true, // Refetch al montar el componente
  })
}

export const useAllAreas = () => {
  return useQuery({
    queryKey: ['areas', 'all'],
    queryFn: () => areasApi.getAllAreas(),
  })
}

export const useArea = (id: number) => {
  return useQuery({
    queryKey: ['areas', id],
    queryFn: () => areasApi.getOne(id),
    enabled: !!id,
  })
}

export const useCreateArea = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: AreaFormData) => areasApi.create(data),
    onSuccess: () => {
      // Invalidar todas las queries de áreas
      queryClient.invalidateQueries({ queryKey: ['areas'] })
      // Forzar refetch inmediato
      queryClient.refetchQueries({ queryKey: ['areas'] })
    },
  })
}

export const useUpdateArea = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: AreaFormData }) =>
      areasApi.update(id, data),
    onSuccess: () => {
      // Invalidar todas las queries de áreas
      queryClient.invalidateQueries({ queryKey: ['areas'] })
      // Forzar refetch inmediato
      queryClient.refetchQueries({ queryKey: ['areas'] })
    },
  })
}

export const useDeleteArea = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: number) => areasApi.delete(id),
    onSuccess: () => {
      // Invalidar todas las queries de áreas
      queryClient.invalidateQueries({ queryKey: ['areas'] })
      // Forzar refetch inmediato
      queryClient.refetchQueries({ queryKey: ['areas'] })
    },
  })
}
