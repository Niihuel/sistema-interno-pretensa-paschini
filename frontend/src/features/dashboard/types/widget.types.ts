/**
 * Tipos de widgets disponibles
 */
export const WidgetType = {
  KPI: 'kpi' as const,
  CHART: 'chart' as const,
  LIST: 'list' as const,
  QUICK_ACTIONS: 'quick_actions' as const,
  CALENDAR_MINI: 'calendar_mini' as const,
  ALERTS: 'alerts' as const,
  MODULE_STATS: 'module_stats' as const,
};

export type WidgetType = typeof WidgetType[keyof typeof WidgetType];

/**
 * Tipos de gráficos
 */
export const ChartType = {
  BAR: 'bar' as const,
  LINE: 'line' as const,
  AREA: 'area' as const,
  PIE: 'pie' as const,
  COMPOSED: 'composed' as const,
};

export type ChartType = typeof ChartType[keyof typeof ChartType];

/**
 * Data source para widgets
 */
export interface WidgetDataSource {
  module: string; // 'tickets', 'employees', 'equipment', etc.
  endpoint: string; // '/api/tickets/stats'
  refresh?: number; // Refresh interval in seconds
}

/**
 * Configuración de KPI Widget
 */
export interface KPIWidgetConfig {
  title: string;
  value: number | string;
  trend?: {
    value: number;
    direction: 'up' | 'down' | 'neutral';
  };
  icon?: string;
  color?: string;
  dataSource: WidgetDataSource;
}

/**
 * Configuración de Chart Widget
 */
export interface ChartWidgetConfig {
  title: string;
  chartType: ChartType;
  dataSource: WidgetDataSource;
  xAxisKey: string;
  yAxisKey: string | string[]; // Multiple for composed charts
  colors?: string[];
  showLegend?: boolean;
  showGrid?: boolean;
  animate?: boolean;
}

/**
 * Configuración de List Widget
 */
export interface ListWidgetConfig {
  title: string;
  dataSource: WidgetDataSource;
  itemTemplate: {
    title: string; // Field name for title
    subtitle?: string; // Field name for subtitle
    badge?: string; // Field name for badge
    link?: string; // Field name for link
  };
  limit?: number;
}

/**
 * Configuración de Quick Actions Widget
 */
export interface QuickActionsWidgetConfig {
  title: string;
  actions: Array<{
    label: string;
    icon: string;
    link: string;
    color?: string;
    permission?: string; // RBAC permission required
  }>;
}

/**
 * Configuración de Alerts Widget
 */
export interface AlertsWidgetConfig {
  title: string;
  dataSource: WidgetDataSource;
  severityField: string;
  messageField: string;
  limit?: number;
}

/**
 * Configuración de Module Stats Widget
 */
export interface ModuleStatsWidgetConfig {
  title: string;
  module: string;
  stats: Array<{
    label: string;
    value: number | string;
    color?: string;
    link?: string;
  }>;
  dataSource: WidgetDataSource;
}

/**
 * Union type para todas las configuraciones de widgets
 */
export type WidgetConfig =
  | KPIWidgetConfig
  | ChartWidgetConfig
  | ListWidgetConfig
  | QuickActionsWidgetConfig
  | AlertsWidgetConfig
  | ModuleStatsWidgetConfig;

/**
 * Widget completo con metadata
 */
export interface Widget {
  id: string;
  type: WidgetType;
  config: WidgetConfig;
  presetId?: string;
  layout: {
    x: number;
    y: number;
    w: number;
    h: number;
    minW?: number;
    minH?: number;
    maxW?: number;
    maxH?: number;
  };
  theme?: {
    themeName?: string; // shadcn/ui theme name (zinc, slate, rose, etc.)
    backgroundColor?: string;
    borderColor?: string;
    textColor?: string;
    accentColor?: string;
    customColors?: any; // Custom theme colors from ThemeEditor
  };
  permissions?: string[]; // RBAC permissions required to view
}

/**
 * Dashboard Layout completo
 */
export interface DashboardLayout {
  id: string;
  name: string;
  description?: string;
  userId: number;
  widgets: Widget[];
  theme: string; // Theme name from themes.ts
  isDefault?: boolean;
  isPublic?: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Configuración exportable
 */
export interface ExportableDashboardConfig {
  version: string;
  name: string;
  description?: string;
  theme: string;
  widgets: Widget[];
  exportedAt: string;
}

/**
 * Props para widgets base
 */
export interface BaseWidgetProps {
  widget: Widget;
  onEdit?: (widget: Widget) => void;
  onDelete?: (widgetId: string) => void;
  onRefresh?: (widgetId: string) => void;
  isEditing?: boolean;
}

/**
 * Catálogo de widgets disponibles para añadir
 */
export interface WidgetCatalogItem {
  type: WidgetType;
  name: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  defaultSize: { w: number; h: number };
  defaultConfig: Partial<WidgetConfig>;
  preview?: string; // URL to preview image
}
