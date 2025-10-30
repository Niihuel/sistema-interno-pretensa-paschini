import { useQuery } from '@tanstack/react-query';
import {
  Database,
  CheckCircle,
  XCircle,
  AlertTriangle,
  TrendingUp,
  Calendar,
  HardDrive,
  Clock,
  Activity,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import { apiClient } from '../../../api/client';
import { getRechartsTheme, getCartesianGridProps, getAxisProps, getTooltipProps } from '../../dashboard/utils/rechartsTheme';
import StatCard from '../../../shared/components/ui/StatCard';

export default function DailyBackupsDashboardTab() {
  const rechartsTheme = getRechartsTheme();
  
  // Theme-aware colors
  const COLORS = {
    primary: rechartsTheme.colors[0],
    success: rechartsTheme.colors[2],
    warning: rechartsTheme.colors[1],
    danger: rechartsTheme.colors[3],
    info: rechartsTheme.colors[4],
    purple: rechartsTheme.colors[5],
  };
  
  // Fetch daily backups stats
  const { data: backupStats } = useQuery({
    queryKey: ['dashboard-daily-backups-stats'],
    queryFn: async () => {
      try {
        const response = await apiClient.get('/dashboard/daily-backups-stats');
        return response.data.data;
      } catch (error) {
        console.error('Error fetching daily backups stats:', error);
        return {
          total: 0,
          completed: 0,
          pending: 0,
          failed: 0,
          thisMonth: { total: 0, completed: 0, pending: 0 },
          lastMonth: { total: 0, completed: 0, pending: 0 },
          trend: []
        };
      }
    },
    retry: false,
  });

  return (
    <div className="space-y-6">
      {/* KPI Cards - Backup Status */}
      <section>
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <Database className="w-5 h-5 text-blue-400" />
          Estado de Backups Diarios
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <StatCard
            label="Total de Backups"
            value={backupStats?.total || 0}
            icon={Database}
          />
          <StatCard
            label="Exitosos"
            value={backupStats?.successful || 0}
            icon={CheckCircle}
            variant="success"
          />
          <StatCard
            label="Fallidos"
            value={backupStats?.failed || 0}
            icon={XCircle}
            variant="danger"
          />
          <StatCard
            label="Pendientes Hoy"
            value={backupStats?.pendingToday || 0}
            icon={AlertTriangle}
            variant="warning"
          />
          <StatCard
            label="Últimos 7 Días"
            value={backupStats?.last7Days || 0}
            icon={Calendar}
            variant="info"
          />
        </div>
      </section>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Backup Status Distribution */}
        {backupStats && (
          <div className="rounded-xl border border-white/10 bg-white/5 p-6">
            <h4 className="text-white font-medium mb-4 flex items-center gap-2">
              <Activity className="w-4 h-4 text-green-400" />
              Distribución de Estados
            </h4>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={[
                    { name: 'Exitosos', value: backupStats.successful || 0 },
                    { name: 'Fallidos', value: backupStats.failed || 0 },
                    { name: 'Pendientes', value: backupStats.pending || 0 },
                  ]}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  label
                >
                  <Cell fill={COLORS.success} />
                  <Cell fill={COLORS.danger} />
                  <Cell fill={COLORS.warning} />
                </Pie>
                <Tooltip {...getTooltipProps(rechartsTheme)} cursor={{ fill: 'rgba(255,255,255,0.1)' }} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Backups by Type */}
        {backupStats?.byType && backupStats.byType.length > 0 && (
          <div className="rounded-xl border border-white/10 bg-white/5 p-6">
            <h4 className="text-white font-medium mb-4 flex items-center gap-2">
              <Database className="w-4 h-4 text-purple-400" />
              Backups por Tipo
            </h4>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={backupStats.byType}>
                <CartesianGrid {...getCartesianGridProps(rechartsTheme)} />
                <XAxis {...getAxisProps(rechartsTheme)} dataKey="name" />
                <YAxis {...getAxisProps(rechartsTheme)} />
                <Tooltip {...getTooltipProps(rechartsTheme)} cursor={{ fill: 'rgba(255,255,255,0.1)' }} />
                <Legend />
                <Bar dataKey="value" fill={COLORS.primary} radius={[8, 8, 0, 0]} name="Cantidad" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Backup Success Rate Trend */}
      {backupStats?.successTrend && backupStats.successTrend.length > 0 && (
        <section>
          <div className="rounded-xl border border-white/10 bg-white/5 p-6">
            <h4 className="text-white font-medium mb-4 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-blue-400" />
              Tendencia de Backups (Últimos 30 Días)
            </h4>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={backupStats.successTrend}>
                <CartesianGrid {...getCartesianGridProps(rechartsTheme)} />
                <XAxis {...getAxisProps(rechartsTheme)} dataKey="date" />
                <YAxis {...getAxisProps(rechartsTheme)} />
                <Tooltip {...getTooltipProps(rechartsTheme)} cursor={{ fill: 'rgba(255,255,255,0.1)' }} />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="successful"
                  stroke={COLORS.success}
                  strokeWidth={2}
                  dot={{ r: 4 }}
                  name="Exitosos"
                />
                <Line
                  type="monotone"
                  dataKey="failed"
                  stroke={COLORS.danger}
                  strokeWidth={2}
                  dot={{ r: 4 }}
                  name="Fallidos"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </section>
      )}

      {/* Backup Size Trend */}
      {backupStats?.sizeTrend && backupStats.sizeTrend.length > 0 && (
        <section>
          <div className="rounded-xl border border-white/10 bg-white/5 p-6">
            <h4 className="text-white font-medium mb-4 flex items-center gap-2">
              <HardDrive className="w-4 h-4 text-purple-400" />
              Tendencia de Tamaño de Backups
            </h4>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={backupStats.sizeTrend}>
                <CartesianGrid {...getCartesianGridProps(rechartsTheme)} />
                <XAxis {...getAxisProps(rechartsTheme)} dataKey="date" />
                <YAxis {...getAxisProps(rechartsTheme)} />
                <Tooltip {...getTooltipProps(rechartsTheme)} cursor={{ fill: 'rgba(255,255,255,0.1)' }} />
                <Legend />
                <Bar dataKey="size" fill={COLORS.purple} radius={[8, 8, 0, 0]} name="Tamaño (MB)" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>
      )}

      {/* Additional Stats */}
      <section>
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-yellow-400" />
          Información Adicional
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <StatCard
            label="Tamaño Total"
            value={`${(backupStats?.totalSize || 0).toFixed(2)} GB`}
            icon={HardDrive}
            variant="info"
          />
          <StatCard
            label="Tiempo Promedio"
            value={`${backupStats?.averageDuration || 0} min`}
            icon={Clock}
          />
          <StatCard
            label="Último Backup"
            value={backupStats?.lastBackupHours ? `Hace ${backupStats.lastBackupHours}h` : 'N/A'}
            icon={Calendar}
            variant="success"
          />
          <StatCard
            label="Retención"
            value={`${backupStats?.retentionDays || 30} días`}
            icon={AlertTriangle}
            variant="warning"
          />
        </div>
      </section>
    </div>
  );
}
