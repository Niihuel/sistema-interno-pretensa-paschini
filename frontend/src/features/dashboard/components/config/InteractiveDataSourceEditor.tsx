import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Database, TrendingUp, List, Activity } from 'lucide-react';
import { apiClient } from '../../../../api/client';
import Select from '../../../../shared/components/ui/Select';
import Input from '../../../../shared/components/ui/Input';

interface Module {
  id: string;
  label: string;
  endpoint: string;
  fields: Array<{
    id: string;
    label: string;
    type: 'number' | 'chart' | 'list' | 'group';
  }>;
}

interface InteractiveDataSourceEditorProps {
  widgetType: 'kpi' | 'chart' | 'list';
  value: {
    module?: string;
    endpoint?: string;
    field?: string;
    refresh?: number;
    // Para charts
    chartType?: string;
    xAxisKey?: string;
    yAxisKey?: string | string[];
  };
  onChange: (value: any) => void;
}

export default function InteractiveDataSourceEditor({
  widgetType,
  value,
  onChange,
}: InteractiveDataSourceEditorProps) {
  const [selectedModuleId, setSelectedModuleId] = useState<string>(value.module || '');
  const [selectedFieldId, setSelectedFieldId] = useState<string>(value.field || '');

  // Cargar metadata de módulos disponibles
  const { data: metadata, isLoading } = useQuery({
    queryKey: ['widget-config-metadata'],
    queryFn: async () => {
      const response = await apiClient.get('/dashboard/widget-config-metadata');
      return response.data as { modules: Module[] };
    },
    staleTime: 5 * 60 * 1000, // Cache por 5 minutos
  });

  const modules = metadata?.modules || [];
  const selectedModule = modules.find((m) => m.id === selectedModuleId);
  
  // Filtrar campos según tipo de widget
  const availableFields = selectedModule?.fields.filter((field) => {
    if (widgetType === 'kpi') {
      return field.type === 'number';
    } else if (widgetType === 'chart') {
      return field.type === 'chart';
    } else if (widgetType === 'list') {
      return field.type === 'list';
    }
    return true;
  }) || [];

  const handleModuleChange = (moduleId: string) => {
    setSelectedModuleId(moduleId);
    setSelectedFieldId(''); // Reset field selection
    
    const module = modules.find((m) => m.id === moduleId);
    if (module) {
      onChange({
        ...value,
        module: module.id,
        endpoint: module.endpoint,
        field: '',
      });
    }
  };

  const handleFieldChange = (fieldId: string) => {
    setSelectedFieldId(fieldId);
    onChange({
      ...value,
      field: fieldId,
    });
  };

  const handleRefreshChange = (refreshValue: string) => {
    const parsed = Number.parseInt(refreshValue, 10);
    onChange({
      ...value,
      refresh: Number.isFinite(parsed) && parsed > 0 ? parsed : undefined,
    });
  };

  const handleChartTypeChange = (chartType: string) => {
    onChange({
      ...value,
      chartType,
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Activity className="w-6 h-6 animate-spin text-blue-400" />
        <span className="ml-2 text-white/60">Cargando módulos...</span>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-2 text-white/80">
        <Database className="w-5 h-5 text-blue-400" />
        <h3 className="font-semibold">Fuente de Datos</h3>
      </div>

      {/* Selector de Módulo */}
      <div className="space-y-2">
        <label className="text-sm text-white/70">
          Módulo del Sistema
        </label>
        <Select
          value={selectedModuleId}
          onChange={(e) => handleModuleChange(e.target.value)}
          options={[
            { value: '', label: 'Selecciona un módulo...' },
            ...modules.map((module) => ({
              value: module.id,
              label: module.label,
            })),
          ]}
        />
        <p className="text-xs text-white/40">
          Elige de qué parte del sistema quieres obtener datos
        </p>
      </div>

      {/* Selector de Campo */}
      {selectedModule && availableFields.length > 0 && (
        <div className="space-y-2">
          <label className="text-sm text-white/70">
            {widgetType === 'kpi' && 'Métrica a Mostrar'}
            {widgetType === 'chart' && 'Datos para Gráfico'}
            {widgetType === 'list' && 'Lista a Mostrar'}
          </label>
          <Select
            value={selectedFieldId}
            onChange={(e) => handleFieldChange(e.target.value)}
            options={[
              { value: '', label: 'Selecciona un campo...' },
              ...availableFields.map((field) => ({
                value: field.id,
                label: field.label,
              })),
            ]}
          />
          {selectedFieldId && (
            <div className="mt-2 px-3 py-2 rounded-lg bg-blue-500/10 border border-blue-500/20">
              <p className="text-xs text-blue-300">
                📊 Se obtendrán datos desde: <code className="text-blue-200 font-mono">{selectedModule.endpoint}</code>
              </p>
            </div>
          )}
        </div>
      )}

      {/* Selector de Tipo de Gráfico (solo para chart widgets) */}
      {widgetType === 'chart' && selectedFieldId && (
        <div className="space-y-2">
          <label className="text-sm text-white/70 flex items-center gap-2">
            <TrendingUp className="w-4 h-4" />
            Tipo de Gráfico
          </label>
          <Select
            value={value.chartType || 'bar'}
            onChange={(e) => handleChartTypeChange(e.target.value)}
            options={[
              { value: 'bar', label: '📊 Barras' },
              { value: 'line', label: '📈 Líneas' },
              { value: 'area', label: '📉 Área' },
              { value: 'pie', label: '🍩 Circular' },
              { value: 'composed', label: '📊 Combinado' },
            ]}
          />
        </div>
      )}

      {/* Auto-refresh */}
      <div className="space-y-2">
        <label className="text-sm text-white/70">
          Actualización Automática
        </label>
        <div className="flex items-center gap-2">
          <Input
            type="number"
            value={value.refresh || 60}
            onChange={(e) => handleRefreshChange(e.target.value)}
            placeholder="60"
            min="10"
            step="10"
          />
          <span className="text-sm text-white/60">segundos</span>
        </div>
        <p className="text-xs text-white/40">
          Los datos se actualizarán automáticamente cada {value.refresh || 60} segundos
        </p>
      </div>

      {/* Preview Info */}
      {selectedModule && selectedFieldId && (
        <div className="mt-4 p-4 rounded-lg bg-white/5 border border-white/10">
          <div className="text-xs font-medium text-white/60 mb-2">CONFIGURACIÓN ACTUAL</div>
          <div className="space-y-1 text-xs text-white/80">
            <div><span className="text-white/50">Módulo:</span> {selectedModule.label}</div>
            <div><span className="text-white/50">Campo:</span> {availableFields.find(f => f.id === selectedFieldId)?.label}</div>
            <div><span className="text-white/50">Endpoint:</span> <code className="text-blue-300">{selectedModule.endpoint}</code></div>
            {widgetType === 'chart' && value.chartType && (
              <div><span className="text-white/50">Tipo:</span> {value.chartType}</div>
            )}
          </div>
        </div>
      )}

      {/* Empty State */}
      {modules.length === 0 && !isLoading && (
        <div className="py-8 text-center">
          <List className="w-12 h-12 mx-auto text-white/20 mb-3" />
          <p className="text-white/40 text-sm">
            No hay módulos disponibles
          </p>
        </div>
      )}
    </div>
  );
}
