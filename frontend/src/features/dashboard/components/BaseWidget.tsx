import { useState, useEffect, type ReactNode } from 'react';
import { AlertCircle, FileQuestion } from 'lucide-react';
import type { Widget } from '../types/widget.types';
import { apiClient } from '../../../api/client';
import EmptyState from '../../../shared/components/ui/EmptyState';
import LoadingSpinner from '../../../shared/components/ui/LoadingSpinner';

/**
 * Configuración para el data fetching del widget
 */
export interface WidgetDataConfig {
  endpoint?: string;
  refresh?: number; // segundos
  transform?: (data: any) => any; // función para transformar datos
}

/**
 * Props que recibe el BaseWidget
 */
export interface BaseWidgetProps {
  widget: Widget;
  onEdit?: (widget: Widget) => void;
  onDelete?: (id: string) => void;
  onRefresh?: (id: string) => void;
  isEditing?: boolean;
}

/**
 * Props que el BaseWidget pasa al componente hijo (render prop)
 */
export interface WidgetRenderProps<TData = any> {
  data: TData | null;
  loading: boolean;
  error: string | null;
  widget: Widget;
  isEditing?: boolean;
  refetch: () => Promise<void>;
}

/**
 * Props del BaseWidget con render prop pattern
 */
interface BaseWidgetWrapperProps extends BaseWidgetProps {
  dataConfig?: WidgetDataConfig;
  children: (props: WidgetRenderProps) => ReactNode;
  minHeight?: string;
  showEmptyState?: boolean;
  emptyMessage?: string;
}

/**
 * BaseWidget - Componente base para todos los widgets del dashboard
 *
 * Responsabilidades:
 * - Manejo de estados (loading, error, data)
 * - Data fetching con auto-refresh
 * - Aplicación de temas
 * - UI states (loading spinner, error message, empty state)
 * - Container común con estilos consistentes
 *
 * Uso:
 * ```tsx
 * <BaseWidget widget={widget} dataConfig={{ endpoint: '/api/data' }}>
 *   {({ data, loading, error, theme }) => (
 *     // Render del contenido específico del widget
 *   )}
 * </BaseWidget>
 * ```
 */
export default function BaseWidget({
  widget,
  dataConfig,
  children,
  onEdit: _onEdit,
  onDelete: _onDelete,
  onRefresh,
  isEditing = false,
  minHeight = '100%',
  showEmptyState = true,
  emptyMessage = 'Sin datos disponibles',
}: BaseWidgetWrapperProps) {
  // Data fetching state
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(!!dataConfig?.endpoint);
  const [error, setError] = useState<string | null>(null);

  // Fetch data function
  const fetchData = async () => {
    if (!dataConfig?.endpoint) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await apiClient.get(dataConfig.endpoint);
      const rawData = response.data;

      // Aplicar transformación si existe
      const transformedData = dataConfig.transform
        ? dataConfig.transform(rawData)
        : rawData;

      setData(transformedData);
    } catch (err: any) {
      const errorMessage = err.message || 'Error cargando datos';
      setError(errorMessage);
      console.error(`Widget ${widget.id} error:`, err);
    } finally {
      setLoading(false);
    }
  };

  // Auto-refresh effect
  useEffect(() => {
    fetchData();

    // Setup auto-refresh if configured
    if (dataConfig?.refresh && dataConfig.refresh > 0) {
      const interval = setInterval(fetchData, dataConfig.refresh * 1000);
      return () => clearInterval(interval);
    }
  }, [dataConfig?.endpoint, dataConfig?.refresh]);

  // Handle manual refresh from parent
  useEffect(() => {
    if (onRefresh) {
      // Si el padre quiere controlar el refresh, exponer la función
      // (esto requeriría un ref o callback, por ahora solo refetch interno)
    }
  }, [onRefresh]);

  // Loading state
  if (loading) {
    return (
      <WidgetContainer minHeight={minHeight}>
        <div className="flex-1 flex items-center justify-center">
          <LoadingSpinner size="md" />
        </div>
      </WidgetContainer>
    );
  }

  // Error state
  if (error) {
    return (
      <WidgetContainer minHeight={minHeight}>
        <div className="flex-1 flex flex-col items-center justify-center gap-3">
          <div className="w-12 h-12 rounded-full flex items-center justify-center bg-red-500/20">
            <AlertCircle className="w-6 h-6 text-red-500" />
          </div>
          <div className="text-center">
            <div className="text-sm font-medium mb-1 text-red-500">
              Error al cargar
            </div>
            <div className="text-xs text-white/60">
              {error}
            </div>
          </div>
          <button
            onClick={fetchData}
            className="px-4 py-2 rounded-lg text-sm font-medium transition-colors bg-blue-500/20 text-blue-500 hover:bg-blue-500/30"
          >
            Reintentar
          </button>
        </div>
      </WidgetContainer>
    );
  }

  // Empty state (optional)
  if (showEmptyState && (!data || (Array.isArray(data) && data.length === 0))) {
    return (
      <WidgetContainer minHeight={minHeight}>
        <div className="flex-1 flex flex-col items-center justify-center">
          <EmptyState
            icon={FileQuestion}
            title={emptyMessage}
            description="No hay información para mostrar"
            className="py-6"
          />
        </div>
      </WidgetContainer>
    );
  }

  // Content state - render children with props
  return (
    <WidgetContainer minHeight={minHeight}>
      {children({
        data,
        loading,
        error,
        widget,
        isEditing,
        refetch: fetchData,
      })}
    </WidgetContainer>
  );
}

/**
 * WidgetContainer - Componente de contenedor común para widgets
 * Proporciona la estructura visual base (bordes, padding, background)
 */
interface WidgetContainerProps {
  children: ReactNode;
  minHeight?: string;
  className?: string;
}

export function WidgetContainer({
  children,
  minHeight = '100%',
  className = '',
}: WidgetContainerProps) {
  return (
    <div
      className={`rounded-xl p-5 flex flex-col relative transition-all backdrop-blur-sm bg-white/5 border border-white/10 text-white ${className}`}
      style={{
        minHeight,
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
      }}
    >
      {children}
    </div>
  );
}

/**
 * Hook helper para widgets que necesitan acceso directo a la lógica de fetching
 * sin usar el BaseWidget wrapper
 */
export function useWidgetData<TData = any>(
  dataConfig?: WidgetDataConfig,
  widgetId?: string
) {
  const [data, setData] = useState<TData | null>(null);
  const [loading, setLoading] = useState(!!dataConfig?.endpoint);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    if (!dataConfig?.endpoint) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await apiClient.get(dataConfig.endpoint);
      const rawData = response.data;

      const transformedData = dataConfig.transform
        ? dataConfig.transform(rawData)
        : rawData;

      setData(transformedData);
    } catch (err: any) {
      const errorMessage = err.message || 'Error cargando datos';
      setError(errorMessage);
      console.error(`Widget ${widgetId || 'unknown'} error:`, err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();

    if (dataConfig?.refresh && dataConfig.refresh > 0) {
      const interval = setInterval(fetchData, dataConfig.refresh * 1000);
      return () => clearInterval(interval);
    }
  }, [dataConfig?.endpoint, dataConfig?.refresh]);

  return { data, loading, error, refetch: fetchData };
}
