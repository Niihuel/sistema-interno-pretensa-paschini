export type BackupFileType = 'backupZip' | 'backupAdjuntosZip' | 'calipsoBak' | 'presupuestacionBak';

export interface BackupFileInfo {
  key: BackupFileType;
  name: string;
  description: string;
  pattern: string;
}

export interface BackupDisk {
  id: number;
  name: string;
  sequence: number;
  description?: string;
  color?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface BackupStatus {
  id: number;
  code: string;
  label: string;
  description?: string;
  color?: string;
  sortOrder: number;
  isFinal: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface BackupNotificationSetting {
  id: number;
  code: string;
  title: string;
  message: string;
  priority: string;
  isEnabled: boolean;
  sendHour?: number | null;
  sendMinute?: number | null;
  daysOfWeek?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface DailyBackupFile {
  id: number;
  dailyBackupId: number;
  fileTypeId: number;
  statusId: number;
  fileType: BackupFileTypeModel;
  status: BackupStatus;
  createdAt: string;
  updatedAt: string;
}

export interface DailyBackup {
  id: number;
  date: string;
  diskId: number;
  disk: BackupDisk;
  // DEPRECATED: Campos legacy para compatibilidad
  backupZipStatusId: number;
  backupZipStatus: BackupStatus;
  backupAdjuntosStatusId: number;
  backupAdjuntosStatus: BackupStatus;
  calipsoStatusId: number;
  calipsoStatus: BackupStatus;
  presupuestacionStatusId: number;
  presupuestacionStatus: BackupStatus;
  // Nuevo sistema dinámico
  files?: DailyBackupFile[];
  completedBy?: number | null;
  completedAt?: string | null;
  notes?: string | null;
  user?: {
    id: number;
    username: string;
    firstName?: string | null;
    lastName?: string | null;
  } | null;
  createdAt: string;
  updatedAt: string;
}

export interface DailyBackupStats {
  total: number;
  completed: number;
  pending: number;
  thisMonth: {
    total: number;
    completed: number;
    pending: number;
  };
  lastMonth: {
    total: number;
    completed: number;
    pending: number;
  };
}

export interface UpdateDailyBackupDto {
  diskNumber?: number;
  diskId?: number;
  backupZipStatusId?: number;
  backupAdjuntosStatusId?: number;
  calipsoStatusId?: number;
  presupuestacionStatusId?: number;
  notes?: string;
}

export interface BackupFileTypeModel {
  id: number;
  code: string;
  name: string;
  description?: string;
  sequence: number;
  icon?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface DailyBackupConfig {
  disks: BackupDisk[];
  statuses: BackupStatus[];
  notifications: BackupNotificationSetting[];
  fileTypes: BackupFileTypeModel[];
}
export interface CreateBackupDiskPayload {
  name: string;
  sequence: number;
  description?: string;
  color?: string;
  isActive?: boolean;
}

export interface UpdateBackupDiskPayload extends Partial<CreateBackupDiskPayload> {}

export interface CreateBackupStatusPayload {
  code: string;
  label: string;
  description?: string;
  color?: string;
  sortOrder?: number;
  isFinal?: boolean;
  isActive?: boolean;
}

export interface UpdateBackupStatusPayload extends Partial<CreateBackupStatusPayload> {}

export interface UpdateNotificationSettingPayload {
  title?: string;
  message?: string;
  priority?: string;
  isEnabled?: boolean;
  sendHour?: number | null;
  sendMinute?: number | null;
  daysOfWeek?: string | null;
}

export interface CreateBackupFileTypePayload {
  code: string;
  name: string;
  description?: string;
  sequence: number;
  icon?: string;
  isActive?: boolean;
}

export interface UpdateBackupFileTypePayload extends Partial<CreateBackupFileTypePayload> {}
