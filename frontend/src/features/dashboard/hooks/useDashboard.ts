import { useQuery } from '@tanstack/react-query'
import { dashboardApi } from '../api/dashboard.api'

export function useDashboardSummary() {
  return useQuery({
    queryKey: ['dashboard', 'summary'],
    queryFn: () => dashboardApi.getSummary(),
    staleTime: 30000, // 30 seconds
  })
}
