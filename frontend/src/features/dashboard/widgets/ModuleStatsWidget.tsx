import { RefreshCw, TrendingUp, ArrowRight } from 'lucide-react';
import type { BaseWidgetProps, ModuleStatsWidgetConfig } from '../types/widget.types';
import { useState, useEffect } from 'react';
import { apiClient } from '../../../api/client';
import { Link } from 'react-router-dom';

export function ModuleStatsWidget({ widget, onEdit: _onEdit, onDelete: _onDelete, onRefresh: _onRefresh, isEditing: _isEditing }: BaseWidgetProps) {
  const config = widget.config as ModuleStatsWidgetConfig;
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    if (!config.dataSource?.endpoint) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await apiClient.get(config.dataSource.endpoint);
      setData(response.data);
    } catch (err: any) {
      setError(err.message || 'Error cargando datos');
      console.error('Module Stats Widget error:', err);
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

  const getStatValue = (statLabel: string): string | number => {
    if (!data) return 0;

    // Try to find the stat in the API response
    // Support both array and object formats
    if (Array.isArray(data)) {
      const stat = data.find((s) => s.label === statLabel);
      return stat?.value || 0;
    }

    // If data is an object, try to find by key
    return data[statLabel] || 0;
  };

  const renderStat = (stat: any, index: number) => {
    const value = data ? getStatValue(stat.label) : stat.value;
    const color = stat.color || widget.theme?.accentColor || '#3b82f6';
    const hasLink = !!stat.link;

    const content = (
      <div
        className="flex flex-col p-4 rounded-lg border transition-all"
        style={{
          backgroundColor: `${color}10`,
          borderColor: `${color}30`,
        }}
      >
        <div className="flex items-start justify-between mb-2">
          <div className="text-xs text-white/60">{stat.label}</div>
          {hasLink && (
            <ArrowRight className="w-4 h-4 text-white/40 transition-transform group-hover:translate-x-1" />
          )}
        </div>
        <div className="text-2xl font-bold" style={{ color }}>
          {value}
        </div>
      </div>
    );

    if (hasLink) {
      return (
        <Link key={index} to={stat.link} className="group">
          {content}
        </Link>
      );
    }

    return <div key={index}>{content}</div>;
  };

  return (
    <div
      className="h-full rounded-xl border border-white/10 p-4 flex flex-col relative"
      style={{
        backgroundColor: widget.theme?.backgroundColor || 'rgba(255, 255, 255, 0.05)',
        borderColor: widget.theme?.borderColor || 'rgba(255, 255, 255, 0.1)',
        color: widget.theme?.textColor || 'white',
      }}
    >
      {/* Title */}
      <div className="text-sm font-medium text-white/80 mb-4">{config.title}</div>

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

      {/* Stats Grid */}
      {!loading && !error && (
        <div className="flex-1 grid grid-cols-2 gap-3 auto-rows-min">
          {config.stats.map((stat, index) => renderStat(stat, index))}
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && config.stats.length === 0 && (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="text-white/40 text-sm mb-1">Sin estadísticas configuradas</div>
            <div className="text-white/30 text-xs">Añade estadísticas desde la configuración</div>
          </div>
        </div>
      )}

      {/* Module Footer */}
      {!loading && !error && config.stats.length > 0 && (
        <div className="text-xs text-white/40 mt-3 pt-3 border-t border-white/5 flex items-center gap-2">
          <TrendingUp className="w-3.5 h-3.5" />
          <span>Módulo: {config.module}</span>
        </div>
      )}
    </div>
  );
}

export default ModuleStatsWidget;
