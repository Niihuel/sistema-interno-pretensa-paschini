import type { WidgetDataSource } from '../../types/widget.types';
import Input from '../../../../shared/components/ui/Input';

interface WidgetDataSourceEditorProps {
  value: WidgetDataSource;
  onChange: (value: WidgetDataSource) => void;
  description?: string;
}

export default function WidgetDataSourceEditor({
  value,
  onChange,
  description,
}: WidgetDataSourceEditorProps) {
  const handleStringChange = (field: 'module' | 'endpoint', newValue: string) => {
    onChange({
      ...value,
      [field]: newValue,
    });
  };

  const handleRefreshChange = (inputValue: string) => {
    const parsed = Number.parseInt(inputValue, 10);
    onChange({
      ...value,
      refresh: Number.isFinite(parsed) ? parsed : 0,
    });
  };

  return (
    <div className="space-y-3 rounded-lg border border-white/10 bg-white/5 p-4">
      <div className="text-sm font-medium text-white/90">Fuente de datos (API)</div>
      {description && <p className="text-xs text-white/50">{description}</p>}

      <div className="space-y-2">
        <label className="text-xs text-white/60">Módulo</label>
        <Input
          type="text"
          value={value.module}
          onChange={(event) => handleStringChange('module', event.target.value)}
          placeholder="tickets, employees, etc."
        />
      </div>

      <div className="space-y-2">
        <label className="text-xs text-white/60">Endpoint</label>
        <Input
          type="text"
          value={value.endpoint}
          onChange={(event) => handleStringChange('endpoint', event.target.value)}
          placeholder="/api/module/stats"
        />
      </div>

      <div className="space-y-2">
        <label className="text-xs text-white/60">Auto-refresco (segundos)</label>
        <Input
          type="number"
          value={value.refresh ?? 0}
          onChange={(event) => handleRefreshChange(event.target.value)}
          placeholder="0 = desactivado"
        />
      </div>
    </div>
  );
}
