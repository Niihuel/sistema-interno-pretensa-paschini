import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { Prisma } from '@prisma/client';
import { PrismaService } from '@/common/prisma.service';
import { NotificationsService } from '@/notifications/notifications.service';
import {
  NotificationPriority,
  NotificationType,
} from '@/notifications/dto/create-notification.dto';
import {
  CreateCalendarEventDto,
  QueryCalendarEventDto,
  UpdateCalendarEventDto,
} from './dto';

type AuthenticatedUser = {
  id: number;
  username?: string;
  permissions?: string[];
};

const calendarEventWithRelations = Prisma.validator<Prisma.CalendarEventDefaultArgs>()({
  include: {
    participants: {
      include: {
        user: {
          select: {
            id: true,
            username: true,
            firstName: true,
            lastName: true,
            email: true,
            isActive: true,
          },
        },
      },
    },
    attachments: true,
    reminders: true,
  },
});

type CalendarEventWithRelations = Prisma.CalendarEventGetPayload<
  typeof calendarEventWithRelations
>;

interface ReminderPlan {
  scheduledAt: Date;
  context: string;
}

@Injectable()
export class CalendarService {
  private readonly logger = new Logger(CalendarService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationsService: NotificationsService,
  ) {}

  /**
   * Obtener backups diarios del mes como eventos de calendario
   */
    async getDailyBackupsForMonth(year: number, month: number) {
    const start = new Date(year, month - 1, 1);
    start.setHours(0, 0, 0, 0);

    const end = new Date(year, month, 0, 23, 59, 59, 999);

    const backups = await this.prisma.dailyBackup.findMany({
      where: {
        date: {
          gte: start,
          lte: end,
        },
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            firstName: true,
            lastName: true,
          },
        },
        disk: true,
        backupZipStatus: true,
        backupAdjuntosStatus: true,
        calipsoStatus: true,
        presupuestacionStatus: true,
      },
      orderBy: { date: 'asc' },
    });

    return backups.map((backup: any) => {
      const fileStatuses = [
        backup.backupZipStatus,
        backup.backupAdjuntosStatus,
        backup.calipsoStatus,
        backup.presupuestacionStatus,
      ];

      const completed = fileStatuses.filter((status) => status?.isFinal).length;
      const total = fileStatuses.length;
      const diskDisplay = backup.disk?.name ?? `Disco ${backup.disk?.sequence ?? '?'}`;

      let title: string;
      let color: string;

      if (completed === total) {
        title = `? Backup Completo (${diskDisplay})`;
        color = '#10b981';
      } else if (completed > 0) {
        title = `?? Backup ${completed}/${total} (${diskDisplay})`;
        color = '#f59e0b';
      } else {
        title = `?? Backup Pendiente (${diskDisplay})`;
        const now = new Date();
        color = backup.date < now ? '#ef4444' : '#f59e0b';
      }

      return {
        id: `backup-${backup.id}`,
        title,
        startDate: backup.date,
        endDate: backup.date,
        isAllDay: true,
        type: 'BACKUP',
        status: completed === total ? 'COMPLETED' : 'SCHEDULED',
        location: null,
        description: `Backup diario en ${diskDisplay}: ${completed}/${total} archivos completados`,
        createdById: backup.completedBy || null,
        participants: [],
        reminders: [],
        attachments: [],
      };
    });
  }

  async create(dto: CreateCalendarEventDto, user: AuthenticatedUser) {
    const startDate = this.ensureValidDate(dto.startTime, 'Fecha de inicio invalida');
    const endDate = dto.endTime
      ? this.ensureValidDate(dto.endTime, 'Fecha de fin invalida')
      : startDate;

    if (endDate.getTime() < startDate.getTime()) {
      throw new BadRequestException(
        'La fecha de fin debe ser posterior a la fecha de inicio',
      );
    }

    const participantIds = new Set<number>(dto.participantIds ?? []);
    if (user?.id) {
      participantIds.add(user.id);
    }

    if (!participantIds.size) {
      throw new BadRequestException('Debe incluir al menos un participante');
    }

    const event = await this.prisma.calendarEvent.create({
      data: {
        title: dto.title.trim(),
        description: dto.description?.trim(),
        startDate,
        endDate,
        isAllDay: dto.allDay ?? false,
        location: dto.location?.trim(),
        type: dto.type || 'GENERAL',
        status: dto.status || 'SCHEDULED',
        createdById: user?.id,
        participants: {
          create: Array.from(participantIds).map((participantId) => ({
            userId: participantId,
            status: participantId === user?.id ? 'ACCEPTED' : 'PENDING',
          })),
        },
      },
      include: calendarEventWithRelations.include,
    });

    await this.rebuildReminders(event);

    if (dto.sendInitialNotification !== false) {
      await this.notifyParticipants(event, user, 'Evento creado');
    }

    return this.transformEvent(event);
  }

  async findAll(query: QueryCalendarEventDto, user: AuthenticatedUser) {
    const hasAllAccess = this.hasPermission(user, 'view', 'all');
    const where: Prisma.CalendarEventWhereInput = {};

    if (!hasAllAccess && user?.id) {
      where.OR = [
        { createdById: user.id },
        { participants: { some: { userId: user.id } } },
      ];
    }

    if (query.participantId) {
      where.participants = {
        some: { userId: query.participantId },
      };
    }

    const now = new Date();

    if (query.onlyUpcoming === 'true') {
      where.startDate = { gte: now };
    }

    const andConditions: Prisma.CalendarEventWhereInput[] = [];
    if (where.AND) {
      if (Array.isArray(where.AND)) {
        andConditions.push(...where.AND);
      } else {
        andConditions.push(where.AND);
      }
    }

    const startRange = query.start ? this.parseDate(query.start) : null;
    const endRange = query.end ? this.parseDate(query.end) : null;

    if (startRange) {
      andConditions.push({
        OR: [
          { startDate: { gte: startRange } },
          { endDate: { gte: startRange } },
        ],
      });
    }

    if (endRange) {
      andConditions.push({
        OR: [
          { startDate: { lte: endRange } },
          { endDate: { lte: endRange } },
        ],
      });
    }

    if (query.search) {
      andConditions.push({
        OR: [
          { title: { contains: query.search, mode: 'insensitive' } },
          { description: { contains: query.search, mode: 'insensitive' } },
        ],
      });
    }

    if (andConditions.length > 0) {
      where.AND = andConditions;
    }

    const limit = Math.min(query.limit ?? 200, 500);

    const [events, total] = await Promise.all([
      this.prisma.calendarEvent.findMany({
        where,
        orderBy: { startDate: 'asc' },
        take: limit,
        include: calendarEventWithRelations.include,
      }),
      this.prisma.calendarEvent.count({ where }),
    ]);

    return {
      items: events.map((event) => this.transformEvent(event)),
      total,
    };
  }

  async findOne(id: number, user: AuthenticatedUser) {
    const event = await this.prisma.calendarEvent.findUnique({
      where: { id },
      include: calendarEventWithRelations.include,
    });

    if (!event) {
      throw new NotFoundException('Evento no encontrado');
    }

    if (!this.canViewEvent(event, user)) {
      throw new ForbiddenException('No tienes permisos para ver este evento');
    }

    return this.transformEvent(event);
  }

  async update(id: number, dto: UpdateCalendarEventDto, user: AuthenticatedUser) {
    const existing = await this.prisma.calendarEvent.findUnique({
      where: { id },
      include: calendarEventWithRelations.include,
    });

    if (!existing) {
      throw new NotFoundException('Evento no encontrado');
    }

    const canManageAll = this.hasPermission(user, 'update', 'all');

    if (!canManageAll && existing.createdById !== user?.id) {
      throw new ForbiddenException('No tienes permisos para modificar este evento');
    }

    const data: Prisma.CalendarEventUpdateInput = {};

    if (dto.title !== undefined) data.title = dto.title.trim();
    if (dto.description !== undefined)
      data.description = dto.description?.trim() ?? null;
    if (dto.location !== undefined) data.location = dto.location?.trim() ?? null;
    if (dto.type !== undefined) data.type = dto.type;
    if (dto.status !== undefined) data.status = dto.status;
    if (dto.allDay !== undefined) data.isAllDay = dto.allDay;

    if (dto.startTime !== undefined) {
      data.startDate = this.ensureValidDate(
        dto.startTime,
        'Fecha de inicio invalida',
      );
    }
    if (dto.endTime !== undefined) {
      data.endDate = dto.endTime
        ? this.ensureValidDate(dto.endTime, 'Fecha de fin invalida')
        : data.startDate || undefined;
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.calendarEvent.update({
        where: { id },
        data,
      });

      if (dto.participantIds) {
        const participantIds = new Set<number>(dto.participantIds ?? []);
        if (existing.createdById) {
          participantIds.add(existing.createdById);
        } else if (user?.id) {
          participantIds.add(user.id);
        }

        await tx.calendarEventParticipant.deleteMany({ where: { eventId: id } });
        if (participantIds.size) {
          await tx.calendarEventParticipant.createMany({
            data: Array.from(participantIds).map((participantId) => ({
              eventId: id,
              userId: participantId,
              status:
                participantId === existing.createdById ? 'ACCEPTED' : 'PENDING',
            })),
          });
        }
      }

      if (dto.regenerateReminders !== false) {
        await tx.calendarEventReminder.deleteMany({ where: { eventId: id } });
      }
    });

    const refreshed = await this.prisma.calendarEvent.findUnique({
      where: { id },
      include: calendarEventWithRelations.include,
    });

    if (!refreshed) {
      throw new NotFoundException('Evento no encontrado despues de la actualizacion');
    }

    if (dto.regenerateReminders !== false) {
      await this.rebuildReminders(refreshed);
    }

    await this.notifyParticipants(refreshed, user, 'Evento actualizado');

    return this.transformEvent(refreshed);
  }

  async remove(id: number, user: AuthenticatedUser) {
    const existing = await this.prisma.calendarEvent.findUnique({
      where: { id },
      include: calendarEventWithRelations.include,
    });

    if (!existing) {
      throw new NotFoundException('Evento no encontrado');
    }

    const canDeleteAll = this.hasPermission(user, 'delete', 'all');

    if (!canDeleteAll && existing.createdById !== user?.id) {
      throw new ForbiddenException('No tienes permisos para eliminar este evento');
    }

    await this.prisma.calendarEvent.delete({ where: { id } });
  }

  @Cron(CronExpression.EVERY_5_MINUTES)
  async processDueReminders() {
    const now = new Date();

    const reminders = await this.prisma.calendarEventReminder.findMany({
      where: {
        sentAt: null,
        reminderAt: { lte: now },
      },
      orderBy: { reminderAt: 'asc' },
      take: 50,
      include: {
        event: {
          include: {
            participants: {
              include: {
                user: {
                  select: {
                    id: true,
                    username: true,
                    firstName: true,
                    lastName: true,
                    email: true,
                    isActive: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!reminders.length) {
      return;
    }

    for (const reminder of reminders) {
      try {
        await Promise.all(
          reminder.event.participants
            .filter((participant) => participant.user?.isActive !== false)
            .map((participant) =>
              this.notificationsService.create({
                userId: participant.userId,
                type: NotificationType.CALENDAR,
                title: `Recordatorio: ${reminder.event.title}`,
                message: this.buildReminderMessage(
                  reminder.method,
                  reminder.event,
                ),
                priority: NotificationPriority.NORMAL,
                data: JSON.stringify({
                  eventId: reminder.eventId,
                  reminderId: reminder.id,
                }),
              }),
            ),
        );

        await this.prisma.calendarEventReminder.update({
          where: { id: reminder.id },
          data: {
            sentAt: new Date(),
          },
        });
      } catch (error) {
        this.logger.error(
          `Error enviando recordatorio ${reminder.id}: ${error.message}`,
          error.stack,
        );
      }
    }
  }

  private async rebuildReminders(event: CalendarEventWithRelations) {
    const schedule = this.buildReminderSchedule(event);

    await this.prisma.calendarEventReminder.deleteMany({ where: { eventId: event.id } });

    if (!schedule.length) {
      this.logger.debug(`Sin recordatorios programados para el evento ${event.id}`);
      return;
    }

    await this.prisma.calendarEventReminder.createMany({
      data: schedule.map((item) => ({
        eventId: event.id,
        reminderAt: item.scheduledAt,
        method: item.context || 'NOTIFICATION',
      })),
    });
  }

  private buildReminderSchedule(
    event: CalendarEventWithRelations,
  ): ReminderPlan[] {
    const now = new Date();
    const start = new Date(event.startDate);
    const diffMs = start.getTime() - now.getTime();

    if (diffMs <= 5 * 60 * 1000) {
      return [];
    }

    const hour = 60 * 60 * 1000;
    const day = 24 * hour;
    const candidates: ReminderPlan[] = [];

    candidates.push({
      scheduledAt: new Date(start.getTime() - hour),
      context: 'one-hour-before',
    });

    if (diffMs >= day) {
      candidates.push({
        scheduledAt: new Date(start.getTime() - day),
        context: 'one-day-before',
      });
    }

    if (diffMs >= 7 * day) {
      candidates.push({
        scheduledAt: new Date(start.getTime() - 7 * day),
        context: 'one-week-before',
      });
    }

    if (diffMs >= 30 * day) {
      candidates.push({
        scheduledAt: new Date(start.getTime() - 30 * day),
        context: 'one-month-before',
      });
    }

    if (diffMs >= 90 * day) {
      candidates.push({
        scheduledAt: new Date(start.getTime() - 90 * day),
        context: 'three-months-before',
      });
    }

    const filtered = candidates
      .map((item) => ({
        scheduledAt: this.alignReminderTime(item.scheduledAt, event),
        context: item.context,
      }))
      .filter(
        (item) => item.scheduledAt.getTime() > now.getTime() + 2 * 60 * 1000,
      );

    if (!filtered.length) {
      const fallbackAt = new Date(
        now.getTime() + Math.max(diffMs / 2, 15 * 60 * 1000),
      );
      filtered.push({
        scheduledAt: this.alignReminderTime(fallbackAt, event),
        context: 'short-notice',
      });
    }

    const unique = new Map<number, ReminderPlan>();
    for (const item of filtered) {
      unique.set(item.scheduledAt.getTime(), item);
    }

    return Array.from(unique.values()).sort(
      (a, b) => a.scheduledAt.getTime() - b.scheduledAt.getTime(),
    );
  }

  private alignReminderTime(date: Date, event: CalendarEventWithRelations) {
    if (!event.isAllDay) {
      return date;
    }

    const aligned = new Date(date);
    aligned.setHours(9, 0, 0, 0);
    return aligned;
  }

  private canViewEvent(event: CalendarEventWithRelations, user: AuthenticatedUser) {
    if (this.hasPermission(user, 'view', 'all')) {
      return true;
    }

    if (!user?.id) {
      return false;
    }

    if (event.createdById === user.id) {
      return true;
    }

    return event.participants.some((participant) => participant.userId === user.id);
  }

  private hasPermission(
    user: AuthenticatedUser | undefined,
    action: string,
    scope: 'all' | 'own',
  ) {
    const permissions = user?.permissions ?? [];
    if (!permissions.length) {
      return false;
    }

    if (permissions.includes('*:*:*')) {
      return true;
    }

    return (
      permissions.includes('calendar:*:*') ||
      permissions.includes(`calendar:${action}:*`) ||
      permissions.includes(`calendar:${action}:${scope}`)
    );
  }

  private ensureValidDate(input: string, errorMessage: string) {
    const date = new Date(input);
    if (Number.isNaN(date.getTime())) {
      throw new BadRequestException(errorMessage);
    }
    return date;
  }

  private parseDate(input: string) {
    const date = new Date(input);
    return Number.isNaN(date.getTime()) ? null : date;
  }

  private transformEvent(event: CalendarEventWithRelations) {
    return {
      ...event,
      reminders: event.reminders
        .map((reminder) => ({
          id: reminder.id,
          reminderAt: reminder.reminderAt,
          sentAt: reminder.sentAt,
          method: reminder.method,
        }))
        .sort((a, b) => a.reminderAt.getTime() - b.reminderAt.getTime()),
    };
  }

  private safeParseArray(value?: string | null) {
    if (!value) return [];
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
      this.logger.warn('No se pudo parsear tags de evento');
      return [];
    }
  }

  private safeParseJson<T = Record<string, any>>(value?: string | null): T | null {
    if (!value) return null;
    try {
      return JSON.parse(value);
    } catch (error) {
      this.logger.warn('No se pudo parsear metadata de evento');
      return null;
    }
  }

  private async notifyParticipants(
    event: CalendarEventWithRelations,
    actor: AuthenticatedUser,
    action: string,
  ) {
    const start = new Date(event.startDate);
    const dateFormatter = new Intl.DateTimeFormat('es-AR', {
      dateStyle: 'full',
      timeStyle: event.isAllDay ? undefined : 'short',
    });

    const locationText = event.location ? ` (${event.location})` : '';
    const message = `${action}: ${event.title} el ${dateFormatter.format(
      start,
    )}${locationText}.`;

    await Promise.all(
      event.participants
        .filter((participant) => participant.user?.isActive !== false)
        .filter((participant) => participant.userId !== actor?.id)
        .map((participant) =>
          this.notificationsService.create({
            userId: participant.userId,
            type: NotificationType.CALENDAR,
            title: event.title,
            message,
            priority: NotificationPriority.NORMAL,
            data: JSON.stringify({
              eventId: event.id,
              startDate: event.startDate,
            }),
          }),
        ),
    );
  }

  private mapPriority(priority?: string | null): NotificationPriority {
    if (
      priority &&
      Object.values(NotificationPriority).includes(priority as NotificationPriority)
    ) {
      return priority as NotificationPriority;
    }
    return NotificationPriority.NORMAL;
  }

  private buildReminderMessage(
    context: string | null,
    event: {
      title: string;
      startDate: Date | string;
      isAllDay: boolean;
      location?: string | null;
    },
  ) {
    const start = new Date(event.startDate);
    const dateFormatter = new Intl.DateTimeFormat('es-AR', {
      dateStyle: 'full',
      timeStyle: event.isAllDay ? undefined : 'short',
    });

    const when = dateFormatter.format(start);

    switch (context) {
      case 'three-months-before':
        return `Faltan 3 meses para el evento "${event.title}" (${when}).`;
      case 'one-month-before':
        return `Falta 1 mes para el evento "${event.title}" (${when}).`;
      case 'one-week-before':
        return `Recordatorio: el evento "${event.title}" es en una semana (${when}).`;
      case 'one-day-before':
        return `Recordatorio: el evento "${event.title}" es manana (${when}).`;
      case 'one-hour-before':
        return `Recordatorio final: el evento "${event.title}" comienza pronto (${when}).`;
      default:
        return `Recordatorio: se aproxima el evento "${event.title}" (${when}).`;
    }
  }
}

