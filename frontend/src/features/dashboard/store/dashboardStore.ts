import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface Widget {
  id: string;
  type: 'kpi' | 'chart' | 'list' | 'quick_actions' | 'alerts' | 'module_stats';
  title: string;
  position: {
    col: number;  // CSS Grid column start
    row: number;  // CSS Grid row start
    colSpan: number; // Columns to span (1-12)
    rowSpan: number; // Rows to span
  };
  config: Record<string, any>;
  dataSource?: {
    endpoint: string;
    refresh?: number;
  };
  theme?: {
    themeName?: string;
    backgroundColor?: string;
    borderColor?: string;
    textColor?: string;
    accentColor?: string;
    customColors?: any;
  };
}

export interface DashboardLayout {
  id: string;
  name: string;
  widgets: Widget[];
  createdAt: Date;
  updatedAt: Date;
}

interface DashboardState {
  // State
  layout: DashboardLayout | null;
  widgets: Widget[];
  isEditing: boolean;
  hasUnsavedChanges: boolean;
  
  // Preview state
  previewWidget: Omit<Widget, 'id'> | null;
  previewPosition: { col: number; row: number } | null;
  isPlacingWidget: boolean; // Nuevo: indica si estamos en modo colocación
  adjustedWidgetPositions: Map<string, { col: number; row: number; colSpan: number; rowSpan: number }> | null; // Posiciones temporales durante colocación
  
  // Widget que acaba de ser agregado y necesita configuración
  newlyAddedWidgetId: string | null;
  
  // Drag state
  draggedWidgetId: string | null;
  draggedWidgetPosition: { col: number; row: number } | null;
  
  // Actions
  setEditing: (editing: boolean) => void;
  findFirstAvailablePosition: (colSpan: number, rowSpan: number) => { col: number; row: number };
  setPreviewWidget: (widget: Omit<Widget, 'id'> | null) => void;
  setPreviewPosition: (position: { col: number; row: number } | null) => void;
  setIsPlacingWidget: (isPlacing: boolean) => void;
  startWidgetPlacement: (widget: Omit<Widget, 'id'>) => void;
  confirmWidgetPlacement: () => void;
  cancelWidgetPlacement: () => void;
  setDraggedWidget: (widgetId: string | null, position: { col: number; row: number } | null) => void;
  addWidget: (widget: Omit<Widget, 'id'>, useAutoPosition?: boolean) => void;
  removeWidget: (id: string) => void;
  updateWidget: (id: string, updates: Partial<Widget>) => void;
  moveWidget: (id: string, position: Widget['position']) => void;
  saveLayout: () => void;
  loadLayout: (layoutId: string) => void;
  clearDashboard: () => void;
}

export const useDashboardStore = create<DashboardState>()(
  persist(
    (set, get) => ({
      // Initial state
      layout: null,
      widgets: [],
      isEditing: false,
      hasUnsavedChanges: false,
      
      // Preview state
      previewWidget: null,
      previewPosition: null,
      isPlacingWidget: false,
      adjustedWidgetPositions: null,
      
      // Widget recién agregado
      newlyAddedWidgetId: null,
      
      // Drag state
      draggedWidgetId: null,
      draggedWidgetPosition: null,

      // Toggle edit mode
      setEditing: (editing) => set({ isEditing: editing }),
      
      // Preview actions
      setPreviewWidget: (widget) => set({ previewWidget: widget }),
      setPreviewPosition: (position) => {
        const { widgets, previewWidget } = get();
        
        if (!position || !previewWidget) {
          set({ previewPosition: position, adjustedWidgetPositions: null });
          return;
        }

        // Calcular posiciones ajustadas para evitar colisiones
        const adjustedPositions = new Map<string, { col: number; row: number; colSpan: number; rowSpan: number }>();
        
        // Función para detectar colisión
        const hasCollision = (
          pos1: { col: number; row: number; colSpan: number; rowSpan: number },
          pos2: { col: number; row: number; colSpan: number; rowSpan: number }
        ): boolean => {
          const colOverlap = !(pos1.col + pos1.colSpan <= pos2.col || pos1.col >= pos2.col + pos2.colSpan);
          const rowOverlap = !(pos1.row + pos1.rowSpan <= pos2.row || pos1.row >= pos2.row + pos2.rowSpan);
          return colOverlap && rowOverlap;
        };

        // Ordenar widgets por fila para procesarlos de arriba a abajo
        const sortedWidgets = [...widgets].sort((a, b) => a.position.row - b.position.row);

        // Procesar cada widget
        sortedWidgets.forEach((widget) => {
          const widgetPos = adjustedPositions.get(widget.id) || widget.position;
          
          // Verificar colisión con preview
          const previewPos = {
            col: position.col,
            row: position.row,
            colSpan: previewWidget.position.colSpan,
            rowSpan: previewWidget.position.rowSpan,
          };
          
          const collides = hasCollision(widgetPos, previewPos);

          if (collides) {
            // Empujar widget hacia abajo
            const newRow = position.row + previewWidget.position.rowSpan;
            adjustedPositions.set(widget.id, {
              col: widgetPos.col,
              row: newRow,
              colSpan: widgetPos.colSpan,
              rowSpan: widgetPos.rowSpan,
            });

            // Verificar colisiones en cascada con otros widgets
            sortedWidgets.forEach((otherWidget) => {
              if (otherWidget.id === widget.id) return;
              
              const otherPos = adjustedPositions.get(otherWidget.id) || otherWidget.position;
              
              const movedPos = {
                col: widgetPos.col,
                row: newRow,
                colSpan: widgetPos.colSpan,
                rowSpan: widgetPos.rowSpan,
              };
              
              const cascadeCollides = hasCollision(otherPos, movedPos);

              if (cascadeCollides && otherPos.row <= newRow) {
                // Empujar este widget también
                adjustedPositions.set(otherWidget.id, {
                  col: otherPos.col,
                  row: newRow + widgetPos.rowSpan,
                  colSpan: otherPos.colSpan,
                  rowSpan: otherPos.rowSpan,
                });
              }
            });
          }
        });

        set({ previewPosition: position, adjustedWidgetPositions: adjustedPositions });
      },
      setIsPlacingWidget: (isPlacing) => set({ isPlacingWidget: isPlacing }),
      
      // Widget placement workflow
      startWidgetPlacement: (widget) => {
        set({ 
          previewWidget: widget, 
          isPlacingWidget: true,
          previewPosition: { col: 1, row: 1 }, // Posición inicial
          adjustedWidgetPositions: null // Limpiar posiciones ajustadas al iniciar
        });
      },
      
      confirmWidgetPlacement: () => {
        const { previewWidget, previewPosition, addWidget, adjustedWidgetPositions, updateWidget } = get();
        
        if (previewWidget && previewPosition) {
          // 1. Guardar las posiciones ajustadas de los widgets empujados PRIMERO
          if (adjustedWidgetPositions) {
            adjustedWidgetPositions.forEach((adjustedPos, widgetId) => {
              updateWidget(widgetId, {
                position: {
                  col: adjustedPos.col,
                  row: adjustedPos.row,
                  colSpan: adjustedPos.colSpan,
                  rowSpan: adjustedPos.rowSpan,
                },
              });
            });
          }
          
          // 2. Añadir el nuevo widget en la posición del preview
          addWidget({
            ...previewWidget,
            position: {
              ...previewWidget.position,
              col: previewPosition.col,
              row: previewPosition.row,
            }
          }, false); // NO auto-posicionar, usar la posición del preview
        }
        
        set({ 
          previewWidget: null, 
          previewPosition: null, 
          isPlacingWidget: false,
          adjustedWidgetPositions: null 
        });
      },
      
      cancelWidgetPlacement: () => set({ 
        previewWidget: null, 
        previewPosition: null, 
        isPlacingWidget: false,
        adjustedWidgetPositions: null 
      }),
      
      // Drag widget - calcular posiciones ajustadas durante el drag
      setDraggedWidget: (widgetId, position) => {
        const { widgets } = get();
        
        if (!widgetId || !position) {
          set({ draggedWidgetId: null, draggedWidgetPosition: null, adjustedWidgetPositions: null });
          return;
        }
        
        const draggedWidget = widgets.find(w => w.id === widgetId);
        if (!draggedWidget) {
          set({ draggedWidgetId: null, draggedWidgetPosition: null, adjustedWidgetPositions: null });
          return;
        }
        
        // Calcular posiciones ajustadas usando la misma lógica que preview
        const adjustedPositions = new Map<string, { col: number; row: number; colSpan: number; rowSpan: number }>();
        
        const hasCollision = (
          pos1: { col: number; row: number; colSpan: number; rowSpan: number },
          pos2: { col: number; row: number; colSpan: number; rowSpan: number }
        ): boolean => {
          const colOverlap = !(pos1.col + pos1.colSpan <= pos2.col || pos1.col >= pos2.col + pos2.colSpan);
          const rowOverlap = !(pos1.row + pos1.rowSpan <= pos2.row || pos1.row >= pos2.row + pos2.rowSpan);
          return colOverlap && rowOverlap;
        };
        
        // Posición del widget arrastrado
        const draggedPos = {
          col: position.col,
          row: position.row,
          colSpan: draggedWidget.position.colSpan,
          rowSpan: draggedWidget.position.rowSpan,
        };
        
        // Ordenar widgets por fila
        const sortedWidgets = [...widgets]
          .filter(w => w.id !== widgetId) // Excluir el widget arrastrado
          .sort((a, b) => a.position.row - b.position.row);
        
        // Procesar colisiones
        sortedWidgets.forEach((widget) => {
          const widgetPos = adjustedPositions.get(widget.id) || widget.position;
          
          const collides = hasCollision(widgetPos, draggedPos);
          
          if (collides) {
            const newRow = position.row + draggedWidget.position.rowSpan;
            adjustedPositions.set(widget.id, {
              col: widgetPos.col,
              row: newRow,
              colSpan: widgetPos.colSpan,
              rowSpan: widgetPos.rowSpan,
            });
            
            // Colisiones en cascada
            sortedWidgets.forEach((otherWidget) => {
              if (otherWidget.id === widget.id) return;
              
              const otherPos = adjustedPositions.get(otherWidget.id) || otherWidget.position;
              
              const movedPos = {
                col: widgetPos.col,
                row: newRow,
                colSpan: widgetPos.colSpan,
                rowSpan: widgetPos.rowSpan,
              };
              
              const cascadeCollides = hasCollision(otherPos, movedPos);
              
              if (cascadeCollides && otherPos.row <= newRow) {
                adjustedPositions.set(otherWidget.id, {
                  col: otherPos.col,
                  row: newRow + widgetPos.rowSpan,
                  colSpan: otherPos.colSpan,
                  rowSpan: otherPos.rowSpan,
                });
              }
            });
          }
        });
        
        set({ 
          draggedWidgetId: widgetId, 
          draggedWidgetPosition: position, 
          adjustedWidgetPositions: adjustedPositions 
        });
      },

      // Encontrar primer espacio disponible en el grid
      findFirstAvailablePosition: (colSpan: number, rowSpan: number): { col: number; row: number } => {
        const { widgets } = get();
        const gridCols = 12;
        const maxRow = 20; // Límite razonable
        
        // Función para verificar si una posición está ocupada
        const isPositionOccupied = (col: number, row: number, colSpan: number, rowSpan: number): boolean => {
          return widgets.some(widget => {
            const w = widget.position;
            // Verificar si hay overlap
            const colOverlap = !(col + colSpan <= w.col || col >= w.col + w.colSpan);
            const rowOverlap = !(row + rowSpan <= w.row || row >= w.row + w.rowSpan);
            return colOverlap && rowOverlap;
          });
        };
        
        // Buscar primera posición disponible fila por fila
        for (let row = 1; row <= maxRow; row++) {
          for (let col = 1; col <= gridCols - colSpan + 1; col++) {
            if (!isPositionOccupied(col, row, colSpan, rowSpan)) {
              return { col, row };
            }
          }
        }
        
        // Si no encuentra espacio, poner al final
        const maxRowUsed = Math.max(0, ...widgets.map(w => w.position.row + w.position.rowSpan - 1));
        return { col: 1, row: maxRowUsed + 1 };
      },

      // Añadir widget con auto-posicionamiento
      addWidget: (widget, useAutoPosition = true) => {
        const { findFirstAvailablePosition } = get();
        
        let finalPosition = widget.position;
        
        // Solo auto-posicionar si useAutoPosition es true
        if (useAutoPosition) {
          const availablePosition = findFirstAvailablePosition(
            widget.position.colSpan,
            widget.position.rowSpan
          );
          finalPosition = {
            ...widget.position,
            col: availablePosition.col,
            row: availablePosition.row,
          };
        }
        
        const newWidget: Widget = {
          ...widget,
          id: `widget-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          position: finalPosition,
        };
        
        set((state) => ({
          widgets: [...state.widgets, newWidget],
          hasUnsavedChanges: true,
          // Marcar como recién agregado para abrir modal de configuración
          newlyAddedWidgetId: newWidget.id,
        }));
      },

      // Remove widget
      removeWidget: (id) =>
        set((state) => ({
          widgets: state.widgets.filter((w) => w.id !== id),
          hasUnsavedChanges: true,
        })),

      // Update widget
      updateWidget: (id, updates) =>
        set((state) => ({
          widgets: state.widgets.map((w) =>
            w.id === id ? { ...w, ...updates } : w
          ),
          hasUnsavedChanges: true,
        })),

      // Move widget (drag & drop)
      moveWidget: (id, position) =>
        set((state) => ({
          widgets: state.widgets.map((w) =>
            w.id === id ? { ...w, position } : w
          ),
          hasUnsavedChanges: true,
        })),

      // Save layout
      saveLayout: () => {
        const state = get();
        const layout: DashboardLayout = {
          id: state.layout?.id || 'admin-dashboard',
          name: state.layout?.name || 'Dashboard Administrativo',
          widgets: state.widgets,
          createdAt: state.layout?.createdAt || new Date(),
          updatedAt: new Date(),
        };

        set({ layout, hasUnsavedChanges: false });
      },

      // Load layout
      loadLayout: (layoutId) => {
        // Esta función se puede extender para cargar desde API
        console.log('Loading layout:', layoutId);
      },

      // Clear all widgets
      clearDashboard: () =>
        set({
          widgets: [],
          hasUnsavedChanges: true,
        }),
    }),
    {
      name: 'dashboard-admin-storage',
      partialize: (state) => ({
        layout: state.layout,
        widgets: state.widgets,
      }),
    }
  )
);
