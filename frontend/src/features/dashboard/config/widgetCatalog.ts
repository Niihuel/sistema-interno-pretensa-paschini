import type { WidgetCatalogItem, WidgetType } from '../types/widget.types';
import { ChartType } from '../types/widget.types';
import {
  Activity,
  BarChart3,
  List,
  Zap,
  AlertTriangle,
  Package
} from 'lucide-react';

export const widgetCatalog: WidgetCatalogItem[] = [
  {
    type: 'kpi' as WidgetType,
    name: 'KPI',
    description: 'Muestra un indicador clave con valor, tendencia e ícono',
    icon: Activity,
    defaultSize: { w: 3, h: 2 },
    defaultConfig: {
      title: 'Nuevo KPI',
      value: 0,
      trend: {
        value: 0,
        direction: 'neutral' as const,
      },
      icon: 'activity',
      color: '#3b82f6',
      dataSource: {
        module: '',
        endpoint: '',
        refresh: 0,
      },
    },
  },
  {
    type: 'chart' as WidgetType,
    name: 'Gráfico',
    description: 'Visualiza datos con gráficos de barras, líneas, áreas o torta',
    icon: BarChart3,
    defaultSize: { w: 6, h: 4 },
    defaultConfig: {
      title: 'Nuevo Gráfico',
      chartType: ChartType.BAR,
      xAxisKey: 'name',
      yAxisKey: 'value',
      colors: ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'],
      showLegend: true,
      showGrid: true,
      animate: true,
      dataSource: {
        module: '',
        endpoint: '',
        refresh: 0,
      },
    },
  },
  {
    type: 'list' as WidgetType,
    name: 'Lista',
    description: 'Muestra una lista de elementos con título, subtítulo y badge',
    icon: List,
    defaultSize: { w: 4, h: 4 },
    defaultConfig: {
      title: 'Nueva Lista',
      itemTemplate: {
        title: 'title',
        subtitle: 'subtitle',
        badge: 'status',
        link: 'link',
      },
      limit: 10,
      dataSource: {
        module: '',
        endpoint: '',
        refresh: 0,
      },
    },
  },
  {
    type: 'quick_actions' as WidgetType,
    name: 'Acciones Rápidas',
    description: 'Botones de acceso rápido a funciones comunes',
    icon: Zap,
    defaultSize: { w: 4, h: 3 },
    defaultConfig: {
      title: 'Acciones Rápidas',
      actions: [
        {
          label: 'Nuevo Ticket',
          icon: 'plus',
          link: '/tickets/new',
          color: '#3b82f6',
        },
        {
          label: 'Empleados',
          icon: 'users',
          link: '/employees',
          color: '#10b981',
        },
        {
          label: 'Equipamiento',
          icon: 'package',
          link: '/equipment',
          color: '#f59e0b',
        },
        {
          label: 'Inventario',
          icon: 'wrench',
          link: '/inventory',
          color: '#ef4444',
        },
      ],
    },
  },
  {
    type: 'alerts' as WidgetType,
    name: 'Alertas',
    description: 'Muestra alertas y notificaciones con niveles de severidad',
    icon: AlertTriangle,
    defaultSize: { w: 4, h: 4 },
    defaultConfig: {
      title: 'Alertas',
      severityField: 'severity',
      messageField: 'message',
      limit: 5,
      dataSource: {
        module: '',
        endpoint: '',
        refresh: 30,
      },
    },
  },
  {
    type: 'module_stats' as WidgetType,
    name: 'Estadísticas de Módulo',
    description: 'Muestra estadísticas agrupadas de un módulo específico',
    icon: Package,
    defaultSize: { w: 4, h: 3 },
    defaultConfig: {
      title: 'Estadísticas',
      module: '',
      stats: [
        {
          label: 'Total',
          value: 0,
          color: '#3b82f6',
          link: '',
        },
        {
          label: 'Activos',
          value: 0,
          color: '#10b981',
          link: '',
        },
        {
          label: 'Pendientes',
          value: 0,
          color: '#f59e0b',
          link: '',
        },
        {
          label: 'Completados',
          value: 0,
          color: '#8b5cf6',
          link: '',
        },
      ],
      dataSource: {
        module: '',
        endpoint: '',
        refresh: 0,
      },
    },
  },
];

// Helper function to get catalog item by type
export const getWidgetCatalogItem = (type: WidgetType): WidgetCatalogItem | undefined => {
  return widgetCatalog.find((item) => item.type === type);
};

// Helper function to create a new widget from catalog
export const createWidgetFromCatalog = (type: WidgetType, position?: { x: number; y: number }): any => {
  const catalogItem = getWidgetCatalogItem(type);
  if (!catalogItem) return null;

  return {
    id: `widget-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    type: catalogItem.type,
    config: catalogItem.defaultConfig,
    layout: {
      x: position?.x || 0,
      y: position?.y || 0,
      w: catalogItem.defaultSize.w,
      h: catalogItem.defaultSize.h,
      minW: 2,
      minH: 2,
    },
    theme: {
      themeName: 'blue', // Tema por defecto
      backgroundColor: 'rgba(255, 255, 255, 0.05)',
      borderColor: 'rgba(255, 255, 255, 0.1)',
      textColor: 'white',
      accentColor: '#3b82f6',
    },
  };
};
