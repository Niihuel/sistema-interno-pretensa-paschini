import React from 'react';
import { TrendingUp, Calendar, Clock, Info, CheckCircle2, AlertCircle } from 'lucide-react';
import { BarChart, Bar, PieChart, Pie, Cell, ResponsiveContainer, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import type { DailyBackupStats } from '../types';
import { getRechartsTheme, getCartesianGridProps, getAxisProps, getTooltipProps } from '../../dashboard/utils/rechartsTheme';

interface BackupsStatsProps {
  stats: DailyBackupStats | undefined;
  isLoading: boolean;
}

export const BackupsStats: React.FC<BackupsStatsProps> = ({ stats, isLoading }) => {
  const rechartsTheme = getRechartsTheme();
  
  if (isLoading) {
    return (
      <div className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 p-6 animate-pulse">
        <div className="h-6 bg-white/10 rounded w-1/2 mb-4"></div>
        <div className="space-y-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-24 bg-white/10 rounded-lg"></div>
          ))}
        </div>
      </div>
    );
  }

  if (!stats) return null;

  const completionRate =
    stats?.total && stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0;
  const thisMonthRate =
    stats?.thisMonth?.total && stats.thisMonth.total > 0
      ? Math.round((stats.thisMonth.completed / stats.thisMonth.total) * 100)
      : 0;
  const lastMonthRate =
    stats?.lastMonth?.total && stats.lastMonth.total > 0
      ? Math.round((stats.lastMonth.completed / stats.lastMonth.total) * 100)
      : 0;

  // Preparar datos para gráficos
  const comparisonData = [
    {
      name: 'Mes Anterior',
      Completados: stats.lastMonth?.completed || 0,
      Pendientes: stats.lastMonth?.pending || 0,
      Total: stats.lastMonth?.total || 0
    },
    {
      name: 'Este Mes',
      Completados: stats.thisMonth?.completed || 0,
      Pendientes: stats.thisMonth?.pending || 0,
      Total: stats.thisMonth?.total || 0
    },
    {
      name: 'Total General',
      Completados: stats.completed,
      Pendientes: stats.pending,
      Total: stats.total
    }
  ];

  const statusPieData = [
    { name: 'Completados', value: stats.completed, fill: rechartsTheme.colors[2] }, // green
    { name: 'Pendientes', value: stats.pending, fill: rechartsTheme.colors[1] } // yellow
  ].filter(item => item.value > 0);

  const monthlyCompletionData = [
    { name: 'Mes Anterior', rate: lastMonthRate, fill: rechartsTheme.colors[7] }, // gray
    { name: 'Este Mes', rate: thisMonthRate, fill: rechartsTheme.colors[2] }, // green
    { name: 'Total General', rate: completionRate, fill: rechartsTheme.colors[4] } // blue
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <TrendingUp className="w-5 h-5 text-blue-400" />
        <h3 className="text-xl font-bold text-white">Estadísticas de Backups Diarios</h3>
      </div>

      {/* Tarjetas Resumen */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="text-white/60 text-sm">Total</div>
            <Calendar className="w-5 h-5 text-white/40" />
          </div>
          <div className="text-3xl font-bold text-white">{stats.total}</div>
          <div className="text-xs text-white/50 mt-1">Todos los backups</div>
        </div>

        <div className="bg-green-500/5 backdrop-blur-sm rounded-2xl border border-green-500/20 p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="text-green-400/80 text-sm">Completados</div>
            <CheckCircle2 className="w-5 h-5 text-green-400/60" />
          </div>
          <div className="text-3xl font-bold text-green-400">{stats.completed}</div>
          <div className="text-xs text-green-400/60 mt-1">{completionRate}% del total</div>
        </div>

        <div className="bg-yellow-500/5 backdrop-blur-sm rounded-2xl border border-yellow-500/20 p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="text-yellow-400/80 text-sm">Pendientes</div>
            <AlertCircle className="w-5 h-5 text-yellow-400/60" />
          </div>
          <div className="text-3xl font-bold text-yellow-400">{stats.pending}</div>
          <div className="text-xs text-yellow-400/60 mt-1">{100 - completionRate}% del total</div>
        </div>

        <div className="bg-blue-500/5 backdrop-blur-sm rounded-2xl border border-blue-500/20 p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="text-blue-400/80 text-sm">Este Mes</div>
            <Calendar className="w-5 h-5 text-blue-400/60" />
          </div>
          <div className="text-3xl font-bold text-blue-400">{stats.thisMonth?.total || 0}</div>
          <div className="text-xs text-blue-400/60 mt-1">
            {stats.thisMonth?.completed || 0} completados
          </div>
        </div>
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Comparación Mensual */}
        <div className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-6">
          <h3 className="text-white font-semibold text-lg mb-4">Comparación Mensual</h3>
          {stats.total === 0 ? (
            <div className="flex items-center justify-center h-[300px]">
              <div className="text-center text-white/60">
                No hay datos de backups disponibles
              </div>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={comparisonData}>
                <CartesianGrid {...getCartesianGridProps(rechartsTheme)} />
                <XAxis {...getAxisProps(rechartsTheme)} dataKey="name"
                  angle={-15}
                  textAnchor="end"
                  height={60}
                />
                <YAxis {...getAxisProps(rechartsTheme)} />
                <Tooltip {...getTooltipProps(rechartsTheme)} cursor={{ fill: 'rgba(255,255,255,0.1)' }} />
                <Legend />
                <Bar dataKey="Completados" fill={rechartsTheme.colors[2]} radius={[8, 8, 0, 0]} />
                <Bar dataKey="Pendientes" fill={rechartsTheme.colors[1]} radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Estado General */}
        <div className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-6">
          <h3 className="text-white font-semibold text-lg mb-4">Estado General</h3>
          {statusPieData.length === 0 ? (
            <div className="flex items-center justify-center h-[300px]">
              <div className="text-center text-white/60">
                No hay datos de estado disponibles
              </div>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={statusPieData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }: any) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={90}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {statusPieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip {...getTooltipProps(rechartsTheme)} cursor={{ fill: 'rgba(255,255,255,0.1)' }} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Tasa de Completado */}
        <div className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-6">
          <h3 className="text-white font-semibold text-lg mb-4">Tasa de Completado</h3>
          {stats.total === 0 ? (
            <div className="flex items-center justify-center h-[250px]">
              <div className="text-center text-white/60">
                No hay datos de tasa disponibles
              </div>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={monthlyCompletionData}>
                <CartesianGrid {...getCartesianGridProps(rechartsTheme)} />
                <XAxis {...getAxisProps(rechartsTheme)} dataKey="name"
                  angle={-15}
                  textAnchor="end"
                  height={60}
                />
                <YAxis {...getAxisProps(rechartsTheme)}
                  domain={[0, 100]}
                  tickFormatter={(value) => `${value}%`}
                />
                <Tooltip
                   {...getTooltipProps(rechartsTheme)}
                  cursor={{ fill: 'rgba(255,255,255,0.1)' }}
                  formatter={(value) => `${value}%`}
                />
                <Bar dataKey="rate" radius={[8, 8, 0, 0]}>
                  {monthlyCompletionData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Información de Recordatorios */}
        <div className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-6">
          <div className="flex items-center gap-2 mb-4">
            <Info className="w-5 h-5 text-purple-400" />
            <h3 className="text-white font-semibold text-lg">Recordatorios Configurados</h3>
          </div>
          <div className="space-y-3">
            <div className="flex items-center gap-3 p-3 bg-purple-500/10 border border-purple-500/20 rounded-lg">
              <Clock className="w-5 h-5 text-purple-400 flex-shrink-0" />
              <div>
                <div className="text-purple-400 font-medium text-sm">9:00 AM</div>
                <div className="text-white/60 text-xs">Recordatorio inicial del día</div>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
              <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
              <div>
                <div className="text-red-400 font-medium text-sm">2:00 PM</div>
                <div className="text-white/60 text-xs">Recordatorio urgente</div>
              </div>
            </div>
            <div className="mt-4 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
              <div className="text-blue-400 text-xs font-medium mb-1">Nota</div>
              <div className="text-white/70 text-xs">
                Los recordatorios se envían automáticamente los días laborables para asegurar que se realicen los backups diarios.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
