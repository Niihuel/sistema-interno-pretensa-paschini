import { useState, useCallback, useRef, useEffect } from 'react';
import { useDashboardStore } from '../store/dashboardStore';

interface UseWidgetResizeOptions {
  widgetId: string;
  minColSpan?: number;
  maxColSpan?: number;
  minRowSpan?: number;
  maxRowSpan?: number;
}

type ResizeDirection = 'nw' | 'n' | 'ne' | 'e' | 'se' | 's' | 'sw' | 'w';

export function useWidgetResize({
  widgetId,
  minColSpan = 2,
  maxColSpan = 12,
  minRowSpan = 1,
  maxRowSpan = 10,
}: UseWidgetResizeOptions) {
  const { updateWidget, widgets } = useDashboardStore();
  const [isResizing, setIsResizing] = useState(false);
  const resizeStartRef = useRef<{ 
    x: number; 
    y: number; 
    colSpan: number; 
    rowSpan: number;
    direction: ResizeDirection | null;
  } | null>(null);

  const widget = widgets.find(w => w.id === widgetId);

  // Función para verificar si hay colisión con otros widgets
  const checkCollision = useCallback((
    col: number,
    row: number,
    colSpan: number,
    rowSpan: number
  ): boolean => {
    return widgets.some(w => {
      if (w.id === widgetId) return false; // Ignorar el mismo widget
      
      const colOverlap = !(col + colSpan <= w.position.col || col >= w.position.col + w.position.colSpan);
      const rowOverlap = !(row + rowSpan <= w.position.row || row >= w.position.row + w.position.rowSpan);
      
      return colOverlap && rowOverlap;
    });
  }, [widgets, widgetId]);

  const handleResizeStart = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!widget) return;

    // Obtener dirección del resize desde el data attribute
    const target = e.currentTarget as HTMLElement;
    const direction = target.getAttribute('data-resize-direction') as ResizeDirection | null;

    setIsResizing(true);
    resizeStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      colSpan: widget.position.colSpan,
      rowSpan: widget.position.rowSpan,
      direction,
    };

    // Añadir clase al body para prevenir selección
    document.body.style.userSelect = 'none';
    
    // Cursor según dirección
    if (direction) {
      document.body.style.cursor = `${direction}-resize`;
    }
  }, [widget]);

  const handleResizeMove = useCallback((e: MouseEvent) => {
    if (!isResizing || !resizeStartRef.current || !widget) return;

    const deltaX = e.clientX - resizeStartRef.current.x;
    const deltaY = e.clientY - resizeStartRef.current.y;
    const direction = resizeStartRef.current.direction;

    // Calcular nuevos spans basado en píxeles movidos
    const PIXELS_PER_COL = 100;
    const PIXELS_PER_ROW = 80;

    const colChange = Math.round(deltaX / PIXELS_PER_COL);
    const rowChange = Math.round(deltaY / PIXELS_PER_ROW);

    let newColSpan = resizeStartRef.current.colSpan;
    let newRowSpan = resizeStartRef.current.rowSpan;

    // Aplicar cambios según la dirección
    if (direction) {
      const canResizeHorizontal = ['e', 'w', 'ne', 'se', 'nw', 'sw'].includes(direction);
      const canResizeVertical = ['n', 's', 'ne', 'se', 'nw', 'sw'].includes(direction);

      if (canResizeHorizontal) {
        const potentialColSpan = Math.max(
          minColSpan,
          Math.min(maxColSpan, resizeStartRef.current.colSpan + colChange)
        );
        
        // Verificar si el nuevo tamaño colisiona con otros widgets
        const wouldCollide = checkCollision(
          widget.position.col,
          widget.position.row,
          potentialColSpan,
          newRowSpan
        );
        
        // Solo aplicar si NO colisiona y NO se sale del grid
        if (!wouldCollide && widget.position.col + potentialColSpan <= 13) {
          newColSpan = potentialColSpan;
        }
      }

      if (canResizeVertical) {
        const potentialRowSpan = Math.max(
          minRowSpan,
          Math.min(maxRowSpan, resizeStartRef.current.rowSpan + rowChange)
        );
        
        // Verificar si el nuevo tamaño colisiona con otros widgets
        const wouldCollide = checkCollision(
          widget.position.col,
          widget.position.row,
          newColSpan,
          potentialRowSpan
        );
        
        // Solo aplicar si NO colisiona
        if (!wouldCollide) {
          newRowSpan = potentialRowSpan;
        }
      }
    }

    // Actualizar widget solo si hay cambios
    if (newColSpan !== widget.position.colSpan || newRowSpan !== widget.position.rowSpan) {
      updateWidget(widgetId, {
        position: {
          ...widget.position,
          colSpan: newColSpan,
          rowSpan: newRowSpan,
        },
      });
    }
  }, [isResizing, widget, widgetId, updateWidget, minColSpan, maxColSpan, minRowSpan, maxRowSpan, checkCollision]);

  const handleResizeEnd = useCallback(() => {
    setIsResizing(false);
    resizeStartRef.current = null;
    
    // Remover estilos del body
    document.body.style.userSelect = '';
    document.body.style.cursor = '';
  }, []);

  // Event listeners
  useEffect(() => {
    if (isResizing) {
      window.addEventListener('mousemove', handleResizeMove);
      window.addEventListener('mouseup', handleResizeEnd);

      return () => {
        window.removeEventListener('mousemove', handleResizeMove);
        window.removeEventListener('mouseup', handleResizeEnd);
      };
    }
  }, [isResizing, handleResizeMove, handleResizeEnd]);

  return {
    isResizing,
    handleResizeStart,
  };
}
