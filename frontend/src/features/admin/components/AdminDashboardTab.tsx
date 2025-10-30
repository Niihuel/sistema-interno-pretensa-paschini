import { useState, useEffect } from 'react';
import { useBlocker } from 'react-router-dom';
import { useDashboardStore } from '../../dashboard/store/dashboardStore';
import { GridContainer } from '../../dashboard/core/GridContainer';
import { WidgetPicker } from '../../dashboard/components/WidgetPicker';
import { WidgetPlacementOverlay } from '../../dashboard/components/WidgetPlacementOverlay';
import ConfirmDialog from '../../../shared/components/ui/ConfirmDialog';
import { Edit3, Plus, Save, LayoutDashboard, Settings } from 'lucide-react';
import { cn } from '../../../shared/utils/cn';

export default function AdminDashboardTab() {
  const { isEditing, setEditing, saveLayout, hasUnsavedChanges, cancelWidgetPlacement, widgets } = useDashboardStore();
  const [showWidgetPicker, setShowWidgetPicker] = useState(false);

  // Prevenir navegación si hay cambios sin guardar
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsavedChanges]);

  // Bloquear navegación interna si hay cambios sin guardar
  const blocker = useBlocker(
    ({ currentLocation, nextLocation }) =>
      hasUnsavedChanges && currentLocation.pathname !== nextLocation.pathname
  );

  const handleCloseWidgetPicker = () => {
    const { isPlacingWidget: placing } = useDashboardStore.getState();
    if (!placing) {
      cancelWidgetPlacement();
    }
    setShowWidgetPicker(false);
  };

  const handleToggleEdit = () => {
    if (isEditing) {
      cancelWidgetPlacement();
    }
    setEditing(!isEditing);
  };

  const handleSave = () => {
    saveLayout();
  };

  return (
    <div className="text-white">
      {/* Widget Picker Modal */}
      {showWidgetPicker && (
        <WidgetPicker onClose={handleCloseWidgetPicker} />
      )}

      {/* Widget Placement Overlay */}
      <WidgetPlacementOverlay />

      {/* Empty State - Mostrar cuando no hay widgets y NO está colocando */}
      {widgets.length === 0 && !isEditing ? (
        <div className="flex items-center justify-center min-h-[500px]">
          <div className="text-center max-w-md">
            <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center">
              <LayoutDashboard className="w-10 h-10 text-white/40" />
            </div>
            
            <h2 className="text-2xl font-bold text-white mb-3">
              Configura tu Dashboard aquí
            </h2>
            
            <p className="text-white/60 mb-8">
              Personaliza tu panel de control con widgets y métricas relevantes para tu gestión
            </p>
            
            <button
              onClick={() => {
                setEditing(true);
                setShowWidgetPicker(true);
              }}
              className="flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all duration-200 bg-white/10 text-white border-2 border-white/20 shadow-lg hover:bg-white/15 mx-auto"
            >
              <Settings className="w-4 h-4" />
              <span>Ir a Configuración</span>
            </button>
          </div>
        </div>
      ) : (
        /* Dashboard con widgets o modo edición activo */
        <div>
          {/* Header con controles - Solo mostrar si hay widgets */}
          {widgets.length > 0 && (
            <div className="flex items-center justify-between mb-6">
              <div>
                <p className="text-white/70">
                  Modo edición {isEditing ? 'activo' : 'inactivo'}
                  {hasUnsavedChanges && (
                    <span className="ml-2 rounded-md border border-amber-400/40 bg-amber-500/10 px-2 py-0.5 text-xs text-amber-200">
                      Cambios sin guardar
                    </span>
                  )}
                </p>
              </div>

              <div className="flex items-center gap-2">
              {/* Botón Editar/Finalizar */}
              <button
                onClick={handleToggleEdit}
                className={cn(
                  "flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium transition-all duration-200 whitespace-nowrap",
                  isEditing
                    ? "bg-white/10 text-white border-2 border-white/20 shadow-lg"
                    : "bg-white/5 text-white/60 border border-white/10 hover:bg-white/10 hover:text-white hover:border-white/20"
                )}
              >
                <Edit3 className="w-4 h-4" />
                <span className="text-sm">{isEditing ? 'Finalizar edición' : 'Editar'}</span>
              </button>

              {/* Botón Añadir Widget */}
              {isEditing && (
                <button
                  onClick={() => setShowWidgetPicker(!showWidgetPicker)}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium transition-all duration-200 whitespace-nowrap bg-white/10 text-white border-2 border-white/20 shadow-lg hover:bg-white/15"
                >
                  <Plus className="w-4 h-4" />
                  <span className="text-sm">Añadir widget</span>
                </button>
              )}

              {/* Botón Guardar */}
              {isEditing && hasUnsavedChanges && (
                <button
                  onClick={handleSave}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium transition-all duration-200 whitespace-nowrap bg-white/10 text-white border-2 border-white/20 shadow-lg hover:bg-white/15"
                >
                  <Save className="w-4 h-4" />
                  <span className="text-sm">Guardar</span>
                </button>
              )}
            </div>
          </div>
          )}

          {/* Grid Container */}
          <GridContainer />
        </div>
      )}

      {/* Dialog de confirmación para navegación */}
      <ConfirmDialog
        isOpen={blocker.state === 'blocked'}
        onClose={() => {
          // Al hacer clic en "Cancelar" o cerrar, quedarse en la página
          blocker.reset?.();
        }}
        onConfirm={() => {
          // Al hacer clic en "Guardar", guardar y continuar
          saveLayout();
          blocker.proceed?.();
        }}
        title="¿Guardar cambios?"
        message="Tienes cambios sin guardar en el dashboard. ¿Deseas guardarlos antes de continuar?"
        confirmText="Guardar"
        cancelText="Descartar"
        variant="default"
      />
    </div>
  );
}
