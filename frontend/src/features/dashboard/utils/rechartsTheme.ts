/**
 * Helper para integrar temas del dashboard con Recharts
 * Proporciona configuraciones de estilo consistentes para gráficos
 */

/**
 * Extrae solo el componente RGB de un color rgba
 * Ejemplo: rgba(59, 130, 246, 1) -> rgb(59, 130, 246)
 */
function rgbaToRgb(rgba: string): string {
  const match = rgba.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*[\d.]+)?\)/);
  if (match) {
    return `rgb(${match[1]}, ${match[2]}, ${match[3]})`;
  }
  return rgba;
}

/**
 * Convierte rgba a formato con opacidad personalizada
 */
function withOpacity(rgba: string, opacity: number): string {
  const match = rgba.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
  if (match) {
    return `rgba(${match[1]}, ${match[2]}, ${match[3]}, ${opacity})`;
  }
  return rgba;
}

/**
 * Configuración de tema para Recharts basado en los colores del widget
 */
export interface RechartsThemeConfig {
  // Colores para gráficos
  colors: string[];

  // Estilos de Grid
  gridStyle: {
    stroke: string;
    strokeDasharray?: string;
    opacity?: number;
  };

  // Estilos de Ejes
  axisStyle: {
    stroke: string;
    fontSize: number;
    fontFamily: string;
  };

  // Estilos de Texto
  textStyle: {
    fill: string;
    fontSize: number;
    fontFamily: string;
  };

  // Estilos de Tooltip
  tooltipStyle: {
    backgroundColor: string;
    border: string;
    borderRadius: string;
    boxShadow: string;
  };

  // Estilos de Legend
  legendStyle: {
    fontSize: number;
    fontFamily: string;
    color: string;
  };
}

/**
 * Genera configuración de tema para Recharts desde colores del tema del widget
 */
export function getRechartsTheme(themeColors: Partial<Record<string, string>> = {}): RechartsThemeConfig {
  const {
    chart1 = 'rgba(59, 130, 246, 1)',
    chart2 = 'rgba(16, 185, 129, 1)',
    chart3 = 'rgba(245, 158, 11, 1)',
    chart4 = 'rgba(239, 68, 68, 1)',
    chart5 = 'rgba(139, 92, 246, 1)',
    chart6 = 'rgba(236, 72, 153, 1)',
    textMuted = 'rgba(161, 161, 170, 1)',
    border = 'rgba(161, 161, 170, 0.2)',
    bg = 'rgba(24, 24, 27, 0.95)',
  } = themeColors;

  return {
    colors: [chart1, chart2, chart3, chart4, chart5, chart6],

    gridStyle: {
      stroke: withOpacity(border, 0.3),
      strokeDasharray: '3 3',
      opacity: 0.5,
    },

    axisStyle: {
      stroke: withOpacity(textMuted, 0.5),
      fontSize: 12,
      fontFamily: 'system-ui, -apple-system, sans-serif',
    },

    textStyle: {
      fill: rgbaToRgb(textMuted),
      fontSize: 12,
      fontFamily: 'system-ui, -apple-system, sans-serif',
    },

    tooltipStyle: {
      backgroundColor: withOpacity(bg, 0.98),
      border: `1px solid ${withOpacity(border, 0.5)}`,
      borderRadius: '8px',
      boxShadow: '0 4px 16px rgba(0, 0, 0, 0.3)',
    },

    legendStyle: {
      fontSize: 12,
      fontFamily: 'system-ui, -apple-system, sans-serif',
      color: rgbaToRgb(textMuted),
    },
  };
}

/**
 * Props comunes de estilo para CartesianGrid
 */
export function getCartesianGridProps(theme: RechartsThemeConfig) {
  return {
    stroke: theme.gridStyle.stroke,
    strokeDasharray: theme.gridStyle.strokeDasharray,
    opacity: theme.gridStyle.opacity,
  };
}

/**
 * Props comunes de estilo para XAxis y YAxis
 */
export function getAxisProps(theme: RechartsThemeConfig) {
  return {
    stroke: theme.axisStyle.stroke,
    style: {
      fontSize: theme.axisStyle.fontSize,
      fontFamily: theme.axisStyle.fontFamily,
      fill: theme.textStyle.fill,
    },
    tick: {
      fill: theme.textStyle.fill,
    },
  };
}

/**
 * Props comunes de estilo para Tooltip
 */
export function getTooltipProps(theme: RechartsThemeConfig) {
  return {
    contentStyle: {
      backgroundColor: theme.tooltipStyle.backgroundColor,
      border: theme.tooltipStyle.border,
      borderRadius: theme.tooltipStyle.borderRadius,
      boxShadow: theme.tooltipStyle.boxShadow,
    },
    labelStyle: {
      color: theme.textStyle.fill,
      fontWeight: 600,
    },
    itemStyle: {
      color: theme.textStyle.fill,
    },
  };
}

/**
 * Props comunes de estilo para Legend
 */
export function getLegendProps(theme: RechartsThemeConfig) {
  return {
    wrapperStyle: {
      fontSize: theme.legendStyle.fontSize,
      fontFamily: theme.legendStyle.fontFamily,
      color: theme.legendStyle.color,
    },
  };
}

/**
 * Obtiene un color específico del array de colores del gráfico
 */
export function getChartColor(theme: RechartsThemeConfig, index: number): string {
  return theme.colors[index % theme.colors.length];
}

/**
 * Props de estilo para diferentes tipos de gráficos
 */
export const chartTypeStyles = {
  bar: {
    radius: [4, 4, 0, 0], // Esquinas redondeadas arriba
    animationDuration: 300,
  },
  line: {
    strokeWidth: 2,
    dot: { r: 4 },
    activeDot: { r: 6 },
    animationDuration: 300,
  },
  area: {
    strokeWidth: 2,
    fillOpacity: 0.6,
    animationDuration: 300,
  },
  pie: {
    innerRadius: '50%', // Para hacer donut
    outerRadius: '80%',
    paddingAngle: 2,
    animationDuration: 300,
  },
};

/**
 * Helper completo que genera todas las props necesarias para un gráfico
 */
export function getChartProps(themeColors: Partial<Record<string, string>> = {}, chartType: 'bar' | 'line' | 'area' | 'pie' = 'bar') {
  const theme = getRechartsTheme(themeColors);

  return {
    theme,
    colors: theme.colors,
    cartesianGridProps: getCartesianGridProps(theme),
    axisProps: getAxisProps(theme),
    tooltipProps: getTooltipProps(theme),
    legendProps: getLegendProps(theme),
    chartSpecificProps: chartTypeStyles[chartType],
  };
}

/**
 * Hook helper para usar en componentes de widgets
 * Ejemplo de uso:
 *
 * const chartProps = useRechartsTheme(widget.theme);
 *
 * <CartesianGrid {...chartProps.cartesianGridProps} />
 * <XAxis {...chartProps.axisProps} />
 * <Tooltip {...chartProps.tooltipProps} />
 */
export function useRechartsTheme(widgetTheme?: any) {
  // Obtener colores del tema del widget
  const themeColors: Partial<Record<string, string>> = widgetTheme || {};

  return getRechartsTheme(themeColors);
}
