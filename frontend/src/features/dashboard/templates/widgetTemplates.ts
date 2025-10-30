import type { Widget } from '../store/dashboardStore';
import { 
  DollarSign, 
  Users, 
  Package, 
  TrendingUp, 
  BarChart3, 
  Activity,
  List,
  AlertTriangle,
  Zap,
  Boxes
} from 'lucide-react';

export interface WidgetTemplate {
  id: string;
  name: string;
  description: string;
  icon: string; // Emoji deprecated, use iconComponent
  iconComponent: any; // Lucide icon component
  category: 'analytics' | 'operations' | 'sales' | 'monitoring';
  widget: Omit<Widget, 'id'>;
}

export const widgetTemplates: WidgetTemplate[] = [
  // KPI Templates
  {
    id: 'kpi-sales',
    name: 'Ventas del Día',
    description: 'KPI con ventas totales y tendencia',
    icon: '💰',
    iconComponent: DollarSign,
    category: 'sales',
    widget: {
      type: 'kpi',
      title: 'Ventas del Día',
      position: { col: 1, row: 1, colSpan: 3, rowSpan: 2 },
      config: {
        value: '$45,500',
        icon: '💰', // Será mapeado a DollarSign en el widget
        trend: { value: 12.5, direction: 'up' },
      },
      dataSource: {
        endpoint: '/api/sales/today',
        refresh: 60,
      },
    },
  },
  {
    id: 'kpi-users',
    name: 'Usuarios Activos',
    description: 'Total de usuarios activos en tiempo real',
    icon: '👥',
    iconComponent: Users,
    category: 'analytics',
    widget: {
      type: 'kpi',
      title: 'Usuarios Activos',
      position: { col: 1, row: 1, colSpan: 3, rowSpan: 2 },
      config: {
        value: 1250,
        icon: '👥',
        trend: { value: 8.3, direction: 'up' },
      },
      dataSource: {
        endpoint: '/api/users/active',
        refresh: 30,
      },
    },
  },
  {
    id: 'kpi-orders',
    name: 'Pedidos Pendientes',
    description: 'Cantidad de pedidos por procesar',
    icon: '📦',
    iconComponent: Package,
    category: 'operations',
    widget: {
      type: 'kpi',
      title: 'Pedidos Pendientes',
      position: { col: 1, row: 1, colSpan: 3, rowSpan: 2 },
      config: {
        value: 23,
        icon: '📦',
        trend: { value: -15.2, direction: 'down' },
      },
      dataSource: {
        endpoint: '/api/orders/pending',
        refresh: 60,
      },
    },
  },
  {
    id: 'kpi-revenue',
    name: 'Ingresos Mensuales',
    description: 'Total de ingresos del mes actual',
    icon: '📈',
    iconComponent: TrendingUp,
    category: 'sales',
    widget: {
      type: 'kpi',
      title: 'Ingresos del Mes',
      position: { col: 1, row: 1, colSpan: 3, rowSpan: 2 },
      config: {
        value: '$125,000',
        icon: '📈',
        trend: { value: 22.1, direction: 'up' },
      },
      dataSource: {
        endpoint: '/api/revenue/monthly',
        refresh: 300,
      },
    },
  },

  // Chart Templates
  {
    id: 'chart-sales-week',
    name: 'Ventas Semanales',
    description: 'Gráfico de barras con ventas por día',
    icon: '📊',
    iconComponent: BarChart3,
    category: 'sales',
    widget: {
      type: 'chart',
      title: 'Ventas de la Semana',
      position: { col: 1, row: 1, colSpan: 6, rowSpan: 4 },
      config: {
        chartType: 'bar',
        xAxisKey: 'day',
        yAxisKey: 'sales',
        colors: ['#6366f1'],
        showLegend: true,
        showGrid: true,
      },
      dataSource: {
        endpoint: '/api/sales/week',
        refresh: 300,
      },
    },
  },
  {
    id: 'chart-traffic',
    name: 'Tráfico del Sitio',
    description: 'Gráfico de líneas con visitas',
    icon: '📈',
    iconComponent: Activity,
    category: 'analytics',
    widget: {
      type: 'chart',
      title: 'Visitas del Sitio',
      position: { col: 1, row: 1, colSpan: 6, rowSpan: 4 },
      config: {
        chartType: 'line',
        xAxisKey: 'hour',
        yAxisKey: 'visits',
        colors: ['#10b981'],
        showLegend: false,
        showGrid: true,
      },
      dataSource: {
        endpoint: '/api/analytics/traffic',
        refresh: 60,
      },
    },
  },

  // List Templates
  {
    id: 'list-orders',
    name: 'Últimos Pedidos',
    description: 'Lista de pedidos recientes',
    icon: '📋',
    iconComponent: List,
    category: 'operations',
    widget: {
      type: 'list',
      title: 'Últimos Pedidos',
      position: { col: 1, row: 1, colSpan: 4, rowSpan: 4 },
      config: {
        itemTemplate: {
          title: 'order_number',
          subtitle: 'customer_name',
          badge: 'status',
          link: '/orders/:id',
        },
        limit: 10,
      },
      dataSource: {
        endpoint: '/api/orders/recent',
        refresh: 60,
      },
    },
  },
  {
    id: 'list-alerts',
    name: 'Alertas del Sistema',
    description: 'Notificaciones importantes',
    icon: '⚠️',
    iconComponent: AlertTriangle,
    category: 'monitoring',
    widget: {
      type: 'alerts',
      title: 'Alertas del Sistema',
      position: { col: 1, row: 1, colSpan: 4, rowSpan: 4 },
      config: {
        severityField: 'severity',
        messageField: 'message',
        limit: 5,
      },
      dataSource: {
        endpoint: '/api/system/alerts',
        refresh: 30,
      },
    },
  },

  // Quick Actions Templates
  {
    id: 'actions-main',
    name: 'Acciones Principales',
    description: 'Accesos rápidos a funciones clave',
    icon: '⚡',
    iconComponent: Zap,
    category: 'operations',
    widget: {
      type: 'quick_actions',
      title: 'Acciones Rápidas',
      position: { col: 1, row: 1, colSpan: 4, rowSpan: 3 },
      config: {
        actions: [
          { label: 'Nuevo Pedido', icon: 'plus', link: '/orders/new', color: '#10b981' },
          { label: 'Inventario', icon: 'package', link: '/inventory', color: '#6366f1' },
          { label: 'Clientes', icon: 'users', link: '/customers', color: '#f59e0b' },
          { label: 'Reportes', icon: 'file-text', link: '/reports', color: '#8b5cf6' },
        ],
      },
    },
  },

  // Module Stats Templates
  {
    id: 'stats-inventory',
    name: 'Estadísticas de Inventario',
    description: 'Resumen del estado del inventario',
    icon: '📦',
    iconComponent: Boxes,
    category: 'operations',
    widget: {
      type: 'module_stats',
      title: 'Inventario',
      position: { col: 1, row: 1, colSpan: 4, rowSpan: 3 },
      config: {
        module: 'inventory',
        stats: [
          { label: 'Total Productos', value: 1234, color: '#6366f1' },
          { label: 'Stock Bajo', value: 45, color: '#ef4444', link: '/inventory?filter=low' },
          { label: 'Valor Total', value: '$125K', color: '#10b981' },
          { label: 'Movimientos Hoy', value: 89, color: '#f59e0b' },
        ],
      },
      dataSource: {
        endpoint: '/api/inventory/stats',
        refresh: 300,
      },
    },
  },
];

// Helper para obtener templates por categoría
export function getTemplatesByCategory(category: WidgetTemplate['category']) {
  return widgetTemplates.filter((t) => t.category === category);
}

// Helper para obtener un template por ID
export function getTemplateById(id: string) {
  return widgetTemplates.find((t) => t.id === id);
}

// Categorías disponibles
export const categories: Array<{ id: WidgetTemplate['category']; label: string }> = [
  { id: 'analytics', label: 'Analytics' },
  { id: 'sales', label: 'Ventas' },
  { id: 'operations', label: 'Operaciones' },
  { id: 'monitoring', label: 'Monitoreo' },
];
