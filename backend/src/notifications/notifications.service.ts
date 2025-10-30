import { Injectable, NotFoundException, Logger, forwardRef, Inject } from '@nestjs/common';
import { PrismaService } from '@/common/prisma.service';
import { Cron, CronExpression } from '@nestjs/schedule';
import {
  CreateNotificationDto,
  UpdateNotificationDto,
  QueryNotificationDto,
  NotificationType,
  NotificationPriority,
} from './dto';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);
  private notificationsGateway: any; // Será inyectado después para evitar circular dependency

  constructor(private prisma: PrismaService) {}

  // Método para inyectar el gateway (evita circular dependency)
  setGateway(gateway: any) {
    this.notificationsGateway = gateway;
  }

  async create(dto: CreateNotificationDto) {
    const notification = await this.prisma.notification.create({
      data: {
        userId: dto.userId,
        type: dto.type,
        title: dto.title,
        message: dto.message,
        priority: dto.priority || 'NORMAL',
        data: dto.data,
      },
    });

    // Emit real-time notification
    if (this.notificationsGateway) {
      try {
        await this.notificationsGateway.emitToUser(dto.userId, 'new-notification', notification);
        await this.notificationsGateway.emitUnreadCount(dto.userId);
      } catch (error) {
        this.logger.warn('Failed to emit real-time notification', error.message);
      }
    }

    return notification;
  }

  async createForAllUsers(dto: Omit<CreateNotificationDto, 'userId'>) {
    const users = await this.prisma.user.findMany({
      where: { isActive: true },
      select: { id: true },
    });

    const notifications = users.map((user) => ({
      userId: user.id,
      type: dto.type,
      title: dto.title,
      message: dto.message,
      priority: dto.priority || 'NORMAL',
      data: dto.data,
    }));

    const result = await this.prisma.notification.createMany({
      data: notifications,
    });

    // Emit real-time notification to all users
    if (this.notificationsGateway) {
      try {
        // Emit a generic broadcast event
        await this.notificationsGateway.emitToAll('new-broadcast-notification', {
          type: dto.type,
          title: dto.title,
          message: dto.message,
          priority: dto.priority || 'NORMAL',
        });

        // Update unread count for each user
        for (const user of users) {
          await this.notificationsGateway.emitUnreadCount(user.id);
        }
      } catch (error) {
        this.logger.warn('Failed to emit broadcast notification', error.message);
      }
    }

    return result;
  }

  async findAll(userId: number, query: QueryNotificationDto) {
    const page = query.page || 1;
    const limit = query.limit || 50;
    const skip = (page - 1) * limit;

    const where: any = {
      userId,
    };

    if (query.type) where.type = query.type;
    if (query.isRead !== undefined) where.isRead = query.isRead;
    if (query.priority) where.priority = query.priority;

    const [items, total] = await Promise.all([
      this.prisma.notification.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.notification.count({ where }),
    ]);

    return {
      items,
      total,
      page,
      limit,
      pages: Math.ceil(total / limit),
    };
  }

  async findOne(id: number, userId: number) {
    const notification = await this.prisma.notification.findFirst({
      where: { id, userId },
    });

    if (!notification) {
      throw new NotFoundException('Notification not found');
    }

    return notification;
  }

  async update(id: number, userId: number, dto: UpdateNotificationDto) {
    await this.findOne(id, userId); // Verify ownership

    return this.prisma.notification.update({
      where: { id },
      data: {
        ...dto,
        readAt: dto.isRead ? new Date() : null,
      },
    });
  }

  async markAsRead(id: number, userId: number) {
    return this.update(id, userId, { isRead: true });
  }

  async markAllAsRead(userId: number) {
    return this.prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: {
        isRead: true,
        readAt: new Date(),
      },
    });
  }

  async remove(id: number, userId: number) {
    await this.findOne(id, userId); // Verify ownership
    return this.prisma.notification.delete({ where: { id } });
  }

  async getUnreadCount(userId: number) {
    return this.prisma.notification.count({
      where: { userId, isRead: false },
    });
  }

  // Helper method to create backup notification
  async notifyBackupComplete(backupType: string, status: 'SUCCESS' | 'FAILED', fileName?: string) {
    const title = status === 'SUCCESS'
      ? 'Backup Completado'
      : 'Backup Fallido';

    const message = status === 'SUCCESS'
      ? `El backup ${backupType} se completó exitosamente${fileName ? `: ${fileName}` : ''}.`
      : `El backup ${backupType} falló. Revisa los logs para más detalles.`;

    return this.createForAllUsers({
      type: NotificationType.BACKUP,
      title,
      message,
      priority: status === 'FAILED' ? NotificationPriority.HIGH : NotificationPriority.NORMAL,
      data: JSON.stringify({ backupType, status, fileName }),
    });
  }

  // Helper method to create ticket notification
  async notifyTicketNoProgress(ticketId: number, title: string, daysOpen: number) {
    const message = `El ticket "${title}" lleva ${daysOpen} día${daysOpen > 1 ? 's' : ''} sin progreso.`;

    return this.createForAllUsers({
      type: NotificationType.TICKET,
      title: 'Ticket Sin Progreso',
      message,
      priority: daysOpen >= 30 ? NotificationPriority.URGENT : daysOpen >= 7 ? NotificationPriority.HIGH : NotificationPriority.NORMAL,
      data: JSON.stringify({ ticketId, daysOpen }),
    });
  }

  // Helper method to create low stock consumable notification
  async notifyLowStock(
    consumableId: number,
    itemName: string,
    quantity: number,
    minimumStock?: number | null,
  ) {
    const threshold = Math.max(minimumStock ?? 0, 3);
    const title = quantity <= 0 ? 'Stock Agotado' : 'Stock Bajo de Consumibles';
    const message = quantity <= 0
      ? `El consumible "${itemName}" no tiene stock disponible. Reponer de inmediato.`
      : `El consumible "${itemName}" tiene stock bajo (${quantity} unidades, mínimo recomendado ${threshold}).`;

    const existingNotification = await this.prisma.notification.findFirst({
      where: {
        type: NotificationType.INVENTORY,
        data: { contains: `"consumableId":${consumableId}` },
        createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
      },
    });

    if (existingNotification) {
      return null;
    }

    const priority = quantity <= 0
      ? NotificationPriority.URGENT
      : quantity <= 1
        ? NotificationPriority.URGENT
        : NotificationPriority.HIGH;

    return this.createForAllUsers({
      type: NotificationType.INVENTORY,
      title,
      message,
      priority,
      data: JSON.stringify({ consumableId, itemName, quantity, minimumStock: threshold }),
    });
  }

  /**
   * Cron job para verificar tickets sin progreso
   * Se ejecuta diariamente a las 9:00 AM
   */
  @Cron('0 9 * * *') // 9:00 AM todos los días
  async checkTicketsWithoutProgress() {
    this.logger.log('Checking tickets without progress');

    try {
      const now = new Date();
      const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

      // Buscar tickets abiertos (OPEN) que no han cambiado a IN_PROGRESS
      const ticketsWithoutProgress = await this.prisma.ticket.findMany({
        where: {
          status: 'OPEN',
        },
        select: {
          id: true,
          title: true,
          createdAt: true,
        },
      });

      for (const ticket of ticketsWithoutProgress) {
        const daysOpen = Math.floor((now.getTime() - ticket.createdAt.getTime()) / (24 * 60 * 60 * 1000));

        // Notificar si lleva 1 día, 7 días o 30 días sin progreso
        if (daysOpen === 1 || daysOpen === 7 || daysOpen === 30) {
          await this.notifyTicketNoProgress(ticket.id, ticket.title, daysOpen);
          this.logger.log(`Sent notification for ticket ${ticket.id} - ${daysOpen} days without progress`);
        }
      }

      this.logger.log('Finished checking tickets without progress');
    } catch (error) {
      this.logger.error('Error checking tickets without progress', error.stack);
    }
  }

  /**
   * Cron job para verificar stock bajo de consumibles
   * Se ejecuta diariamente a las 10:00 AM
   */
  @Cron('0 10 * * *') // 10:00 AM todos los días
  async checkLowStock() {
    this.logger.log('Checking low stock consumables');

    try {
      // Buscar consumibles con stock bajo o igual al mínimo (≤ minimumStock)
      const lowStockConsumables = await this.prisma.consumable.findMany({
        where: {
          type: { in: ['TONER', 'INK_CARTRIDGE'] },
          OR: [
            { status: 'LOW_STOCK' },
            { quantityAvailable: { lte: 3 } },
          ],
        },
        select: {
          id: true,
          itemName: true,
          quantityAvailable: true,
          minimumStock: true,
        },
      });

      for (const consumable of lowStockConsumables) {
        await this.notifyLowStock(
          consumable.id,
          consumable.itemName,
          consumable.quantityAvailable,
          consumable.minimumStock,
        );
        this.logger.log(`Sent low stock notification for consumable ${consumable.id} - ${consumable.itemName}`);
      }
      this.logger.log(`Finished checking low stock - ${lowStockConsumables.length} consumables with low stock`);
    } catch (error) {
      this.logger.error('Error checking low stock', error.stack);
    }
  }
}
