import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { purchaseRequestsApi } from '../api/purchase-requests.api'
import type { PurchaseRequestFormData, PurchaseRequestFilters } from '../types'

export function usePurchaseRequests(filters?: PurchaseRequestFilters) {
  return useQuery({
    queryKey: ['purchase-requests', filters],
    queryFn: () => purchaseRequestsApi.getAll(filters),
    staleTime: 30000, // 30 seconds
  })
}

export function usePurchaseRequestById(id: number) {
  return useQuery({
    queryKey: ['purchase-requests', id],
    queryFn: () => purchaseRequestsApi.getById(id),
    enabled: !!id,
  })
}

export function useCreatePurchaseRequest() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: PurchaseRequestFormData) => purchaseRequestsApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchase-requests'] })
    },
  })
}

export function useUpdatePurchaseRequest() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<PurchaseRequestFormData> }) =>
      purchaseRequestsApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchase-requests'] })
    },
  })
}

export function useDeletePurchaseRequest() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: number) => purchaseRequestsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchase-requests'] })
    },
  })
}
