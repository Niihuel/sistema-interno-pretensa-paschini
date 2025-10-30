import type { Widget } from '../store/dashboardStore';

/**
 * Widgets predeterminados del Dashboard Administrativo
 * Estos widgets muestran datos reales del sistema
 */
export const defaultAdminWidgets: Omit<Widget, 'id'>[] = [
  // Fila 1: KPIs principales
  {
    type: 'kpi',
    title: 'Usuarios Activos',
    position: { col: 1, row: 1, colSpan: 3, rowSpan: 2 },
    config: {
      icon: 'Users',
      value: 0,
      dataSource: 'users',
      field: 'active',
      trend: {
        value: 8.3,
        direction: 'up' as const,
      },
      color: 'blue',
    },
    dataSource: {
      endpoint: '/dashboard/employees-stats',
      refresh: 60000,
    },
  },
  {
    type: 'kpi',
    title: 'Tickets Abiertos',
    position: { col: 4, row: 1, colSpan: 3, rowSpan: 2 },
    config: {
      icon: 'Ticket',
      value: 0,
      dataSource: 'tickets',
      field: 'open',
      trend: {
        value: -12.5,
        direction: 'down' as const,
      },
      color: 'orange',
    },
    dataSource: {
      endpoint: '/dashboard/tickets-stats',
      refresh: 30000,
    },
  },
  {
    type: 'kpi',
    title: 'Solicitudes Pendientes',
    position: { col: 7, row: 1, colSpan: 3, rowSpan: 2 },
    config: {
      icon: 'ClipboardList',
      value: 0,
      dataSource: 'purchaseRequests',
      field: 'pending',
      trend: {
        value: 5.2,
        direction: 'up' as const,
      },
      color: 'purple',
    },
    dataSource: {
      endpoint: '/dashboard/purchase-requests-stats',
      refresh: 60000,
    },
  },
  {
    type: 'kpi',
    title: 'Consumibles Bajo Stock',
    position: { col: 10, row: 1, colSpan: 3, rowSpan: 2 },
    config: {
      icon: 'Package',
      value: 0,
      dataSource: 'consumables',
      field: 'lowStock',
      trend: {
        value: 3,
        direction: 'up' as const,
      },
      color: 'red',
    },
    dataSource: {
      endpoint: '/dashboard/consumables-stats',
      refresh: 30000,
    },
  },

  // Fila 2: Estadísticas secundarias
  {
    type: 'kpi',
    title: 'Equipos Activos',
    position: { col: 1, row: 3, colSpan: 3, rowSpan: 2 },
    config: {
      icon: 'Monitor',
      value: 0,
      dataSource: 'equipment',
      field: 'active',
      color: 'green',
    },
    dataSource: {
      endpoint: '/dashboard/equipment-stats',
      refresh: 60000,
    },
  },
  {
    type: 'kpi',
    title: 'Empleados Registrados',
    position: { col: 4, row: 3, colSpan: 3, rowSpan: 2 },
    config: {
      icon: 'Briefcase',
      value: 0,
      dataSource: 'employees',
      field: 'total',
      color: 'blue',
    },
    dataSource: {
      endpoint: '/dashboard/employees-stats',
      refresh: 60000,
    },
  },

  // Fila 3: Alertas y notificaciones
  {
    type: 'alerts',
    title: 'Alertas del Sistema',
    position: { col: 7, row: 3, colSpan: 6, rowSpan: 3 },
    config: {
      maxItems: 5,
      showPriority: true,
    },
    dataSource: {
      endpoint: '/notifications',
      refresh: 30000,
    },
  },

  // Fila 4: Actividad reciente
  {
    type: 'list',
    title: 'Tickets Recientes',
    position: { col: 1, row: 5, colSpan: 6, rowSpan: 3 },
    config: {
      maxItems: 5,
      showStatus: true,
      showPriority: true,
    },
    dataSource: {
      endpoint: '/tickets?limit=5&sort=createdAt:desc',
      refresh: 30000,
    },
  },
];

/**
 * Obtiene widgets por defecto según el tipo de dashboard
 */
export function getDefaultWidgets(dashboardType: 'admin' | 'tickets' | 'custom' = 'admin'): Omit<Widget, 'id'>[] {
  switch (dashboardType) {
    case 'admin':
      return defaultAdminWidgets;
    case 'tickets':
      return [
        {
          type: 'kpi',
          title: 'Tickets Abiertos',
          position: { col: 1, row: 1, colSpan: 4, rowSpan: 2 },
          config: {
            icon: 'Ticket',
            value: 0,
            dataSource: 'tickets',
            field: 'open',
            color: 'orange',
          },
          dataSource: {
            endpoint: '/dashboard/tickets-stats',
            refresh: 30000,
          },
        },
        {
          type: 'kpi',
          title: 'En Progreso',
          position: { col: 5, row: 1, colSpan: 4, rowSpan: 2 },
          config: {
            icon: 'Zap',
            value: 0,
            dataSource: 'tickets',
            field: 'inProgress',
            color: 'blue',
          },
          dataSource: {
            endpoint: '/dashboard/tickets-stats',
            refresh: 30000,
          },
        },
        {
          type: 'kpi',
          title: 'Cerrados Hoy',
          position: { col: 9, row: 1, colSpan: 4, rowSpan: 2 },
          config: {
            icon: 'Zap',
            value: 0,
            dataSource: 'tickets',
            field: 'closedToday',
            color: 'green',
          },
          dataSource: {
            endpoint: '/dashboard/tickets-stats',
            refresh: 30000,
          },
        },
      ];
    default:
      return [];
  }
}
