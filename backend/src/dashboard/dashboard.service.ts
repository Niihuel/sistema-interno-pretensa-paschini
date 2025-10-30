import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/common/prisma.service';
import { subDays, format } from 'date-fns';

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Obtiene la metadata de configuración para los widgets
   * Devuelve los módulos disponibles y sus campos configurables
   */
  async getWidgetConfigMetadata() {
    return {
      modules: [
        {
          id: 'tickets',
          label: 'Tickets',
          endpoint: '/dashboard/tickets-stats',
          fields: [
            { id: 'total', label: 'Total de Tickets', type: 'number' },
            { id: 'open', label: 'Tickets Abiertos', type: 'number' },
            { id: 'inProgress', label: 'En Progreso', type: 'number' },
            { id: 'resolved', label: 'Resueltos', type: 'number' },
            { id: 'closed', label: 'Cerrados', type: 'number' },
            { id: 'byPriority', label: 'Por Prioridad', type: 'chart' },
            { id: 'trend', label: 'Tendencia (7 días)', type: 'chart' },
          ]
        },
        {
          id: 'equipment',
          label: 'Equipos',
          endpoint: '/dashboard/equipment-stats',
          fields: [
            { id: 'total', label: 'Total de Equipos', type: 'number' },
            { id: 'active', label: 'Equipos Activos', type: 'number' },
            { id: 'inactive', label: 'Equipos Inactivos', type: 'number' },
            { id: 'inRepair', label: 'En Reparación', type: 'number' },
            { id: 'byStatus', label: 'Por Estado', type: 'chart' },
            { id: 'byCategory', label: 'Por Categoría', type: 'chart' },
          ]
        },
        {
          id: 'employees',
          label: 'Empleados',
          endpoint: '/dashboard/employees-stats',
          fields: [
            { id: 'total', label: 'Total de Empleados', type: 'number' },
            { id: 'active', label: 'Empleados Activos', type: 'number' },
            { id: 'inactive', label: 'Empleados Inactivos', type: 'number' },
            { id: 'recentHires', label: 'Contrataciones Recientes (30 días)', type: 'number' },
            { id: 'byArea', label: 'Por Área', type: 'chart' },
          ]
        },
        {
          id: 'printers',
          label: 'Impresoras',
          endpoint: '/dashboard/printers-stats',
          fields: [
            { id: 'total', label: 'Total de Impresoras', type: 'number' },
            { id: 'active', label: 'Impresoras Activas', type: 'number' },
            { id: 'inactive', label: 'Impresoras Inactivas', type: 'number' },
            { id: 'inRepair', label: 'En Reparación', type: 'number' },
            { id: 'byStatus', label: 'Por Estado', type: 'chart' },
            { id: 'byArea', label: 'Por Área', type: 'chart' },
          ]
        },
        {
          id: 'inventory',
          label: 'Inventario',
          endpoint: '/dashboard/inventory-stats',
          fields: [
            { id: 'total', label: 'Total de Items', type: 'number' },
            { id: 'lowStock', label: 'Stock Bajo', type: 'number' },
            { id: 'outOfStock', label: 'Sin Stock', type: 'number' },
            { id: 'byCategory', label: 'Por Categoría', type: 'chart' },
            { id: 'criticalItems', label: 'Items Críticos', type: 'list' },
          ]
        },
        {
          id: 'consumables',
          label: 'Consumibles',
          endpoint: '/dashboard/consumables-stats',
          fields: [
            { id: 'total', label: 'Total de Consumibles', type: 'number' },
            { id: 'lowStock', label: 'Stock Bajo', type: 'number' },
            { id: 'outOfStock', label: 'Sin Stock', type: 'number' },
            { id: 'criticalItems', label: 'Items Críticos', type: 'list' },
          ]
        },
        {
          id: 'purchase-requests',
          label: 'Solicitudes de Compra',
          endpoint: '/dashboard/purchase-requests-stats',
          fields: [
            { id: 'total', label: 'Total de Solicitudes', type: 'number' },
            { id: 'pending', label: 'Solicitudes Pendientes', type: 'number' },
            { id: 'approved', label: 'Aprobadas', type: 'number' },
            { id: 'rejected', label: 'Rechazadas', type: 'number' },
            { id: 'byStatus', label: 'Por Estado', type: 'chart' },
          ]
        },
        {
          id: 'daily-backups',
          label: 'Backups Diarios',
          endpoint: '/dashboard/daily-backups-stats',
          fields: [
            { id: 'total', label: 'Total de Backups', type: 'number' },
            { id: 'completed', label: 'Completados', type: 'number' },
            { id: 'pending', label: 'Pendientes', type: 'number' },
            { id: 'thisMonth', label: 'Este Mes', type: 'group' },
            { id: 'lastMonth', label: 'Mes Anterior', type: 'group' },
          ]
        },
      ]
    };
  }

  async getTicketsStats() {
    try {
      const [total, open, inProgress, resolved, closed, byPriority] = await Promise.all([
        this.prisma.ticket.count(),
        this.prisma.ticket.count({ where: { status: 'OPEN' } }),
        this.prisma.ticket.count({ where: { status: 'IN_PROGRESS' } }),
        this.prisma.ticket.count({ where: { status: 'RESOLVED' } }),
        this.prisma.ticket.count({ where: { status: 'CLOSED' } }),
        this.prisma.ticket.groupBy({
          by: ['priority'],
          _count: { _all: true }
        }).then(rows => rows.map(r => ({ name: r.priority, value: r._count._all })))
      ]);

      // Trend for last 7 days
      const trend: Array<{ date: string; open: number; closed: number }> = [];
      for (let i = 6; i >= 0; i--) {
        const date = subDays(new Date(), i);
        const [openCount, closedCount] = await Promise.all([
          this.prisma.ticket.count({
            where: {
              status: 'OPEN',
              createdAt: { gte: date, lt: subDays(date, -1) }
            }
          }),
          this.prisma.ticket.count({
            where: {
              status: 'CLOSED',
              updatedAt: { gte: date, lt: subDays(date, -1) }
            }
          })
        ]);
        trend.push({ date: format(date, 'dd/MM'), open: openCount, closed: closedCount });
      }

      return { total, open, inProgress, resolved, closed, byPriority, trend };
    } catch (error) {
      return { total: 0, open: 0, inProgress: 0, resolved: 0, closed: 0, byPriority: [], trend: [] };
    }
  }

  async getEquipmentStats() {
    try {
      const [total, active, inactive, inRepair, byStatus, byCategory] = await Promise.all([
        this.prisma.equipment.count(),
        this.prisma.equipment.count({ where: { status: 'Activo' } }),
        this.prisma.equipment.count({ where: { status: 'Inactivo' } }),
        this.prisma.equipment.count({ where: { status: 'En Reparación' } }),
        this.prisma.equipment.groupBy({
          by: ['status'],
          _count: { _all: true }
        }).then(rows => rows.map(r => ({ name: r.status, value: r._count._all }))),
        this.prisma.equipment.groupBy({
          by: ['type'],
          _count: { _all: true }
        }).then(rows => rows.map(r => ({ name: r.type, value: r._count._all })))
      ]);

      return { total, active, inactive, inRepair, byStatus, byCategory };
    } catch (error) {
      return { total: 0, active: 0, inactive: 0, inRepair: 0, byStatus: [], byCategory: [] };
    }
  }

  async getPrintersStats() {
    try {
      const [total, active, inactive, inRepair, byStatus] = await Promise.all([
        this.prisma.printer.count(),
        this.prisma.printer.count({ where: { status: 'ACTIVE' } }),
        this.prisma.printer.count({ where: { status: 'INACTIVE' } }),
        this.prisma.printer.count({ where: { status: 'IN_REPAIR' } }),
        this.prisma.printer.groupBy({
          by: ['status'],
          _count: { _all: true }
        }).then(rows => rows.map(r => ({ name: r.status, value: r._count._all })))
      ]);

      // By area
      const byArea = await this.prisma.printer.groupBy({
        by: ['area'],
        _count: { _all: true }
      }).then(rows => {
        return rows.map(r => ({
          name: r.area || 'Sin área',
          value: r._count._all
        }));
      });

      return { total, active, inactive, inRepair, byStatus, byArea };
    } catch (error) {
      return { total: 0, active: 0, inactive: 0, inRepair: 0, byStatus: [], byArea: [] };
    }
  }

  async getInventoryStats() {
    try {
      const [total, lowStock, outOfStock, byCategory] = await Promise.all([
        this.prisma.inventoryItem.count(),
        this.prisma.inventoryItem.count({
          where: {
            quantity: { lte: 10 }
          }
        }),
        this.prisma.inventoryItem.count({ where: { quantity: 0 } }),
        this.prisma.inventoryItem.groupBy({
          by: ['category'],
          _count: { _all: true }
        }).then(rows => rows.map(r => ({ name: r.category, value: r._count._all })))
      ]);

      // Critical items (items with quantity <= 10)
      const criticalItems = await this.prisma.inventoryItem.findMany({
        where: {
          quantity: { lte: 10 }
        },
        select: {
          name: true,
          quantity: true
        },
        take: 5,
        orderBy: { quantity: 'asc' }
      }).then(items => items.map(item => ({
        name: item.name,
        current: item.quantity,
        minimum: 10
      })));

      return { total, lowStock, outOfStock, byCategory, criticalItems };
    } catch (error) {
      return { total: 0, lowStock: 0, outOfStock: 0, byCategory: [], criticalItems: [] };
    }
  }

  async getEmployeesStats() {
    try {
      const [total, active, inactive] = await Promise.all([
        this.prisma.employee.count(),
        this.prisma.employee.count({ where: { status: 'ACTIVE' } }),
        this.prisma.employee.count({ where: { status: 'INACTIVE' } })
      ]);

      // Recent hires (last 30 days)
      const thirtyDaysAgo = subDays(new Date(), 30);
      const recentHires = await this.prisma.employee.count({
        where: { createdAt: { gte: thirtyDaysAgo } }
      });

      // By area
      const byArea = await this.prisma.employee.groupBy({
        by: ['area'],
        _count: { _all: true }
      }).then(rows => {
        return rows.map(r => ({
          name: r.area || 'Sin área',
          value: r._count._all
        }));
      });

      return { total, active, inactive, recentHires, byArea };
    } catch (error) {
      return { total: 0, active: 0, inactive: 0, recentHires: 0, byArea: [] };
    }
  }

  async getConsumablesStats() {
    try {
      const consumables = await this.prisma.consumable.findMany({
        select: {
          itemName: true,
          quantityAvailable: true,
          minimumStock: true
        }
      });

      const total = consumables.length;
      let lowStock = 0;
      let outOfStock = 0;
      const criticalItems: Array<{ name: string; currentStock: number; minStock: number; percentage: number }> = [];

      for (const consumable of consumables) {
        const totalStock = consumable.quantityAvailable;
        const minStock = consumable.minimumStock;
        const percentage = minStock > 0 ? (totalStock / minStock) * 100 : 100;

        if (totalStock === 0) {
          outOfStock++;
          criticalItems.push({
            name: consumable.itemName,
            currentStock: totalStock,
            minStock: minStock,
            percentage: 0
          });
        } else if (totalStock <= minStock) {
          lowStock++;
          criticalItems.push({
            name: consumable.itemName,
            currentStock: totalStock,
            minStock: minStock,
            percentage
          });
        }
      }

      // Sort by percentage (most critical first)
      criticalItems.sort((a, b) => a.percentage - b.percentage);

      return {
        total,
        lowStock,
        outOfStock,
        criticalItems: criticalItems.slice(0, 5)
      };
    } catch (error) {
      return { total: 0, lowStock: 0, outOfStock: 0, criticalItems: [] };
    }
  }

  async getMyLayout(userId: number) {
    try {
      const dashboardLayout = await this.prisma.dashboardLayout.findUnique({
        where: {
          userId_name: {
            userId,
            name: 'default'
          }
        }
      });

      if (!dashboardLayout) {
        return null;
      }

      // Verificar que layout no sea null antes de parsear
      if (!dashboardLayout.layout) {
        return null;
      }

      return JSON.parse(dashboardLayout.layout);
    } catch (error) {
      console.error('Error getting dashboard layout:', error);
      return null;
    }
  }

  async saveLayout(userId: number, layoutData: any) {
    try {
      const existingLayout = await this.prisma.dashboardLayout.findUnique({
        where: {
          userId_name: {
            userId,
            name: 'default'
          }
        }
      });

      const data = {
        userId,
        layoutId: 'default',
        name: 'default',
        layout: JSON.stringify(layoutData),
        widgets: layoutData.widgets || [],
        isDefault: true
      };

      if (existingLayout) {
        await this.prisma.dashboardLayout.update({
          where: {
            userId_name: {
              userId,
              name: 'default'
            }
          },
          data: {
            layout: data.layout,
            widgets: data.widgets
          }
        });
      } else {
        await this.prisma.dashboardLayout.create({
          data
        });
      }

      return { success: true };
    } catch (error) {
      console.error('Error saving dashboard layout:', error);
      throw error;
    }
  }

  async getSummary() {
    try {
      const [
        openTickets,
        totalEquipment,
        activeEmployees,
        equipmentByStatus,
        printersByStatus,
        purchasesByStatus,
        ticketsByPriority,
        employeesByArea,
        inventoryByCategory,
        backupsByStatus
      ] = await Promise.all([
        // Open tickets count
        this.prisma.ticket.count({ where: { status: 'OPEN' } }).catch(() => 0),

        // Total equipment count
        this.prisma.equipment.count().catch(() => 0),

        // Active employees count
        this.prisma.employee.count({ where: { status: 'ACTIVE' } }).catch(() => 0),

        // Equipment by status
        this.prisma.equipment
          .groupBy({
            by: ['status'],
            _count: { _all: true }
          })
          .then((rows) => rows.map((r) => ({ name: r.status, value: r._count._all })))
          .catch(() => []),

        // Printers by status
        this.prisma.printer
          .groupBy({
            by: ['status'],
            _count: { _all: true }
          })
          .then((rows) => rows.map((r) => ({
            name: r.status === 'ACTIVE' ? 'Activo' : r.status,
            value: r._count._all
          })))
          .catch(() => []),

        // Purchases by status
        this.prisma.purchase
          .groupBy({
            by: ['status'],
            _count: { _all: true }
          })
          .then((rows) => rows.map((r) => ({ name: r.status, value: r._count._all })))
          .catch(() => []),

        // Tickets by priority
        this.prisma.ticket
          .groupBy({
            by: ['priority'],
            _count: { _all: true }
          })
          .then((rows) => rows.map((r) => ({ name: r.priority, value: r._count._all })))
          .catch(() => []),

        // Employees by area
        this.prisma.employee
          .groupBy({
            by: ['area'],
            _count: { _all: true }
          })
          .then((rows) => {
            return rows.map((r) => ({
              name: r.area || 'Sin área',
              value: r._count._all
            }));
          })
          .catch(() => []),

        // Inventory by category
        this.prisma.inventoryItem
          .groupBy({
            by: ['category'],
            _count: { _all: true }
          })
          .then((rows) => rows.map((r) => ({ name: r.category, value: r._count._all })))
          .catch(() => []),

        // Backups by status
        this.prisma.backupLog
          .groupBy({
            by: ['status'],
            _count: { _all: true }
          })
          .then((rows) => rows.map((r) => ({ name: r.status, value: r._count._all })))
          .catch(() => [])
      ]);

      return {
        openTickets,
        totalEquipment,
        activeEmployees,
        equipmentByStatus,
        printersByStatus,
        purchasesByStatus,
        ticketsByPriority,
        employeesByArea,
        inventoryByCategory,
        backupsByStatus
      };
    } catch (error) {
      // Return empty data on error
      return {
        openTickets: 0,
        totalEquipment: 0,
        activeEmployees: 0,
        equipmentByStatus: [],
        printersByStatus: [],
        purchasesByStatus: [],
        ticketsByPriority: [],
        employeesByArea: [],
        inventoryByCategory: [],
        backupsByStatus: []
      };
    }
  }

  async getPurchaseRequestsStats() {
    try {
      const [total, pending, approved, rejected, received, byCategory, byPriority] = await Promise.all([
        this.prisma.purchaseRequest.count(),
        this.prisma.purchaseRequest.count({ where: { status: 'PENDING' } }),
        this.prisma.purchaseRequest.count({ where: { status: 'APPROVED' } }),
        this.prisma.purchaseRequest.count({ where: { status: 'REJECTED' } }),
        this.prisma.purchaseRequest.count({ where: { status: 'RECEIVED' } }),
        this.prisma.purchaseRequest.groupBy({
          by: ['category'],
          _count: { _all: true }
        }).then(rows => rows.map(r => ({ name: r.category || 'Sin categoría', value: r._count._all }))),
        this.prisma.purchaseRequest.groupBy({
          by: ['priority'],
          _count: { _all: true }
        }).then(rows => rows.map(r => ({ name: r.priority, value: r._count._all })))
      ]);

      // Tendencia últimos 30 días
      const trend: Array<{ date: string; created: number; approved: number }> = [];
      for (let i = 29; i >= 0; i--) {
        const date = subDays(new Date(), i);
        const [createdCount, approvedCount] = await Promise.all([
          this.prisma.purchaseRequest.count({
            where: {
              createdAt: { gte: date, lt: subDays(date, -1) }
            }
          }),
          this.prisma.purchaseRequest.count({
            where: {
              status: 'APPROVED',
              updatedAt: { gte: date, lt: subDays(date, -1) }
            }
          })
        ]);
        trend.push({ date: format(date, 'dd/MM'), created: createdCount, approved: approvedCount });
      }

      return { total, pending, approved, rejected, received, byCategory, byPriority, trend };
    } catch (error) {
      return { total: 0, pending: 0, approved: 0, rejected: 0, received: 0, byCategory: [], byPriority: [], trend: [] };
    }
  }

  async getRecentActivity(userId: number) {
    try {
      // Get user's permissions to filter activities
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        include: {
          userRoles: {
            include: {
              role: {
                include: {
                  rolePermissions: {
                    include: {
                      permission: true
                    }
                  }
                }
              }
            }
          },
          userPermissions: {
            include: {
              permission: true
            }
          }
        }
      });

      if (!user) {
        return [];
      }

      // Extract permissions
      const permissions = new Set<string>();

      // Add permissions from roles
      user.userRoles.forEach(userRole => {
        if (userRole.isActive) {
          userRole.role.rolePermissions.forEach(rolePermission => {
            if (rolePermission.isActive && rolePermission.permission.isActive) {
              permissions.add(`${rolePermission.permission.resource}:${rolePermission.permission.action}`);
            }
          });
        }
      });

      // Add direct user permissions
      user.userPermissions.forEach(userPermission => {
        if (userPermission.isActive && !userPermission.isDenied && userPermission.permission.isActive) {
          permissions.add(`${userPermission.permission.resource}:${userPermission.permission.action}`);
        }
      });

      const activities: any[] = [];

      // Fetch tickets (if user has permission)
      if (permissions.has('tickets:view') || permissions.has('tickets:view_all')) {
        try {
          const tickets = await this.prisma.ticket.findMany({
            take: 10,
            orderBy: { createdAt: 'desc' },
            include: {
              requestor: {
                select: { firstName: true, lastName: true }
              },
              technician: {
                select: { firstName: true, lastName: true, username: true }
              }
            }
          });

          tickets.forEach(ticket => {
            const userName = ticket.technician
              ? `${ticket.technician.firstName || ''} ${ticket.technician.lastName || ''}`.trim() || ticket.technician.username
              : `${ticket.requestor.firstName} ${ticket.requestor.lastName}`;

            activities.push({
              id: `ticket-${ticket.id}`,
              type: 'ticket',
              action: ticket.status === 'CLOSED' ? 'completed' : ticket.status === 'OPEN' ? 'created' : 'updated',
              title: ticket.title,
              user: userName,
              timestamp: ticket.createdAt,
              status: ticket.priority === 'HIGH' ? 'warning' : ticket.priority === 'CRITICAL' ? 'warning' : 'info'
            });
          });
        } catch (error) {
          console.error('Error fetching tickets for activity feed:', error);
        }
      }

      // Fetch equipment (if user has permission)
      if (permissions.has('equipment:view') || permissions.has('equipment:view_all')) {
        try {
          const equipment = await this.prisma.equipment.findMany({
            take: 10,
            orderBy: { createdAt: 'desc' },
            include: {
              assignedTo: {
                select: { firstName: true, lastName: true }
              }
            }
          });

          equipment.forEach(item => {
            const userName = item.assignedTo
              ? `${item.assignedTo.firstName} ${item.assignedTo.lastName}`
              : 'Sistema';

            activities.push({
              id: `equipment-${item.id}`,
              type: 'equipment',
              action: 'created',
              title: `${item.type}: ${item.name}`,
              user: userName,
              timestamp: item.createdAt,
              status: item.status === 'Activo' ? 'success' : 'info'
            });
          });
        } catch (error) {
          console.error('Error fetching equipment for activity feed:', error);
        }
      }

      // Fetch replacements/repairs (if user has permission)
      if (permissions.has('replacements:view') || permissions.has('replacements:view_all')) {
        try {
          const replacements = await this.prisma.replacement.findMany({
            take: 10,
            orderBy: { createdAt: 'desc' },
            include: {
              printer: {
                select: { model: true }
              },
              consumable: {
                select: { itemName: true }
              }
            }
          });

          replacements.forEach(replacement => {
            activities.push({
              id: `repair-${replacement.id}`,
              type: 'repair',
              action: replacement.completionDate ? 'completed' : 'created',
              title: `Reemplazo en impresora ${replacement.printer.model}`,
              user: 'Técnico',
              timestamp: replacement.createdAt,
              status: replacement.completionDate ? 'success' : 'info'
            });
          });
        } catch (error) {
          console.error('Error fetching replacements for activity feed:', error);
        }
      }

      // Fetch purchase requests (if user has permission)
      if (permissions.has('purchase_requests:view') || permissions.has('purchase_requests:view_all')) {
        try {
          const purchases = await this.prisma.purchaseRequest.findMany({
            take: 10,
            orderBy: { createdAt: 'desc' },
            include: {
              requestor: {
                select: { firstName: true, lastName: true }
              }
            }
          });

          purchases.forEach(purchase => {
            const userName = purchase.requestor
              ? `${purchase.requestor.firstName} ${purchase.requestor.lastName}`
              : 'Sistema';

            activities.push({
              id: `purchase-${purchase.id}`,
              type: 'purchase',
              action: purchase.status === 'APPROVED' ? 'approved' : purchase.status === 'RECEIVED' ? 'completed' : 'created',
              title: purchase.itemName,
              user: userName,
              timestamp: purchase.createdAt,
              status: purchase.status === 'APPROVED' ? 'success' : purchase.status === 'REJECTED' ? 'warning' : 'info'
            });
          });
        } catch (error) {
          console.error('Error fetching purchases for activity feed:', error);
        }
      }

      // Fetch employees (if user has permission)
      if (permissions.has('employees:view') || permissions.has('employees:view_all')) {
        try {
          const employees = await this.prisma.employee.findMany({
            take: 10,
            orderBy: { createdAt: 'desc' },
            select: {
              id: true,
              firstName: true,
              lastName: true,
              area: true,
              status: true,
              createdAt: true
            }
          });

          employees.forEach(employee => {
            activities.push({
              id: `employee-${employee.id}`,
              type: 'employee',
              action: 'created',
              title: `Nuevo empleado: ${employee.firstName} ${employee.lastName}`,
              user: 'RRHH',
              timestamp: employee.createdAt,
              status: employee.status === 'ACTIVE' ? 'success' : 'info'
            });
          });
        } catch (error) {
          console.error('Error fetching employees for activity feed:', error);
        }
      }

      // Fetch inventory items (if user has permission)
      if (permissions.has('inventory:view') || permissions.has('inventory:view_all')) {
        try {
          const inventoryItems = await this.prisma.inventoryItem.findMany({
            take: 10,
            orderBy: { createdAt: 'desc' },
            include: {
              assignedTo: {
                select: { firstName: true, lastName: true }
              }
            }
          });

          inventoryItems.forEach(item => {
            const userName = item.assignedTo
              ? `${item.assignedTo.firstName} ${item.assignedTo.lastName}`
              : 'Sistema';

            activities.push({
              id: `inventory-${item.id}`,
              type: 'inventory',
              action: 'created',
              title: `${item.category}: ${item.name}`,
              user: userName,
              timestamp: item.createdAt,
              status: item.status === 'AVAILABLE' ? 'success' : 'info'
            });
          });
        } catch (error) {
          console.error('Error fetching inventory for activity feed:', error);
        }
      }

      // Sort all activities by timestamp (most recent first)
      activities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

      // Return top 20 activities
      return activities.slice(0, 20);
    } catch (error) {
      console.error('Error fetching recent activity:', error);
      return [];
    }
  }

  async getDailyBackupsStats() {
    try {
      const now = new Date();
      const last7Days = subDays(now, 7);
      const last30Days = subDays(now, 30);

      // Get total backups
      const total = await this.prisma.dailyBackup.count();

      // Get backups from last 7 days
      const last7DaysCount = await this.prisma.dailyBackup.count({
        where: {
          date: { gte: last7Days }
        }
      });

      // Get completed backups (all files have final status)
      const allBackups = await this.prisma.dailyBackup.findMany({
        include: {
          files: {
            include: {
              status: true
            }
          }
        }
      });

      let successful = 0;
      let failed = 0;
      let pending = 0;

      allBackups.forEach(backup => {
        const files = backup.files || [];
        if (files.length === 0) {
          pending++;
        } else {
          const allCompleted = files.every(f => f.status?.isFinal);
          if (allCompleted) {
            successful++;
          } else {
            const anyFailed = files.some(f => f.status?.label?.toLowerCase().includes('error') || f.status?.label?.toLowerCase().includes('fallo'));
            if (anyFailed) {
              failed++;
            } else {
              pending++;
            }
          }
        }
      });

      // Pending today
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const pendingToday = await this.prisma.dailyBackup.count({
        where: {
          date: { gte: today },
          completedAt: null
        }
      });

      // Backups by type (based on file types)
      const fileTypes = await this.prisma.backupFileType.findMany({
        include: {
          _count: {
            select: { dailyBackupFiles: true }
          }
        }
      });

      const byType = fileTypes.map(ft => ({
        name: ft.name,
        value: ft._count.dailyBackupFiles
      }));

      // Success trend for last 30 days
      const successTrend: Array<{ date: string; successful: number; failed: number }> = [];
      for (let i = 29; i >= 0; i--) {
        const date = subDays(new Date(), i);
        const nextDate = subDays(date, -1);

        const backupsOnDate = await this.prisma.dailyBackup.findMany({
          where: {
            date: { gte: date, lt: nextDate }
          },
          include: {
            files: {
              include: {
                status: true
              }
            }
          }
        });

        let successCount = 0;
        let failCount = 0;

        backupsOnDate.forEach(backup => {
          const files = backup.files || [];
          if (files.length > 0) {
            const allCompleted = files.every(f => f.status?.isFinal);
            const anyFailed = files.some(f => f.status?.label?.toLowerCase().includes('error') || f.status?.label?.toLowerCase().includes('fallo'));

            if (allCompleted && !anyFailed) {
              successCount++;
            } else if (anyFailed) {
              failCount++;
            }
          }
        });

        successTrend.push({
          date: format(date, 'dd/MM'),
          successful: successCount,
          failed: failCount
        });
      }

      // Size trend for last 7 days (placeholder - no size data in current schema)
      const sizeTrend: Array<{ date: string; size: number }> = [];
      for (let i = 6; i >= 0; i--) {
        const date = subDays(new Date(), i);
        sizeTrend.push({
          date: format(date, 'dd/MM'),
          size: 0 // Placeholder - size tracking not implemented
        });
      }

      // Calculate average duration (if available)
      const completedBackups = allBackups.filter(b => b.completedAt);
      let averageDuration = 0;
      if (completedBackups.length > 0) {
        // This would need duration calculation logic
        averageDuration = 30; // Placeholder
      }

      // Last backup info
      const lastBackup = await this.prisma.dailyBackup.findFirst({
        orderBy: { date: 'desc' },
        include: { files: true }
      });

      let lastBackupHours: number | null = null;
      if (lastBackup) {
        const lastDate = new Date(lastBackup.date);
        const diffMs = now.getTime() - lastDate.getTime();
        lastBackupHours = Math.floor(diffMs / (1000 * 60 * 60));
      }

      return {
        total,
        successful,
        failed,
        pending,
        pendingToday,
        last7Days: last7DaysCount,
        byType,
        successTrend,
        sizeTrend,
        totalSize: '0', // Size tracking not implemented
        averageDuration,
        lastBackupHours,
        retentionDays: 30 // Default retention policy
      };
    } catch (error) {
      console.error('Error fetching daily backups stats:', error);
      return {
        total: 0,
        successful: 0,
        failed: 0,
        pending: 0,
        pendingToday: 0,
        last7Days: 0,
        byType: [],
        successTrend: [],
        sizeTrend: [],
        totalSize: '0',
        averageDuration: 0,
        lastBackupHours: null,
        retentionDays: 30
      };
    }
  }

  // ============================================================================
  // DASHBOARD LAYOUTS PERSISTENCE
  // ============================================================================

  async getDashboardLayout(userId: number, layoutId: string) {
    try {
      const layout = await this.prisma.dashboardLayout.findUnique({
        where: {
          userId_layoutId: {
            userId,
            layoutId,
          },
        },
      });

      if (!layout) {
        return null;
      }

      return {
        id: layout.id,
        layoutId: layout.layoutId,
        name: layout.name,
        description: layout.description,
        widgets: layout.widgets,
        theme: layout.theme,
        isDefault: layout.isDefault,
        isPublic: layout.isPublic,
        createdAt: layout.createdAt,
        updatedAt: layout.updatedAt,
      };
    } catch (error) {
      console.error('Error fetching dashboard layout:', error);
      return null;
    }
  }

  async saveDashboardLayout(userId: number, layoutData: {
    layoutId: string;
    name: string;
    description?: string;
    widgets: any[];
    theme?: string;
    isDefault?: boolean;
    isPublic?: boolean;
  }) {
    try {
      const layout = await this.prisma.dashboardLayout.upsert({
        where: {
          userId_layoutId: {
            userId,
            layoutId: layoutData.layoutId,
          },
        },
        create: {
          userId,
          layoutId: layoutData.layoutId,
          name: layoutData.name,
          description: layoutData.description,
          widgets: layoutData.widgets,
          theme: layoutData.theme || 'blue',
          isDefault: layoutData.isDefault || false,
          isPublic: layoutData.isPublic || false,
        },
        update: {
          name: layoutData.name,
          description: layoutData.description,
          widgets: layoutData.widgets,
          theme: layoutData.theme,
          isDefault: layoutData.isDefault,
          isPublic: layoutData.isPublic,
        },
      });

      return {
        success: true,
        layout: {
          id: layout.id,
          layoutId: layout.layoutId,
          name: layout.name,
          description: layout.description,
          widgets: layout.widgets,
          theme: layout.theme,
          isDefault: layout.isDefault,
          isPublic: layout.isPublic,
          createdAt: layout.createdAt,
          updatedAt: layout.updatedAt,
        },
      };
    } catch (error) {
      console.error('Error saving dashboard layout:', error);
      return {
        success: false,
        error: 'Failed to save dashboard layout',
      };
    }
  }

  async getUserDashboardLayouts(userId: number) {
    try {
      const layouts = await this.prisma.dashboardLayout.findMany({
        where: { userId },
        orderBy: { updatedAt: 'desc' },
      });

      return layouts.map((layout) => ({
        id: layout.id,
        layoutId: layout.layoutId,
        name: layout.name,
        description: layout.description,
        theme: layout.theme,
        isDefault: layout.isDefault,
        isPublic: layout.isPublic,
        widgetCount: Array.isArray(layout.widgets) ? layout.widgets.length : 0,
        createdAt: layout.createdAt,
        updatedAt: layout.updatedAt,
      }));
    } catch (error) {
      console.error('Error fetching user dashboard layouts:', error);
      return [];
    }
  }

  async deleteDashboardLayout(userId: number, layoutId: string) {
    try {
      await this.prisma.dashboardLayout.delete({
        where: {
          userId_layoutId: {
            userId,
            layoutId,
          },
        },
      });

      return { success: true };
    } catch (error) {
      console.error('Error deleting dashboard layout:', error);
      return {
        success: false,
        error: 'Failed to delete dashboard layout',
      };
    }
  }
}
