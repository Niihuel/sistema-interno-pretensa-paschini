import type { ChartWidgetConfig } from '../types/widget.types';
import type { Widget } from '../store/dashboardStore';
import BaseWidget from '../components/BaseWidget';
import EmptyState from '../../../shared/components/ui/EmptyState';
import { BarChart3 } from 'lucide-react';
import { getRechartsTheme, getCartesianGridProps, getAxisProps, getTooltipProps, getLegendProps } from '../utils/rechartsTheme';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  AreaChart,
  Area,
  PieChart,
  Pie,
  ComposedChart,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from 'recharts';

interface ChartWidgetProps {
  widget: Widget;
  onEdit?: (widget: Widget) => void;
  onDelete?: (id: string) => void;
  onRefresh?: (id: string) => void;
  isEditing?: boolean;
}

export function ChartWidget({ widget, onEdit, onDelete, onRefresh, isEditing }: ChartWidgetProps) {
  const config = widget.config as ChartWidgetConfig;
  
  // Determinar tamaño del widget para ajustar visualización
  const { colSpan, rowSpan } = widget.position;
  const isSmall = colSpan <= 3 || rowSpan <= 2;
  const isMedium = colSpan <= 6 && rowSpan <= 3;

  const renderChart = (data: any[], theme: any) => {
    if (!data || data.length === 0) {
      return (
        <div className="flex-1 flex items-center justify-center">
          <EmptyState
            icon={BarChart3}
            title="Sin datos disponibles"
            description="No hay información para mostrar"
            className="py-6"
          />
        </div>
      );
    }

    // Obtener configuración de tema para Recharts
    const customColors = (widget.theme as any)?.customColors;
    const rechartsTheme = getRechartsTheme(customColors || theme);
    const colors = config.colors || rechartsTheme.colors;

    // Ajustar márgenes según tamaño
    const margin = isSmall 
      ? { top: 5, right: 5, left: -20, bottom: 5 }
      : isMedium
      ? { top: 5, right: 10, left: -10, bottom: 5 }
      : { top: 5, right: 20, left: 0, bottom: 5 };

    const chartProps = {
      data,
      margin,
    };

    const axisProps = getAxisProps(rechartsTheme);
    const tooltipProps = getTooltipProps(rechartsTheme);
    const legendProps = getLegendProps(rechartsTheme);
    const gridProps = getCartesianGridProps(rechartsTheme);

    switch (config.chartType) {
      case 'bar':
        return (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart {...chartProps}>
              {config.showGrid !== false && <CartesianGrid {...gridProps} />}
              <XAxis dataKey={config.xAxisKey} {...axisProps} />
              <YAxis {...axisProps} />
              <Tooltip {...tooltipProps} />
              {config.showLegend !== false && <Legend {...legendProps} />}
              {Array.isArray(config.yAxisKey) ? (
                config.yAxisKey.map((key, index) => (
                  <Bar
                    key={key}
                    dataKey={key}
                    fill={colors[index % colors.length]}
                    radius={[4, 4, 0, 0]}
                    animationDuration={config.animate !== false ? 300 : 0}
                  />
                ))
              ) : (
                <Bar
                  dataKey={config.yAxisKey}
                  fill={colors[0]}
                  radius={[4, 4, 0, 0]}
                  animationDuration={config.animate !== false ? 300 : 0}
                />
              )}
            </BarChart>
          </ResponsiveContainer>
        );

      case 'line':
        return (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart {...chartProps}>
              {config.showGrid !== false && <CartesianGrid {...gridProps} />}
              <XAxis dataKey={config.xAxisKey} {...axisProps} />
              <YAxis {...axisProps} />
              <Tooltip {...tooltipProps} />
              {config.showLegend !== false && <Legend {...legendProps} />}
              {Array.isArray(config.yAxisKey) ? (
                config.yAxisKey.map((key, index) => (
                  <Line
                    key={key}
                    type="monotone"
                    dataKey={key}
                    stroke={colors[index % colors.length]}
                    strokeWidth={2}
                    dot={{ r: 4 }}
                    activeDot={{ r: 6 }}
                    animationDuration={config.animate !== false ? 300 : 0}
                  />
                ))
              ) : (
                <Line
                  type="monotone"
                  dataKey={config.yAxisKey}
                  stroke={colors[0]}
                  strokeWidth={2}
                  dot={{ r: 4 }}
                  activeDot={{ r: 6 }}
                  animationDuration={config.animate !== false ? 300 : 0}
                />
              )}
            </LineChart>
          </ResponsiveContainer>
        );

      case 'area':
        return (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart {...chartProps}>
              {config.showGrid !== false && <CartesianGrid {...gridProps} />}
              <XAxis dataKey={config.xAxisKey} {...axisProps} />
              <YAxis {...axisProps} />
              <Tooltip {...tooltipProps} />
              {config.showLegend !== false && <Legend {...legendProps} />}
              {Array.isArray(config.yAxisKey) ? (
                config.yAxisKey.map((key, index) => (
                  <Area
                    key={key}
                    type="monotone"
                    dataKey={key}
                    stroke={colors[index % colors.length]}
                    fill={colors[index % colors.length]}
                    fillOpacity={0.6}
                    strokeWidth={2}
                    animationDuration={config.animate !== false ? 300 : 0}
                  />
                ))
              ) : (
                <Area
                  type="monotone"
                  dataKey={config.yAxisKey}
                  stroke={colors[0]}
                  fill={colors[0]}
                  fillOpacity={0.6}
                  strokeWidth={2}
                  animationDuration={config.animate !== false ? 300 : 0}
                />
              )}
            </AreaChart>
          </ResponsiveContainer>
        );

      case 'pie':
        return (
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                dataKey={Array.isArray(config.yAxisKey) ? config.yAxisKey[0] : config.yAxisKey}
                nameKey={config.xAxisKey}
                cx="50%"
                cy="50%"
                innerRadius="50%"
                outerRadius="80%"
                paddingAngle={2}
                label={(entry: any) => String(entry[config.xAxisKey])}
                animationDuration={config.animate !== false ? 300 : 0}
              >
                {data.map((_entry, index) => (
                  <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                ))}
              </Pie>
              <Tooltip {...tooltipProps} />
              {config.showLegend !== false && <Legend {...legendProps} />}
            </PieChart>
          </ResponsiveContainer>
        );

      case 'composed':
        return (
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart {...chartProps}>
              {config.showGrid !== false && <CartesianGrid {...gridProps} />}
              <XAxis dataKey={config.xAxisKey} {...axisProps} />
              <YAxis {...axisProps} />
              <Tooltip {...tooltipProps} />
              {config.showLegend !== false && <Legend {...legendProps} />}
              {Array.isArray(config.yAxisKey) &&
                config.yAxisKey.map((key, index) => {
                  // Alternate between Bar, Line, and Area for composed charts
                  const componentType = index % 3;
                  if (componentType === 0) {
                    return (
                      <Bar
                        key={key}
                        dataKey={key}
                        fill={colors[index % colors.length]}
                        radius={[4, 4, 0, 0]}
                        animationDuration={config.animate !== false ? 300 : 0}
                      />
                    );
                  } else if (componentType === 1) {
                    return (
                      <Line
                        key={key}
                        type="monotone"
                        dataKey={key}
                        stroke={colors[index % colors.length]}
                        strokeWidth={2}
                        dot={{ r: 4 }}
                        animationDuration={config.animate !== false ? 300 : 0}
                      />
                    );
                  } else {
                    return (
                      <Area
                        key={key}
                        type="monotone"
                        dataKey={key}
                        stroke={colors[index % colors.length]}
                        fill={colors[index % colors.length]}
                        fillOpacity={0.4}
                        strokeWidth={2}
                        animationDuration={config.animate !== false ? 300 : 0}
                      />
                    );
                  }
                })}
            </ComposedChart>
          </ResponsiveContainer>
        );

      default:
        return (
          <div className="flex-1 flex items-center justify-center" style={{ color: theme.textMuted }}>
            Tipo de gráfico no soportado
          </div>
        );
    }
  };

  // Simplemente renderizar directamente con datos del config por ahora
  // TODO: Integrar con BaseWidget cuando se unifiquen los tipos
  const data = config.dataSource?.endpoint ? [] : (config as any).data || [];
  const theme = {
    text: '#ffffff',
    textMuted: 'rgba(255, 255, 255, 0.6)',
    textSubtle: 'rgba(255, 255, 255, 0.4)',
  };

  return (
    <div 
      className="h-full rounded-xl border border-white/10 p-4 flex flex-col backdrop-blur-sm"
      style={{
        backgroundColor: widget.theme?.backgroundColor || 'rgba(255, 255, 255, 0.05)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
      }}
    >
      {/* Title */}
      <div className="text-sm font-semibold mb-4 text-white/80">
        {widget.title}
      </div>

      {/* Chart */}
      <div className="flex-1 min-h-0">{renderChart(data, theme)}</div>
    </div>
  );
}

export default ChartWidget;
