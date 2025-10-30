import React, { useMemo } from 'react';
import { format, isValid, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { CheckCircle2, Clock, ChevronLeft, ChevronRight, HardDrive, Circle, FileArchive, Database, FileSpreadsheet, FileText } from 'lucide-react';
import LoadingSpinner from '../../../shared/components/ui/LoadingSpinner';
import type { DailyBackup, BackupStatus } from '../types';
import Button from '../../../shared/components/ui/Button';
import { exportToProfessionalExcel, exportToProfessionalPDF, prepareDataForExport } from '../../../lib/professional-export';

interface BackupsHistoryTableProps {
  data:
    | {
        items: DailyBackup[];
        total: number;
        page: number;
        limit: number;
        pages: number;
      }
    | undefined;
  isLoading: boolean;
  currentPage: number;
  onPageChange: (page: number) => void;
}

const safeParseDate = (dateString: string): Date => {
  try {
    const date = typeof dateString === 'string' ? parseISO(dateString) : new Date(dateString);
    return isValid(date) ? date : new Date();
  } catch {
    return new Date();
  }
};

const StatusBadge: React.FC<{ status?: BackupStatus; compact?: boolean }> = ({ status, compact = false }) => {
  if (!status) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs bg-white/10 text-white/50">
        <Circle className="w-3 h-3" />
        {!compact && 'Pendiente'}
      </span>
    );
  }

  if (status.isFinal) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs bg-green-500/10 text-green-400 border border-green-500/30">
        <CheckCircle2 className="w-3 h-3" />
        {!compact && (status.label || 'Completado')}
      </span>
    );
  }

  if (status.code?.toUpperCase().includes('PROGRESS')) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs bg-yellow-500/10 text-yellow-400 border border-yellow-500/30">
        <Clock className="w-3 h-3" />
        {!compact && (status.label || 'En Proceso')}
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs bg-white/10 text-white/60">
      <Circle className="w-3 h-3" />
      {!compact && (status.label || 'Pendiente')}
    </span>
  );
};

export const BackupsHistoryTable: React.FC<BackupsHistoryTableProps> = ({
  data,
  isLoading,
  currentPage,
  onPageChange,
}) => {
  const items = data?.items ?? [];
  const totalPages = data?.pages ?? 1;

  // Obtener todos los tipos de archivos únicos de todos los backups
  const allFileTypes = useMemo(() => {
    const fileTypesMap = new Map<string, { code: string; name: string; sequence: number }>();
    
    items.forEach(backup => {
      backup.files?.forEach(file => {
        if (!fileTypesMap.has(file.fileType.code)) {
          fileTypesMap.set(file.fileType.code, {
            code: file.fileType.code,
            name: file.fileType.name,
            sequence: file.fileType.sequence,
          });
        }
      });
    });

    // Ordenar por secuencia
    return Array.from(fileTypesMap.values()).sort((a, b) => a.sequence - b.sequence);
  }, [items]);

  const handlePrev = () => {
    if (currentPage > 1) {
      onPageChange(currentPage - 1);
    }
  };

  const handleNext = () => {
    if (currentPage < totalPages) {
      onPageChange(currentPage + 1);
    }
  };

  // Export handlers
  const handleExportExcel = async () => {
    const exportRows = items.map((backup) => {
      const backupDate = safeParseDate(backup.date);
      const totalFiles = backup.files?.length || 0;
      const completedCount = backup.files?.filter(f => f.status?.isFinal).length || 0;
      const userName = backup.user?.firstName || backup.user?.username || '-';
      
      const row: Record<string, any> = {
        fecha: format(backupDate, 'dd/MM/yyyy'),
        disco: backup.disk?.name ?? `Disco ${backup.disk?.sequence ?? '-'}`,
        progreso: `${completedCount}/${totalFiles}`,
        estado: totalFiles > 0 && completedCount === totalFiles ? 'Completo' : completedCount > 0 ? 'En Progreso' : 'Pendiente',
        usuario: userName,
      };

      // Agregar columnas dinámicas para cada tipo de archivo
      allFileTypes.forEach(fileType => {
        const file = backup.files?.find(f => f.fileType.code === fileType.code);
        row[fileType.name] = file?.status?.label || 'Pendiente';
      });

      if (backup.completedAt) {
        row.horaCompletado = format(parseISO(backup.completedAt), 'HH:mm');
      }

      return row;
    });

    const columns: Record<string, string> = {
      fecha: 'Fecha',
      disco: 'Disco',
    };

    // Agregar columnas dinámicas
    allFileTypes.forEach(fileType => {
      columns[fileType.name] = fileType.name;
    });

    columns.progreso = 'Progreso';
    columns.estado = 'Estado';
    columns.usuario = 'Usuario';
    columns.horaCompletado = 'Hora';

    const exportData = prepareDataForExport(
      exportRows,
      columns,
      {
        title: 'Historial de Backups Diarios',
        subtitle: `${items.length} backups registrados`,
        department: 'Sistemas',
        author: 'Sistema',
      }
    );
    await exportToProfessionalExcel(exportData);
  };

  const handleExportPDF = async () => {
    const exportRows = items.map((backup) => {
      const backupDate = safeParseDate(backup.date);
      const totalFiles = backup.files?.length || 0;
      const completedCount = backup.files?.filter(f => f.status?.isFinal).length || 0;
      const userName = backup.user?.firstName || backup.user?.username || '-';
      
      return {
        fecha: format(backupDate, 'dd/MM/yyyy'),
        disco: backup.disk?.name ?? `Disco ${backup.disk?.sequence ?? '-'}`,
        progreso: `${completedCount}/${totalFiles}`,
        estado: totalFiles > 0 && completedCount === totalFiles ? 'Completo' : completedCount > 0 ? 'En Progreso' : 'Pendiente',
        usuario: userName,
      };
    });

    const exportData = prepareDataForExport(
      exportRows,
      {
        fecha: 'Fecha',
        disco: 'Disco',
        progreso: 'Progreso',
        estado: 'Estado',
        usuario: 'Usuario',
      },
      {
        title: 'Historial de Backups Diarios',
        subtitle: `${items.length} backups registrados`,
        department: 'Sistemas',
        author: 'Sistema',
      }
    );
    await exportToProfessionalPDF(exportData);
  };

  return (
    <div className="space-y-4">
      {/* Export Buttons */}
      <div className="flex gap-2">
        <Button variant="glass" size="sm" onClick={handleExportExcel} disabled={isLoading || items.length === 0}>
          <FileSpreadsheet className="w-4 h-4 mr-2" />
          Exportar Excel
        </Button>
        <Button variant="glass" size="sm" onClick={handleExportPDF} disabled={isLoading || items.length === 0}>
          <FileText className="w-4 h-4 mr-2" />
          Exportar PDF
        </Button>
      </div>

      <div className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10">
        {isLoading ? (
          <div className="p-8 flex justify-center"><LoadingSpinner size="md" /></div>
        ) : items.length === 0 ? (
          <div className="p-8 text-center text-white/60">No se encontraron backups en el historial</div>
        ) : (
          <>
          {/* Desktop Table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full">
              <thead className="bg-white/5">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-white/70 uppercase tracking-wider">Fecha</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-white/70 uppercase tracking-wider">Disco</th>
                  {allFileTypes.map(fileType => (
                    <th key={fileType.code} className="px-4 py-3 text-center text-xs font-medium text-white/70 uppercase tracking-wider">
                      {fileType.name}
                    </th>
                  ))}
                  <th className="px-4 py-3 text-center text-xs font-medium text-white/70 uppercase tracking-wider">Estado</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-white/70 uppercase tracking-wider">Usuario</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {items.map((backup) => {
                  const backupDate = safeParseDate(backup.date);
                  const totalFiles = backup.files?.length || 0;
                  const completedCount = backup.files?.filter(f => f.status?.isFinal).length || 0;
                  const allCompleted = totalFiles > 0 && completedCount === totalFiles;
                  const userName = backup.user?.firstName || backup.user?.username || '-';

                  return (
                    <tr key={backup.id} className="hover:bg-white/5 transition-colors">
                      <td className="px-4 py-3">
                        <div className="text-white text-sm font-medium">{format(backupDate, 'dd/MM/yy')}</div>
                        <div className="text-xs text-white/60">{format(backupDate, "EEEE, d 'de' MMMM", { locale: es })}</div>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className="inline-flex items-center gap-1.5 px-2 py-1 bg-blue-500/10 text-blue-400 rounded-lg text-xs font-medium border border-blue-500/20">
                          <HardDrive className="w-3.5 h-3.5" />
                          {backup.disk?.name ?? `Disco ${backup.disk?.sequence ?? '-'}`}
                        </span>
                      </td>
                      {allFileTypes.map(fileType => {
                        const file = backup.files?.find(f => f.fileType.code === fileType.code);
                        return (
                          <td key={fileType.code} className="px-4 py-3 text-center">
                            <StatusBadge status={file?.status} compact />
                          </td>
                        );
                      })}
                      <td className="px-4 py-3 text-center">
                        {allCompleted ? (
                          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs bg-green-500/10 text-green-400 border border-green-500/30">
                            <CheckCircle2 className="w-3 h-3" />
                            Completo
                          </span>
                        ) : completedCount > 0 ? (
                          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs bg-orange-500/10 text-orange-400 border border-orange-500/30">
                            <Clock className="w-3 h-3" />
                            {completedCount}/{totalFiles}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs bg-white/10 text-white/50">
                            <Circle className="w-3 h-3" />
                            Pendiente
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-white/80 text-sm">{userName}</div>
                        {backup.completedAt && (
                          <div className="text-xs text-white/50">
                            {format(parseISO(backup.completedAt), 'HH:mm')}
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards */}
          <div className="md:hidden space-y-4 p-4">
            {items.map((backup) => {
              const backupDate = safeParseDate(backup.date);
              const totalFiles = backup.files?.length || 0;
              const completedCount = backup.files?.filter(f => f.status?.isFinal).length || 0;
              const allCompleted = totalFiles > 0 && completedCount === totalFiles;
              const userName = backup.user?.firstName || backup.user?.username || '-';

              // Ordenar archivos por secuencia
              const sortedFiles = [...(backup.files || [])].sort((a, b) => 
                a.fileType.sequence - b.fileType.sequence
              );

              return (
                <div key={backup.id} className="bg-white/5 backdrop-blur-sm rounded-lg border border-white/10 p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h3 className="text-white font-medium text-sm mb-1">{format(backupDate, 'dd/MM/yy')}</h3>
                      <p className="text-white/60 text-xs">{format(backupDate, "EEEE, d 'de' MMMM", { locale: es })}</p>
                    </div>
                    {allCompleted ? (
                      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs bg-green-500/10 text-green-400 border border-green-500/30">
                        <CheckCircle2 className="w-3 h-3" />
                        Completo
                      </span>
                    ) : completedCount > 0 ? (
                      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs bg-orange-500/10 text-orange-400 border border-orange-500/30">
                        <Clock className="w-3 h-3" />
                        {completedCount}/{totalFiles}
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs bg-white/10 text-white/50">
                        <Circle className="w-3 h-3" />
                        Pendiente
                      </span>
                    )}
                  </div>

                  <div className="flex items-center justify-between mb-3">
                    <span className="inline-flex items-center gap-1.5 px-2 py-1 bg-blue-500/10 text-blue-400 rounded-lg text-xs font-medium border border-blue-500/20">
                      <HardDrive className="w-3.5 h-3.5" />
                      {backup.disk?.name ?? `Disco ${backup.disk?.sequence ?? '-'}`}
                    </span>
                    <div className="text-right">
                      <div className="text-white/80 text-xs font-medium">{userName}</div>
                      {backup.completedAt && (
                        <div className="text-xs text-white/50">
                          {format(parseISO(backup.completedAt), 'HH:mm')}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    {sortedFiles.map((file) => {
                      const Icon = file.fileType.name.toLowerCase().includes('.zip') ? FileArchive : Database;
                      return (
                        <div key={file.id} className="flex items-center justify-between text-sm">
                          <div className="flex items-center gap-2 text-white/70">
                            <Icon className="w-4 h-4" />
                            <span>{file.fileType.name}</span>
                          </div>
                          <StatusBadge status={file.status} />
                        </div>
                      );
                    })}
                  </div>

                  {backup.notes && (
                    <div className="mt-3 p-2 bg-blue-500/5 rounded-lg border border-blue-500/20">
                      <p className="text-xs text-blue-400 font-medium mb-1">Notas:</p>
                      <p className="text-white/70 text-xs">{backup.notes}</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between px-4 py-3 border-t border-white/10 bg-white/5">
            <div className="text-xs text-white/60">
              Mostrando {items.length} de {data?.total ?? 0} registros
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handlePrev}
                disabled={currentPage <= 1}
                className="inline-flex items-center justify-center w-8 h-8 rounded-lg border border-white/10 text-white/70 hover:bg-white/10 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-sm text-white/60">
                Página {currentPage} de {totalPages}
              </span>
              <button
                onClick={handleNext}
                disabled={currentPage >= totalPages}
                className="inline-flex items-center justify-center w-8 h-8 rounded-lg border border-white/10 text-white/70 hover:bg-white/10 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </>
      )}
      </div>
    </div>
  );
};
