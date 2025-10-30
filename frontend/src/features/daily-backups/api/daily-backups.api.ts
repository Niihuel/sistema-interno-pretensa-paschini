import { apiClient } from '../../../api/client';
import type {
  DailyBackup,
  DailyBackupStats,
  UpdateDailyBackupDto,
  BackupFileType,
  DailyBackupConfig,
  CreateBackupDiskPayload,
  UpdateBackupDiskPayload,
  CreateBackupStatusPayload,
  UpdateBackupStatusPayload,
  UpdateNotificationSettingPayload,
  CreateBackupFileTypePayload,
  UpdateBackupFileTypePayload,
} from '../types';

export const dailyBackupsApi = {
  // Obtener backup de hoy
  getTodayBackup: async (): Promise<DailyBackup | null> => {
    const response = await apiClient.get('/daily-backups/today');
    return response.data;
  },

  // Crear o actualizar backup de hoy
  createOrUpdateToday: async (data: UpdateDailyBackupDto): Promise<DailyBackup> => {
    const response = await apiClient.post('/daily-backups/today', data);
    return response.data;
  },

  // Toggle estado de un disco (DEPRECATED - mantener por compatibilidad)
  toggleDisk: async (diskNumber: number): Promise<DailyBackup> => {
    const response = await apiClient.patch(`/daily-backups/today/disk/${diskNumber}`);
    return response.data;
  },

  // Toggle estado de un archivo específico
  toggleFile: async (fileType: BackupFileType): Promise<DailyBackup> => {
    const response = await apiClient.patch(`/daily-backups/today/file/${fileType}`);
    return response.data;
  },

  // Actualizar estado específico de un archivo
  updateFileStatus: async (fileTypeId: number, statusId: number): Promise<DailyBackup> => {
    const response = await apiClient.put(`/daily-backups/today/file-type/${fileTypeId}/status/${statusId}`);
    return response.data;
  },

  // Cambiar disco (método mejorado)
  changeDisk: async (diskNumber: number): Promise<DailyBackup> => {
    const response = await apiClient.post('/daily-backups/today', { diskNumber });
    return response.data;
  },

  // Obtener backups por mes
  getBackupsByMonth: async (year: number, month: number): Promise<DailyBackup[]> => {
    const response = await apiClient.get(`/daily-backups/month/${year}/${month}`);
    return response.data;
  },

  // Obtener backups como eventos de calendario
  getBackupsAsCalendarEvents: async (year: number, month: number): Promise<any[]> => {
    const response = await apiClient.get(`/daily-backups/calendar/${year}/${month}`);
    return response.data;
  },

  // Obtener historial
  getHistory: async (page: number = 1, limit: number = 30): Promise<{
    items: DailyBackup[];
    total: number;
    page: number;
    limit: number;
    pages: number;
  }> => {
    const response = await apiClient.get('/daily-backups/history', {
      params: { page, limit },
    });
    return response.data;
  },

  // Obtener estadísticas
  getStats: async (): Promise<DailyBackupStats> => {
    const response = await apiClient.get('/daily-backups/stats');
    return response.data;
  },

  // Configuración
  getConfig: async (): Promise<DailyBackupConfig> => {
    const response = await apiClient.get('/daily-backups/config');
    return response.data;
  },

  // Discos
  createDisk: async (payload: CreateBackupDiskPayload) => {
    const response = await apiClient.post('/daily-backups/config/disks', payload);
    return response.data;
  },

  updateDisk: async (id: number, payload: UpdateBackupDiskPayload) => {
    const response = await apiClient.patch(`/daily-backups/config/disks/${id}`, payload);
    return response.data;
  },

  archiveDisk: async (id: number) => {
    const response = await apiClient.delete(`/daily-backups/config/disks/${id}`);
    return response.data;
  },

  // Estados
  createStatus: async (payload: CreateBackupStatusPayload) => {
    const response = await apiClient.post('/daily-backups/config/statuses', payload);
    return response.data;
  },

  updateStatus: async (id: number, payload: UpdateBackupStatusPayload) => {
    const response = await apiClient.patch(`/daily-backups/config/statuses/${id}`, payload);
    return response.data;
  },

  archiveStatus: async (id: number) => {
    const response = await apiClient.delete(`/daily-backups/config/statuses/${id}`);
    return response.data;
  },

  // Notificaciones
  updateNotificationSetting: async (code: string, payload: UpdateNotificationSettingPayload) => {
    const response = await apiClient.patch(`/daily-backups/config/notifications/${code}`, payload);
    return response.data;
  },

  // Tipos de Archivos
  createFileType: async (payload: CreateBackupFileTypePayload) => {
    const response = await apiClient.post('/daily-backups/config/file-types', payload);
    return response.data;
  },

  updateFileType: async (id: number, payload: UpdateBackupFileTypePayload) => {
    const response = await apiClient.patch(`/daily-backups/config/file-types/${id}`, payload);
    return response.data;
  },

  archiveFileType: async (id: number) => {
    const response = await apiClient.delete(`/daily-backups/config/file-types/${id}`);
    return response.data;
  },
};
