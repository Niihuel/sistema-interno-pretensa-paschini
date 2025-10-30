import type { ChartWidgetConfig, ChartType } from '../../types/widget.types';
import Input from '../../../../shared/components/ui/Input';
import Select from '../../../../shared/components/ui/Select';
import WidgetDataSourceEditor from './WidgetDataSourceEditor';

interface ChartConfigFormProps {
  config: ChartWidgetConfig;
  onChange: (config: ChartWidgetConfig) => void;
}

const chartTypeOptions: Array<{ value: ChartType; label: string }> = [
  { value: 'bar', label: 'Barras' },
  { value: 'line', label: 'Líneas' },
  { value: 'area', label: 'Área' },
  { value: 'pie', label: 'Torta' },
  { value: 'composed', label: 'Compuesto' },
];

export default function ChartConfigForm({ config, onChange }: ChartConfigFormProps) {
  const updateField = (field: keyof ChartWidgetConfig, value: unknown) => {
    onChange({ ...config, [field]: value });
  };

  const yAxisValue = Array.isArray(config.yAxisKey)
    ? config.yAxisKey.join(', ')
    : config.yAxisKey;

  const handleYAxisChange = (value: string) => {
    if (config.chartType === 'composed') {
      const tokens = value
        .split(',')
        .map((token) => token.trim())
        .filter(Boolean);
      updateField('yAxisKey', tokens.length > 1 ? tokens : tokens[0] ?? '');
    } else {
      updateField('yAxisKey', value);
    }
  };

  const handleDataSourceChange = (partial: Partial<ChartWidgetConfig['dataSource']>) => {
    onChange({
      ...config,
      dataSource: {
        ...config.dataSource,
        ...partial,
      },
    });
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <label className="text-sm font-medium text-white/80">Título</label>
        <Input
          type="text"
          value={config.title}
          onChange={(event) => updateField('title', event.target.value)}
          placeholder="Nombre del gráfico"
        />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-white/80">Tipo de gráfico</label>
        <Select
          value={config.chartType}
          onChange={(event) => updateField('chartType', event.target.value as ChartType)}
          options={chartTypeOptions}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <label className="text-sm font-medium text-white/80">Eje X (campo)</label>
          <Input
            type="text"
            value={config.xAxisKey}
            onChange={(event) => updateField('xAxisKey', event.target.value)}
            placeholder="name"
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium text-white/80">Eje Y (campo)</label>
          <Input
            type="text"
            value={yAxisValue}
            onChange={(event) => handleYAxisChange(event.target.value)}
            placeholder={config.chartType === 'composed' ? 'value1, value2' : 'value'}
          />
          {config.chartType === 'composed' && (
            <p className="text-xs text-white/40">
              Separa con coma para escribir varias series (ej. ventas, compras).
            </p>
          )}
        </div>
      </div>

      <div className="space-y-3 rounded-lg border border-white/10 bg-white/5 p-4">
        <div className="text-sm font-medium text-white/90">Opciones de visualización</div>
        <label className="flex items-center gap-2 text-sm text-white/80">
          <input
            type="checkbox"
            checked={Boolean(config.showLegend)}
            onChange={(event) => updateField('showLegend', event.target.checked)}
            className="h-4 w-4"
          />
          Mostrar leyenda
        </label>
        <label className="flex items-center gap-2 text-sm text-white/80">
          <input
            type="checkbox"
            checked={Boolean(config.showGrid)}
            onChange={(event) => updateField('showGrid', event.target.checked)}
            className="h-4 w-4"
          />
          Mostrar cuadrícula
        </label>
        <label className="flex items-center gap-2 text-sm text-white/80">
          <input
            type="checkbox"
            checked={Boolean(config.animate)}
            onChange={(event) => updateField('animate', event.target.checked)}
            className="h-4 w-4"
          />
          Animaciones suaves
        </label>
      </div>

      <WidgetDataSourceEditor
        value={config.dataSource}
        onChange={(next) => handleDataSourceChange(next)}
        description="Define el origen de datos para el gráfico."
      />
    </div>
  );
}
