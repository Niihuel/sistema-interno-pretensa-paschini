/**
 * Templates de widgets - Tipos genéricos de componentes
 * El usuario configura el contenido después mediante el modal
 */

import type { WidgetType } from '../types/widget.types';

export interface WidgetTemplate {
  id: string;
  name: string;
  description: string;
  category: 'basic' | 'advanced';
  icon: string;
  type: WidgetType;
}

/**
 * Templates genéricos - Solo 5 tipos básicos de widgets
 */
export const widgetTemplates: WidgetTemplate[] = [
  {
    id: 'kpi-widget',
    name: 'KPI / Métrica',
    description: 'Muestra un valor numérico de cualquier módulo. Ideal para totales, cantidades o porcentajes. Configura después qué módulo y campo mostrar.',
    category: 'basic',
    icon: 'BarChart3',
    type: 'kpi',
  },
  {
    id: 'chart-widget',
    name: 'Gráfico',
    description: 'Visualiza datos en gráficos de barras, líneas, área o circulares. Elige el módulo y tipo de gráfico en la configuración.',
    category: 'basic',
    icon: 'TrendingUp',
    type: 'chart',
  },
  {
    id: 'list-widget',
    name: 'Lista',
    description: 'Muestra una lista de elementos de cualquier módulo. Ideal para mostrar items recientes o pendientes.',
    category: 'basic',
    icon: 'List',
    type: 'list',
  },
  {
    id: 'alerts-widget',
    name: 'Alertas',
    description: 'Muestra notificaciones y alertas del sistema. Mantente informado de eventos importantes.',
    category: 'basic',
    icon: 'Bell',
    type: 'alerts',
  },
  {
    id: 'quick-actions-widget',
    name: 'Acciones Rápidas',
    description: 'Botones de acceso rápido a las páginas más importantes del sistema.',
    category: 'basic',
    icon: 'Zap',
    type: 'quick_actions',
  },
];

/**
 * Obtener plantillas por categoría
 */
export function getTemplatesByCategory(category: WidgetTemplate['category']): WidgetTemplate[] {
  return widgetTemplates.filter((t) => t.category === category);
}

/**
 * Obtener plantilla por ID
 */
export function getTemplateById(id: string): WidgetTemplate | undefined {
  return widgetTemplates.find((t) => t.id === id);
}

/**
 * Obtener todas las categorías disponibles
 */
export function getCategories(): Array<{ id: WidgetTemplate['category']; label: string; icon: string }> {
  return [
    { id: 'basic', label: 'Básicos', icon: 'LayoutGrid' },
    { id: 'advanced', label: 'Avanzados', icon: 'Sparkles' },
  ];
}
