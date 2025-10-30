import { useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { dailyBackupsApi } from '../api/daily-backups.api';
import { calendarKeys } from '../../calendar/hooks/useCalendar';
import type {
  DailyBackup,
  UpdateDailyBackupDto,
  BackupFileType,
  BackupStatus,
} from '../types';
import { useToast } from '../../../shared/components/ui/ToastContainer';

const fileDisplayNames: Record<BackupFileType, string> = {
  backupZip: 'Backup.zip',
  backupAdjuntosZip: 'BackupAdjuntos.zip',
  calipsoBak: 'Calipso.bak',
  presupuestacionBak: 'Presupuestacion.bak',
};

const handleApiError = (error: unknown, fallbackMessage: string, toast: ReturnType<typeof useToast>) => {
  if (axios.isAxiosError(error) && error.response) {
    const status = error.response.status;
    if (status === 403) {
      toast.error('No tienes permisos para gestionar los backups diarios.');
      return;
    }
    if (status === 404) {
      toast.error('No hay backup configurado para hoy. Verifica la configuración.');
      return;
    }
  }
  console.error(fallbackMessage, error);
  toast.error(fallbackMessage);
};

export const useDailyBackups = () => {
  const queryClient = useQueryClient();
  const toast = useToast();

  const { data: config, isLoading: isLoadingConfig } = useQuery({
    queryKey: ['daily-backups', 'config'],
    queryFn: dailyBackupsApi.getConfig,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  const { data: todayBackup, isLoading: isLoadingToday, refetch: refetchToday } = useQuery({
    queryKey: ['daily-backups', 'today'],
    queryFn: dailyBackupsApi.getTodayBackup,
    staleTime: 2 * 60 * 1000, // 2 minutos para el backup de hoy (más frecuente)
    refetchOnWindowFocus: false,
  });

  const { data: stats, isLoading: isLoadingStats } = useQuery({
    queryKey: ['daily-backups', 'stats'],
    queryFn: dailyBackupsApi.getStats,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  const statusesById = useMemo(() => {
    const map = new Map<number, BackupStatus>();
    (config?.statuses ?? []).forEach((status) => {
      map.set(status.id, status);
    });
    return map;
  }, [config]);

  const updateMutation = useMutation({
    mutationFn: (data: UpdateDailyBackupDto) => dailyBackupsApi.createOrUpdateToday(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['daily-backups'] });
      // Forzar refetch inmediato del calendario
      queryClient.refetchQueries({ queryKey: calendarKeys.all });
      toast.success('Backup actualizado correctamente');
    },
    onError: (error) => handleApiError(error, 'Error al actualizar el backup', toast),
  });

  const toggleDiskMutation = useMutation({
    mutationFn: (diskNumber: number) => dailyBackupsApi.toggleDisk(diskNumber),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['daily-backups'] });
      queryClient.refetchQueries({ queryKey: calendarKeys.all });
    },
    onError: (error) => handleApiError(error, 'Error al actualizar el disco', toast),
  });

  const toggleFileMutation = useMutation({
    mutationFn: (fileType: BackupFileType) => dailyBackupsApi.toggleFile(fileType),
    onMutate: async (fileType) => {
      // Cancelar queries pendientes
      await queryClient.cancelQueries({ queryKey: ['daily-backups', 'today'] });

      // Obtener el backup actual del cache
      const previousBackup = queryClient.getQueryData<DailyBackup | null>(['daily-backups', 'today']);

      // Mapeo de fileType legacy a código dinámico
      const legacyToCodeMap: Record<string, string> = {
        backupZip: 'BACKUP_ZIP',
        backupAdjuntosZip: 'BACKUP_ADJUNTOS_ZIP',
        calipsoBak: 'CALIPSO_BAK',
        presupuestacionBak: 'PRESUPUESTACION_BAK',
      };

      const fileCode = legacyToCodeMap[fileType] || fileType.toUpperCase();

      // Buscar el archivo actual en el array files
      let previousStatus = null;
      if (previousBackup?.files) {
        const file = previousBackup.files.find(f => f.fileType.code === fileCode);
        previousStatus = file?.status || null;
      }

      // Retornar contexto para usar en onSuccess
      return { previousStatus, fileType, fileCode };
    },
    onSuccess: (data, fileType, context) => {
      queryClient.invalidateQueries({ queryKey: ['daily-backups'] });
      queryClient.invalidateQueries({ queryKey: ['daily-backups', 'history'] });
      queryClient.refetchQueries({ queryKey: calendarKeys.all });

      // Buscar el nuevo estado en el array files del response
      const fileCode = context?.fileCode || fileType.toUpperCase();
      const updatedFile = (data as DailyBackup).files?.find(f => f.fileType.code === fileCode);
      const newStatus = updatedFile?.status;

      // Construir mensaje con transición de estado
      const fileName = updatedFile?.fileType.name || fileDisplayNames[fileType] || 'Archivo';
      const previousLabel = context?.previousStatus?.label || 'Sin estado';
      const newLabel = newStatus?.label || 'Sin estado';

      toast.success(`${fileName}: ${previousLabel} → ${newLabel}`);
    },
    onError: (error) => {
      handleApiError(error, 'Error al actualizar el archivo', toast);
    },
  });

  const changeDiskMutation = useMutation({
    mutationFn: (diskNumber: number) => dailyBackupsApi.createOrUpdateToday({ diskNumber }),
    onMutate: async (diskNumber: number) => {
      // Cancelar queries pendientes
      await queryClient.cancelQueries({ queryKey: ['daily-backups', 'today'] });

      // Obtener el backup actual del cache
      const previousBackup = queryClient.getQueryData<DailyBackup | null>(['daily-backups', 'today']);
      const previousDisk = previousBackup?.disk || null;

      // Actualización optimista: cambiar el disco inmediatamente en el cache
      if (previousBackup && config?.disks) {
        const newDisk = config.disks.find(d => d.sequence === diskNumber);
        if (newDisk) {
          const optimisticBackup = {
            ...previousBackup,
            disk: newDisk,
            diskId: newDisk.id,
          };
          queryClient.setQueryData(['daily-backups', 'today'], optimisticBackup);
        }
      }

      return { previousBackup, previousDisk };
    },
    onSuccess: async (data, _diskNumber, context) => {
      // Actualizar el cache con los datos reales del servidor
      queryClient.setQueryData(['daily-backups', 'today'], data);
      
      // Invalidar queries relacionadas - incluir historial
      queryClient.invalidateQueries({ queryKey: ['daily-backups', 'month'] });
      queryClient.invalidateQueries({ queryKey: ['daily-backups', 'history'] });
      queryClient.refetchQueries({ queryKey: calendarKeys.all });

      const newDiskLabel = data.disk?.name ?? `Disco ${data.disk?.sequence ?? ''}`;

      if (context?.previousDisk && data.disk?.id !== context.previousDisk.id) {
        toast.success(`Disco cambiado a "${newDiskLabel}"`);
      }
    },
    onError: (error, _diskNumber, context) => {
      // Restaurar el estado anterior en caso de error
      if (context?.previousBackup) {
        queryClient.setQueryData(['daily-backups', 'today'], context.previousBackup);
      }
      handleApiError(error, 'Error al cambiar el disco', toast);
    },
  });

  const updateFileStatusMutation = useMutation({
    mutationFn: ({ fileTypeId, statusId }: { fileTypeId: number; statusId: number }) => 
      dailyBackupsApi.updateFileStatus(fileTypeId, statusId),
    onMutate: async ({ fileTypeId, statusId }) => {
      // Cancelar queries pendientes
      await queryClient.cancelQueries({ queryKey: ['daily-backups', 'today'] });

      // Obtener el backup actual del cache
      const previousBackup = queryClient.getQueryData<DailyBackup | null>(['daily-backups', 'today']);
      
      // Actualización optimista
      if (previousBackup?.files) {
        const newStatus = statusesById.get(statusId);
        if (newStatus) {
          const updatedFiles = previousBackup.files.map(file => 
            file.fileTypeId === fileTypeId 
              ? { ...file, status: newStatus, statusId }
              : file
          );
          
          const optimisticBackup = {
            ...previousBackup,
            files: updatedFiles,
          };
          
          queryClient.setQueryData(['daily-backups', 'today'], optimisticBackup);
        }
      }

      return { previousBackup };
    },
    onSuccess: (data, { fileTypeId, statusId }) => {
      // Actualizar el cache con los datos reales del servidor
      queryClient.setQueryData(['daily-backups', 'today'], data);
      
      // Invalidar queries relacionadas - incluir historial
      queryClient.invalidateQueries({ queryKey: ['daily-backups', 'month'] });
      queryClient.invalidateQueries({ queryKey: ['daily-backups', 'history'] });
      queryClient.refetchQueries({ queryKey: calendarKeys.all });

      // Mostrar mensaje de éxito
      const updatedFile = data.files?.find(f => f.fileTypeId === fileTypeId);
      const fileName = updatedFile?.fileType.name || 'Archivo';
      const newStatus = statusesById.get(statusId);
      
      if (newStatus) {
        toast.success(`${fileName}: ${newStatus.label}`);
      }
    },
    onError: (error, _variables, context) => {
      // Restaurar el estado anterior en caso de error
      if (context?.previousBackup) {
        queryClient.setQueryData(['daily-backups', 'today'], context.previousBackup);
      }
      handleApiError(error, 'Error al actualizar el estado del archivo', toast);
    },
  });

  return {
    todayBackup,
    stats,
    config,
    statusesById,
    isLoadingConfig,
    isLoadingToday,
    isLoadingStats,
    updateBackup: updateMutation.mutate,
    toggleDisk: toggleDiskMutation.mutate,
    toggleFile: toggleFileMutation.mutate,
    changeDisk: changeDiskMutation.mutate,
    updateFileStatus: (fileTypeId: number, statusId: number) => 
      updateFileStatusMutation.mutate({ fileTypeId, statusId }),
    isUpdating: updateMutation.isPending,
    isTogglingFile: toggleFileMutation.isPending,
    isChangingDisk: changeDiskMutation.isPending,
    isUpdatingFileStatus: updateFileStatusMutation.isPending,
    refetchToday,
  };
};

export const useBackupsByMonth = (year: number, month: number) => {
  return useQuery({
    queryKey: ['daily-backups', 'month', year, month],
    queryFn: () => dailyBackupsApi.getBackupsByMonth(year, month),
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
};

export const useBackupsHistory = (page: number = 1, limit: number = 30) => {
  return useQuery({
    queryKey: ['daily-backups', 'history', page, limit],
    queryFn: () => dailyBackupsApi.getHistory(page, limit),
    staleTime: 0, // Siempre considerar datos como stale para forzar refetch
    gcTime: 5 * 60 * 1000, // Mantener en cache 5 minutos
    refetchOnWindowFocus: false, // No refetch al cambiar de ventana
    refetchOnMount: true, // Refetch al montar para ver cambios recientes
  });
};



