import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { printersApi } from '../api/printers.api'
import type { PrinterFormData, PrinterFilters } from '../types'

export function usePrinters(filters?: PrinterFilters) {
  return useQuery({
    queryKey: ['printers', filters],
    queryFn: () => printersApi.getAll(filters),
    staleTime: 30000, // 30 seconds
  })
}

export function usePrinterById(id: number) {
  return useQuery({
    queryKey: ['printers', id],
    queryFn: () => printersApi.getById(id),
    enabled: !!id,
  })
}

export function useCreatePrinter() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: PrinterFormData) => printersApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['printers'] })
    },
  })
}

export function useUpdatePrinter() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<PrinterFormData> }) =>
      printersApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['printers'] })
    },
  })
}

export function useDeletePrinter() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: number) => printersApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['printers'] })
    },
  })
}
