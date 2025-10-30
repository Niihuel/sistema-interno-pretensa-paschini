import { useQuery } from '@tanstack/react-query';
import {
  Users,
  UserCheck,
  UserX,
  TrendingUp,
  Calendar,
  MapPin,
  Briefcase,
  AlertCircle,
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

export default function EmployeesDashboardTab() {
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
  
  // Fetch employee stats
  const { data: employeesStats } = useQuery({
    queryKey: ['dashboard-employees-stats'],
    queryFn: async () => {
      try {
        const response = await apiClient.get('/dashboard/employees-stats');
        return response.data.data;
      } catch (error) {
        console.error('Error fetching employees stats:', error);
        return {
          total: 0,
          active: 0,
          inactive: 0,
          byDepartment: [],
          byLocation: [],
          byPosition: [],
          trend: []
        };
      }
    },
    retry: false,
  });

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <section>
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <Users className="w-5 h-5 text-blue-400" />
          Resumen de Empleados
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            label="Total de Empleados"
            value={employeesStats?.total || 0}
            icon={Users}
          />
          <StatCard
            label="Empleados Activos"
            value={employeesStats?.active || 0}
            icon={UserCheck}
            variant="success"
          />
          <StatCard
            label="Empleados Inactivos"
            value={employeesStats?.inactive || 0}
            icon={UserX}
            variant="danger"
          />
          <StatCard
            label="Nuevos (Este Mes)"
            value={employeesStats?.newThisMonth || 0}
            icon={Calendar}
            variant="info"
          />
        </div>
      </section>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Employees by Department */}
        {employeesStats?.byDepartment && employeesStats.byDepartment.length > 0 && (
          <div className="rounded-xl border border-white/10 bg-white/5 p-6">
            <h4 className="text-white font-medium mb-4 flex items-center gap-2">
              <Briefcase className="w-4 h-4 text-purple-400" />
              Empleados por Departamento
            </h4>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={employeesStats.byDepartment}>
                <CartesianGrid {...getCartesianGridProps(rechartsTheme)} />
                <XAxis {...getAxisProps(rechartsTheme)} dataKey="name" />
                <YAxis {...getAxisProps(rechartsTheme)} />
                <Tooltip {...getTooltipProps(rechartsTheme)} cursor={{ fill: 'rgba(255,255,255,0.1)' }} />
                <Legend />
                <Bar dataKey="value" fill={COLORS.primary} radius={[8, 8, 0, 0]} name="Empleados" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Employees by Area/Zone */}
        {employeesStats?.byArea && employeesStats.byArea.length > 0 && (
          <div className="rounded-xl border border-white/10 bg-white/5 p-6">
            <h4 className="text-white font-medium mb-4 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-green-400" />
              Distribución por Área
            </h4>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={employeesStats.byArea}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  label
                >
                  {employeesStats.byArea.map((_entry: any, index: number) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={[COLORS.primary, COLORS.success, COLORS.warning, COLORS.danger, COLORS.info, COLORS.purple][index % 6]}
                    />
                  ))}
                </Pie>
                <Tooltip {...getTooltipProps(rechartsTheme)} cursor={{ fill: 'rgba(255,255,255,0.1)' }} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Active vs Inactive Trend */}
      {employeesStats?.trend && employeesStats.trend.length > 0 && (
        <section>
          <div className="rounded-xl border border-white/10 bg-white/5 p-6">
            <h4 className="text-white font-medium mb-4 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-blue-400" />
              Tendencia de Empleados (Últimos 6 Meses)
            </h4>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={employeesStats.trend}>
                <CartesianGrid {...getCartesianGridProps(rechartsTheme)} />
                <XAxis {...getAxisProps(rechartsTheme)} dataKey="month" />
                <YAxis {...getAxisProps(rechartsTheme)} />
                <Tooltip {...getTooltipProps(rechartsTheme)} cursor={{ fill: 'rgba(255,255,255,0.1)' }} />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="active"
                  stroke={COLORS.success}
                  strokeWidth={2}
                  dot={{ r: 4 }}
                  name="Activos"
                />
                <Line
                  type="monotone"
                  dataKey="inactive"
                  stroke={COLORS.danger}
                  strokeWidth={2}
                  dot={{ r: 4 }}
                  name="Inactivos"
                />
                <Line
                  type="monotone"
                  dataKey="total"
                  stroke={COLORS.primary}
                  strokeWidth={2}
                  dot={{ r: 4 }}
                  name="Total"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </section>
      )}

      {/* Additional Stats */}
      <section>
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-yellow-400" />
          Información Adicional
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <StatCard
            label="Con Equipos Asignados"
            value={employeesStats?.withEquipment || 0}
            icon={Users}
            variant="success"
          />
          <StatCard
            label="Sin Equipos"
            value={employeesStats?.withoutEquipment || 0}
            icon={Users}
            variant="warning"
          />
          <StatCard
            label="Departamentos"
            value={employeesStats?.totalDepartments || 0}
            icon={Briefcase}
            variant="info"
          />
        </div>
      </section>
    </div>
  );
}
