import { RefreshCw, AlertCircle, AlertTriangle, Info, CheckCircle } from 'lucide-react';
import type { Widget } from '../store/dashboardStore';
import { useState, useEffect } from 'react';
import { apiClient } from '../../../api/client';

interface AlertsWidgetProps {
  widget: Widget;
  onEdit?: (widget: Widget) => void;
  onDelete?: (id: string) => void;
  onRefresh?: (id: string) => void;
  isEditing?: boolean;
}

const getSeverityConfig = (severity: string): { icon: any; color: string; bgColor: string } => {
  const normalizedSeverity = severity?.toLowerCase() || 'info';

  switch (normalizedSeverity) {
    case 'error':
    case 'critical':
    case 'high':
      return {
        icon: AlertCircle,
        color: '#ef4444',
        bgColor: 'rgba(239, 68, 68, 0.1)',
      };
    case 'warning':
    case 'medium':
      return {
        icon: AlertTriangle,
        color: '#f59e0b',
        bgColor: 'rgba(245, 158, 11, 0.1)',
      };
    case 'success':
    case 'resolved':
      return {
        icon: CheckCircle,
        color: '#10b981',
        bgColor: 'rgba(16, 185, 129, 0.1)',
      };
    case 'info':
    case 'low':
    default:
      return {
        icon: Info,
        color: '#3b82f6',
        bgColor: 'rgba(59, 130, 246, 0.1)',
      };
  }
};

export function AlertsWidget({ widget, onEdit: _onEdit, onDelete: _onDelete, onRefresh: _onRefresh, isEditing: _isEditing }: AlertsWidgetProps) {
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
      console.error('Alerts Widget error:', err);
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

  const getFieldValue = (item: any, fieldName: string): string => {
    // Support nested fields with dot notation
    const value = fieldName?.split('.').reduce((obj, key) => obj?.[key], item);
    return value?.toString() || '';
  };

  const renderAlert = (item: any, index: number) => {
    const severity = getFieldValue(item, config.severityField || 'severity');
    const message = getFieldValue(item, config.messageField || 'message');
    const severityConfig = getSeverityConfig(severity);
    const IconComponent = severityConfig.icon;

    const iconSize = isCompact ? 'w-6 h-6' : 'w-8 h-8';
    const iconInnerSize = isCompact ? 'w-4 h-4' : 'w-5 h-5';
    const padding = isCompact ? 'p-2' : 'p-3';
    const textSize = isCompact ? 'text-xs' : 'text-sm';

    return (
      <div
        key={index}
        className={`flex items-start gap-${isCompact ? '2' : '3'} ${padding} rounded-lg border transition-colors`}
        style={{
          backgroundColor: severityConfig.bgColor,
          borderColor: `${severityConfig.color}30`,
        }}
      >
        <div
          className={`flex-shrink-0 ${iconSize} rounded-lg flex items-center justify-center`}
          style={{ backgroundColor: `${severityConfig.color}20` }}
        >
          <IconComponent className={iconInnerSize} style={{ color: severityConfig.color }} />
        </div>
        <div className="flex-1 min-w-0">
          <div className={`${textSize} text-white/90 ${isCompact ? 'line-clamp-2' : ''}`}>
            {message || 'Sin mensaje'}
          </div>
          <div className={`text-white/50 mt-1 capitalize ${isCompact ? 'text-[10px]' : 'text-xs'}`}>
            {severity || 'info'}
          </div>
        </div>
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
      <div className="text-sm font-medium text-white/80 mb-3">{config.title}</div>

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
          <div className="text-center">
            <CheckCircle className="w-12 h-12 mx-auto mb-2 text-green-400/40" />
            <div className="text-white/40 text-sm mb-1">No hay alertas</div>
            <div className="text-white/30 text-xs">Todo está funcionando correctamente</div>
          </div>
        </div>
      )}

      {/* Alerts Content */}
      {!loading && !error && data.length > 0 && (
        <div className="flex-1 overflow-y-auto space-y-2 custom-scrollbar">
          {data.map((item, index) => renderAlert(item, index))}
        </div>
      )}

      {/* Alert count footer */}
      {!loading && !error && data.length > 0 && (
        <div className="text-xs text-white/40 mt-2 pt-2 border-t border-white/5">
          {data.length} alerta{data.length !== 1 ? 's' : ''} activa{data.length !== 1 ? 's' : ''}
          {config.limit && data.length >= config.limit && ` (máximo ${config.limit})`}
        </div>
      )}
    </div>
  );
}

export default AlertsWidget;
