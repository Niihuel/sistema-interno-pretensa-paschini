/**
 * useChartTheme Hook
 * 
 * Provides default chart colors and configuration for Recharts components.
 * 
 * @returns {ChartThemeConfig} Chart configuration
 */

import { useMemo } from 'react';

export interface ChartThemeConfig {
  colors: string[];
  tooltip: {
    contentStyle: {
      backgroundColor: string;
      border: string;
      borderColor: string;
      borderRadius: string;
      color: string;
    };
    labelStyle: {
      color: string;
      fontWeight: number;
    };
  };
  axis: {
    style: {
      fill: string;
      fontSize: number;
    };
  };
  grid: {
    stroke: string;
    strokeDasharray: string;
  };
}

export const useChartTheme = (): ChartThemeConfig => {
  const chartConfig = useMemo(() => ({
    colors: [
      '#4ade80', // green
      '#3b82f6', // blue
      '#f59e0b', // amber
      '#ef4444', // red
      '#8b5cf6', // purple
      '#ec4899', // pink
      '#06b6d4', // cyan
      '#f97316', // orange
    ],
    tooltip: {
      contentStyle: {
        backgroundColor: '#1e293b',
        border: '1px solid',
        borderColor: 'rgba(255, 255, 255, 0.1)',
        borderRadius: '8px',
        color: '#f8fafc',
      },
      labelStyle: {
        color: '#f8fafc',
        fontWeight: 600,
      },
    },
    axis: {
      style: {
        fill: 'rgba(255, 255, 255, 0.6)',
        fontSize: 12,
      },
    },
    grid: {
      stroke: 'rgba(255, 255, 255, 0.1)',
      strokeDasharray: '3 3',
    },
  }), []);
  
  return chartConfig;
};

/**
 * Helper hook to get a specific chart color by index
 * 
 * @param index - Color index (0-7)
 * @returns Hex color string
 * 
 * @example
 * ```tsx
 * const color1 = useChartColor(0);
 * const color2 = useChartColor(1);
 * ```
 */
export const useChartColor = (index: number): string => {
  const chartTheme = useChartTheme();
  const safeIndex = Math.max(0, Math.min(7, index));
  return chartTheme.colors[safeIndex] || '#888888';
};

/**
 * Helper hook to get all chart colors as an array
 * 
 * @returns Array of 8 hex color strings
 * 
 * @example
 * ```tsx
 * const colors = useChartColors();
 * // colors = ['#...', '#...', ...]
 * ```
 */
export const useChartColors = (): string[] => {
  const chartTheme = useChartTheme();
  return chartTheme.colors;
};
