import { useMemo, useCallback } from 'react';

/**
 * Hook para gestionar el sistema de grid del dashboard
 * Proporciona utilidades para conversiones, validaciones y snapping
 */

export interface GridConfig {
  cols: number;
  rowHeight: number;
  containerWidth: number;
  margin?: [number, number];
}

export interface GridPosition {
  x: number;
  y: number;
}

export interface GridSize {
  w: number;
  h: number;
}

export interface GridBounds extends GridPosition, GridSize {}

export interface PixelPosition {
  x: number;
  y: number;
}

export interface ValidationResult {
  isValid: boolean;
  reason?: string;
  maxW?: number;
  maxH?: number;
}

export function useGridSystem(config: GridConfig) {
  const { cols, rowHeight, containerWidth, margin = [16, 16] } = config;

  /**
   * Calcula el ancho de una columna en píxeles
   */
  const colWidth = useMemo(() => {
    // Ancho total disponible menos los márgenes
    const totalMarginWidth = (cols - 1) * margin[0];
    return (containerWidth - totalMarginWidth) / cols;
  }, [containerWidth, cols, margin]);

  /**
   * Convierte píxeles a coordenadas de grid (con snapping)
   */
  const pixelsToGrid = useCallback(
    (pixelX: number, pixelY: number): GridPosition => {
      // Calcular posición considerando los márgenes
      const gridX = Math.round(pixelX / (colWidth + margin[0]));
      const gridY = Math.round(pixelY / (rowHeight + margin[1]));

      return {
        x: Math.max(0, Math.min(gridX, cols - 1)),
        y: Math.max(0, gridY),
      };
    },
    [colWidth, rowHeight, cols, margin]
  );

  /**
   * Convierte coordenadas de grid a píxeles
   */
  const gridToPixels = useCallback(
    (gridX: number, gridY: number): PixelPosition => {
      return {
        x: gridX * (colWidth + margin[0]),
        y: gridY * (rowHeight + margin[1]),
      };
    },
    [colWidth, rowHeight, margin]
  );

  /**
   * Calcula el tamaño en grid basado en píxeles
   */
  const pixelSizeToGrid = useCallback(
    (pixelWidth: number, pixelHeight: number): GridSize => {
      const w = Math.round(pixelWidth / (colWidth + margin[0]));
      const h = Math.round(pixelHeight / (rowHeight + margin[1]));

      return {
        w: Math.max(1, w),
        h: Math.max(1, h),
      };
    },
    [colWidth, rowHeight, margin]
  );

  /**
   * Calcula el tamaño en píxeles basado en grid
   */
  const gridSizeToPixels = useCallback(
    (gridW: number, gridH: number): { width: number; height: number } => {
      return {
        width: gridW * colWidth + (gridW - 1) * margin[0],
        height: gridH * rowHeight + (gridH - 1) * margin[1],
      };
    },
    [colWidth, rowHeight, margin]
  );

  /**
   * Valida que un widget quepa en el grid
   */
  const validateBounds = useCallback(
    (
      bounds: GridBounds,
      constraints?: {
        minW?: number;
        minH?: number;
        maxW?: number;
        maxH?: number;
      }
    ): ValidationResult => {
      const { x, y, w, h } = bounds;
      const { minW = 1, minH = 1, maxW = cols, maxH = Infinity } = constraints || {};

      // Validar que no se salga del grid
      if (x < 0 || y < 0) {
        return {
          isValid: false,
          reason: 'La posición no puede ser negativa',
        };
      }

      if (x + w > cols) {
        return {
          isValid: false,
          reason: `El widget excede el ancho del grid (máximo ${cols} columnas)`,
          maxW: cols - x,
        };
      }

      // Validar tamaño mínimo
      if (w < minW || h < minH) {
        return {
          isValid: false,
          reason: `El widget es demasiado pequeño (mínimo ${minW}x${minH})`,
        };
      }

      // Validar tamaño máximo
      if (w > maxW || h > maxH) {
        return {
          isValid: false,
          reason: `El widget es demasiado grande (máximo ${maxW}x${maxH})`,
          maxW,
          maxH,
        };
      }

      return { isValid: true };
    },
    [cols]
  );

  /**
   * Ajusta los bounds para que cumplan con las restricciones
   */
  const clampBounds = useCallback(
    (
      bounds: GridBounds,
      constraints?: {
        minW?: number;
        minH?: number;
        maxW?: number;
        maxH?: number;
      }
    ): GridBounds => {
      const { x, y, w, h } = bounds;
      const { minW = 1, minH = 1, maxW = cols, maxH = Infinity } = constraints || {};

      const clampedW = Math.max(minW, Math.min(w, maxW, cols - x));
      const clampedH = Math.max(minH, Math.min(h, maxH));

      return {
        x: Math.max(0, x),
        y: Math.max(0, y),
        w: clampedW,
        h: clampedH,
      };
    },
    [cols]
  );

  /**
   * Calcula las líneas del grid para visualización
   */
  const getGridLines = useCallback((): {
    vertical: number[];
    horizontal: number[];
  } => {
    const vertical: number[] = [];
    const horizontal: number[] = [];

    // Líneas verticales (columnas)
    for (let i = 0; i <= cols; i++) {
      vertical.push(i * (colWidth + margin[0]));
    }

    // Líneas horizontales (filas) - solo las visibles
    // Calculamos basado en la altura del contenedor (asumiendo ~10 filas visibles)
    const visibleRows = 10;
    for (let i = 0; i <= visibleRows; i++) {
      horizontal.push(i * (rowHeight + margin[1]));
    }

    return { vertical, horizontal };
  }, [cols, colWidth, rowHeight, margin]);

  /**
   * Calcula el área ocupada por un widget en píxeles
   */
  const getWidgetPixelBounds = useCallback(
    (bounds: GridBounds): { x: number; y: number; width: number; height: number } => {
      const position = gridToPixels(bounds.x, bounds.y);
      const size = gridSizeToPixels(bounds.w, bounds.h);

      return {
        x: position.x,
        y: position.y,
        width: size.width,
        height: size.height,
      };
    },
    [gridToPixels, gridSizeToPixels]
  );

  /**
   * Calcula el snap más cercano para una posición en píxeles
   */
  const snapToGrid = useCallback(
    (pixelX: number, pixelY: number): PixelPosition => {
      const gridPos = pixelsToGrid(pixelX, pixelY);
      return gridToPixels(gridPos.x, gridPos.y);
    },
    [pixelsToGrid, gridToPixels]
  );

  /**
   * Formatea el tamaño del widget para mostrar al usuario
   */
  const formatSize = useCallback((w: number, h: number): string => {
    return `${w} × ${h}`;
  }, []);

  /**
   * Formatea la posición del widget para mostrar al usuario
   */
  const formatPosition = useCallback((x: number, y: number): string => {
    return `(${x}, ${y})`;
  }, []);

  return {
    // Configuración
    colWidth,
    rowHeight,
    cols,
    margin,

    // Conversiones
    pixelsToGrid,
    gridToPixels,
    pixelSizeToGrid,
    gridSizeToPixels,

    // Validaciones
    validateBounds,
    clampBounds,

    // Utilidades
    getGridLines,
    getWidgetPixelBounds,
    snapToGrid,

    // Formateo
    formatSize,
    formatPosition,
  };
}
