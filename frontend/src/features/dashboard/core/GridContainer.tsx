import { useState, useEffect } from 'react';
import { AnimatePresence } from 'framer-motion';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  arrayMove,
} from '@dnd-kit/sortable';
import { useDashboardStore } from '../store/dashboardStore';
import { GridCell } from './GridCell';
import { WidgetPreview } from '../components/WidgetPreview';
import WidgetConfigModal from '../components/WidgetConfigModal';
import { LayoutGrid } from 'lucide-react';

export function GridContainer() {
  const { widgets, isEditing, updateWidget, previewWidget, previewPosition, setDraggedWidget, newlyAddedWidgetId } = useDashboardStore();
  const [activeId, setActiveId] = useState<string | null>(null);
  const [widgetToConfig, setWidgetToConfig] = useState<any | null>(null);
  
  // Detectar widget recién agregado y abrir modal automáticamente
  useEffect(() => {
    if (newlyAddedWidgetId) {
      const widget = widgets.find(w => w.id === newlyAddedWidgetId);
      if (widget) {
        // Pequeño delay para que el usuario vea el widget agregado
        setTimeout(() => {
          setWidgetToConfig(widget);
          // Limpiar el flag
          useDashboardStore.setState({ newlyAddedWidgetId: null });
        }, 300);
      }
    }
  }, [newlyAddedWidgetId, widgets]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // Prevent accidental drags
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragStart = (event: any) => {
    const widgetId = event.active.id as string;
    setActiveId(widgetId);
    const widget = widgets.find(w => w.id === widgetId);
    if (widget) {
      setDraggedWidget(widgetId, { col: widget.position.col, row: widget.position.row });
    }
  };

  const handleDragMove = (event: any) => {
    if (!activeId) return;
    
    const widget = widgets.find(w => w.id === activeId);
    if (!widget) return;
    
    // No hay over durante el drag, usar delta acumulado del active
    if (event.active && event.active.rect && event.active.rect.current && event.active.rect.current.initial) {
      const gridContainer = document.querySelector('[data-grid-container]');
      if (!gridContainer) return;
      
      const gridRect = gridContainer.getBoundingClientRect();
      const activeRect = event.active.rect.current.translated;
      
      if (!activeRect) return;
      
      // Calcular posición relativa al grid
      const relativeX = activeRect.left - gridRect.left;
      const relativeY = activeRect.top - gridRect.top;
      
      // Calcular columna y fila
      const gridCols = 12;
      const colWidth = gridRect.width / gridCols;
      const rowHeight = 80 + 16; // auto-rows-[80px] + gap-4
      
      const newCol = Math.max(1, Math.min(gridCols - widget.position.colSpan + 1, Math.floor(relativeX / colWidth) + 1));
      const newRow = Math.max(1, Math.floor(relativeY / rowHeight) + 1);
      
      setDraggedWidget(activeId, { col: newCol, row: newRow });
    }
  };

  const handleDragEnd = (event: any) => {
    const { active } = event;
    
    const { draggedWidgetPosition, adjustedWidgetPositions } = useDashboardStore.getState();
    
    if (!active?.id) {
      // Limpieza de emergencia si no hay active
      setActiveId(null);
      setDraggedWidget(null, null);
      return;
    }
    
    // Capturar estados ANTES de limpiar
    const savedDraggedPosition = draggedWidgetPosition;
    const savedAdjustedPositions = adjustedWidgetPositions;
    
    // Limpiar INMEDIATAMENTE para evitar bugs de invisibilidad
    setActiveId(null);
    setDraggedWidget(null, null);
    
    // 1. Guardar la posición del widget arrastrado
    if (savedDraggedPosition) {
      const widget = widgets.find(w => w.id === active.id);
      if (widget) {
        updateWidget(active.id, {
          position: {
            ...widget.position,
            col: savedDraggedPosition.col,
            row: savedDraggedPosition.row,
          },
        });
      }
    }
    
    // 2. Guardar las posiciones ajustadas de los widgets empujados
    if (savedAdjustedPositions) {
      savedAdjustedPositions.forEach((adjustedPos, widgetId) => {
        if (widgetId !== active.id) { // No actualizar el widget arrastrado dos veces
          updateWidget(widgetId, {
            position: {
              col: adjustedPos.col,
              row: adjustedPos.row,
              colSpan: adjustedPos.colSpan,
              rowSpan: adjustedPos.rowSpan,
            },
          });
        }
      });
    }
  };

  const activeWidget = widgets.find((w) => w.id === activeId);

  const handleDragCancel = () => {
    // Limpiar estado si el drag se cancela
    setActiveId(null);
    setDraggedWidget(null, null);
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragMove={handleDragMove}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
    >
      {/* CSS Grid - 12 columnas - SIEMPRE renderizar para que el overlay lo encuentre */}
      <div
        data-grid-container
        className="grid grid-cols-12 auto-rows-[80px] gap-4"
        style={{
          minHeight: 'calc(100vh - 200px)',
        }}
      >
        <SortableContext items={widgets.map((w) => w.id)}>
          {widgets.map((widget) => (
            <GridCell
              key={widget.id}
              widget={widget}
              isEditing={isEditing}
              isDragging={activeId === widget.id}
            />
          ))}
        </SortableContext>
        
        {/* Widget Preview - Mostrar cuando hay un widget en preview */}
        <AnimatePresence>
          {previewWidget && previewPosition && (
            <WidgetPreview
              widget={previewWidget}
              position={previewPosition}
            />
          )}
        </AnimatePresence>
      </div>

      {/* Drag Overlay - Preview suave y elegante */}
      <DragOverlay 
        dropAnimation={{
          duration: 300,
          easing: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
        }}
      >
        {activeWidget && (
          <div 
            className="cursor-grabbing"
            style={{
              width: `${activeWidget.position.colSpan * 100}px`,
              minHeight: `${activeWidget.position.rowSpan * 96}px`,
              filter: 'drop-shadow(0 20px 40px rgba(59, 130, 246, 0.4))',
            }}
          >
            <div className="relative rounded-xl border border-blue-400/60 bg-gradient-to-br from-slate-800/95 to-slate-900/95 backdrop-blur-2xl overflow-hidden">
              {/* Brillo sutil */}
              <div className="absolute inset-0 bg-gradient-to-br from-blue-400/10 via-transparent to-transparent" />
              
              {/* Badge de tamaño - más sutil */}
              <div className="absolute top-3 right-3 bg-blue-500/80 text-white text-xs px-2.5 py-1 rounded-lg font-medium shadow-lg backdrop-blur-sm">
                {activeWidget.position.colSpan} × {activeWidget.position.rowSpan}
              </div>
              
              {/* Contenido del widget SIN emoji */}
              <div className="relative p-6">
                <div className="mb-4">
                  <h3 className="text-base font-semibold text-white/90 mb-1">
                    {activeWidget.title}
                  </h3>
                  <div className="text-xs text-blue-300/70 font-medium">
                    {activeWidget.type === 'kpi' ? 'Indicador' : 'Widget'}
                  </div>
                </div>
                
                {activeWidget.type === 'kpi' && (
                  <div className="space-y-2">
                    <div className="text-3xl font-bold text-white">
                      {activeWidget.config.value || '---'}
                    </div>
                    {activeWidget.config.change && (
                      <div className={`text-sm font-medium ${
                        activeWidget.config.change.startsWith('+') || activeWidget.config.change.startsWith('-12') 
                          ? 'text-red-400' 
                          : 'text-green-400'
                      }`}>
                        {activeWidget.config.change}
                      </div>
                    )}
                  </div>
                )}
              </div>
              
              {/* Indicador de movimiento */}
              <div className="absolute bottom-3 left-1/2 -translate-x-1/2 bg-white/10 text-white/60 px-3 py-1 rounded-full text-xs font-medium backdrop-blur-sm">
                Moviendo...
              </div>
            </div>
          </div>
        )}
      </DragOverlay>
      
      {/* Modal de Configuración Automático */}
      {widgetToConfig && (
        <WidgetConfigModal
          widget={widgetToConfig}
          onClose={() => setWidgetToConfig(null)}
          defaultTab="data"
        />
      )}
    </DndContext>
  );
}
