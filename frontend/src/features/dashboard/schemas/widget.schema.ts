import { z } from 'zod';

// Widget Position Schema
export const widgetPositionSchema = z.object({
  col: z.number().min(1).max(12),
  row: z.number().min(1),
  colSpan: z.number().min(1).max(12),
  rowSpan: z.number().min(1).max(10),
});

// Data Source Schema
export const dataSourceSchema = z.object({
  endpoint: z.string().url(),
  refresh: z.number().optional(),
}).optional();

// KPI Widget Config
export const kpiConfigSchema = z.object({
  value: z.union([z.number(), z.string()]),
  icon: z.string().optional(),
  trend: z.object({
    value: z.number(),
    direction: z.enum(['up', 'down', 'neutral']),
  }).optional(),
});

// Chart Widget Config
export const chartConfigSchema = z.object({
  chartType: z.enum(['bar', 'line', 'area', 'pie']),
  xAxisKey: z.string(),
  yAxisKey: z.string(),
  colors: z.array(z.string()).optional(),
  showLegend: z.boolean().default(true),
  showGrid: z.boolean().default(true),
});

// List Widget Config
export const listConfigSchema = z.object({
  itemTemplate: z.object({
    titleKey: z.string(),
    subtitleKey: z.string().optional(),
    badgeKey: z.string().optional(),
  }),
  limit: z.number().default(5),
});

// Quick Actions Widget Config
export const quickActionsConfigSchema = z.object({
  actions: z.array(
    z.object({
      label: z.string(),
      icon: z.string(),
      link: z.string(),
      color: z.string().optional(),
    })
  ),
});

// Alerts Widget Config
export const alertsConfigSchema = z.object({
  severityField: z.string(),
  messageField: z.string(),
  limit: z.number().default(5),
});

// Module Stats Widget Config
export const moduleStatsConfigSchema = z.object({
  module: z.string(),
  stats: z.array(
    z.object({
      label: z.string(),
      value: z.union([z.number(), z.string()]),
      color: z.string().optional(),
      link: z.string().optional(),
    })
  ),
});

// Base Widget Schema
export const widgetSchema = z.object({
  id: z.string(),
  type: z.enum(['kpi', 'chart', 'list', 'quick_actions', 'alerts', 'module_stats']),
  title: z.string(),
  position: widgetPositionSchema,
  config: z.record(z.any()), // Se valida específicamente según el tipo
  dataSource: dataSourceSchema,
});

// Widget Type
export type Widget = z.infer<typeof widgetSchema>;
export type WidgetPosition = z.infer<typeof widgetPositionSchema>;
export type KPIConfig = z.infer<typeof kpiConfigSchema>;
export type ChartConfig = z.infer<typeof chartConfigSchema>;
