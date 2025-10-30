import { useState } from 'react';
import { useDailyBackups, useBackupsHistory } from '../hooks/useDailyBackups';
import { TodayBackupCard } from './TodayBackupCard';
import { BackupsStats } from './BackupsStats';
import { BackupsHistoryTable } from './BackupsHistoryTable';
import PageHeader from '../../../shared/components/ui/PageHeader';
import Tabs, { type Tab } from '../../../shared/components/ui/Tabs';
import { Calendar, History, BarChart3, Database } from 'lucide-react';

type BackupTabId = 'daily' | 'history' | 'stats';

const BACKUP_TABS: Tab[] = [
  { id: 'daily', label: 'Backup Diario', icon: Calendar },
  { id: 'history', label: 'Historial', icon: History },
  { id: 'stats', label: 'Estadísticas', icon: BarChart3 },
];

export default function DailyBackupsPage() {
  const [activeTab, setActiveTab] = useState<BackupTabId>('daily');
  const {
    todayBackup,
    stats,
    config,
    isLoadingToday,
    isLoadingStats,
    isLoadingConfig,
    toggleFile,
    changeDisk,
    updateFileStatus,
    isTogglingFile,
    isChangingDisk,
    isUpdatingFileStatus
  } = useDailyBackups();
  const [currentPage, setCurrentPage] = useState(1);
  const { data: historyData, isLoading: isLoadingHistory, refetch: refetchHistory } = useBackupsHistory(currentPage, 5);

  return (
    <div className="min-h-screen p-4 sm:p-6">
      <div className="max-w-[1600px] mx-auto">
        <PageHeader
          title="Backups Diarios"
          description="Registro de backups manuales en discos físicos"
          icon={Database}
        />

        {/* Tabs */}
        <Tabs
          tabs={BACKUP_TABS}
          activeTab={activeTab}
          onChange={(id) => {
            setActiveTab(id as BackupTabId);
            // Refrescar historial cuando se cambia al tab de historial
            if (id === 'history') {
              refetchHistory();
            }
          }}
          className="mb-6"
        />

        {/* Tab Content */}
        <div className="mt-6">
          {activeTab === 'daily' && (
            <TodayBackupCard
              backup={todayBackup}
              config={config}
              isLoading={isLoadingToday}
              isLoadingConfig={isLoadingConfig}
              onToggleFile={toggleFile}
              onChangeDisk={changeDisk}
              onUpdateFileStatus={updateFileStatus}
              isTogglingFile={isTogglingFile}
              isChangingDisk={isChangingDisk}
              isUpdatingFileStatus={isUpdatingFileStatus}
            />
          )}

          {activeTab === 'history' && (
            <BackupsHistoryTable
              data={historyData}
              isLoading={isLoadingHistory}
              currentPage={currentPage}
              onPageChange={setCurrentPage}
            />
          )}

          {activeTab === 'stats' && (
            <BackupsStats stats={stats} isLoading={isLoadingStats} />
          )}
        </div>
      </div>
    </div>
  );
}







