import { useQuery } from '@tanstack/react-query'
import { Package, AlertTriangle, XCircle, FileQuestion, PieChart as PieChartIcon, Layers } from 'lucide-react'
import { BarChart, Bar, PieChart, Pie, Cell, ResponsiveContainer, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts'
import { apiClient } from '../../../api/client'
import { getRechartsTheme, getCartesianGridProps, getAxisProps, getTooltipProps } from '../../dashboard/utils/rechartsTheme'
import EmptyState from '../../../shared/components/ui/EmptyState'
import StatCard from '../../../shared/components/ui/StatCard'

interface InventoryStats {
  total: number
  lowStock: number
  outOfStock: number
  byCategory: Array<{ name: string; value: number }>
  criticalItems: Array<{ name: string; current: number; minimum: number }>
}

export default function InventoryDashboardTab() {
  const rechartsTheme = getRechartsTheme();
  
  const { data, isLoading } = useQuery({
    queryKey: ['dashboard-inventory'],
    queryFn: async () => {
      try {
        const response = await apiClient.get('/dashboard/inventory-stats')
        return response.data.data as InventoryStats
      } catch (error) {
        console.error('Error fetching inventory stats:', error)
        // Retornar datos vacíos en lugar de undefined
        return {
          total: 0,
          lowStock: 0,
          outOfStock: 0,
          byCategory: [],
          criticalItems: []
        } as InventoryStats
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

  const available = data.total - data.lowStock - data.outOfStock

  // Datos para gráficos usando colores del tema
  const statusData = [
    { name: 'Disponible', value: available, fill: rechartsTheme.colors[2] }, // green
    { name: 'Stock Bajo', value: data.lowStock, fill: rechartsTheme.colors[1] }, // yellow/warning
    { name: 'Agotado', value: data.outOfStock, fill: rechartsTheme.colors[0] } // red/danger
  ].filter(item => item.value > 0)

  const categoryData = data.byCategory || []

  return (
    <div className="space-y-6">
      {/* Gráficos Principales */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Gráfico de Estado */}
        <div className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-6">
          <h3 className="text-white font-semibold text-lg mb-4">Estado del Inventario</h3>
          {statusData.length === 0 ? (
            <EmptyState
              icon={PieChartIcon}
              title="No hay inventario registrado"
              description="Los datos aparecerán cuando se agreguen items al inventario"
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

        {/* Gráfico por Categoría */}
        <div className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-6">
          <h3 className="text-white font-semibold text-lg mb-4">Distribución por Categoría</h3>
          {categoryData.length === 0 ? (
            <EmptyState
              icon={Layers}
              title="Sin categorías registradas"
              description="Los datos de categorías aparecerán cuando se clasifiquen los items"
              className="h-[300px]"
            />
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={categoryData}>
                <CartesianGrid {...getCartesianGridProps(rechartsTheme)} />
                <XAxis {...getAxisProps(rechartsTheme)} dataKey="name"
                  angle={-45}
                  textAnchor="end"
                  height={80}
                />
                <YAxis {...getAxisProps(rechartsTheme)}
                />
                <Tooltip {...getTooltipProps(rechartsTheme)} cursor={{ fill: 'rgba(255,255,255,0.1)' }} />
                <Bar dataKey="value" fill={rechartsTheme.colors[4]} radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Tarjetas de Resumen */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard label="Total Items" value={data.total} icon={Package} />
        <StatCard label="Stock Bajo" value={data.lowStock} icon={AlertTriangle} variant="warning" />
        <StatCard label="Agotado" value={data.outOfStock} icon={XCircle} variant="danger" />
      </div>

      {/* Items Críticos */}
      {data.criticalItems && data.criticalItems.length > 0 && (
        <div className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-6">
          <h3 className="text-white font-semibold text-lg mb-4 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-yellow-400" />
            Items con Stock Crítico
          </h3>
          <div className="space-y-3">
            {data.criticalItems.map((item, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/10"
              >
                <div className="flex-1">
                  <div className="text-white font-medium text-sm">{item.name}</div>
                  <div className="text-white/60 text-xs">
                    Stock mínimo: {item.minimum}
                  </div>
                </div>
                <div className="text-right">
                  <div className={`text-lg font-bold ${item.current === 0 ? 'text-red-400' : 'text-yellow-400'}`}>
                    {item.current}
                  </div>
                  <div className="text-white/40 text-xs">disponibles</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
