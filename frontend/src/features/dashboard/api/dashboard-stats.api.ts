import { apiClient } from '../../../api/client';

export interface DashboardStats {
  // Tickets
  tickets: {
    total: number;
    open: number;
    inProgress: number;
    closed: number;
    pending: number;
    byPriority: {
      high: number;
      medium: number;
      low: number;
    };
  };
  
  // Usuarios
  users: {
    total: number;
    active: number;
    inactive: number;
    online: number;
  };
  
  // Empleados
  employees: {
    total: number;
    active: number;
    inactive: number;
  };
  
  // Equipos
  equipment: {
    total: number;
    active: number;
    inactive: number;
    inMaintenance: number;
  };
  
  // Consumibles
  consumables: {
    total: number;
    lowStock: number;
    outOfStock: number;
    available: number;
  };
  
  // Solicitudes de compra
  purchaseRequests: {
    total: number;
    pending: number;
    approved: number;
    rejected: number;
  };
  
  // Notificaciones
  notifications: {
    total: number;
    unread: number;
  };
  
  // Backups
  backups: {
    lastBackup: string | null;
    totalBackups: number;
    successful: number;
    failed: number;
  };
}

export const dashboardStatsApi = {
  /**
   * Obtiene todas las estadísticas del dashboard
   */
  async getStats(): Promise<DashboardStats> {
    const { data } = await apiClient.get<DashboardStats>('/dashboard/stats');
    return data;
  },
  
  /**
   * Obtiene estadísticas de tickets
   */
  async getTicketStats() {
    const { data } = await apiClient.get('/tickets/stats');
    return data;
  },
  
  /**
   * Obtiene estadísticas de usuarios
   */
  async getUserStats() {
    const { data } = await apiClient.get('/users/stats');
    return data;
  },
  
  /**
   * Obtiene estadísticas de empleados
   */
  async getEmployeeStats() {
    const { data } = await apiClient.get('/employees/stats');
    return data;
  },
  
  /**
   * Obtiene estadísticas de equipos
   */
  async getEquipmentStats() {
    const { data } = await apiClient.get('/equipment/stats');
    return data;
  },
  
  /**
   * Obtiene estadísticas de consumibles
   */
  async getConsumableStats() {
    const { data } = await apiClient.get('/consumables/stats');
    return data;
  },
  
  /**
   * Obtiene estadísticas de solicitudes de compra
   */
  async getPurchaseRequestStats() {
    const { data } = await apiClient.get('/purchase-requests/stats');
    return data;
  },
};
