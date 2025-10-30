import { useQuery } from '@tanstack/react-query'
import { Ticket, AlertCircle, CheckCircle2, Clock, FileQuestion, TrendingUp, PieChart as PieChartIcon, BarChart3 } from 'lucide-react'
import { BarChart, Bar, PieChart, Pie, Cell, LineChart, Line, ResponsiveContainer, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts'
import { apiClient } from '../../../api/client'
import { getRechartsTheme, getCartesianGridProps, getAxisProps, getTooltipProps } from '../../dashboard/utils/rechartsTheme'
import StatCard from '../../../shared/components/ui/StatCard'
import EmptyState from '../../../shared/components/ui/EmptyState'

interface TicketsStats {
  total: number
  open: number
  inProgress: number
  resolved: number
  closed: number
  byPriority: Array<{ name: string; value: number }>
  trend: Array<{ date: string; open: number; closed: number }>
}

export default function TicketsDashboardTab() {
  const rechartsTheme = getRechartsTheme();
  
  const { data, isLoading } = useQuery({
    queryKey: ['dashboard-tickets'],
    queryFn: async () => {
      const response = await apiClient.get('/dashboard/tickets-stats')
      return response.data.data as TicketsStats
    }
  })
  
  // Priority colors using theme chart colors
  const PRIORITY_COLORS: Record<string, string> = {
    HIGH: rechartsTheme.colors[0], // chart-1 (typically red/danger)
    MEDIUM: rechartsTheme.colors[1], // chart-2 (typically yellow/warning)
    LOW: rechartsTheme.colors[2] // chart-3 (typically green/success)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-white/60">Cargando estadísticas...</div>
      </div>
    )
  }

  if (!data) {
    return <EmptyState icon={FileQuestion} title="No hay datos disponibles" />
  }

  const statusData = [
    { name: 'Abiertos', value: data.open, fill: rechartsTheme.colors[3] },
    { name: 'En Progreso', value: data.inProgress, fill: rechartsTheme.colors[4] },
    { name: 'Resueltos', value: data.resolved, fill: rechartsTheme.colors[5] },
    { name: 'Cerrados', value: data.closed, fill: rechartsTheme.colors[6] }
  ].filter(item => item.value > 0)

  const priorityDataWithColors = (data.byPriority || []).map(item => ({
    ...item,
    fill: PRIORITY_COLORS[item.name] || 'rgb(156, 163, 175)'
  }))

  return (
    <div className="space-y-6">
      {/* Gráficos Principales */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Tendencia de 7 días */}
        <div className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-6">
          <h3 className="text-white font-semibold text-lg mb-4">Tendencia Últimos 7 Días</h3>
          {!data.trend || data.trend.length === 0 ? (
            <EmptyState
              icon={TrendingUp}
              title="No hay datos de tendencia"
              description="Los datos de tendencia aparecerán aquí una vez que haya actividad"
              className="h-[300px]"
            />
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={data.trend}>
                <CartesianGrid {...getCartesianGridProps(rechartsTheme)} />
                <XAxis {...getAxisProps(rechartsTheme)} dataKey="date" />
                <YAxis {...getAxisProps(rechartsTheme)} />
                <Tooltip {...getTooltipProps(rechartsTheme)} cursor={{ fill: 'rgba(255,255,255,0.1)' }} />
                <Legend />
                <Line type="monotone" dataKey="open" stroke={rechartsTheme.colors[3]} strokeWidth={2} name="Abiertos" />
                <Line type="monotone" dataKey="closed" stroke={rechartsTheme.colors[5]} strokeWidth={2} name="Cerrados" />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Estado Actual */}
        <div className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-6">
          <h3 className="text-white font-semibold text-lg mb-4">Estado Actual de Tickets</h3>
          {statusData.length === 0 ? (
            <EmptyState
              icon={PieChartIcon}
              title="No hay tickets registrados"
              description="Los datos aparecerán cuando se creen tickets"
              className="h-[300px]"
            />
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }: any) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={90}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip {...getTooltipProps(rechartsTheme)} cursor={{ fill: 'rgba(255,255,255,0.1)' }} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Por Prioridad */}
      <div className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-6">
        <h3 className="text-white font-semibold text-lg mb-4">Distribución por Prioridad</h3>
        {priorityDataWithColors.length === 0 ? (
          <EmptyState
            icon={BarChart3}
            title="Sin datos de prioridad"
            description="Los datos de prioridad aparecerán cuando se asignen a los tickets"
            className="h-[250px]"
          />
        ) : (
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={priorityDataWithColors}>
              <CartesianGrid {...getCartesianGridProps(rechartsTheme)} />
              <XAxis {...getAxisProps(rechartsTheme)} dataKey="name" />
              <YAxis {...getAxisProps(rechartsTheme)} />
              <Tooltip {...getTooltipProps(rechartsTheme)} />
              <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                {priorityDataWithColors.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Tarjetas de Resumen */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard label="Total" value={data.total} icon={Ticket} />
        <StatCard label="Abiertos" value={data.open} icon={AlertCircle} variant="info" />
        <StatCard label="En Progreso" value={data.inProgress} icon={Clock} variant="warning" />
        <StatCard label="Resueltos" value={data.resolved} icon={CheckCircle2} variant="success" />
        <StatCard label="Cerrados" value={data.closed} icon={CheckCircle2} />
      </div>
    </div>
  )
}
