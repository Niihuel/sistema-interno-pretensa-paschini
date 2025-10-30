import type {
  AlertsWidgetConfig,
  ChartWidgetConfig,
  KPIWidgetConfig,
  ListWidgetConfig,
  ModuleStatsWidgetConfig,
  QuickActionsWidgetConfig,
  Widget,
  WidgetType,
} from '../types/widget.types';

export interface WidgetConfigPreset {
  id: string;
  name: string;
  description: string;
  config:
    | KPIWidgetConfig
    | ChartWidgetConfig
    | ListWidgetConfig
    | QuickActionsWidgetConfig
    | AlertsWidgetConfig
    | ModuleStatsWidgetConfig;
}

const cloneConfig = <T extends Widget['config']>(config: T): T =>
  JSON.parse(JSON.stringify(config));

const KPI_PRESETS: WidgetConfigPreset[] = [
  {
    id: 'kpi-open-tickets',
    name: 'Tickets abiertos',
    description: 'Cantidad total de tickets pendientes en tiempo real.',
    config: {
      title: 'Tickets abiertos',
      value: 0,
      icon: '🎫',
      trend: { value: 0, direction: 'neutral' },
      dataSource: {
        module: 'tickets',
        endpoint: '/api/dashboard/tickets-stats',
        refresh: 60,
      },
    },
  },
  {
    id: 'kpi-equipment-available',
    name: 'Equipos disponibles',
    description: 'Inventario disponible para asignación inmediata.',
    config: {
      title: 'Equipos disponibles',
      value: 0,
      icon: '💻',
      trend: { value: 0, direction: 'up' },
      dataSource: {
        module: 'equipment',
        endpoint: '/api/dashboard/equipment-stats',
        refresh: 120,
      },
    },
  },
  {
    id: 'kpi-active-employees',
    name: 'Empleados activos',
    description: 'Personal con acceso vigente al sistema.',
    config: {
      title: 'Empleados activos',
      value: 0,
      icon: '🧑‍💼',
      trend: { value: 0, direction: 'neutral' },
      dataSource: {
        module: 'employees',
        endpoint: '/api/dashboard/employees-stats',
        refresh: 180,
      },
    },
  },
];

const CHART_PRESETS: WidgetConfigPreset[] = [
  {
    id: 'chart-tickets-status',
    name: 'Tickets por estado',
    description: 'Distribución de tickets por estado operativo.',
    config: {
      title: 'Tickets por estado',
      chartType: 'bar',
      xAxisKey: 'status',
      yAxisKey: 'total',
      showLegend: false,
      showGrid: true,
      animate: true,
      dataSource: {
        module: 'tickets',
        endpoint: '/api/dashboard/tickets-stats',
        refresh: 120,
      },
    },
  },
  {
    id: 'chart-equipment-type',
    name: 'Equipos por tipo',
    description: 'Comparativa por categoría de hardware.',
    config: {
      title: 'Equipos por tipo',
      chartType: 'bar',
      xAxisKey: 'type',
      yAxisKey: 'count',
      showLegend: false,
      showGrid: true,
      animate: true,
      dataSource: {
        module: 'equipment',
        endpoint: '/api/dashboard/equipment-stats',
        refresh: 300,
      },
    },
  },
  {
    id: 'chart-incidents-month',
    name: 'Incidentes por mes',
    description: 'Tendencia mensual de incidentes resueltos.',
    config: {
      title: 'Incidentes por mes',
      chartType: 'line',
      xAxisKey: 'month',
      yAxisKey: 'resolved',
      showLegend: true,
      showGrid: true,
      animate: true,
      dataSource: {
        module: 'tickets',
        endpoint: '/api/dashboard/incidents-monthly',
        refresh: 600,
      },
    },
  },
];

const LIST_PRESETS: WidgetConfigPreset[] = [
  {
    id: 'list-recent-tickets',
    name: 'Tickets recientes',
    description: 'Últimas solicitudes creadas con su estado actual.',
    config: {
      title: 'Tickets recientes',
      dataSource: {
        module: 'tickets',
        endpoint: '/api/dashboard/recent-activity',
        refresh: 90,
      },
      itemTemplate: {
        title: 'title',
        subtitle: 'createdAt',
        badge: 'status',
        link: 'url',
      },
      limit: 5,
    },
  },
  {
    id: 'list-pending-purchases',
    name: 'Compras pendientes',
    description: 'Solicitudes de compra en espera de aprobación.',
    config: {
      title: 'Compras pendientes',
      dataSource: {
        module: 'purchase-requests',
        endpoint: '/api/dashboard/purchase-requests-stats',
        refresh: 180,
      },
      itemTemplate: {
        title: 'requester',
        subtitle: 'createdAt',
        badge: 'status',
        link: 'url',
      },
      limit: 5,
    },
  },
];

const QUICK_ACTIONS_PRESETS: WidgetConfigPreset[] = [
  {
    id: 'quick-actions-standard',
    name: 'Accesos frecuentes',
    description: 'Acciones recomendadas para operaciones diarias.',
    config: {
      title: 'Accesos rápidos',
      actions: [
        { label: 'Nuevo ticket', icon: 'plus', link: '/tickets/new', color: '#3b82f6' },
        { label: 'Inventario', icon: 'package', link: '/equipment', color: '#22c55e' },
        { label: 'Empleados', icon: 'users', link: '/employees', color: '#f97316' },
      ],
    },
  },
  {
    id: 'quick-actions-support',
    name: 'Soporte rápido',
    description: 'Atajos para tareas críticas del equipo de soporte.',
    config: {
      title: 'Soporte TI',
      actions: [
        { label: 'Dashboard de tickets', icon: 'layout-dashboard', link: '/admin/dashboard', color: '#6366f1' },
        { label: 'Incidentes críticos', icon: 'alert-triangle', link: '/tickets?priority=high', color: '#ef4444' },
        { label: 'Reportes', icon: 'file-text', link: '/reports', color: '#14b8a6' },
      ],
    },
  },
];

const ALERT_PRESETS: WidgetConfigPreset[] = [
  {
    id: 'alerts-critical',
    name: 'Alertas críticas',
    description: 'Últimos incidentes que requieren atención inmediata.',
    config: {
      title: 'Alertas críticas',
      dataSource: {
        module: 'alerts',
        endpoint: '/api/dashboard/alerts/critical',
        refresh: 60,
      },
      severityField: 'severity',
      messageField: 'message',
      limit: 5,
    },
  },
  {
    id: 'alerts-maintenance',
    name: 'Mantenimientos programados',
    description: 'Eventos programados para equipos e infraestructura.',
    config: {
      title: 'Mantenimientos',
      dataSource: {
        module: 'maintenance',
        endpoint: '/api/dashboard/maintenance/upcoming',
        refresh: 300,
      },
      severityField: 'type',
      messageField: 'description',
      limit: 5,
    },
  },
];

const MODULE_STATS_PRESETS: WidgetConfigPreset[] = [
  {
    id: 'stats-it-operations',
    name: 'Operaciones TI',
    description: 'Indicadores clave del equipo de operaciones.',
    config: {
      title: 'Resumen operaciones TI',
      module: 'it-operations',
      stats: [
        { label: 'Backups completados', value: 0, color: '#22c55e' },
        { label: 'Servicios monitoreados', value: 0, color: '#0ea5e9' },
        { label: 'Alertas abiertas', value: 0, color: '#ef4444' },
      ],
      dataSource: {
        module: 'operations',
        endpoint: '/api/dashboard/operations/summary',
        refresh: 300,
      },
    },
  },
  {
    id: 'stats-backups',
    name: 'Estado de respaldos',
    description: 'Visión rápida del estado de copias de seguridad recientes.',
    config: {
      title: 'Estado de respaldos',
      module: 'backups',
      stats: [
        { label: 'Último backup', value: '-', color: '#38bdf8' },
        { label: 'Pendientes', value: 0, color: '#f97316' },
        { label: 'Fallidos', value: 0, color: '#ef4444' },
      ],
      dataSource: {
        module: 'backups',
        endpoint: '/api/dashboard/backups/status',
        refresh: 600,
      },
    },
  },
];

export const widgetConfigPresets: Partial<Record<WidgetType, WidgetConfigPreset[]>> = {
  kpi: KPI_PRESETS.map((preset) => ({ ...preset, config: cloneConfig(preset.config) })),
  chart: CHART_PRESETS.map((preset) => ({ ...preset, config: cloneConfig(preset.config) })),
  list: LIST_PRESETS.map((preset) => ({ ...preset, config: cloneConfig(preset.config) })),
  quick_actions: QUICK_ACTIONS_PRESETS.map((preset) => ({ ...preset, config: cloneConfig(preset.config) })),
  alerts: ALERT_PRESETS.map((preset) => ({ ...preset, config: cloneConfig(preset.config) })),
  module_stats: MODULE_STATS_PRESETS.map((preset) => ({ ...preset, config: cloneConfig(preset.config) })),
};
