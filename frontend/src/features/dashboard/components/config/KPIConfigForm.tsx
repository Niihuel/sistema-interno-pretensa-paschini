import type { KPIWidgetConfig } from '../../types/widget.types';
import Input from '../../../../shared/components/ui/Input';
import Select from '../../../../shared/components/ui/Select';
import WidgetDataSourceEditor from './WidgetDataSourceEditor';

interface KPIConfigFormProps {
  config: KPIWidgetConfig;
  onChange: (config: KPIWidgetConfig) => void;
}

export default function KPIConfigForm({ config, onChange }: KPIConfigFormProps) {
  const updateField = (field: keyof KPIWidgetConfig, value: unknown) => {
    onChange({ ...config, [field]: value });
  };

  const updateTrend = (partial: Partial<NonNullable<KPIWidgetConfig['trend']>>) => {
    onChange({
      ...config,
      trend: {
        value: config.trend?.value ?? 0,
        direction: config.trend?.direction ?? 'neutral',
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
          placeholder="Nombre del KPI"
        />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-white/80">Valor inicial</label>
        <Input
          type="number"
          value={Number(config.value) || 0}
          onChange={(event) => updateField('value', Number(event.target.value) || 0)}
          placeholder="0"
        />
        <p className="text-xs text-white/40">
          Valor que se mostrará cuando aún no haya datos del endpoint configurado.
        </p>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-white/80">Ícono (emoji)</label>
        <Input
          type="text"
          value={config.icon || ''}
          onChange={(event) => updateField('icon', event.target.value)}
          placeholder="⭐"
          maxLength={2}
        />
      </div>

      <WidgetDataSourceEditor
        value={config.dataSource}
        onChange={(next) => onChange({ ...config, dataSource: next })}
      />

      <div className="space-y-3 rounded-lg border border-white/10 bg-white/5 p-4">
        <div className="text-sm font-medium text-white/90">Tendencia</div>

        <div className="space-y-2">
          <label className="text-xs text-white/60">Valor (%)</label>
          <Input
            type="number"
            value={config.trend?.value ?? 0}
            onChange={(event) => updateTrend({ value: Number(event.target.value) || 0 })}
            placeholder="0"
          />
        </div>

        <div className="space-y-2">
          <label className="text-xs text-white/60">Dirección</label>
          <Select
            value={config.trend?.direction || 'neutral'}
            onChange={(event) =>
              updateTrend({ direction: event.target.value as 'up' | 'down' | 'neutral' })
            }
            options={[
              { value: 'up', label: 'Arriba (positivo)' },
              { value: 'down', label: 'Abajo (negativo)' },
              { value: 'neutral', label: 'Neutral' },
            ]}
          />
        </div>
      </div>
    </div>
  );
}
