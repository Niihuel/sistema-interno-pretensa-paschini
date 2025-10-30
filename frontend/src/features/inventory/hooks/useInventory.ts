import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { inventoryApi } from '../api/inventory.api'
import type { InventoryFormData, InventoryFilters } from '../types'

export function useInventory(filters?: InventoryFilters) {
  return useQuery({
    queryKey: ['inventory', filters],
    queryFn: () => inventoryApi.getAll(filters),
    staleTime: 30000, // 30 seconds
  })
}

export function useInventoryById(id: number) {
  return useQuery({
    queryKey: ['inventory', id],
    queryFn: () => inventoryApi.getById(id),
    enabled: !!id,
  })
}

export function useCreateInventory() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: InventoryFormData) => inventoryApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory'] })
    },
  })
}

export function useUpdateInventory() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<InventoryFormData> }) =>
      inventoryApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory'] })
    },
  })
}

export function useDeleteInventory() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: number) => inventoryApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory'] })
    },
  })
}
