import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { backupsApi } from '../api/backups.api'
import type { BackupsFilters } from '../types'

export const useBackups = (filters?: BackupsFilters) => {
  return useQuery({
    queryKey: ['backups', filters],
    queryFn: () => backupsApi.getAll(filters),
  })
}

export const useBackup = (id: number) => {
  return useQuery({
    queryKey: ['backups', id],
    queryFn: () => backupsApi.getOne(id),
    enabled: !!id,
  })
}

export const useBackupStats = () => {
  return useQuery({
    queryKey: ['backups', 'stats'],
    queryFn: () => backupsApi.getStats(),
  })
}

export const useCreateBackup = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: () => backupsApi.createBackup(),
    onSuccess: () => {
      // Invalidar queries para refrescar la lista y stats
      queryClient.invalidateQueries({ queryKey: ['backups'] })
    },
  })
}

export const useRestoreBackup = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: number) => backupsApi.restoreBackup(id),
    onSuccess: () => {
      // Invalidar todas las queries ya que la base de datos fue restaurada
      queryClient.invalidateQueries()
    },
  })
}

export const useDeleteBackup = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: number) => backupsApi.deleteBackup(id),
    onSuccess: () => {
      // Invalidar queries para refrescar la lista y stats
      queryClient.invalidateQueries({ queryKey: ['backups'] })
    },
  })
}
