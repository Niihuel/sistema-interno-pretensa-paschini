import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/common/prisma.service';

@Injectable()
export class AdminService {
  constructor(private prisma: PrismaService) {}

  async getStats() {
    const [
      totalUsers,
      activeUsers,
      inactiveUsers,
      totalRoles,
      totalEmployees,
      activeEmployees,
      totalEquipment,
      totalTickets,
      openTickets,
      totalPrinters,
      activePrinters,
      totalPurchaseRequests,
      pendingPurchaseRequests,
      totalInventoryItems,
      assignedInventoryItems,
    ] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.user.count({ where: { isActive: true } }),
      this.prisma.user.count({ where: { isActive: false } }),
      this.prisma.role.count({ where: { isActive: true } }),
      this.prisma.employee.count(),
      this.prisma.employee.count({ where: { status: 'ACTIVE' } }),
      this.prisma.equipment.count(),
      this.prisma.ticket.count(),
      this.prisma.ticket.count({ where: { status: 'OPEN' } }),
      this.prisma.printer.count(),
      this.prisma.printer.count({ where: { status: 'ACTIVE' } }),
      this.prisma.purchaseRequest.count(),
      this.prisma.purchaseRequest.count({ where: { status: 'PENDING' } }),
      this.prisma.inventoryItem.count(),
      this.prisma.inventoryItem.count({ where: { status: 'ASSIGNED' } }),
    ]);

    return {
      // Admin panel stats
      totalUsers,
      activeUsers,
      inactiveUsers,
      totalRoles,
      // System-wide stats
      users: {
        total: totalUsers,
        active: activeUsers,
        inactive: inactiveUsers,
      },
      roles: {
        total: totalRoles,
      },
      employees: {
        total: totalEmployees,
        active: activeEmployees,
      },
      equipment: {
        total: totalEquipment,
      },
      tickets: {
        total: totalTickets,
        open: openTickets,
      },
      printers: {
        total: totalPrinters,
        active: activePrinters,
      },
      purchaseRequests: {
        total: totalPurchaseRequests,
        pending: pendingPurchaseRequests,
      },
      inventory: {
        total: totalInventoryItems,
        assigned: assignedInventoryItems,
      },
    };
  }
}
