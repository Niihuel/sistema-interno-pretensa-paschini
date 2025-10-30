import { RefreshCw, ChevronRight, FileQuestion } from 'lucide-react';
import type { ListWidgetConfig } from '../types/widget.types';
import type { Widget } from '../store/dashboardStore';
import { useState, useEffect } from 'react';
import { apiClient } from '../../../api/client';
import { Link } from 'react-router-dom';
import EmptyState from '../../../shared/components/ui/EmptyState';

interface ListWidgetProps {
  widget: Widget;
  onEdit?: (widget: Widget) => void;
  onDelete?: (id: string) => void;
  onRefresh?: (id: string) => void;
  isEditing?: boolean;
}

export function ListWidget({ widget, onEdit: _onEdit, onDelete: _onDelete, onRefresh: _onRefresh, isEditing: _isEditing }: ListWidgetProps) {
  const config = widget.config as any;
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Determinar tamaño para layout responsive
  const { colSpan, rowSpan } = widget.position;
  const isCompact = colSpan <= 4 || rowSpan <= 3;

  const fetchData = async () => {
    if (!config.dataSource?.endpoint) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await apiClient.get(config.dataSource.endpoint);
      let items = response.data?.data || response.data || [];

      // Apply limit if configured
      if (config.limit && config.limit > 0) {
        items = items.slice(0, config.limit);
      }

      setData(items);
    } catch (err: any) {
      setError(err.message || 'Error cargando datos');
      console.error('List Widget error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();

    // Auto-refresh if configured
    if (config.dataSource?.refresh && config.dataSource.refresh > 0) {
      const interval = setInterval(fetchData, config.dataSource.refresh * 1000);
      return () => clearInterval(interval);
    }
  }, [config.dataSource]);

  const getFieldValue = (item: any, fieldName: string | undefined): string => {
    if (!fieldName) return '';

    // Support nested fields with dot notation (e.g., "user.name")
    const value = fieldName.split('.').reduce((obj, key) => obj?.[key], item);
    return value?.toString() || '';
  };

  const renderListItem = (item: any, index: number) => {
    const title = getFieldValue(item, config.itemTemplate?.title);
    const subtitle = getFieldValue(item, config.itemTemplate?.subtitle);
    const badge = getFieldValue(item, config.itemTemplate?.badge);
    const link = getFieldValue(item, config.itemTemplate?.link);

    const content = (
      <>
        <div className="flex-1 min-w-0">
          <div className={`font-medium text-white truncate ${isCompact ? 'text-xs' : 'text-sm'}`}>
            {title || 'Sin título'}
          </div>
          {subtitle && (
            <div className={`text-white/60 truncate mt-0.5 ${isCompact ? 'text-[10px]' : 'text-xs'}`}>
              {subtitle}
            </div>
          )}
        </div>
        {badge && (
          <div className="flex-shrink-0 ml-2">
            <span className={`px-2 py-0.5 rounded-full bg-white/10 text-white/80 ${isCompact ? 'text-[10px]' : 'text-xs'}`}>
              {badge}
            </span>
          </div>
        )}
        {link && (
          <div className="flex-shrink-0 ml-2">
            <ChevronRight className={`text-white/40 ${isCompact ? 'w-3 h-3' : 'w-4 h-4'}`} />
          </div>
        )}
      </>
    );

    const itemClasses = `flex items-center gap-2 ${isCompact ? 'p-2' : 'p-3'} rounded-lg hover:bg-white/5 transition-colors border border-transparent hover:border-white/10`;

    if (link) {
      return (
        <Link key={index} to={link} className={itemClasses}>
          {content}
        </Link>
      );
    }

    return (
      <div key={index} className={itemClasses}>
        {content}
      </div>
    );
  };

  return (
    <div
      className="h-full rounded-xl border border-white/10 p-4 flex flex-col relative backdrop-blur-sm"
      style={{
        backgroundColor: widget.theme?.backgroundColor || 'rgba(255, 255, 255, 0.05)',
        borderColor: widget.theme?.borderColor || 'rgba(255, 255, 255, 0.1)',
        color: widget.theme?.textColor || 'white',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
      }}
    >
      {/* Title */}
      <div className={`font-medium text-white/80 mb-3 ${isCompact ? 'text-xs' : 'text-sm'}`}>
        {widget.title || config.title}
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex-1 flex items-center justify-center">
          <RefreshCw className="w-6 h-6 animate-spin opacity-50" />
        </div>
      )}

      {/* Error State */}
      {error && !loading && (
        <div className="flex-1 flex flex-col items-center justify-center">
          <div className="text-red-400 text-sm mb-1">Error</div>
          <div className="text-xs text-white/50">{error}</div>
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && data.length === 0 && (
        <div className="flex-1 flex items-center justify-center">
          <EmptyState
            icon={FileQuestion}
            title="Sin datos disponibles"
            description="No hay elementos para mostrar"
            className="py-6"
          />
        </div>
      )}

      {/* List Content */}
      {!loading && !error && data.length > 0 && (
        <div className="flex-1 overflow-y-auto space-y-1 custom-scrollbar">
          {data.map((item, index) => renderListItem(item, index))}
        </div>
      )}

      {/* Item count footer */}
      {!loading && !error && data.length > 0 && (
        <div className="text-xs text-white/40 mt-2 pt-2 border-t border-white/5">
          {data.length} elemento{data.length !== 1 ? 's' : ''}
          {config.limit && data.length >= config.limit && ` (máximo ${config.limit})`}
        </div>
      )}
    </div>
  );
}

export default ListWidget;
