import { Plus, Edit3, Save, LayoutGrid } from 'lucide-react';
import ToolbarMenu from './ToolbarMenu';

interface DashboardToolbarProps {
  isEditing: boolean;
  onToggleEdit: () => void;
  onAddWidget: () => void;
  onSave: () => void;
  onExport: () => void;
  onImport: () => void;
  hasUnsavedChanges?: boolean;
  onCustomizeTheme?: () => void;
}

const buttonBaseClasses =
  'flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-950';

export default function DashboardToolbar({
  isEditing,
  onToggleEdit,
  onAddWidget,
  onSave,
  onExport,
  onImport,
  hasUnsavedChanges = false,
  onCustomizeTheme,
}: DashboardToolbarProps) {
  return (
    <div className="flex items-center justify-between border-b border-white/10 bg-white/5 backdrop-blur-xl px-5 py-4">
      <div className="flex items-center gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-lg border border-white/10 bg-white/5">
          <LayoutGrid className="h-5 w-5 text-white/90" />
        </span>
        <div>
          <h1 className="text-lg font-semibold text-white">Dashboard Administrativo</h1>
          <p className="text-xs text-white/60">
            {isEditing ? 'Modo edición activo' : 'Modo visualización'}
            {hasUnsavedChanges && (
              <span className="ml-2 rounded-md border border-amber-400/40 bg-amber-500/10 px-2 py-0.5 text-amber-200">
                Cambios sin guardar
              </span>
            )}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={onToggleEdit}
          className={`${buttonBaseClasses} ${
            isEditing
              ? 'border border-indigo-500/40 bg-indigo-500 text-white hover:bg-indigo-400 focus:ring-indigo-400/60'
              : 'border border-white/10 bg-white/5 text-white hover:border-white/20 hover:bg-white/10 focus:ring-white/20 backdrop-blur-sm'
          }`}
        >
          <Edit3 className="h-4 w-4" />
          <span>{isEditing ? 'Finalizar edición' : 'Editar'}</span>
        </button>

        {isEditing && (
          <button
            onClick={onAddWidget}
            className={`${buttonBaseClasses} border border-emerald-500/40 bg-emerald-500 text-white hover:bg-emerald-400 focus:ring-emerald-400/50`}
          >
            <Plus className="h-4 w-4" />
            <span>Añadir widget</span>
          </button>
        )}

        {isEditing && hasUnsavedChanges && (
          <button
            onClick={onSave}
            className={`${buttonBaseClasses} border border-amber-500/60 bg-amber-500 text-white hover:bg-amber-400 focus:ring-amber-400/60`}
          >
            <Save className="h-4 w-4" />
            <span>Guardar</span>
          </button>
        )}

        <div className="h-8 w-px bg-white/10" />

        <ToolbarMenu onExport={onExport} onImport={onImport} onCustomizeTheme={onCustomizeTheme} />
      </div>
    </div>
  );
}
