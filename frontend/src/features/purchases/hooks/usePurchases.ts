import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { purchasesApi } from '../api/purchases.api'
import type { PurchasesFilters, PurchaseFormData } from '../types'

export const usePurchases = (filters?: PurchasesFilters) => {
  return useQuery({
    queryKey: ['purchases', filters],
    queryFn: () => purchasesApi.getAll(filters),
  })
}

export const usePurchase = (id: number) => {
  return useQuery({
    queryKey: ['purchases', id],
    queryFn: () => purchasesApi.getOne(id),
    enabled: !!id,
  })
}

export const useCreatePurchase = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: PurchaseFormData) => purchasesApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchases'] })
    },
  })
}

export const useUpdatePurchase = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: PurchaseFormData }) =>
      purchasesApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchases'] })
    },
  })
}

export const useDeletePurchase = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: number) => purchasesApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchases'] })
    },
  })
}
