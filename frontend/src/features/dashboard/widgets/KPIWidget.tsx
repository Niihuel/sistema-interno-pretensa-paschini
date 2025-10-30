import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Users, 
  Package, 
  Activity,
  Ticket,
  Clock,
  Monitor,
  Server,
  Printer,
  ClipboardList,
  ShoppingCart,
  Zap,
  BarChart3,
  PieChart,
  LineChart,
  BarChart,
  Laptop,
  Briefcase
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import type { Widget } from '../store/dashboardStore';
import { cn } from '../../../shared/utils/cn';
import { apiClient } from '../../../api/client';

interface KPIWidgetProps {
  widget: Widget;
}

// Mapeo de iconos de Lucide por nombre
const iconMap: Record<string, any> = {
  DollarSign,
  Users,
  Package,
  Activity,
  Ticket,
  Clock,
  Monitor,
  Server,
  Printer,
  ClipboardList,
  ShoppingCart,
  Zap,
  BarChart3,
  PieChart,
  LineChart,
  BarChart,
  Laptop,
  Briefcase,
  TrendingUp,
  TrendingDown,
};

export function KPIWidget({ widget }: KPIWidgetProps) {
  const config = widget.config;
  const iconKey = config.icon;
  
  // Cargar datos reales si hay dataSource
  const { data: liveData, isLoading, isError } = useQuery({
    queryKey: ['widget', widget.id, widget.dataSource?.endpoint],
    queryFn: async () => {
      if (!widget.dataSource?.endpoint) return null;
      const { data } = await apiClient.get(widget.dataSource.endpoint);
      return data;
    },
    refetchInterval: widget.dataSource?.refresh || 60000,
    enabled: !!widget.dataSource?.endpoint,
    retry: 1, // Solo reintentar una vez para evitar parpadeos
    staleTime: 30000, // Considerar datos frescos por 30 segundos
  });
  
  // Obtener valor desde datos en vivo o config
  const getValue = () => {
    // Si hay error o no hay datos, usar valor configurado
    if (isError || (!isLoading && !liveData)) {
      return config.value ?? 0;
    }
    
    // Si está cargando por primera vez, usar valor configurado
    if (isLoading && config.value !== undefined) {
      return config.value;
    }
    
    // Si está cargando y no hay valor configurado, mostrar placeholder
    if (isLoading) {
      return '...';
    }
    
    // Si hay datos en vivo, usarlos
    if (liveData && config.dataSource && config.field) {
      const dataPath = config.dataSource;
      const field = config.field;
      return liveData[dataPath]?.[field] ?? liveData[field] ?? config.value ?? 0;
    }
    
    return config.value ?? 0;
  };
  
  const value = getValue();
  const trend = config.trend;
  
  // Obtener tamaño del widget para layout responsive
  const { colSpan, rowSpan } = widget.position;
  const isSmall = colSpan <= 2 || rowSpan <= 1;
  const isMedium = colSpan <= 4 && rowSpan <= 2;
  
  // Seleccionar icono de Lucide
  const IconComponent = iconKey && iconMap[iconKey] ? iconMap[iconKey] : Activity;

  // Layout compacto para widgets pequeños
  if (isSmall) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-3 text-center">
        <IconComponent className="w-6 h-6 text-blue-400 mb-2" />
        <div className="text-2xl font-bold text-white mb-1">{value}</div>
        <div className="text-xs text-white/50 line-clamp-1">{widget.title}</div>
      </div>
    );
  }

  // Layout mediano
  if (isMedium) {
    return (
      <div className="flex flex-col h-full p-4">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center shrink-0">
            <IconComponent className="w-4 h-4 text-blue-400" />
          </div>
          <span className="text-white/60 text-xs font-medium flex-1 line-clamp-1">
            {widget.title}
          </span>
        </div>

        <div className="text-3xl font-bold text-white mb-2">
          {value}
        </div>

        {trend && (
          <div className={cn(
            "flex items-center gap-1.5 text-xs",
            trend.direction === 'up' && "text-green-400",
            trend.direction === 'down' && "text-red-400",
            trend.direction === 'neutral' && "text-white/40"
          )}>
            {trend.direction === 'up' && <TrendingUp className="w-3 h-3" />}
            {trend.direction === 'down' && <TrendingDown className="w-3 h-3" />}
            <span className="font-semibold">
              {trend.value > 0 ? '+' : ''}{trend.value}%
            </span>
          </div>
        )}
      </div>
    );
  }

  // Layout grande (default)
  return (
    <div className="flex flex-col p-6 h-full">
      {/* Header con icono y título */}
      <div className="flex items-center gap-3 mb-4">
        <div className="w-12 h-12 rounded-lg bg-blue-500/20 flex items-center justify-center shrink-0">
          <IconComponent className="w-6 h-6 text-blue-400" />
        </div>
        <span className="text-white/60 text-sm font-medium flex-1">
          {widget.title}
        </span>
      </div>

      {/* Valor principal */}
      <div className="text-5xl font-bold text-white mb-3">
        {value}
      </div>

      {/* Tendencia */}
      {trend && (
        <div className={cn(
          "flex items-center gap-2 text-sm",
          trend.direction === 'up' && "text-green-400",
          trend.direction === 'down' && "text-red-400",
          trend.direction === 'neutral' && "text-white/40"
        )}>
          {trend.direction === 'up' && <TrendingUp className="w-4 h-4" />}
          {trend.direction === 'down' && <TrendingDown className="w-4 h-4" />}
          <span className="font-semibold">
            {trend.value > 0 ? '+' : ''}{trend.value}%
          </span>
          <span className="text-white/40">vs anterior</span>
        </div>
      )}

      {/* Empty state */}
      {value === 0 && (
        <div className="text-xs text-white/40 mt-auto">
          Sin datos disponibles
        </div>
      )}
    </div>
  );
}

export default KPIWidget;
