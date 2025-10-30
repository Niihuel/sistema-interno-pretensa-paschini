import { useQuery } from '@tanstack/react-query';
import {
  Printer,
  CheckCircle,
  AlertTriangle,
  XCircle,
  TrendingUp,
  Activity,
  Wifi,
  WifiOff,
  MapPin,
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
import StatCard from '../../../shared/components/ui/StatCard';

export default function PrintersDashboardTab() {
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
  
  // Fetch printer stats
  const { data: printerStats } = useQuery({
    queryKey: ['dashboard-printers-stats'],
    queryFn: async () => {
      try {
        const response = await apiClient.get('/dashboard/printers-stats');
        return response.data.data;
      } catch (error) {
        console.error('Error fetching printers stats:', error);
        return {
          total: 0,
          online: 0,
          offline: 0,
          warning: 0,
          byLocation: [],
          byStatus: [],
          trend: []
        };
      }
    },
    retry: false,
  });


  return (
    <div className="space-y-6">
      {/* KPI Cards - Status */}
      <section>
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <Printer className="w-5 h-5 text-blue-400" />
          Estado de Impresoras
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <StatCard icon={Printer} label="Total de Impresoras" value={printerStats?.total || 0} />
          <StatCard icon={CheckCircle} label="Operativas" value={printerStats?.operational || 0} variant="success" />
          <StatCard icon={Wifi} label="En Línea" value={printerStats?.online || 0} variant="info" />
          <StatCard icon={AlertTriangle} label="Con Problemas" value={printerStats?.warning || 0} variant="warning" />
          <StatCard icon={XCircle} label="Fuera de Servicio" value={printerStats?.offline || 0} variant="danger" />
        </div>
      </section>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Printers by Type */}
        {printerStats?.byType && printerStats.byType.length > 0 && (
          <div className="rounded-xl border border-white/10 bg-white/5 p-6">
            <h4 className="text-white font-medium mb-4 flex items-center gap-2">
              <Printer className="w-4 h-4 text-purple-400" />
              Impresoras por Tipo
            </h4>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={printerStats.byType}>
                <CartesianGrid {...getCartesianGridProps(rechartsTheme)} />
                <XAxis {...getAxisProps(rechartsTheme)} dataKey="name" />
                <YAxis {...getAxisProps(rechartsTheme)} />
                <Tooltip
                   {...getTooltipProps(rechartsTheme)}
                />
                <Legend />
                <Bar dataKey="value" fill={COLORS.primary} radius={[8, 8, 0, 0]} name="Cantidad" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Printer Status Distribution */}
        {printerStats && (
          <div className="rounded-xl border border-white/10 bg-white/5 p-6">
            <h4 className="text-white font-medium mb-4 flex items-center gap-2">
              <Activity className="w-4 h-4 text-green-400" />
              Distribución por Estado
            </h4>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={[
                    { name: 'Operativas', value: printerStats.operational || 0 },
                    { name: 'Con Problemas', value: printerStats.warning || 0 },
                    { name: 'Fuera de Servicio', value: printerStats.offline || 0 },
                  ]}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  label
                >
                  <Cell fill={COLORS.success} />
                  <Cell fill={COLORS.warning} />
                  <Cell fill={COLORS.danger} />
                </Pie>
                <Tooltip
                   {...getTooltipProps(rechartsTheme)}
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Printers by Location */}
      {printerStats?.byLocation && printerStats.byLocation.length > 0 && (
        <section>
          <div className="rounded-xl border border-white/10 bg-white/5 p-6">
            <h4 className="text-white font-medium mb-4 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-green-400" />
              Impresoras por Ubicación
            </h4>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={printerStats.byLocation}>
                <CartesianGrid {...getCartesianGridProps(rechartsTheme)} />
                <XAxis {...getAxisProps(rechartsTheme)} dataKey="name" />
                <YAxis {...getAxisProps(rechartsTheme)} />
                <Tooltip
                   {...getTooltipProps(rechartsTheme)}
                />
                <Legend />
                <Bar dataKey="value" fill={COLORS.info} radius={[8, 8, 0, 0]} name="Impresoras" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>
      )}

      {/* Usage Trend */}
      {printerStats?.usageTrend && printerStats.usageTrend.length > 0 && (
        <section>
          <div className="rounded-xl border border-white/10 bg-white/5 p-6">
            <h4 className="text-white font-medium mb-4 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-blue-400" />
              Tendencia de Uso (Últimos 6 Meses)
            </h4>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={printerStats.usageTrend}>
                <CartesianGrid {...getCartesianGridProps(rechartsTheme)} />
                <XAxis {...getAxisProps(rechartsTheme)} dataKey="month" />
                <YAxis {...getAxisProps(rechartsTheme)} />
                <Tooltip
                   {...getTooltipProps(rechartsTheme)}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="prints"
                  stroke={COLORS.primary}
                  strokeWidth={2}
                  dot={{ r: 4 }}
                  name="Impresiones"
                />
                <Line
                  type="monotone"
                  dataKey="issues"
                  stroke={COLORS.danger}
                  strokeWidth={2}
                  dot={{ r: 4 }}
                  name="Problemas"
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
          <StatCard icon={Wifi} label="Impresoras de Red" value={printerStats?.network || 0} variant="success" />
          <StatCard icon={WifiOff} label="Impresoras USB" value={printerStats?.usb || 0} variant="info" />
          <StatCard icon={AlertTriangle} label="Tóner Bajo" value={printerStats?.lowToner || 0} variant="warning" />
          <StatCard icon={Activity} label="Mantenimientos Pendientes" value={printerStats?.maintenanceDue || 0} variant="danger" />
        </div>
      </section>
    </div>
  );
}
