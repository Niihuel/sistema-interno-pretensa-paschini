import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { consumablesApi, consumableTypesApi, compatibilityApi, stockMovementsApi } from '../api/consumables.api'
import type {
  ConsumableTypeFilters,
  ConsumableFilters,
  ConsumableTypeFormData,
  ConsumableFormData,
  CompatibilityFormData,
  StockMovementFormData,
} from '../types'

// ============================================================================
// QUERY KEYS
// ============================================================================

export const consumablesKeys = {
  all: ['consumables'] as const,
  types: () => [...consumablesKeys.all, 'types'] as const,
  type: (id: number) => [...consumablesKeys.types(), id] as const,
  typesList: (filters?: ConsumableTypeFilters) => [...consumablesKeys.types(), 'list', filters] as const,

  compatibility: () => [...consumablesKeys.all, 'compatibility'] as const,
  compatibilityForPrinter: (model: string) => [...consumablesKeys.compatibility(), 'printer', model] as const,
  compatibilityForType: (id: number) => [...consumablesKeys.compatibility(), 'type', id] as const,

  items: () => [...consumablesKeys.all, 'items'] as const,
  item: (id: number) => [...consumablesKeys.items(), id] as const,
  itemsList: (filters?: ConsumableFilters) => [...consumablesKeys.items(), 'list', filters] as const,
  lowStock: () => [...consumablesKeys.items(), 'low-stock'] as const,
  expiring: (daysAhead?: number) => [...consumablesKeys.items(), 'expiring', daysAhead] as const,
  summary: () => [...consumablesKeys.items(), 'summary'] as const,

  movements: (consumableId: number) => [...consumablesKeys.all, 'movements', consumableId] as const,
}

// ============================================================================
// CONSUMABLE TYPES HOOKS
// ============================================================================

export function useConsumableTypes(filters?: ConsumableTypeFilters) {
  return useQuery({
    queryKey: consumablesKeys.typesList(filters),
    queryFn: () => consumableTypesApi.getAll(filters),
  })
}

export function useConsumableType(id: number) {
  return useQuery({
    queryKey: consumablesKeys.type(id),
    queryFn: () => consumableTypesApi.getOne(id),
    enabled: !!id,
  })
}

export function useCreateConsumableType() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: ConsumableTypeFormData) => consumableTypesApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: consumablesKeys.types() })
    },
  })
}

export function useUpdateConsumableType() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<ConsumableTypeFormData> }) =>
      consumableTypesApi.update(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: consumablesKeys.type(id) })
      queryClient.invalidateQueries({ queryKey: consumablesKeys.types() })
    },
  })
}

export function useDeleteConsumableType() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: number) => consumableTypesApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: consumablesKeys.types() })
    },
  })
}

// ============================================================================
// COMPATIBILITY HOOKS
// ============================================================================

export function useCompatibilityForPrinter(printerModel: string) {
  return useQuery({
    queryKey: consumablesKeys.compatibilityForPrinter(printerModel),
    queryFn: () => compatibilityApi.getForPrinter(printerModel),
    enabled: !!printerModel,
  })
}

export function useCompatibilityForType(consumableTypeId: number) {
  return useQuery({
    queryKey: consumablesKeys.compatibilityForType(consumableTypeId),
    queryFn: () => compatibilityApi.getForConsumableType(consumableTypeId),
    enabled: !!consumableTypeId,
  })
}

export function useCreateCompatibility() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: CompatibilityFormData) => compatibilityApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: consumablesKeys.compatibility() })
    },
  })
}

export function useDeleteCompatibility() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: number) => compatibilityApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: consumablesKeys.compatibility() })
    },
  })
}

// ============================================================================
// CONSUMABLES (INVENTORY) HOOKS
// ============================================================================

export function useConsumables(filters?: ConsumableFilters) {
  return useQuery({
    queryKey: consumablesKeys.itemsList(filters),
    queryFn: () => consumablesApi.getAll(filters),
  })
}

export function useConsumable(id: number) {
  return useQuery({
    queryKey: consumablesKeys.item(id),
    queryFn: () => consumablesApi.getOne(id),
    enabled: !!id,
  })
}

export function useCreateConsumable() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: ConsumableFormData) => consumablesApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: consumablesKeys.items() })
      queryClient.invalidateQueries({ queryKey: consumablesKeys.summary() })
      queryClient.invalidateQueries({ queryKey: consumablesKeys.lowStock() })
    },
  })
}

export function useUpdateConsumable() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<ConsumableFormData> }) =>
      consumablesApi.update(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: consumablesKeys.item(id) })
      queryClient.invalidateQueries({ queryKey: consumablesKeys.items() })
      queryClient.invalidateQueries({ queryKey: consumablesKeys.summary() })
      queryClient.invalidateQueries({ queryKey: consumablesKeys.lowStock() })
    },
  })
}

export function useDeleteConsumable() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: number) => consumablesApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: consumablesKeys.items() })
      queryClient.invalidateQueries({ queryKey: consumablesKeys.summary() })
      queryClient.invalidateQueries({ queryKey: consumablesKeys.lowStock() })
    },
  })
}

export function useLowStockConsumables() {
  return useQuery({
    queryKey: consumablesKeys.lowStock(),
    queryFn: () => consumablesApi.getLowStock(),
  })
}

export function useExpiringConsumables(daysAhead = 30) {
  return useQuery({
    queryKey: consumablesKeys.expiring(daysAhead),
    queryFn: () => consumablesApi.getExpiring(daysAhead),
  })
}

export function useConsumablesSummary() {
  return useQuery({
    queryKey: consumablesKeys.summary(),
    queryFn: () => consumablesApi.getSummary(),
  })
}

// ============================================================================
// STOCK MOVEMENTS HOOKS
// ============================================================================

export function useStockMovements(consumableId: number, limit?: number) {
  return useQuery({
    queryKey: consumablesKeys.movements(consumableId),
    queryFn: () => stockMovementsApi.getForConsumable(consumableId, limit),
    enabled: !!consumableId,
  })
}

export function useCreateStockMovement() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: StockMovementFormData) => stockMovementsApi.create(data),
    onSuccess: (_, { consumableId }) => {
      queryClient.invalidateQueries({ queryKey: consumablesKeys.movements(consumableId) })
      queryClient.invalidateQueries({ queryKey: consumablesKeys.item(consumableId) })
      queryClient.invalidateQueries({ queryKey: consumablesKeys.items() })
      queryClient.invalidateQueries({ queryKey: consumablesKeys.summary() })
      queryClient.invalidateQueries({ queryKey: consumablesKeys.lowStock() })
    },
  })
}
