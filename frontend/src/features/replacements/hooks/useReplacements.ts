import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { replacementsApi } from '../api/replacements.api'
import type { ReplacementsFilters, ReplacementFormData } from '../types'

export const useReplacements = (filters?: ReplacementsFilters) => {
  return useQuery({
    queryKey: ['replacements', filters],
    queryFn: () => replacementsApi.getAll(filters),
  })
}

export const useReplacement = (id: number) => {
  return useQuery({
    queryKey: ['replacements', id],
    queryFn: () => replacementsApi.getOne(id),
    enabled: !!id,
  })
}

export const useCreateReplacement = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: ReplacementFormData) => replacementsApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['replacements'] })
      queryClient.invalidateQueries({ queryKey: ['consumables'] })
    },
  })
}

export const useUpdateReplacement = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: ReplacementFormData }) =>
      replacementsApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['replacements'] })
    },
  })
}

export const useDeleteReplacement = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: number) => replacementsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['replacements'] })
    },
  })
}
