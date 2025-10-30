import type { WidgetConfigPreset } from '../../config/widgetConfigPresets';

interface WidgetPresetSelectorProps {
  presets: WidgetConfigPreset[];
  selectedPresetId?: string;
  onSelect: (preset: WidgetConfigPreset) => void;
}

export default function WidgetPresetSelector({
  presets,
  selectedPresetId,
  onSelect,
}: WidgetPresetSelectorProps) {
  if (presets.length === 0) {
    return (
      <div className="rounded-lg border border-slate-800 bg-slate-900/70 px-4 py-3 text-sm text-slate-300">
        No hay configuraciones rápidas disponibles para este tipo de widget.
      </div>
    );
  }

  return (
    <div className="grid gap-3 md:grid-cols-2">
      {presets.map((preset) => {
        const isActive = preset.id === selectedPresetId;
        return (
          <button
            key={preset.id}
            type="button"
            onClick={() => onSelect(preset)}
            className={`rounded-lg border px-4 py-3 text-left transition-colors ${
              isActive
                ? 'border-indigo-400 bg-indigo-500/15 text-white shadow-sm'
                : 'border-slate-800 bg-slate-900/60 text-slate-200 hover:border-slate-600 hover:bg-slate-900'
            }`}
          >
            <div className="flex items-baseline justify-between gap-2">
              <h4 className="text-sm font-semibold">{preset.name}</h4>
              {isActive && (
                <span className="rounded-full bg-indigo-500/20 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-indigo-200">
                  activo
                </span>
              )}
            </div>
            <p className="mt-1 text-xs text-slate-400">{preset.description}</p>
          </button>
        );
      })}
    </div>
  );
}
