import { useQuery } from '@tanstack/react-query';
import {
  Monitor,
  CheckCircle,
  Clock,
  AlertTriangle,
  XCircle,
  TrendingUp,
  Package,
  Activity,
  Cpu,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  LineChart,
  Line,
} from 'recharts';
import { apiClient } from '../../../api/client';
import { getRechartsTheme, getCartesianGridProps, getAxisProps, getTooltipProps } from '../../dashboard/utils/rechartsTheme';

export default function EquipmentDashboardTab() {
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
  
  // Fetch equipment stats
  const { data: equipmentStats } = useQuery({
    queryKey: ['dashboard-equipment-stats'],
    queryFn: async () => {
      try {
        const response = await apiClient.get('/dashboard/equipment-stats');
        return response.data.data;
      } catch (error) {
        console.error('Error fetching equipment stats:', error);
        return {
          total: 0,
          available: 0,
          inUse: 0,
          maintenance: 0,
          retired: 0,
          byType: [],
          byStatus: [],
          trend: []
        };
      }
    },
    retry: false,
  });

  // KPI Card Component
  const KPICard = ({ icon: Icon, title, value, subtitle, trend, color }: any) => (
    <div className="rounded-xl border border-white/10 bg-white/5 p-6 hover:bg-white/10 transition-all">
      <div className="flex items-start justify-between mb-4">
        <div
          className="w-12 h-12 rounded-lg flex items-center justify-center"
          style={{ backgroundColor: `${color}20` }}
        >
          <Icon className="w-6 h-6" style={{ color }} />
        </div>
        {trend && (
          <div className={`flex items-center gap-1 text-sm ${trend > 0 ? 'text-green-400' : 'text-red-400'}`}>
            <TrendingUp className="w-4 h-4" />
            <span>{Math.abs(trend)}%</span>
          </div>
        )}
      </div>
      <div className="text-3xl font-bold text-white mb-1">{value}</div>
      <div className="text-sm text-white/60">{title}</div>
      {subtitle && <div className="text-xs text-white/40 mt-1">{subtitle}</div>}
    </div>
  );

  return (
    <div className="space-y-6">
      {/* KPI Cards - Status */}
      <section>
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <Monitor className="w-5 h-5 text-blue-400" />
          Estado de Equipos
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <KPICard
            icon={Monitor}
            title="Total de Equipos"
            value={equipmentStats?.total || 0}
            subtitle="En el sistema"
            color={COLORS.primary}
          />
          <KPICard
            icon={CheckCircle}
            title="Asignados"
            value={equipmentStats?.assigned || 0}
            subtitle={`${Math.round(((equipmentStats?.assigned || 0) / (equipmentStats?.total || 1)) * 100)}% del total`}
            color={COLORS.success}
          />
          <KPICard
            icon={Package}
            title="Disponibles"
            value={equipmentStats?.available || 0}
            subtitle="Listos para asignar"
            color={COLORS.info}
          />
          <KPICard
            icon={Clock}
            title="En Mantenimiento"
            value={equipmentStats?.inMaintenance || 0}
            subtitle="En reparación"
            color={COLORS.warning}
          />
          <KPICard
            icon={XCircle}
            title="Dados de Baja"
            value={equipmentStats?.retired || 0}
            subtitle="Fuera de servicio"
            color={COLORS.danger}
          />
        </div>
      </section>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Equipment by Type */}
        {equipmentStats?.byType && equipmentStats.byType.length > 0 && (
          <div className="rounded-xl border border-white/10 bg-white/5 p-6">
            <h4 className="text-white font-medium mb-4 flex items-center gap-2">
              <Cpu className="w-4 h-4 text-purple-400" />
              Equipos por Tipo
            </h4>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={equipmentStats.byType}>
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

        {/* Equipment Status Distribution */}
        {equipmentStats && (
          <div className="rounded-xl border border-white/10 bg-white/5 p-6">
            <h4 className="text-white font-medium mb-4 flex items-center gap-2">
              <Activity className="w-4 h-4 text-green-400" />
              Distribución por Estado
            </h4>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={[
                    { name: 'Asignado', value: equipmentStats.assigned || 0 },
                    { name: 'Disponible', value: equipmentStats.available || 0 },
                    { name: 'Mantenimiento', value: equipmentStats.inMaintenance || 0 },
                    { name: 'Baja', value: equipmentStats.retired || 0 },
                  ]}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  label
                >
                  <Cell fill={COLORS.success} />
                  <Cell fill={COLORS.info} />
                  <Cell fill={COLORS.warning} />
                  <Cell fill={COLORS.danger} />
                </Pie>
                <Tooltip {...getTooltipProps(rechartsTheme)} cursor={{ fill: 'rgba(255,255,255,0.1)' }} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Equipment by Brand */}
      {equipmentStats?.byBrand && equipmentStats.byBrand.length > 0 && (
        <section>
          <div className="rounded-xl border border-white/10 bg-white/5 p-6">
            <h4 className="text-white font-medium mb-4 flex items-center gap-2">
              <Package className="w-4 h-4 text-blue-400" />
              Equipos por Marca
            </h4>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={equipmentStats.byBrand}>
                <CartesianGrid {...getCartesianGridProps(rechartsTheme)} />
                <XAxis {...getAxisProps(rechartsTheme)} dataKey="name" />
                <YAxis {...getAxisProps(rechartsTheme)} />
                <Tooltip {...getTooltipProps(rechartsTheme)} cursor={{ fill: 'rgba(255,255,255,0.1)' }} />
                <Legend />
                <Bar dataKey="value" fill={COLORS.info} radius={[8, 8, 0, 0]} name="Equipos" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>
      )}

      {/* Monthly Maintenance Trend */}
      {equipmentStats?.maintenanceTrend && equipmentStats.maintenanceTrend.length > 0 && (
        <section>
          <div className="rounded-xl border border-white/10 bg-white/5 p-6">
            <h4 className="text-white font-medium mb-4 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-yellow-400" />
              Tendencia de Mantenimientos (Últimos 6 Meses)
            </h4>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={equipmentStats.maintenanceTrend}>
                <CartesianGrid {...getCartesianGridProps(rechartsTheme)} />
                <XAxis {...getAxisProps(rechartsTheme)} dataKey="month" />
                <YAxis {...getAxisProps(rechartsTheme)} />
                <Tooltip {...getTooltipProps(rechartsTheme)} cursor={{ fill: 'rgba(255,255,255,0.1)' }} />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="count"
                  stroke={COLORS.warning}
                  strokeWidth={2}
                  dot={{ r: 4 }}
                  name="Mantenimientos"
                />
              </LineChart>
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
          <KPICard
            icon={Monitor}
            title="Nuevos (Este Mes)"
            value={equipmentStats?.newThisMonth || 0}
            subtitle="Equipos agregados"
            color={COLORS.success}
          />
          <KPICard
            icon={Clock}
            title="Próximos Mantenimientos"
            value={equipmentStats?.upcomingMaintenance || 0}
            subtitle="En los próximos 30 días"
            color={COLORS.warning}
          />
          <KPICard
            icon={Activity}
            title="Antigüedad Promedio"
            value={`${equipmentStats?.averageAge || 0} años`}
            subtitle="Del parque tecnológico"
            color={COLORS.info}
          />
          <KPICard
            icon={Cpu}
            title="Tipos de Equipos"
            value={equipmentStats?.totalTypes || 0}
            subtitle="Categorías diferentes"
            color={COLORS.purple}
          />
        </div>
      </section>
    </div>
  );
}
