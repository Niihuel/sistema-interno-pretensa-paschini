import { useQuery } from '@tanstack/react-query';
import { dashboardStatsApi } from '../api/dashboard-stats.api';

/**
 * Hook para obtener estadísticas del dashboard en tiempo real
 */
export function useDashboardStats() {
  return useQuery({
    queryKey: ['dashboard', 'stats'],
    queryFn: () => dashboardStatsApi.getStats(),
    refetchInterval: 30000, // Actualizar cada 30 segundos
    staleTime: 20000, // Considerar datos frescos por 20 segundos
  });
}

/**
 * Hook para obtener estadísticas de tickets
 */
export function useTicketStats() {
  return useQuery({
    queryKey: ['tickets', 'stats'],
    queryFn: () => dashboardStatsApi.getTicketStats(),
    refetchInterval: 30000,
  });
}

/**
 * Hook para obtener estadísticas de usuarios
 */
export function useUserStats() {
  return useQuery({
    queryKey: ['users', 'stats'],
    queryFn: () => dashboardStatsApi.getUserStats(),
    refetchInterval: 60000, // Cada minuto
  });
}

/**
 * Hook para obtener estadísticas de empleados
 */
export function useEmployeeStats() {
  return useQuery({
    queryKey: ['employees', 'stats'],
    queryFn: () => dashboardStatsApi.getEmployeeStats(),
    refetchInterval: 60000,
  });
}

/**
 * Hook para obtener estadísticas de equipos
 */
export function useEquipmentStats() {
  return useQuery({
    queryKey: ['equipment', 'stats'],
    queryFn: () => dashboardStatsApi.getEquipmentStats(),
    refetchInterval: 60000,
  });
}

/**
 * Hook para obtener estadísticas de consumibles
 */
export function useConsumableStats() {
  return useQuery({
    queryKey: ['consumables', 'stats'],
    queryFn: () => dashboardStatsApi.getConsumableStats(),
    refetchInterval: 30000,
  });
}

/**
 * Hook para obtener estadísticas de solicitudes de compra
 */
export function usePurchaseRequestStats() {
  return useQuery({
    queryKey: ['purchase-requests', 'stats'],
    queryFn: () => dashboardStatsApi.getPurchaseRequestStats(),
    refetchInterval: 60000,
  });
}
