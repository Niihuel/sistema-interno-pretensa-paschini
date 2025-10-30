import React, { useMemo } from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { CheckCircle2, FileArchive, Database } from 'lucide-react';
import type { DailyBackup, BackupFileType, DailyBackupConfig, BackupStatus } from '../types';
import { BACKUP_FILES } from '../constants';
import { DiskSelector } from './DiskSelector';
import { FileStatusPicker } from './FileStatusPicker';

interface TodayBackupCardProps {
  backup: DailyBackup | null | undefined;
  config?: DailyBackupConfig;
  isLoading: boolean;
  isLoadingConfig: boolean;
  onToggleFile: (fileType: BackupFileType) => void;
  onChangeDisk: (diskNumber: number) => void;
  onUpdateFileStatus?: (fileTypeId: number, statusId: number) => void;
  isTogglingFile: boolean;
  isChangingDisk: boolean;
  isUpdatingFileStatus?: boolean;
}

export const TodayBackupCard: React.FC<TodayBackupCardProps> = ({
  backup,
  config,
  isLoading,
  isLoadingConfig,
  onToggleFile,
  onChangeDisk,
  onUpdateFileStatus,
  isTogglingFile,
  isChangingDisk,
  isUpdatingFileStatus = false,
}) => {
  const today = format(new Date(), "EEEE, d 'de' MMMM 'de' yyyy", { locale: es });
  const todayShort = format(new Date(), 'dd/MM/yy');

  // Sistema dinámico: usar backup.files si está disponible, sino usar campos legacy
  const backupFiles = useMemo(() => {
    if (!backup) return [];

    console.log('Building backupFiles:', {
      hasFiles: !!backup.files,
      filesLength: backup.files?.length,
      files: backup.files,
      hasConfig: !!config,
      fileTypesCount: config?.fileTypes?.length,
      backupId: backup.id,
      backupDate: backup.date,
      configFileTypes: config?.fileTypes?.map(ft => ({ id: ft.id, code: ft.code, name: ft.name }))
    });

    // Si tiene archivos dinámicos, usarlos
    if (backup.files && backup.files.length > 0) {
      const mapped = backup.files.map(file => {
        console.log('Mapping file:', {
          id: file.id,
          fileTypeId: file.fileTypeId,
          name: file.fileType?.name,
          code: file.fileType?.code
        });

        return {
          id: file.id,
          name: file.fileType.name,
          code: file.fileType.code,
          status: file.status,
          fileTypeId: file.fileTypeId,
        };
      });

      console.log('Mapped files:', mapped);
      return mapped;
    }

    // Fallback: usar campos legacy - buscar fileTypeId real
    console.log('Using legacy fallback system');

    // Mapeo correcto de keys legacy a códigos del backend
    const legacyToCodeMap: Record<string, string> = {
      'backupZip': 'BACKUP_ZIP',
      'backupAdjuntosZip': 'BACKUP_ADJUNTOS_ZIP',
      'calipsoBak': 'CALIPSO_BAK',
      'presupuestacionBak': 'PRESUPUESTACION_BAK'
    };

    return BACKUP_FILES.map(file => {
      const code = legacyToCodeMap[file.key] || file.key.toUpperCase();
      // Buscar el fileType real en la configuración
      const fileType = config?.fileTypes?.find(ft => ft.code === code);

      // Debug: verificar si encontramos el fileType
      if (!fileType) {
        console.warn(`FileType not found for code: ${code}`, {
          availableFileTypes: config?.fileTypes?.map(ft => ({ id: ft.id, code: ft.code, name: ft.name })),
          searchingFor: code,
          originalKey: file.key,
          mappedCode: code
        });
      }

      const result = {
        id: 0,
        name: file.name,
        code,
        status: backup[`${file.key}Status` as keyof typeof backup] as BackupStatus,
        fileTypeId: fileType?.id || 0,
      };

      console.log(`Legacy file mapping:`, {
        originalKey: file.key,
        mappedCode: code,
        foundFileType: !!fileType,
        fileTypeId: result.fileTypeId,
        fileName: result.name,
        fileTypeDetails: fileType ? { id: fileType.id, code: fileType.code, name: fileType.name } : null
      });

      return result;
    });
  }, [backup, config]);

  const completedCount = useMemo(
    () => backupFiles.filter((file) => file.status?.isFinal).length,
    [backupFiles],
  );

  const allCompleted = completedCount === backupFiles.length && backupFiles.length > 0;
  const disks = config?.disks ?? [];
  const diskLabel = backup?.disk?.name ?? (backup?.disk?.sequence ? `Disco ${backup.disk.sequence}` : 'Sin disco asignado');
  const availableStatuses = config?.statuses ?? [];

  if (isLoading || isLoadingConfig) {
    return (
      <div className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 p-6 animate-pulse">
        <div className="h-8 bg-white/10 rounded w-1/3 mb-4"></div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-32 bg-white/10 rounded-lg"></div>
          ))}
        </div>
      </div>
    );
  }

  if (!backup) {
    return (
      <div className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 p-6">
        <h2 className="text-xl font-bold text-white capitalize mb-2">{today}</h2>
        <p className="text-white/60 text-sm">Fecha: {todayShort}</p>
        <div className="mt-6 p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg text-white/80 text-sm">
          No hay backup configurado para hoy. Verifica la configuración de discos y tipos de archivos.
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 p-4 sm:p-6 hover:border-white/20 transition-all duration-300">
      <div className="flex flex-col sm:flex-row items-start justify-between gap-4 mb-6">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <h2 className="text-xl sm:text-2xl font-bold text-white capitalize">{today}</h2>
          </div>
          <div className="flex items-center gap-3 text-white/60 text-sm">
            <p>Fecha: {todayShort}</p>
            <span className="text-white/20">•</span>
            <p>Disco asignado: {diskLabel}</p>
          </div>
        </div>

        <div className="flex flex-row sm:flex-col items-center sm:items-end gap-3 sm:gap-2 w-full sm:w-auto">
          <DiskSelector
            currentDisk={backup.disk}
            disks={disks}
            onDiskChange={onChangeDisk}
            isLoading={isChangingDisk}
          />

          {allCompleted && (
            <div className="flex items-center gap-2 bg-green-500/10 text-green-400 px-3 sm:px-4 py-2 rounded-lg border border-green-500/20">
              <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5" />
              <div className="text-left">
                <p className="font-semibold text-xs sm:text-sm">Completado</p>
                {backup.user && (
                  <p className="text-xs text-green-400/70">
                    {backup.user.firstName || backup.user.username}
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="mb-6">
        <div className="flex justify-between text-sm mb-2">
          <span className="text-white/60">Progreso del backup</span>
          <span className="text-white font-semibold">{completedCount} de {backupFiles.length} archivos</span>
        </div>
        <div className="w-full h-2.5 bg-white/5 rounded-full overflow-hidden border border-white/10">
          <div
            className={`h-full transition-all duration-700 ease-out ${allCompleted
              ? 'bg-gradient-to-r from-green-500 to-emerald-500'
              : completedCount > 0
                ? 'bg-gradient-to-r from-blue-500 to-cyan-500'
                : 'bg-white/20'
              }`}
            style={{ width: `${(completedCount / backupFiles.length) * 100}%` }}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {backupFiles.map((file) => {
          const Icon = file.name.includes('.zip') ? FileArchive : Database;
          const isCompleted = !!file.status?.isFinal;
          const isInProgress = !!file.status && !file.status.isFinal && file.status.code?.toUpperCase().includes('PROGRESS');

          return (
            <div
              key={file.code}
              className={`
                relative p-4 sm:p-5 rounded-xl border-2 transition-all duration-300
                ${isCompleted
                  ? 'bg-green-500/10 border-green-500/30 shadow-lg shadow-green-500/10'
                  : isInProgress
                    ? 'bg-yellow-500/10 border-yellow-500/30 shadow-lg shadow-yellow-500/10'
                    : 'bg-white/5 border-white/10'
                }
              `}
            >
              <FileStatusPicker
                status={file.status}
                availableStatuses={availableStatuses}
                onToggle={() => onToggleFile(file.code as BackupFileType)}
                onSelectStatus={(statusId) => {
                  console.log('🔄 Status change requested:', {
                    fileName: file.name,
                    fileCode: file.code,
                    currentStatus: file.status?.label,
                    currentStatusId: file.status?.id,
                    newStatusId: statusId,
                    fileTypeId: file.fileTypeId,
                    hasUpdateFunction: !!onUpdateFileStatus,
                    hasConfig: !!config,
                    configFileTypesCount: config?.fileTypes?.length
                  });

                  // Debug: mostrar todos los fileTypes disponibles
                  console.log('📋 Available fileTypes:', config?.fileTypes?.map(ft => ({ id: ft.id, code: ft.code, name: ft.name })));

                  // Intentar usar el método dinámico primero
                  if (onUpdateFileStatus && file.fileTypeId > 0 && statusId > 0) {
                    console.log('✅ Using dynamic method (updateFileStatus)');
                    onUpdateFileStatus(file.fileTypeId, statusId);
                    return;
                  }

                  // Fallback: crear una llamada directa a la API usando el código del archivo
                  console.log('⚠️ Using direct API call fallback');
                  console.log('🔍 Searching for fileType with code:', file.code);

                  // Buscar el fileType en la configuración usando el código
                  const fileType = config?.fileTypes?.find(ft => ft.code === file.code);
                  console.log('🔍 Search result:', fileType);

                  if (fileType && onUpdateFileStatus) {
                    console.log(`🎯 Found fileType: ${fileType.name} (ID: ${fileType.id})`);
                    console.log('📞 Calling onUpdateFileStatus with:', { fileTypeId: fileType.id, statusId });
                    onUpdateFileStatus(fileType.id, statusId);
                  } else {
                    console.log('❌ Could not find fileType or updateFunction, using toggle');
                    console.log('❌ Reasons:', {
                      noFileType: !fileType,
                      noUpdateFunction: !onUpdateFileStatus,
                      fileCode: file.code,
                      availableCodes: config?.fileTypes?.map(ft => ft.code)
                    });
                    onToggleFile(file.code as BackupFileType);
                  }
                }}
                fileName={file.name}
                isLoading={isTogglingFile || isUpdatingFileStatus}
              />

              <div className="flex flex-col items-center justify-center text-center pt-8">
                <div
                  className={`
                    p-2.5 sm:p-3 rounded-xl mb-2 sm:mb-3 transition-all duration-300
                    ${isCompleted ? 'bg-green-500/20' : isInProgress ? 'bg-yellow-500/20' : 'bg-white/5'}
                  `}
                >
                  <Icon
                    className={`w-7 h-7 sm:w-8 sm:h-8 ${isCompleted ? 'text-green-400' : isInProgress ? 'text-yellow-400' : 'text-white/40'
                      }`}
                  />
                </div>
                <p className={`font-semibold text-xs sm:text-sm mb-1 ${isCompleted ? 'text-green-400' : isInProgress ? 'text-yellow-400' : 'text-white'
                  }`}>
                  {file.name}
                </p>
                <span
                  className={`
                    text-xs px-2 py-0.5 rounded-full
                    ${isCompleted
                      ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                      : isInProgress
                        ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
                        : 'bg-white/5 text-white/50 border border-white/10'}
                  `}
                >
                  {file.status?.label ?? (isCompleted ? 'Completado' : isInProgress ? 'En proceso' : 'Pendiente')}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {backup.notes && (
        <div className="mt-6 p-4 bg-blue-500/5 rounded-lg border border-blue-500/20">
          <p className="text-sm text-blue-400 font-medium mb-2">Notas del backup:</p>
          <p className="text-white/80 text-sm">{backup.notes}</p>
        </div>
      )}
    </div>
  );
};






