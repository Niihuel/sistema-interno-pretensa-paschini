import { useQuery } from '@tanstack/react-query'
import { ShoppingCart, Clock, CheckCircle2, XCircle, Package, FileQuestion, TrendingUp, PieChart as PieChartIcon, BarChart3, Layers } from 'lucide-react'
import StatCard from '../../../shared/components/ui/StatCard'
import EmptyState from '../../../shared/components/ui/EmptyState'
import { BarChart, Bar, PieChart, Pie, Cell, LineChart, Line, ResponsiveContainer, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts'
import { apiClient } from '../../../api/client'
import { getRechartsTheme, getCartesianGridProps, getAxisProps, getTooltipProps } from '../../dashboard/utils/rechartsTheme'

interface PurchaseRequestsStats {
  total: number
  pending: number
  approved: number
  rejected: number
  received: number
  byCategory: Array<{ name: string; value: number }>
  byPriority: Array<{ name: string; value: number }>
  trend: Array<{ date: string; created: number; approved: number }>
}

export default function PurchaseRequestsDashboardTab() {
  const rechartsTheme = getRechartsTheme();
  
  // Priority colors using theme chart colors
  const PRIORITY_COLORS: Record<string, string> = {
    HIGH: rechartsTheme.colors[0], // chart-1 (typically red/danger)
    MEDIUM: rechartsTheme.colors[1], // chart-2 (typically yellow/warning)
    LOW: rechartsTheme.colors[2] // chart-3 (typically green/success)
  }

  const CATEGORY_COLORS = [
    rechartsTheme.colors[4],
    rechartsTheme.colors[5],
    rechartsTheme.colors[6],
    rechartsTheme.colors[2],
    rechartsTheme.colors[1],
    rechartsTheme.colors[0]
  ]
  
  const { data, isLoading } = useQuery({
    queryKey: ['dashboard-purchase-requests'],
    queryFn: async () => {
      try {
        const response = await apiClient.get('/dashboard/purchase-requests-stats')
        return response.data.data as PurchaseRequestsStats
      } catch (error) {
        console.error('Error fetching purchase requests stats:', error)
        // Retornar datos vacíos en lugar de undefined
        return {
          total: 0,
          pending: 0,
          approved: 0,
          rejected: 0,
          received: 0,
          byCategory: [],
          byPriority: [],
          trend: []
        } as PurchaseRequestsStats
      }
    }
  })

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
    { name: 'Pendiente', value: data.pending, fill: rechartsTheme.colors[1] }, // yellow/warning
    { name: 'Aprobado', value: data.approved, fill: rechartsTheme.colors[2] }, // green/success
    { name: 'Rechazado', value: data.rejected, fill: rechartsTheme.colors[0] }, // red/danger
    { name: 'Recibido', value: data.received, fill: rechartsTheme.colors[4] } // blue/info
  ].filter(item => item.value > 0)

  const priorityDataWithColors = (data.byPriority || []).map(item => ({
    ...item,
    fill: PRIORITY_COLORS[item.name] || 'rgb(156, 163, 175)'
  }))

  const categoryDataWithColors = (data.byCategory || []).map((item, index) => ({
    ...item,
    fill: CATEGORY_COLORS[index % CATEGORY_COLORS.length]
  }))

  return (
    <div className="space-y-6">
      {/* Gráficos Principales */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Tendencia de 30 días */}
        <div className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-6">
          <h3 className="text-white font-semibold text-lg mb-4">Tendencia Últimos 30 Días</h3>
          {!data.trend || data.trend.length === 0 ? (
            <EmptyState
              icon={TrendingUp}
              title="No hay datos de tendencia"
              description="Los datos de tendencia aparecerán aquí una vez que haya solicitudes"
              className="h-[300px]"
            />
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={data.trend}>
                <CartesianGrid {...getCartesianGridProps(rechartsTheme)} />
                <XAxis {...getAxisProps(rechartsTheme)} dataKey="date"
                  interval="preserveStartEnd"
                />
                <YAxis {...getAxisProps(rechartsTheme)} />
                <Tooltip {...getTooltipProps(rechartsTheme)} cursor={{ fill: 'rgba(255,255,255,0.1)' }} />
                <Legend />
                <Line type="monotone" dataKey="created" stroke={rechartsTheme.colors[4]} strokeWidth={2} name="Creadas" />
                <Line type="monotone" dataKey="approved" stroke={rechartsTheme.colors[2]} strokeWidth={2} name="Aprobadas" />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Estado Actual */}
        <div className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-6">
          <h3 className="text-white font-semibold text-lg mb-4">Estado de Solicitudes</h3>
          {statusData.length === 0 ? (
            <EmptyState
              icon={PieChartIcon}
              title="No hay solicitudes registradas"
              description="Los datos aparecerán cuando se creen solicitudes de compra"
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

      {/* Por Categoría y Prioridad */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Por Categoría */}
        <div className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-6">
          <h3 className="text-white font-semibold text-lg mb-4">Distribución por Categoría</h3>
          {categoryDataWithColors.length === 0 ? (
            <EmptyState
              icon={Layers}
              title="Sin categorías registradas"
              description="Los datos de categorías aparecerán cuando se clasifiquen las solicitudes"
              className="h-[250px]"
            />
          ) : (
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={categoryDataWithColors}>
                <CartesianGrid {...getCartesianGridProps(rechartsTheme)} />
                <XAxis {...getAxisProps(rechartsTheme)} dataKey="name"
                  angle={-45}
                  textAnchor="end"
                  height={80}
                />
                <YAxis {...getAxisProps(rechartsTheme)} />
                <Tooltip {...getTooltipProps(rechartsTheme)} cursor={{ fill: 'rgba(255,255,255,0.1)' }} />
                <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                  {categoryDataWithColors.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Por Prioridad */}
        <div className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-6">
          <h3 className="text-white font-semibold text-lg mb-4">Distribución por Prioridad</h3>
          {priorityDataWithColors.length === 0 ? (
            <EmptyState
              icon={BarChart3}
              title="Sin datos de prioridad"
              description="Los datos de prioridad aparecerán cuando se asignen a las solicitudes"
              className="h-[250px]"
            />
          ) : (
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={priorityDataWithColors}>
                <CartesianGrid {...getCartesianGridProps(rechartsTheme)} />
                <XAxis {...getAxisProps(rechartsTheme)} dataKey="name" />
                <YAxis {...getAxisProps(rechartsTheme)} />
                <Tooltip {...getTooltipProps(rechartsTheme)} cursor={{ fill: 'rgba(255,255,255,0.1)' }} />
                <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                  {priorityDataWithColors.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Tarjetas de Resumen */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard label="Total" value={data.total} icon={ShoppingCart} />
        <StatCard label="Pendientes" value={data.pending} icon={Clock} variant="warning" />
        <StatCard label="Aprobadas" value={data.approved} icon={CheckCircle2} variant="success" />
        <StatCard label="Rechazadas" value={data.rejected} icon={XCircle} variant="danger" />
        <StatCard label="Recibidas" value={data.received} icon={Package} variant="info" />
      </div>
    </div>
  )
}
