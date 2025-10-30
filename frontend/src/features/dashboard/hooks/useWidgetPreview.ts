import { useState, useCallback, useEffect } from 'react';
import type { Widget, WidgetType } from '../types/widget.types';
import { createWidgetFromCatalog } from '../config/widgetCatalog';

interface PreviewPosition {
  x: number;
  y: number;
}

interface UseWidgetPreviewOptions {
  cols: number;
  rowHeight: number;
  containerWidth: number;
}

export const useWidgetPreview = ({ cols, rowHeight, containerWidth }: UseWidgetPreviewOptions) => {
  const [previewWidget, setPreviewWidget] = useState<Widget | null>(null);
  const [previewPosition, setPreviewPosition] = useState<PreviewPosition>({ x: 0, y: 0 });
  const [isDraggingPreview, setIsDraggingPreview] = useState(false);

  // Calculate grid position from mouse coordinates
  const calculateGridPosition = useCallback(
    (mouseX: number, mouseY: number, containerRect: DOMRect) => {
      const relativeX = mouseX - containerRect.left;
      const relativeY = mouseY - containerRect.top;

      const colWidth = containerWidth / cols;
      const gridX = Math.floor(relativeX / colWidth);
      const gridY = Math.floor(relativeY / rowHeight);

      return {
        x: Math.max(0, Math.min(gridX, cols - (previewWidget?.layout.w || 1))),
        y: Math.max(0, gridY),
      };
    },
    [cols, rowHeight, containerWidth, previewWidget]
  );

  // Start preview when dragging from library
  const startPreview = useCallback((widgetType: WidgetType) => {
    const newWidget = createWidgetFromCatalog(widgetType);
    if (newWidget) {
      setPreviewWidget(newWidget);
      setIsDraggingPreview(true);
    }
  }, []);

  // Update preview position as mouse moves
  const updatePreviewPosition = useCallback(
    (mouseX: number, mouseY: number, containerRect: DOMRect) => {
      if (!isDraggingPreview || !previewWidget) return;

      const gridPos = calculateGridPosition(mouseX, mouseY, containerRect);
      setPreviewPosition(gridPos);

      // Update preview widget layout
      setPreviewWidget((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          layout: {
            ...prev.layout,
            x: gridPos.x,
            y: gridPos.y,
          },
        };
      });
    },
    [isDraggingPreview, previewWidget, calculateGridPosition]
  );

  // Confirm preview - returns the final widget
  const confirmPreview = useCallback((): Widget | null => {
    if (!previewWidget) return null;

    const finalWidget = { ...previewWidget };
    setPreviewWidget(null);
    setIsDraggingPreview(false);
    return finalWidget;
  }, [previewWidget]);

  // Cancel preview
  const cancelPreview = useCallback(() => {
    setPreviewWidget(null);
    setIsDraggingPreview(false);
    setPreviewPosition({ x: 0, y: 0 });
  }, []);

  // ESC key handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isDraggingPreview) {
        cancelPreview();
      }
    };

    if (isDraggingPreview) {
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [isDraggingPreview, cancelPreview]);

  return {
    previewWidget,
    previewPosition,
    isDraggingPreview,
    startPreview,
    updatePreviewPosition,
    confirmPreview,
    cancelPreview,
  };
};
