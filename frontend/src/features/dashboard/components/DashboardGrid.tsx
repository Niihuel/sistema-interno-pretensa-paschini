import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import GridLayout, { type Layout } from 'react-grid-layout';
import type { Widget } from '../types/widget.types';
import {
  KPIWidget,
  ChartWidget,
  ListWidget,
  QuickActionsWidget,
  AlertsWidget,
  ModuleStatsWidget,
} from '../widgets';
import WidgetThemeWrapper from './WidgetThemeWrapper';
import ResizeOverlay from './ResizeOverlay';
import GridVisualizer from './GridVisualizer';
import { useGridSystem } from '../hooks/useGridSystem';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';
import '../styles/dashboard-grid.css';

interface DashboardGridProps {
  widgets: Widget[];
  previewWidget?: Widget | null;
  isDraggingPreview?: boolean;
  isEditing: boolean;
  onLayoutChange?: (widgets: Widget[]) => void;
  onWidgetEdit?: (widget: Widget) => void;
  onWidgetDelete?: (widgetId: string) => void;
  onWidgetRefresh?: (widgetId: string) => void;
  onWidgetContextMenu?: (e: React.MouseEvent, widget: Widget) => void;
  cols?: number;
  rowHeight?: number;
}

export default function DashboardGrid({
  widgets,
  previewWidget,
  isDraggingPreview,
  isEditing,
  onLayoutChange,
  onWidgetEdit,
  onWidgetDelete,
  onWidgetRefresh,
  onWidgetContextMenu,
  cols = 12,
  rowHeight = 80,
}: DashboardGridProps) {
  // Estado para el resize
  const [resizingWidget, setResizingWidget] = useState<{
    widget: Widget;
    size: { w: number; h: number };
    gridPosition: { x: number; y: number };
    position?: { x: number; y: number };
  } | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState<number>(1200);
  const [draggingWidget, setDraggingWidget] = useState<{
    widget: Widget;
    size: { w: number; h: number };
    gridPosition: { x: number; y: number };
  } | null>(null);

  const addBodyClass = (className: string) => {
    if (typeof document === 'undefined') return;
    document.body.classList.add(className);
  };

  const removeBodyClass = (className: string) => {
    if (typeof document === 'undefined') return;
    document.body.classList.remove(className);
  };

  useEffect(() => {
    if (
      typeof window === 'undefined' ||
      typeof ResizeObserver === 'undefined' ||
      !containerRef.current
    ) {
      return;
    }

    const node = containerRef.current;
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        if (entry.contentRect) {
          setContainerWidth(Math.round(entry.contentRect.width));
        }
      }
    });

    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!isEditing) {
      setResizingWidget(null);
      setDraggingWidget(null);
      removeBodyClass('is-resizing');
      removeBodyClass('is-dragging');
    }
  }, [isEditing]);

  useEffect(() => {
    return () => {
      removeBodyClass('is-resizing');
      removeBodyClass('is-dragging');
    };
  }, []);

  useEffect(() => {
    if (!resizingWidget) return;
    return () => {
      if (typeof document === 'undefined') return;
      const element = document.querySelector(`[data-widget-id="${resizingWidget.widget.id}"]`);
      if (element) {
        element.classList.remove('resizing');
      }
    };
  }, [resizingWidget]);

  useEffect(() => {
    if (!draggingWidget) return;
    return () => {
      if (typeof document === 'undefined') return;
      const element = document.querySelector(`[data-widget-id="${draggingWidget.widget.id}"]`);
      if (element) {
        element.classList.remove('active');
      }
    };
  }, [draggingWidget]);

  const calculateOverlayPosition = useCallback((widgetId: string) => {
    if (typeof window === 'undefined') return undefined;
    const element = document.querySelector(`[data-widget-id="${widgetId}"]`) as HTMLElement | null;
    if (!element) return undefined;
    const rect = element.getBoundingClientRect();

    return {
      x: rect.left + window.scrollX,
      y: rect.top + window.scrollY,
    };
  }, []);

  // Hook del sistema de grid
  const gridSystem = useGridSystem({
    cols,
    rowHeight,
    containerWidth,
    margin: [16, 16],
  });
  const gridMargin = gridSystem.margin;

  const previewArea = useMemo(() => {
    if (!isDraggingPreview || !previewWidget?.layout) {
      return null;
    }

    const { x, y, w, h } = previewWidget.layout;
    if (
      typeof x !== 'number' ||
      typeof y !== 'number' ||
      typeof w !== 'number' ||
      typeof h !== 'number' ||
      Number.isNaN(x) ||
      Number.isNaN(y) ||
      Number.isNaN(w) ||
      Number.isNaN(h)
    ) {
      return null;
    }

    return { x, y, w, h };
  }, [isDraggingPreview, previewWidget]);

  const visualizerActiveArea = useMemo(() => {
    if (resizingWidget) {
      return {
        x: resizingWidget.gridPosition.x,
        y: resizingWidget.gridPosition.y,
        w: resizingWidget.size.w,
        h: resizingWidget.size.h,
      };
    }
    if (draggingWidget) {
      return {
        x: draggingWidget.gridPosition.x,
        y: draggingWidget.gridPosition.y,
        w: draggingWidget.size.w,
        h: draggingWidget.size.h,
      };
    }
    if (previewArea) {
      return previewArea;
    }
    return undefined;
  }, [draggingWidget, previewArea, resizingWidget]);

  const visualizerMode = useMemo<'idle' | 'resize' | 'move' | 'preview'>(() => {
    if (resizingWidget) return 'resize';
    if (draggingWidget) return 'move';
    if (previewArea) return 'preview';
    return 'idle';
  }, [draggingWidget, previewArea, resizingWidget]);

  // Convert widgets to react-grid-layout format
  const layout: Layout[] = useMemo(() => {
    // Validate and filter widgets
    const validWidgets = widgets.filter((widget) => {
      const isValid = (
        widget &&
        widget.id &&
        widget.layout &&
        typeof widget.layout.x === 'number' &&
        typeof widget.layout.y === 'number' &&
        typeof widget.layout.w === 'number' &&
        typeof widget.layout.h === 'number' &&
        !isNaN(widget.layout.x) &&
        !isNaN(widget.layout.y) &&
        !isNaN(widget.layout.w) &&
        !isNaN(widget.layout.h)
      );
      
      if (!isValid) {
        console.error('Invalid widget detected:', widget);
      }
      
      return isValid;
    });

    const widgetLayouts = validWidgets.map((widget) => ({
      i: widget.id,
      x: Math.max(0, widget.layout.x),
      y: Math.max(0, widget.layout.y),
      w: Math.max(2, widget.layout.w),
      h: Math.max(2, widget.layout.h),
      minW: widget.layout.minW || 2,
      minH: widget.layout.minH || 2,
      maxW: widget.layout.maxW,
      maxH: widget.layout.maxH,
      static: !isEditing, // Make static when not editing
    }));

    // Include preview widget in layout when dragging
    if (isDraggingPreview && previewWidget && previewWidget.layout) {
      const previewX = typeof previewWidget.layout.x === 'number' ? previewWidget.layout.x : 0;
      const previewY = typeof previewWidget.layout.y === 'number' ? previewWidget.layout.y : 0;
      const previewW = typeof previewWidget.layout.w === 'number' ? previewWidget.layout.w : 4;
      const previewH = typeof previewWidget.layout.h === 'number' ? previewWidget.layout.h : 4;
      
      widgetLayouts.push({
        i: previewWidget.id,
        x: Math.max(0, previewX),
        y: Math.max(0, previewY),
        w: Math.max(2, previewW),
        h: Math.max(2, previewH),
        minW: previewWidget.layout.minW || 2,
        minH: previewWidget.layout.minH || 2,
        maxW: previewWidget.layout.maxW,
        maxH: previewWidget.layout.maxH,
        static: true, // Preview is not draggable
      });
    }

    return widgetLayouts;
  }, [widgets, isEditing, isDraggingPreview, previewWidget]);

  const handleLayoutChange = useCallback(
    (newLayout: Layout[]) => {
      if (!isEditing || !onLayoutChange) return;

      // Update widgets with new layout
      const updatedWidgets = widgets.map((widget) => {
        const layoutItem = newLayout.find((l) => l.i === widget.id);
        if (!layoutItem) return widget;

        return {
          ...widget,
          layout: {
            ...widget.layout,
            x: layoutItem.x,
            y: layoutItem.y,
            w: layoutItem.w,
            h: layoutItem.h,
          },
        };
      });

      onLayoutChange(updatedWidgets);
    },
    [widgets, isEditing, onLayoutChange]
  );

  const renderWidget = (widget: Widget) => {
    const baseProps = {
      widget,
      onEdit: onWidgetEdit,
      onDelete: onWidgetDelete,
      onRefresh: onWidgetRefresh,
      isEditing,
    };

    let widgetContent;

    switch (widget.type) {
      case 'kpi':
        widgetContent = <KPIWidget {...baseProps} />;
        break;
      case 'chart':
        widgetContent = <ChartWidget {...baseProps} />;
        break;
      case 'list':
        widgetContent = <ListWidget {...baseProps} />;
        break;
      case 'quick_actions':
        widgetContent = <QuickActionsWidget {...baseProps} />;
        break;
      case 'alerts':
        widgetContent = <AlertsWidget {...baseProps} />;
        break;
      case 'module_stats':
        widgetContent = <ModuleStatsWidget {...baseProps} />;
        break;
      default:
        widgetContent = (
          <div className="h-full rounded-xl border border-white/10 p-4 flex items-center justify-center bg-white/5">
            <div className="text-white/40 text-sm">Tipo de widget no soportado: {widget.type}</div>
          </div>
        );
    }

    // Envolver con tema
    return <WidgetThemeWrapper widget={widget}>{widgetContent}</WidgetThemeWrapper>;
  };

  return (
    <>
      {/* Estilos dinámicos para el grid */}
      <style>{`
        .dashboard-grid.editing {
          background-image:
            linear-gradient(rgba(59, 130, 246, 0.05) 1px, transparent 1px),
            linear-gradient(90deg, rgba(59, 130, 246, 0.05) 1px, transparent 1px);
          background-size: ${100 / cols}% ${rowHeight}px;
        }
      `}</style>

    <div ref={containerRef} className="relative">
      <GridLayout
        className={`dashboard-grid ${isEditing ? 'editing' : ''}`}
        layout={layout}
        cols={cols}
        rowHeight={rowHeight}
        width={containerWidth}
        onLayoutChange={handleLayoutChange}
        isDraggable={isEditing}
        isResizable={isEditing}
        compactType="vertical"
        preventCollision={false}
        margin={[16, 16]}
        containerPadding={[0, 0]}
        useCSSTransforms={true}
        draggableHandle=".drag-handle"
        resizeHandles={['se', 'ne', 'sw', 'nw', 's', 'e']}
        onResizeStart={(_layout, _oldItem, newItem) => {
          const widget = widgets.find((w) => w.id === newItem.i);
          if (widget) {
            setResizingWidget({
              widget,
              size: { w: newItem.w, h: newItem.h },
              gridPosition: { x: newItem.x, y: newItem.y },
              position: calculateOverlayPosition(newItem.i),
            });
          }
          addBodyClass('is-resizing');
          const element = document.querySelector(`[data-widget-id="${newItem.i}"]`) as HTMLElement | null;
          if (element) {
            element.classList.add('resizing');
            element.setAttribute('data-state', 'resizing');
          }
        }}
        onResize={(_layout, _oldItem, newItem) => {
          const widget = widgets.find((w) => w.id === newItem.i);
          if (widget) {
            setResizingWidget({
              widget,
              size: { w: newItem.w, h: newItem.h },
              gridPosition: { x: newItem.x, y: newItem.y },
              position: calculateOverlayPosition(newItem.i),
            });
          }
          const element = document.querySelector(`[data-widget-id="${newItem.i}"]`) as HTMLElement | null;
          if (element) {
            element.setAttribute('data-state', 'resizing');
          }
        }}
        onResizeStop={(_layout, _oldItem, newItem) => {
          setResizingWidget(null);
          removeBodyClass('is-resizing');
          const element = document.querySelector(`[data-widget-id="${newItem.i}"]`) as HTMLElement | null;
          if (element) {
            element.classList.remove('resizing');
            element.removeAttribute('data-state');
          }
        }}
        onDragStart={(_layout, _oldItem, newItem) => {
          const widget = widgets.find((w) => w.id === newItem.i);
          if (widget) {
            setDraggingWidget({
              widget,
              size: { w: newItem.w, h: newItem.h },
              gridPosition: { x: newItem.x, y: newItem.y },
            });
          }
          addBodyClass('is-dragging');
          const element = document.querySelector(`[data-widget-id="${newItem.i}"]`) as HTMLElement | null;
          if (element) {
            element.classList.add('dragging');
            element.setAttribute('data-state', 'dragging');
            element.classList.add('active');
          }
        }}
        onDrag={(_layout, _oldItem, newItem) => {
          const widget = widgets.find((w) => w.id === newItem.i);
          if (!widget) {
            return;
          }
          setDraggingWidget({
            widget,
            size: { w: newItem.w, h: newItem.h },
            gridPosition: { x: newItem.x, y: newItem.y },
          });
        }}
        onDragStop={(_layout, _oldItem, newItem) => {
          setDraggingWidget(null);
          removeBodyClass('is-dragging');
          const element = document.querySelector(`[data-widget-id="${newItem.i}"]`) as HTMLElement | null;
          if (element) {
            element.classList.remove('active');
            element.classList.remove('dragging');
            element.removeAttribute('data-state');
          }
        }}
      >
      {widgets
        .filter((widget) => {
          // Solo renderizar widgets con layout válido
          return (
            widget &&
            widget.layout &&
            typeof widget.layout.x === 'number' &&
            typeof widget.layout.y === 'number' &&
            typeof widget.layout.w === 'number' &&
            typeof widget.layout.h === 'number' &&
            !isNaN(widget.layout.x) &&
            !isNaN(widget.layout.y) &&
            !isNaN(widget.layout.w) &&
            !isNaN(widget.layout.h)
          );
        })
        .map((widget) => (
          <div
            key={widget.id}
            className="dashboard-grid-item"
            data-widget-id={widget.id}
            onContextMenu={(e) => onWidgetContextMenu?.(e, widget)}
          >
            {renderWidget(widget)}
          </div>
        ))}
      {isDraggingPreview && previewWidget && (
        <div
          key={previewWidget.id}
          className="dashboard-grid-item-preview"
          style={{
            opacity: 0.6,
            border: '2px dashed rgba(168, 85, 247, 0.8)',
            borderRadius: '12px',
            animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
            pointerEvents: 'none',
          }}
        >
          <div className="relative w-full h-full">
            {renderWidget(previewWidget)}
            <div className="absolute inset-0 bg-purple-500/10 rounded-xl flex items-center justify-center pointer-events-none">
              <div className="text-white/80 text-sm font-medium px-4 py-2 rounded-lg bg-purple-500/20 backdrop-blur-sm">
                Vista Previa
              </div>
            </div>
          </div>
        </div>
      )}
      </GridLayout>
    </div>

    {/* Grid Visualizer - mostrar en modo edición */}
    {isEditing && (
      <GridVisualizer
        config={{
          cols,
          rowHeight,
          containerWidth,
          margin: gridMargin,
        }}
        isResizing={visualizerMode === 'resize'}
        mode={visualizerMode}
        activeArea={visualizerActiveArea}
      />
    )}

    {/* Resize Overlay - mostrar durante el resize */}
    {resizingWidget && (
      <ResizeOverlay
        widget={resizingWidget.widget}
        currentSize={resizingWidget.size}
        gridPosition={resizingWidget.gridPosition}
        isAtMinLimit={
          resizingWidget.size.w <= (resizingWidget.widget.layout.minW ?? 2) ||
          resizingWidget.size.h <= (resizingWidget.widget.layout.minH ?? 2)
        }
        isAtMaxLimit={
          resizingWidget.size.w >= (resizingWidget.widget.layout.maxW ?? cols) ||
          resizingWidget.size.h >= (resizingWidget.widget.layout.maxH ?? 10)
        }
        position={resizingWidget.position}
      />
    )}

    </>
  );
}
