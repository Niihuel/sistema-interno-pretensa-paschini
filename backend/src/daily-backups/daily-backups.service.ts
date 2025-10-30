import { Injectable, NotFoundException, Logger, forwardRef, Inject, BadRequestException } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { PrismaService } from '@/common/prisma.service';
import { NotificationsService } from '@/notifications/notifications.service';
import {
  NotificationPriority,
  NotificationType,
} from '@/notifications/dto/create-notification.dto';
import {
  CreateDailyBackupDto,
  UpdateDailyBackupDto,
} from './dto';
import { Prisma, BackupStatus, BackupDisk } from '@prisma/client';
import { startOfDay, format, startOfMonth, endOfMonth, getDay, subDays } from 'date-fns';
import { toZonedTime, fromZonedTime } from 'date-fns-tz';

// Zona horaria de Argentina
const TIMEZONE = 'America/Argentina/Buenos_Aires';

const DEFAULT_PENDING_STATUS_CODE = 'PENDING';
const DEFAULT_COMPLETED_STATUS_CODE = 'COMPLETED';
const NOTIFICATION_CODES = {
  morning: 'RECORDATORIO_MATUTINO',
  afternoon: 'ALERTA_TARDE',
  completed: 'AVISO_COMPLETADO',
} as const;

type BackupFileField = 'backupZip' | 'backupAdjuntosZip' | 'calipsoBak' | 'presupuestacionBak';

const BACKUP_FILE_LABELS: Record<BackupFileField, string> = {
  backupZip: 'Backup.zip',
  backupAdjuntosZip: 'BackupAdjuntos.zip',
  calipsoBak: 'Calipso.bak',
  presupuestacionBak: 'Presupuestacion.bak',
};

const DAILY_BACKUP_INCLUDE = Prisma.validator<Prisma.DailyBackupInclude>()({
  disk: true,
  user: {
    select: {
      id: true,
      username: true,
      firstName: true,
      lastName: true,
    },
  },
  files: {
    include: {
      fileType: true,
      status: true,
    },
  },
  // DEPRECATED: Mantener para compatibilidad temporal
  backupZipStatus: true,
  backupAdjuntosStatus: true,
  calipsoStatus: true,
  presupuestacionStatus: true,
});

type DailyBackupWithRelations = Prisma.DailyBackupGetPayload<{
  include: typeof DAILY_BACKUP_INCLUDE;
}>;

@Injectable()
export class DailyBackupsService {
  private readonly logger = new Logger(DailyBackupsService.name);

  constructor(
    private readonly prisma: PrismaService,
    @Inject(forwardRef(() => NotificationsService))
    private readonly notificationsService: NotificationsService,
  ) {}

  /**
   * Obtener "hoy" en la zona horaria de Argentina
   * Esto asegura que el día sea correcto independientemente de la hora UTC del servidor
   */
  private getTodayInTimezone(): Date {
    const now = new Date();
    // Convertir a zona horaria de Argentina
    const argentinaTime = toZonedTime(now, TIMEZONE);
    // Obtener inicio del día en Argentina
    const startOfDayArgentina = startOfDay(argentinaTime);
    // Crear Date solo con año/mes/día (sin hora) para compatibilidad con Prisma @db.Date
    const year = startOfDayArgentina.getFullYear();
    const month = startOfDayArgentina.getMonth();
    const day = startOfDayArgentina.getDate();
    return new Date(year, month, day, 0, 0, 0, 0);
  }

  /**
   * Obtener el listado de discos activos ordenados por secuencia
   */
  private async getActiveDisks(): Promise<BackupDisk[]> {
    const disks = await this.prisma.backupDisk.findMany({
      where: { isActive: true },
      orderBy: { sequence: 'asc' },
    });

    if (!disks.length) {
      throw new NotFoundException('No hay discos configurados para backups diarios');
    }

    return disks;
  }

  /**
   * Calcular qué disco corresponde para una fecha dada considerando la rotación
   */
  private async resolveDiskForDate(
    date: Date,
    options: { diskNumber?: number; diskId?: number } = {},
  ): Promise<BackupDisk | null> {
    const { diskNumber, diskId } = options;

    if (diskId) {
      const disk = await this.prisma.backupDisk.findUnique({ where: { id: diskId } });
      if (!disk || !disk.isActive) {
        throw new NotFoundException('El disco seleccionado no existe o está inactivo');
      }
      return disk;
    }

    const disks = await this.getActiveDisks();

    if (diskNumber) {
      const disk = disks.find((item) => item.sequence === diskNumber);
      if (!disk) {
        throw new NotFoundException(`No existe un disco configurado con secuencia ${diskNumber}`);
      }
      return disk;
    }

    // Rotación diaria: usar todos los días del año para la rotación
    const daysSinceReference = this.countDaysSinceReference(date);
    const index = (daysSinceReference - 1) % disks.length;
    return disks[index];
  }

  /**
   * Contar días desde la fecha de referencia (2025-01-06) - TODOS los días
   */
  private countDaysSinceReference(date: Date): number {
    const referenceDate = startOfDay(new Date('2025-01-06T00:00:00'));
    const targetDate = startOfDay(date);

    if (targetDate < referenceDate) {
      return 1;
    }

    // Calcular diferencia en días
    const diffTime = targetDate.getTime() - referenceDate.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1; // +1 para incluir el día de referencia

    return Math.max(diffDays, 1);
  }

  /**
   * Obtener estados activos ordenados
   */
  private async getActiveStatuses(): Promise<BackupStatus[]> {
    const statuses = await this.prisma.backupStatus.findMany({
      where: { isActive: true },
      orderBy: [
        { sortOrder: 'asc' },
        { id: 'asc' },
      ],
    });

    if (!statuses.length) {
      throw new NotFoundException('No hay estados configurados para backups diarios');
    }

    return statuses;
  }

  /**
   * Obtener tipos de archivos activos ordenados por secuencia
   */
  private async getActiveFileTypes() {
    const fileTypes = await this.prisma.backupFileType.findMany({
      where: { isActive: true },
      orderBy: { sequence: 'asc' },
    });

    if (!fileTypes.length) {
      throw new NotFoundException('No hay tipos de archivos configurados para backups diarios');
    }

    return fileTypes;
  }

  private async getStatusContext() {
    const statuses = await this.getActiveStatuses();
    const statusById = new Map(statuses.map((status) => [status.id, status]));
    const pendingStatus =
      statuses.find((status) => status.code === DEFAULT_PENDING_STATUS_CODE) ?? statuses[0];
    const finalStatuses = statuses.filter((status) => status.isFinal);
    const completedStatus =
      statuses.find((status) => status.code === DEFAULT_COMPLETED_STATUS_CODE) ??
      finalStatuses[finalStatuses.length - 1] ??
      statuses[statuses.length - 1];
    const firstStatus = statuses[0];

    return {
      statuses,
      statusById,
      pendingStatus,
      completedStatus,
      firstStatus,
      finalStatuses,
    };
  }

  private async getNotificationSetting(code: string) {
    return this.prisma.backupNotificationSetting.findUnique({
      where: { code },
    });
  }

  private resolvePriority(priority?: string): NotificationPriority {
    if (!priority) {
      return NotificationPriority.NORMAL;
    }

    const allowed = Object.values(NotificationPriority) as string[];
    return allowed.includes(priority) ? (priority as NotificationPriority) : NotificationPriority.NORMAL;
  }

  /**
   * Obtener el backup de hoy (en zona horaria de Argentina)
   */
  async getTodayBackup() {
    const today = this.getTodayInTimezone();
    const disk = await this.resolveDiskForDate(today);

    if (!disk) {
      return null;
    }

    let backup = await this.prisma.dailyBackup.findUnique({
      where: { date: today },
      include: DAILY_BACKUP_INCLUDE,
    });

    if (!backup) {
      const { pendingStatus } = await this.getStatusContext();
      const fileTypes = await this.getActiveFileTypes();

      // Crear backup nuevo con el disco que corresponde por rotación automática
      // Este es el único momento donde se asigna el disco automáticamente
      backup = await this.prisma.dailyBackup.create({
        data: {
          date: today,
          diskId: disk.id,
          // DEPRECATED: Campos legacy para compatibilidad
          backupZipStatusId: pendingStatus.id,
          backupAdjuntosStatusId: pendingStatus.id,
          calipsoStatusId: pendingStatus.id,
          presupuestacionStatusId: pendingStatus.id,
          // Crear archivos dinámicamente
          files: {
            create: fileTypes.map((fileType) => ({
              fileTypeId: fileType.id,
              statusId: pendingStatus.id,
            })),
          },
        },
        include: DAILY_BACKUP_INCLUDE,
      });

      return backup;
    }

    // Si el backup ya existe, NO actualizar el disco automáticamente
    // El disco solo debe cambiar cuando el usuario lo cambia explícitamente mediante createOrUpdateToday()
    // Esto permite que:
    // 1. La rotación automática funcione al crear el backup del día (a las 2 AM o primera carga)
    // 2. Los cambios manuales del usuario se respeten durante todo el día
    // 3. Al día siguiente, se crea un nuevo backup con el siguiente disco en la rotación

    // Sincronizar archivos con tipos activos (si faltan algunos)
    const fileTypes = await this.getActiveFileTypes();
    const existingFileTypeIds = new Set(backup.files.map((f) => f.fileTypeId));
    const missingFileTypes = fileTypes.filter((ft) => !existingFileTypeIds.has(ft.id));

    if (missingFileTypes.length > 0 && backup) {
      const { pendingStatus } = await this.getStatusContext();

      // Crear archivos faltantes
      await Promise.all(
        missingFileTypes.map((fileType) =>
          this.prisma.dailyBackupFile.create({
            data: {
              dailyBackupId: backup!.id,
              fileTypeId: fileType.id,
              statusId: pendingStatus.id,
            },
          })
        )
      );

      // Recargar backup con los nuevos archivos
      backup = await this.prisma.dailyBackup.findUnique({
        where: { id: backup.id },
        include: DAILY_BACKUP_INCLUDE,
      });
    }

    return backup;
  }

  /**
   * Crear o actualizar el backup de hoy
   * IMPORTANTE: Solo permite modificar el backup del día ACTUAL (en zona horaria de Argentina)
   */
  async createOrUpdateToday(updateDto: UpdateDailyBackupDto, userId: number) {
    const today = this.getTodayInTimezone();

    // VALIDACIÓN CRÍTICA: Solo permitir modificar el backup del día actual
    // Si se intenta modificar un backup de un día diferente, rechazar
    let existing = await this.prisma.dailyBackup.findUnique({
      where: { date: today },
      include: DAILY_BACKUP_INCLUDE,
    });

    const disk = await this.resolveDiskForDate(today, {
      diskNumber: updateDto.diskNumber,
      diskId: updateDto.diskId,
    });

    if (!disk) {
      throw new NotFoundException('No hay discos configurados para realizar backups');
    }

    const statusContext = await this.getStatusContext();
    const fileTypes = await this.getActiveFileTypes();

    const resolveStatusId = (provided?: number, fallback?: number) => {
      const resolved = provided ?? fallback ?? statusContext.pendingStatus.id;
      if (!statusContext.statusById.has(resolved)) {
        throw new NotFoundException('El estado seleccionado no es válido o está inactivo');
      }
      return resolved;
    };

    // LEGACY: Soporte para campos hardcodeados (mantener para compatibilidad)
    const backupZipStatusId = resolveStatusId(updateDto.backupZipStatusId, existing?.backupZipStatusId);
    const backupAdjuntosStatusId = resolveStatusId(updateDto.backupAdjuntosStatusId, existing?.backupAdjuntosStatusId);
    const calipsoStatusId = resolveStatusId(updateDto.calipsoStatusId, existing?.calipsoStatusId);
    const presupuestacionStatusId = resolveStatusId(updateDto.presupuestacionStatusId, existing?.presupuestacionStatusId);

    const wasCompleted = existing ? this.isCompleted(existing) : false;

    // Si no existe el backup, crearlo con archivos dinámicos
    if (!existing) {
      existing = await this.prisma.dailyBackup.create({
        data: {
          date: today,
          diskId: disk.id,
          // DEPRECATED: Campos legacy
          backupZipStatusId,
          backupAdjuntosStatusId,
          calipsoStatusId,
          presupuestacionStatusId,
          notes: updateDto.notes,
          completedBy: userId,
          completedAt: null,
          // Crear archivos dinámicamente
          files: {
            create: fileTypes.map((fileType) => ({
              fileTypeId: fileType.id,
              statusId: statusContext.pendingStatus.id,
            })),
          },
        },
        include: DAILY_BACKUP_INCLUDE,
      });
    }

    // Actualizar disco y campos legacy
    await this.prisma.dailyBackup.update({
      where: { id: existing.id },
      data: {
        diskId: disk.id,
        backupZipStatusId,
        backupAdjuntosStatusId,
        calipsoStatusId,
        presupuestacionStatusId,
        ...(updateDto.notes !== undefined ? { notes: updateDto.notes } : {}),
        completedBy: userId,
        updatedAt: new Date(),
      },
    });

    // NUEVO: Actualizar archivos dinámicamente si se provee fileStatuses
    if (updateDto.fileStatuses && updateDto.fileStatuses.length > 0) {
      for (const fileStatus of updateDto.fileStatuses) {
        // Validar que el statusId es válido
        if (!statusContext.statusById.has(fileStatus.statusId)) {
          throw new NotFoundException(`El estado ${fileStatus.statusId} no es válido o está inactivo`);
        }

        // Actualizar o crear DailyBackupFile
        await this.prisma.dailyBackupFile.upsert({
          where: {
            dailyBackupId_fileTypeId: {
              dailyBackupId: existing.id,
              fileTypeId: fileStatus.fileTypeId,
            },
          },
          create: {
            dailyBackupId: existing.id,
            fileTypeId: fileStatus.fileTypeId,
            statusId: fileStatus.statusId,
          },
          update: {
            statusId: fileStatus.statusId,
          },
        });
      }
    }

    // Recargar backup con todos los archivos actualizados
    const backup = await this.prisma.dailyBackup.findUnique({
      where: { id: existing.id },
      include: DAILY_BACKUP_INCLUDE,
    });

    if (!backup) {
      throw new NotFoundException('No se pudo recargar el backup después de actualizar');
    }

    // Verificar si está completo y actualizar completedAt
    const isNowCompleted = this.isCompleted(backup);
    if (isNowCompleted !== wasCompleted) {
      await this.prisma.dailyBackup.update({
        where: { id: backup.id },
        data: {
          completedAt: isNowCompleted ? new Date() : null,
        },
      });
    }

    // Notificar si se completó
    if (!wasCompleted && isNowCompleted) {
      await this.notifyBackupCompleted(backup.user?.username || 'Usuario desconocido', backup.disk);
    }

    return this.prisma.dailyBackup.findUnique({
      where: { id: backup.id },
      include: DAILY_BACKUP_INCLUDE,
    });
  }

  /**
   * Marcar un archivo específico cambiando al siguiente estado disponible
   * SOPORTA: strings legacy (backupZip, etc.) y códigos dinámicos (BACKUP_ZIP, etc.)
   * NOTA: getTodayBackup() ya asegura que es el backup del día actual
   */
  async toggleFile(
    fileType: 'backupZip' | 'backupAdjuntosZip' | 'calipsoBak' | 'presupuestacionBak' | string,
    userId: number,
  ) {
    const backup = await this.getTodayBackup();

    if (!backup) {
      throw new NotFoundException('No se encontró el backup de hoy');
    }

    // Mapeo de strings legacy a códigos de BackupFileType
    const legacyToCodeMap: Record<string, string> = {
      backupZip: 'BACKUP_ZIP',
      backupAdjuntosZip: 'BACKUP_ADJUNTOS_ZIP',
      calipsoBak: 'CALIPSO_BAK',
      presupuestacionBak: 'PRESUPUESTACION_BAK',
    };

    // Convertir el fileType a código (si es legacy, mapearlo)
    const code = legacyToCodeMap[fileType] || fileType.toUpperCase();

    // Buscar el tipo de archivo por código
    const fileTypeRecord = await this.prisma.backupFileType.findUnique({
      where: { code },
    });

    if (!fileTypeRecord || !fileTypeRecord.isActive) {
      throw new NotFoundException(`El tipo de archivo '${fileType}' no existe o está inactivo`);
    }

    // Buscar el archivo actual en DailyBackupFile
    const currentFile = backup.files.find((f) => f.fileTypeId === fileTypeRecord.id);

    if (!currentFile) {
      throw new NotFoundException(`No se encontró el archivo ${fileType} en el backup de hoy`);
    }

    const { statuses } = await this.getStatusContext();
    const currentIndex = statuses.findIndex((status) => status.id === currentFile.statusId);
    const nextIndex = currentIndex >= 0 ? (currentIndex + 1) % statuses.length : 0;
    const nextStatus = statuses[nextIndex];

    // Actualizar usando el nuevo sistema dinámico
    const updateData: UpdateDailyBackupDto = {
      diskId: backup.diskId,
      fileStatuses: [
        {
          fileTypeId: fileTypeRecord.id,
          statusId: nextStatus.id,
        },
      ],
    };

    return this.createOrUpdateToday(updateData, userId);
  }

  /**
   * Nuevo método: Toggle por fileTypeId directo (más moderno)
   * NOTA: getTodayBackup() ya asegura que es el backup del día actual
   */
  async toggleFileById(fileTypeId: number, userId: number) {
    const backup = await this.getTodayBackup();

    if (!backup) {
      throw new NotFoundException('No se encontró el backup de hoy');
    }

    // Buscar el archivo actual
    const currentFile = backup.files.find((f) => f.fileTypeId === fileTypeId);

    if (!currentFile) {
      throw new NotFoundException(`No se encontró el archivo con ID ${fileTypeId} en el backup de hoy`);
    }

    const { statuses } = await this.getStatusContext();
    const currentIndex = statuses.findIndex((status) => status.id === currentFile.statusId);
    const nextIndex = currentIndex >= 0 ? (currentIndex + 1) % statuses.length : 0;
    const nextStatus = statuses[nextIndex];

    // Actualizar usando el sistema dinámico
    const updateData: UpdateDailyBackupDto = {
      diskId: backup.diskId,
      fileStatuses: [
        {
          fileTypeId,
          statusId: nextStatus.id,
        },
      ],
    };

    return this.createOrUpdateToday(updateData, userId);
  }

  /**
   * Nuevo método: Actualizar estado específico de un archivo
   * NOTA: getTodayBackup() ya asegura que es el backup del día actual
   */
  async updateFileStatus(fileTypeId: number, statusId: number, userId: number) {
    const backup = await this.getTodayBackup();

    if (!backup) {
      throw new NotFoundException('No se encontró el backup de hoy');
    }

    // Verificar que el archivo existe
    const currentFile = backup.files.find((f) => f.fileTypeId === fileTypeId);

    if (!currentFile) {
      throw new NotFoundException(`No se encontró el archivo con ID ${fileTypeId} en el backup de hoy`);
    }

    // Verificar que el estado es válido
    const { statusById } = await this.getStatusContext();
    if (!statusById.has(statusId)) {
      throw new NotFoundException(`El estado ${statusId} no es válido o está inactivo`);
    }

    // Actualizar usando el sistema dinámico
    const updateData: UpdateDailyBackupDto = {
      diskId: backup.diskId,
      fileStatuses: [
        {
          fileTypeId,
          statusId,
        },
      ],
    };

    return this.createOrUpdateToday(updateData, userId);
  }

  /**
   * DEPRECATED: Mantener para compatibilidad temporal
   * Marcar un disco como completado
   */
  async toggleDisk(_diskNumber: number, userId: number) {
    const backup = await this.getTodayBackup();

    if (!backup) {
      throw new NotFoundException('No se encontró el backup de hoy');
    }

    const statusContext = await this.getStatusContext();
    const isAlreadyCompleted = this.isCompleted(backup);
    const targetStatus = isAlreadyCompleted ? statusContext.firstStatus : statusContext.completedStatus;

    const updateData: UpdateDailyBackupDto = {
      backupZipStatusId: targetStatus.id,
      backupAdjuntosStatusId: targetStatus.id,
      calipsoStatusId: targetStatus.id,
      presupuestacionStatusId: targetStatus.id,
      diskId: backup.diskId,
    };

    return this.createOrUpdateToday(updateData, userId);
  }

  /**
   * Obtener backups por mes
   */
  async getBackupsByMonth(year: number, month: number) {
    const start = startOfMonth(new Date(year, month - 1));
    const end = endOfMonth(new Date(year, month - 1));

    const backups = await this.prisma.dailyBackup.findMany({
      where: {
        date: {
          gte: start,
          lte: end,
        },
      },
      include: DAILY_BACKUP_INCLUDE,
      orderBy: { date: 'desc' },
    });

    return backups;
  }

  /**
   * Obtener historial completo (paginado)
   */
  async getHistory(page: number = 1, limit: number = 30) {
    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      this.prisma.dailyBackup.findMany({
        skip,
        take: limit,
        orderBy: { date: 'desc' },
        include: DAILY_BACKUP_INCLUDE,
      }),
      this.prisma.dailyBackup.count(),
    ]);

    return {
      items,
      total,
      page,
      limit,
      pages: Math.ceil(total / limit),
    };
  }

  /**
   * Obtener estadísticas de backups
   */
  async getStats() {
    const now = new Date();
    const startOfThisMonth = startOfMonth(now);
    const startOfLastMonth = startOfMonth(new Date(now.getFullYear(), now.getMonth() - 1));
    const endOfLastMonth = endOfMonth(new Date(now.getFullYear(), now.getMonth() - 1));

    const [
      totalBackups,
      completedBackups,
      thisMonthBackups,
      thisMonthCompleted,
      lastMonthBackups,
      lastMonthCompleted,
    ] = await Promise.all([
      this.prisma.dailyBackup.count(),
      this.prisma.dailyBackup.count({
        where: { completedAt: { not: null } },
      }),
      this.prisma.dailyBackup.count({
        where: { date: { gte: startOfThisMonth } },
      }),
      this.prisma.dailyBackup.count({
        where: {
          date: { gte: startOfThisMonth },
          completedAt: { not: null },
        },
      }),
      this.prisma.dailyBackup.count({
        where: {
          date: { gte: startOfLastMonth, lte: endOfLastMonth },
        },
      }),
      this.prisma.dailyBackup.count({
        where: {
          date: { gte: startOfLastMonth, lte: endOfLastMonth },
          completedAt: { not: null },
        },
      }),
    ]);

    return {
      total: totalBackups,
      completed: completedBackups,
      pending: totalBackups - completedBackups,
      thisMonth: {
        total: thisMonthBackups,
        completed: thisMonthCompleted,
        pending: thisMonthBackups - thisMonthCompleted,
      },
      lastMonth: {
        total: lastMonthBackups,
        completed: lastMonthCompleted,
        pending: lastMonthBackups - lastMonthCompleted,
      },
    };
  }

  /**
   * Cron job: Recordatorio a las 9:00 AM todos los días
   */
  @Cron('0 9 * * *') // 9:00 AM todos los días
  async sendMorningReminder() {
    this.logger.log('Enviando recordatorio matutino de backup diario');

    try {
      const now = new Date();
      // Enviar recordatorios todos los días

      const notificationSetting = await this.getNotificationSetting(NOTIFICATION_CODES.morning);
      if (notificationSetting && !notificationSetting.isEnabled) {
        this.logger.log('Recordatorio matutino deshabilitado por configuración');
        return;
      }

      // ⭐ PREVENIR DUPLICADOS: Verificar si ya se envió un recordatorio hoy
      const todayStart = startOfDay(now);
      const existingNotification = await this.prisma.notification.findFirst({
        where: {
          type: 'BACKUP',
          title: { contains: 'Recordatorio: Backup Diario' },
          createdAt: { gte: todayStart },
        },
        orderBy: { createdAt: 'desc' },
      });

      if (existingNotification) {
        this.logger.log('Ya se envió un recordatorio matutino hoy, omitiendo duplicado');
        return;
      }

      const today = await this.getTodayBackup();

      if (!today || !this.isCompleted(today)) {
        const diskDisplay = today ? this.getDiskDisplayName(today.disk) : 'los discos configurados';
        const title = notificationSetting?.title ?? 'Recordatorio: Backup Diario';
        const defaultMessage = 'Es hora de realizar el backup diario en {{disk}}.';
        const messageTemplate = notificationSetting?.message ?? defaultMessage;
        const message = messageTemplate.replace('{{disk}}', diskDisplay);

        await this.notificationsService.createForAllUsers({
          type: NotificationType.BACKUP,
          title,
          message,
          priority: this.resolvePriority(notificationSetting?.priority),
          data: JSON.stringify({
            context: 'daily-backup-morning',
            date: format(now, 'dd/MM/yyyy'),
            diskId: today?.diskId,
            diskName: today?.disk?.name,
            diskSequence: today?.disk?.sequence,
          }),
        });

        this.logger.log('Recordatorio matutino enviado exitosamente');
      } else {
        this.logger.log('Backup ya completado, no se envía recordatorio matutino');
      }
    } catch (error) {
      this.logger.error('Error enviando recordatorio matutino', error.stack);
    }
  }

  /**
   * Cron job: Recordatorio a las 2:00 PM todos los días
   */
  @Cron('0 14 * * *') // 2:00 PM todos los días
  async sendAfternoonReminder() {
    this.logger.log('Enviando recordatorio vespertino de backup diario');

    try {
      const now = new Date();
      // Enviar recordatorios todos los días

      const notificationSetting = await this.getNotificationSetting(NOTIFICATION_CODES.afternoon);
      if (notificationSetting && !notificationSetting.isEnabled) {
        this.logger.log('Recordatorio vespertino deshabilitado por configuración');
        return;
      }

      // ⭐ PREVENIR DUPLICADOS: Verificar si ya se envió un recordatorio vespertino hoy
      // Buscamos al menos 1 notificación con el contexto específico de afternoon
      const todayStart = startOfDay(now);
      const existingNotification = await this.prisma.notification.findFirst({
        where: {
          type: 'BACKUP',
          data: { contains: '"context":"daily-backup-afternoon"' },
          createdAt: { gte: todayStart },
        },
        orderBy: { createdAt: 'desc' },
      });

      if (existingNotification) {
        this.logger.log('Ya se envió un recordatorio vespertino hoy, omitiendo duplicado');
        return;
      }

      const today = await this.getTodayBackup();

      if (!today || !this.isCompleted(today)) {
        const missingFiles = this.getMissingFiles(today ?? null);
        const filesCompleted = this.countCompletedFiles(today ?? null);
        const totalFiles = today?.files?.length || 4; // Dinámico
        const diskDisplay = today ? this.getDiskDisplayName(today.disk) : 'los discos configurados';

        const title = notificationSetting?.title ?? 'URGENTE: Backup Diario Pendiente';
        const defaultMessage = today
          ? `El backup diario sigue pendiente en {{disk}} ({{completed}}/${totalFiles} archivos completados). Faltan: {{missing}}.`
          : 'El backup diario aún no se ha iniciado.';
        const messageTemplate = notificationSetting?.message ?? defaultMessage;
        const message = messageTemplate
          .replace('{{disk}}', diskDisplay)
          .replace('{{completed}}', `${filesCompleted}`)
          .replace('{{missing}}', missingFiles.join(', ') || 'N/A');

        await this.notificationsService.createForAllUsers({
          type: NotificationType.BACKUP,
          title,
          message,
          priority: this.resolvePriority(notificationSetting?.priority ?? NotificationPriority.HIGH),
          data: JSON.stringify({
            context: 'daily-backup-afternoon',
            date: format(now, 'dd/MM/yyyy'),
            diskId: today?.diskId,
            diskName: today?.disk?.name,
            diskSequence: today?.disk?.sequence,
            filesCompleted,
            missingFiles,
          }),
        });

        this.logger.log('Recordatorio vespertino urgente enviado exitosamente');
      } else {
        this.logger.log('Backup ya completado, no se envía recordatorio vespertino');
      }
    } catch (error) {
      this.logger.error('Error enviando recordatorio vespertino', error.stack);
    }
  }

  /**
   * Verificar si un backup está completo (usa sistema dinámico)
   */
  private isCompleted(backup: DailyBackupWithRelations | null): boolean {
    if (!backup) {
      return false;
    }

    // Si no hay archivos dinámicos, usar lógica legacy
    if (!backup.files || backup.files.length === 0) {
      return (
        backup.backupZipStatus?.isFinal &&
        backup.backupAdjuntosStatus?.isFinal &&
        backup.calipsoStatus?.isFinal &&
        backup.presupuestacionStatus?.isFinal
      );
    }

    // Sistema dinámico: todos los archivos deben tener estado final
    return backup.files.every((file) => file.status?.isFinal);
  }

  /**
   * Contar archivos completados (usa sistema dinámico)
   */
  private countCompletedFiles(backup: DailyBackupWithRelations | null): number {
    if (!backup) {
      return 0;
    }

    // Si no hay archivos dinámicos, usar lógica legacy
    if (!backup.files || backup.files.length === 0) {
      const statuses = [
        backup.backupZipStatus,
        backup.backupAdjuntosStatus,
        backup.calipsoStatus,
        backup.presupuestacionStatus,
      ];
      return statuses.filter((status) => status?.isFinal).length;
    }

    // Sistema dinámico: contar archivos con estado final
    return backup.files.filter((file) => file.status?.isFinal).length;
  }

  /**
   * Obtener lista de archivos faltantes (usa sistema dinámico)
   */
  private getMissingFiles(backup: DailyBackupWithRelations | null): string[] {
    if (!backup) {
      return Object.values(BACKUP_FILE_LABELS);
    }

    // Si no hay archivos dinámicos, usar lógica legacy
    if (!backup.files || backup.files.length === 0) {
      const items: Array<{ status: BackupStatus | null | undefined; label: string }> = [
        { status: backup.backupZipStatus, label: BACKUP_FILE_LABELS.backupZip },
        { status: backup.backupAdjuntosStatus, label: BACKUP_FILE_LABELS.backupAdjuntosZip },
        { status: backup.calipsoStatus, label: BACKUP_FILE_LABELS.calipsoBak },
        { status: backup.presupuestacionStatus, label: BACKUP_FILE_LABELS.presupuestacionBak },
      ];
      return items.filter((item) => !item.status?.isFinal).map((item) => item.label);
    }

    // Sistema dinámico: devolver nombres de archivos no finales
    return backup.files
      .filter((file) => !file.status?.isFinal)
      .map((file) => file.fileType?.name || 'Archivo desconocido');
  }

  /**
   * Contar discos completados (DEPRECATED - mantener por compatibilidad)
   */
  private countCompletedDisks(backup: DailyBackupWithRelations): number {
    return this.isCompleted(backup) ? 1 : 0;
  }

  private getDiskDisplayName(disk: BackupDisk): string {
    return disk.name || `Disco ${disk.sequence}`;
  }

  /**
   * Notificar que el backup fue completado
   */
  private async notifyBackupCompleted(completedByUsername: string, disk: BackupDisk) {
    try {
      const notificationSetting = await this.getNotificationSetting(NOTIFICATION_CODES.completed);
      if (notificationSetting && !notificationSetting.isEnabled) {
        this.logger.log('Notificación de backup completado deshabilitada, no se enviará');
        return;
      }

      const title = notificationSetting?.title ?? 'Backup Diario Completado';
      const messageTemplate =
        notificationSetting?.message ??
        'El backup diario fue completado exitosamente por {{user}} en el {{disk}}.';

      const diskDisplay = this.getDiskDisplayName(disk);
      const message = messageTemplate
        .replace('{{user}}', completedByUsername)
        .replace('{{disk}}', diskDisplay);

      await this.notificationsService.createForAllUsers({
        type: NotificationType.BACKUP,
        title,
        message,
        priority: (notificationSetting?.priority as NotificationPriority) ?? NotificationPriority.NORMAL,
        data: JSON.stringify({
          context: 'daily-backup-completed',
          completedBy: completedByUsername,
          diskId: disk.id,
          diskSequence: disk.sequence,
          diskName: disk.name,
          date: format(new Date(), 'dd/MM/yyyy'),
        }),
      });

      this.logger.log('Notificación de backup completado enviada');
    } catch (error) {
      this.logger.error('Error enviando notificación de backup completado', error.stack);
    }
  }

  /**
   * Obtener backups para el calendario (eventos)
   * IMPORTANTE: SIEMPRE genera el evento del día ACTUAL, incluso si no existe en BD
   * Para días pasados/futuros, solo genera eventos si existen en BD
   */
  async getBackupsAsCalendarEvents(year: number, month: number) {
    const start = startOfMonth(new Date(year, month - 1));
    const end = endOfMonth(new Date(year, month - 1));
    const today = this.getTodayInTimezone();

    // Obtener backups existentes del mes
    const backups = await this.getBackupsByMonth(year, month);

    // Crear Map usando formato YYYY-MM-DD para evitar problemas de timezone
    // IMPORTANTE: Usar componentes UTC para evitar offset de timezone local
    const backupsByDate = new Map(
      backups.map((b) => {
        const date = new Date(b.date);
        const dateKey = `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}-${String(date.getUTCDate()).padStart(2, '0')}`;
        return [dateKey, b];
      })
    );

    const events: any[] = [];

    // CRÍTICO: Si el mes actual incluye HOY, asegurar que siempre haya un evento para hoy
    const todayInRange = today >= start && today <= end;
    if (todayInRange) {
      // Usar formato YYYY-MM-DD para la key (componentes UTC para hacer match con backupsByDate)
      const todayDate = new Date(today);
      const todayKey = `${todayDate.getUTCFullYear()}-${String(todayDate.getUTCMonth() + 1).padStart(2, '0')}-${String(todayDate.getUTCDate()).padStart(2, '0')}`;
      let todayBackup: DailyBackupWithRelations | undefined | null = backupsByDate.get(todayKey);

      // Si no existe backup para hoy, obtenerlo (se creará automáticamente)
      if (!todayBackup) {
        todayBackup = await this.getTodayBackup();
      }

      if (todayBackup) {
        const totalFiles = todayBackup.files?.length || 0;
        const completedFiles = todayBackup.files?.filter(f => f.status?.isFinal).length || 0;
        const isCompleted = todayBackup.completedAt !== null;

        // Extraer componentes UTC de la fecha de BD
        // Prisma devuelve Date con la fecha en UTC, extraemos sus componentes
        const backupDate = new Date(todayBackup.date);
        const year = backupDate.getUTCFullYear();
        const month = backupDate.getUTCMonth() + 1;
        const day = backupDate.getUTCDate();

        // Crear ISO string representando medianoche en Argentina (UTC-3 = +03:00 UTC)
        // Ejemplo: 2025-10-22 00:00 Argentina = 2025-10-22 03:00 UTC
        const utcISOString = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}T03:00:00.000Z`;

        events.push({
          id: todayBackup.id,
          title: isCompleted
            ? `Backup Completo - ${todayBackup.disk?.name || 'Disco'}`
            : totalFiles > 0 && completedFiles > 0
            ? `Backup en Progreso ${completedFiles}/${totalFiles} - ${todayBackup.disk?.name || 'Disco'}`
            : `Backup Pendiente - ${todayBackup.disk?.name || 'Disco'}`,
          description: todayBackup.notes || `Backup diario en ${todayBackup.disk?.name || 'disco'}`,
          startTime: utcISOString,
          endTime: null,
          allDay: true,
          location: null,
          color: isCompleted ? '#10b981' : '#f59e0b', // Verde si completo, naranja si pendiente
          priority: 'NORMAL' as const,
          tags: ['backup', 'sistema'],
          metadata: {
            type: 'daily-backup',
            backupId: todayBackup.id,
            diskId: todayBackup.diskId,
            diskName: todayBackup.disk?.name,
            diskSequence: todayBackup.disk?.sequence,
            completed: isCompleted,
            readonly: false, // El backup de HOY siempre es editable
            isPast: false,
            isToday: true,
            totalFiles,
            completedFiles,
            files: todayBackup.files?.map(f => ({
              fileTypeId: f.fileTypeId,
              fileTypeName: f.fileType?.name,
              fileTypeCode: f.fileType?.code,
              statusId: f.statusId,
              statusCode: f.status?.code,
              statusLabel: f.status?.label,
              isFinal: f.status?.isFinal,
            })),
            statuses: {
              backupZip: todayBackup.backupZipStatus?.code,
              backupAdjuntosZip: todayBackup.backupAdjuntosStatus?.code,
              calipsoBak: todayBackup.calipsoStatus?.code,
              presupuestacionBak: todayBackup.presupuestacionStatus?.code,
            },
            completedBy: todayBackup.user?.username,
            completedAt: todayBackup.completedAt?.toISOString(),
          },
          isArchived: false,
          createdById: todayBackup.completedBy,
          createdAt: todayBackup.createdAt.toISOString(),
          updatedAt: todayBackup.updatedAt.toISOString(),
          participants: [],
          reminders: [],
          attachments: [],
        });

        // Marcar como procesado
        backupsByDate.delete(todayKey);
      }
    }

    // Procesar backups de otros días (pasados/futuros) solo si existen en BD
    for (const backup of backupsByDate.values()) {
      const backupDate = startOfDay(backup.date);
      const isPast = backupDate < today;
      const isCompleted = backup.completedAt !== null;

      const totalFiles = backup.files?.length || 0;
      const completedFiles = backup.files?.filter(f => f.status?.isFinal).length || 0;

      // Determinar color
      let color: string;
      if (isCompleted) {
        color = '#10b981'; // Verde para completados
      } else if (isPast) {
        color = '#ef4444'; // Rojo para incompletos de días pasados
      } else {
        color = '#6b7280'; // Gris para futuros
      }

      // Título sin emojis
      let title: string;
      if (isCompleted) {
        title = `Backup Completo - ${backup.disk?.name || 'Disco'}`;
      } else if (totalFiles > 0 && completedFiles > 0) {
        title = `Backup Incompleto ${completedFiles}/${totalFiles} - ${backup.disk?.name || 'Disco'}`;
      } else if (isPast) {
        title = `Backup Incompleto - ${backup.disk?.name || 'Disco'}`;
      } else {
        title = `Backup Programado - ${backup.disk?.name || 'Disco'}`;
      }

      // Extraer componentes UTC de la fecha de BD
      const backupDateOther = new Date(backup.date);
      const yearOther = backupDateOther.getUTCFullYear();
      const monthOther = backupDateOther.getUTCMonth() + 1;
      const dayOther = backupDateOther.getUTCDate();

      // Crear ISO string representando medianoche en Argentina (UTC-3 = +03:00 UTC)
      const utcISOStringOther = `${yearOther}-${String(monthOther).padStart(2, '0')}-${String(dayOther).padStart(2, '0')}T03:00:00.000Z`;

      events.push({
        id: backup.id,
        title,
        description: backup.notes || `Backup diario en ${backup.disk?.name || 'disco'}`,
        startTime: utcISOStringOther,
        endTime: null,
        allDay: true,
        location: null,
        color,
        priority: isPast && !isCompleted ? 'HIGH' : 'NORMAL' as const,
        tags: ['backup', 'sistema'],
        metadata: {
          type: 'daily-backup',
          backupId: backup.id,
          diskId: backup.diskId,
          diskName: backup.disk?.name,
          diskSequence: backup.disk?.sequence,
          completed: isCompleted,
          readonly: true, // Días pasados/futuros son readonly
          isPast,
          isToday: false,
          totalFiles,
          completedFiles,
          files: backup.files?.map(f => ({
            fileTypeId: f.fileTypeId,
            fileTypeName: f.fileType?.name,
            fileTypeCode: f.fileType?.code,
            statusId: f.statusId,
            statusCode: f.status?.code,
            statusLabel: f.status?.label,
            isFinal: f.status?.isFinal,
          })),
          statuses: {
            backupZip: backup.backupZipStatus?.code,
            backupAdjuntosZip: backup.backupAdjuntosStatus?.code,
            calipsoBak: backup.calipsoStatus?.code,
            presupuestacionBak: backup.presupuestacionStatus?.code,
          },
          completedBy: backup.user?.username,
          completedAt: backup.completedAt?.toISOString(),
        },
        isArchived: false,
        createdById: backup.completedBy,
        createdAt: backup.createdAt.toISOString(),
        updatedAt: backup.updatedAt.toISOString(),
        participants: [],
        reminders: [],
        attachments: [],
      });
    }

    return events;
  }
}