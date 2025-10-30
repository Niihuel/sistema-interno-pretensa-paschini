import type { BackupFileType } from './types';

// Definición local para evitar problemas de importación circular
interface BackupFileInfo {
  key: BackupFileType;
  name: string;
  description: string;
  pattern: string;
}

export const BACKUP_FILES: BackupFileInfo[] = [
  {
    key: 'backupZip',
    name: 'Backup.zip',
    description: 'Backup principal del sistema',
    pattern: 'Backup.zip',
  },
  {
    key: 'backupAdjuntosZip',
    name: 'BackupAdjuntos.zip',
    description: 'Backup de archivos adjuntos',
    pattern: 'BackupAdjuntos.zip',
  },
  {
    key: 'calipsoBak',
    name: 'Calipso.bak',
    description: 'Base de datos Calipso',
    pattern: 'Calipso_YYYY-MM-DD-HH-MM-SS.bak',
  },
  {
    key: 'presupuestacionBak',
    name: 'Presupuestacion.bak',
    description: 'Base de datos Presupuestacion',
    pattern: 'presupuestacion_YYYY-MM-DD-HH-MM-SS.bak',
  },
];

export const getBackupFileName = (fileType: BackupFileType, date?: Date): string => {
  const file = BACKUP_FILES.find(f => f.key === fileType);
  if (!file) return '';

  if (fileType === 'backupZip' || fileType === 'backupAdjuntosZip') {
    return file.name;
  }

  // For .bak files, return pattern with date if provided
  if (date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    
    if (fileType === 'calipsoBak') {
      return `Calipso_${year}-${month}-${day}-${hours}-${minutes}-${seconds}.bak`;
    }
    if (fileType === 'presupuestacionBak') {
      return `presupuestacion_${year}-${month}-${day}-${hours}-${minutes}-${seconds}.bak`;
    }
  }

  return file.pattern;
};
