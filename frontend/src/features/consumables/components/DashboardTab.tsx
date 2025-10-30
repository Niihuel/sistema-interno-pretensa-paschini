import { Package, AlertTriangle, CheckCircle, XCircle, TrendingUp, TrendingDown } from 'lucide-react'
import { useLowStockConsumables, useConsumablesSummary } from '../hooks/useConsumables'
import { AreaChart, Area, ResponsiveContainer, XAxis, YAxis, CartesianGrid, Tooltip, Cell, PieChart, Pie } from 'recharts'
import { getRechartsTheme, getCartesianGridProps, getAxisProps, getTooltipProps } from '../../dashboard/utils/rechartsTheme'

export default function DashboardTab() {
  const rechartsTheme = getRechartsTheme();
  const { data: lowStockData } = useLowStockConsumables()
  const { data: summaryData } = useConsumablesSummary()

  const lowStockItems = lowStockData ?? []

  // Preparar datos para gráficos usando colores del tema
  const chartData = summaryData ? [
    {
      name: 'Disponible',
      value: summaryData.total - summaryData.lowStock - summaryData.outOfStock - summaryData.expired,
      fill: rechartsTheme.colors[2] // green
    },
    {
      name: 'Stock Bajo',
      value: summaryData.lowStock,
      fill: rechartsTheme.colors[1] // yellow/warning
    },
    {
      name: 'Agotado',
      value: summaryData.outOfStock,
      fill: rechartsTheme.colors[0] // red/danger
    },
    {
      name: 'Vencido',
      value: summaryData.expired,
      fill: rechartsTheme.colors[7] // gray
    }
  ].filter(item => item.value > 0) : []

  const areaChartData = summaryData ? [
    { category: 'Disponible', cantidad: summaryData.total - summaryData.lowStock - summaryData.outOfStock - summaryData.expired },
    { category: 'Bajo Stock', cantidad: summaryData.lowStock },
    { category: 'Agotado', cantidad: summaryData.outOfStock },
  ] : []

  return (
    <div className="space-y-6">
      {/* Gráfico Principal */}
      {summaryData && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Gráfico de Área */}
          <div className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-6">
            <h3 className="text-white font-semibold text-lg mb-4">Distribución de Stock</h3>
            {areaChartData.length === 0 || summaryData.total === 0 ? (
              <div className="flex items-center justify-center h-[250px]">
                <div className="text-center text-white/60">
                  No hay datos de stock disponibles
                </div>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={250}>
                <AreaChart data={areaChartData}>
                  <defs>
                    <linearGradient id="colorCantidad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={rechartsTheme.colors[4]} stopOpacity={0.8}/>
                      <stop offset="95%" stopColor={rechartsTheme.colors[4]} stopOpacity={0.1}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid {...getCartesianGridProps(rechartsTheme)} />
                  <XAxis {...getAxisProps(rechartsTheme)} dataKey="category"
                  />
                  <YAxis {...getAxisProps(rechartsTheme)}
                  />
                  <Tooltip {...getTooltipProps(rechartsTheme)} cursor={{ fill: 'rgba(255,255,255,0.1)' }} />
                  <Area
                    type="monotone"
                    dataKey="cantidad"
                    stroke={rechartsTheme.colors[4]}
                    strokeWidth={2}
                    fill="url(#colorCantidad)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Gráfico de Torta */}
          <div className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-6">
            <h3 className="text-white font-semibold text-lg mb-4">Estado del Inventario</h3>
            {chartData.length === 0 || summaryData.total === 0 ? (
              <div className="flex items-center justify-center h-[250px]">
                <div className="text-center text-white/60">
                  No hay datos de inventario disponibles
                </div>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }: any) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip {...getTooltipProps(rechartsTheme)} cursor={{ fill: 'rgba(255,255,255,0.1)' }} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      )}

      {/* Tarjetas de Resumen */}
      {summaryData && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-4 hover:bg-white/10 transition-colors">
            <div className="flex items-center justify-between mb-2">
              <div className="text-white/60 text-sm">Total Consumibles</div>
              <Package className="w-5 h-5 text-white/40" />
            </div>
            <div className="text-3xl font-bold text-white mb-1">{summaryData.total}</div>
            <div className="text-xs text-white/40">En inventario</div>
          </div>

          <div className="bg-green-500/5 backdrop-blur-sm rounded-2xl border border-green-500/20 p-4 hover:bg-green-500/10 transition-colors">
            <div className="flex items-center justify-between mb-2">
              <div className="text-green-400/80 text-sm">Disponible</div>
              <CheckCircle className="w-5 h-5 text-green-400/60" />
            </div>
            <div className="text-3xl font-bold text-green-400 mb-1">
              {summaryData.total - summaryData.lowStock - summaryData.outOfStock - summaryData.expired}
            </div>
            <div className="text-xs text-green-400/60">Stock suficiente</div>
          </div>

          <div className="bg-yellow-500/5 backdrop-blur-sm rounded-2xl border border-yellow-500/20 p-4 hover:bg-yellow-500/10 transition-colors">
            <div className="flex items-center justify-between mb-2">
              <div className="text-yellow-400/80 text-sm">Stock Bajo</div>
              <AlertTriangle className="w-5 h-5 text-yellow-400/60" />
            </div>
            <div className="text-3xl font-bold text-yellow-400 mb-1">{summaryData.lowStock}</div>
            <div className="text-xs text-yellow-400/60">Requiere reposición</div>
          </div>

          <div className="bg-red-500/5 backdrop-blur-sm rounded-2xl border border-red-500/20 p-4 hover:bg-red-500/10 transition-colors">
            <div className="flex items-center justify-between mb-2">
              <div className="text-red-400/80 text-sm">Agotado</div>
              <XCircle className="w-5 h-5 text-red-400/60" />
            </div>
            <div className="text-3xl font-bold text-red-400 mb-1">{summaryData.outOfStock}</div>
            <div className="text-xs text-red-400/60">Sin stock disponible</div>
          </div>
        </div>
      )}

      {/* Low Stock Alert Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Alert Banner */}
        {lowStockItems.length > 0 && (
          <div className="lg:col-span-2 bg-gradient-to-r from-yellow-500/10 via-orange-500/10 to-red-500/10 border border-yellow-500/20 rounded-2xl p-6">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-yellow-500/20 rounded-xl flex items-center justify-center">
                  <AlertTriangle className="w-6 h-6 text-yellow-400" />
                </div>
              </div>
              <div className="flex-1">
                <h3 className="text-yellow-400 font-semibold text-lg mb-1">Alerta de Stock Bajo</h3>
                <p className="text-yellow-400/80 text-sm mb-3">
                  Hay {lowStockItems.length} consumibles con stock bajo o agotado que requieren atención inmediata.
                </p>
                <div className="flex gap-2">
                  <button className="px-4 py-2 bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-400 rounded-lg text-sm font-medium transition-colors">
                    Ver Todos
                  </button>
                  <button className="px-4 py-2 bg-white/5 hover:bg-white/10 text-white/80 rounded-lg text-sm font-medium transition-colors">
                    Generar Orden
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Low Stock Items List */}
        {lowStockItems.length > 0 && (
          <div className="lg:col-span-2 bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-6">
            <h3 className="text-white font-semibold text-lg mb-4 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-yellow-400" />
              Consumibles con Stock Crítico
            </h3>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {lowStockItems.slice(0, 10).map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/10 hover:bg-white/10 transition-colors"
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="flex-shrink-0">
                      <Package className="w-5 h-5 text-white/60" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-white font-medium text-sm truncate">
                        {item.consumableType?.name || 'Sin nombre'}
                      </h4>
                      <p className="text-white/60 text-xs">
                        {item.consumableType?.brand} {item.consumableType?.model}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 flex-shrink-0">
                    <div className="text-right">
                      <div className="text-white font-bold text-sm">{item.quantityAvailable}</div>
                      <div className="text-white/40 text-xs">de {item.minimumStock} mín.</div>
                    </div>
                    <div>
                      {item.quantityAvailable === 0 ? (
                        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-red-500/10 text-red-400 border border-red-500/20">
                          <XCircle className="w-3 h-3" />
                          Agotado
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-yellow-500/10 text-yellow-400 border border-yellow-500/20">
                          <AlertTriangle className="w-3 h-3" />
                          Bajo
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
            {lowStockItems.length > 10 && (
              <div className="mt-4 text-center">
                <button className="text-white/60 hover:text-white text-sm transition-colors">
                  Ver {lowStockItems.length - 10} más →
                </button>
              </div>
            )}
          </div>
        )}

        {/* Empty State */}
        {lowStockItems.length === 0 && (
          <div className="lg:col-span-2 bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-12 text-center">
            <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-green-400" />
            </div>
            <h3 className="text-white font-semibold text-lg mb-2">Todo en Orden</h3>
            <p className="text-white/60 text-sm">
              No hay consumibles con stock bajo o agotado en este momento.
            </p>
          </div>
        )}
      </div>

      {/* Additional Stats */}
      {summaryData && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-6">
            <h3 className="text-white font-semibold text-lg mb-4">Estado del Inventario</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                  <span className="text-white/80 text-sm">Disponible</span>
                </div>
                <span className="text-white font-semibold">
                  {Math.round(
                    ((summaryData.total - summaryData.lowStock - summaryData.outOfStock - summaryData.expired) /
                      summaryData.total) *
                      100
                  )}
                  %
                </span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-yellow-400 rounded-full"></div>
                  <span className="text-white/80 text-sm">Stock Bajo</span>
                </div>
                <span className="text-white font-semibold">
                  {Math.round((summaryData.lowStock / summaryData.total) * 100)}%
                </span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-red-400 rounded-full"></div>
                  <span className="text-white/80 text-sm">Agotado</span>
                </div>
                <span className="text-white font-semibold">
                  {Math.round((summaryData.outOfStock / summaryData.total) * 100)}%
                </span>
              </div>
              {summaryData.expired > 0 && (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-gray-400 rounded-full"></div>
                    <span className="text-white/80 text-sm">Vencido</span>
                  </div>
                  <span className="text-white font-semibold">
                    {Math.round((summaryData.expired / summaryData.total) * 100)}%
                  </span>
                </div>
              )}
            </div>
          </div>

          <div className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-6">
            <h3 className="text-white font-semibold text-lg mb-4">Acciones Rápidas</h3>
            <div className="space-y-2">
              <button className="w-full px-4 py-3 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 rounded-lg text-sm font-medium transition-colors text-left flex items-center gap-2">
                <TrendingUp className="w-4 h-4" />
                Registrar Entrada de Stock
              </button>
              <button className="w-full px-4 py-3 bg-orange-500/10 hover:bg-orange-500/20 text-orange-400 rounded-lg text-sm font-medium transition-colors text-left flex items-center gap-2">
                <TrendingDown className="w-4 h-4" />
                Registrar Salida de Stock
              </button>
              <button className="w-full px-4 py-3 bg-purple-500/10 hover:bg-purple-500/20 text-purple-400 rounded-lg text-sm font-medium transition-colors text-left flex items-center gap-2">
                <Package className="w-4 h-4" />
                Nuevo Consumible
              </button>
              <button className="w-full px-4 py-3 bg-green-500/10 hover:bg-green-500/20 text-green-400 rounded-lg text-sm font-medium transition-colors text-left flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" />
                Generar Reporte de Stock
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
