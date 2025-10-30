import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '@/common/prisma.service';
import {
  CreateBackupDiskDto,
  UpdateBackupDiskDto,
  CreateBackupStatusDto,
  UpdateBackupStatusDto,
  UpdateNotificationSettingDto,
  CreateBackupFileTypeDto,
  UpdateBackupFileTypeDto,
} from './dto';

@Injectable()
export class DailyBackupConfigService {
  constructor(private readonly prisma: PrismaService) {}

  async getConfiguration() {
    const [disks, statuses, notifications, fileTypes] = await Promise.all([
      this.prisma.backupDisk.findMany({
        orderBy: [{ sequence: 'asc' }, { id: 'asc' }],
      }),
      this.prisma.backupStatus.findMany({
        orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }],
      }),
      this.prisma.backupNotificationSetting.findMany({
        orderBy: { code: 'asc' },
      }),
      this.prisma.backupFileType.findMany({
        orderBy: [{ sequence: 'asc' }, { id: 'asc' }],
      }),
    ]);

    return { disks, statuses, notifications, fileTypes };
  }

  async createDisk(dto: CreateBackupDiskDto) {
    try {
      return await this.prisma.backupDisk.create({
        data: {
          name: dto.name,
          sequence: dto.sequence,
          description: dto.description,
          color: dto.color,
          isActive: dto.isActive ?? true,
        },
      });
    } catch (error) {
      this.handlePrismaError(error, 'disco');
    }
  }

  async updateDisk(id: number, dto: UpdateBackupDiskDto) {
    await this.ensureDiskExists(id);

    try {
      const data: Prisma.BackupDiskUpdateInput = {
        ...(dto.name !== undefined ? { name: dto.name } : {}),
        ...(dto.sequence !== undefined ? { sequence: dto.sequence } : {}),
        ...(dto.description !== undefined ? { description: dto.description } : {}),
        ...(dto.color !== undefined ? { color: dto.color } : {}),
        ...(dto.isActive !== undefined ? { isActive: dto.isActive } : {}),
      };

      return await this.prisma.backupDisk.update({
        where: { id },
        data,
      });
    } catch (error) {
      this.handlePrismaError(error, 'disco');
    }
  }

  async archiveDisk(id: number) {
    await this.ensureDiskExists(id);

    return this.prisma.backupDisk.update({
      where: { id },
      data: { isActive: false },
    });
  }

  async createStatus(dto: CreateBackupStatusDto) {
    try {
      return await this.prisma.backupStatus.create({
        data: {
          code: dto.code,
          label: dto.label,
          description: dto.description,
          color: dto.color,
          sortOrder: dto.sortOrder ?? 0,
          isFinal: dto.isFinal ?? false,
          isActive: dto.isActive ?? true,
        },
      });
    } catch (error) {
      this.handlePrismaError(error, 'estado');
    }
  }

  async updateStatus(id: number, dto: UpdateBackupStatusDto) {
    await this.ensureStatusExists(id);

    try {
      const data: Prisma.BackupStatusUpdateInput = {
        ...(dto.code !== undefined ? { code: dto.code } : {}),
        ...(dto.label !== undefined ? { label: dto.label } : {}),
        ...(dto.description !== undefined ? { description: dto.description } : {}),
        ...(dto.color !== undefined ? { color: dto.color } : {}),
        ...(dto.sortOrder !== undefined ? { sortOrder: dto.sortOrder } : {}),
        ...(dto.isFinal !== undefined ? { isFinal: dto.isFinal } : {}),
        ...(dto.isActive !== undefined ? { isActive: dto.isActive } : {}),
      };

      return await this.prisma.backupStatus.update({
        where: { id },
        data,
      });
    } catch (error) {
      this.handlePrismaError(error, 'estado');
    }
  }

  async archiveStatus(id: number) {
    await this.ensureStatusExists(id);

    return this.prisma.backupStatus.update({
      where: { id },
      data: { isActive: false },
    });
  }

  async updateNotificationSetting(code: string, dto: UpdateNotificationSettingDto) {
    const setting = await this.prisma.backupNotificationSetting.findUnique({ where: { code } });
    if (!setting) {
      throw new NotFoundException(`No se encontró la configuración de notificación "${code}"`);
    }

    const data: Prisma.BackupNotificationSettingUpdateInput = {
      ...(dto.title !== undefined ? { title: dto.title } : {}),
      ...(dto.message !== undefined ? { message: dto.message } : {}),
      ...(dto.priority !== undefined ? { priority: dto.priority } : {}),
      ...(dto.isEnabled !== undefined ? { isEnabled: dto.isEnabled } : {}),
      ...(dto.sendHour !== undefined ? { sendHour: dto.sendHour } : {}),
      ...(dto.sendMinute !== undefined ? { sendMinute: dto.sendMinute } : {}),
      ...(dto.daysOfWeek !== undefined ? { daysOfWeek: dto.daysOfWeek } : {}),
    };

    return this.prisma.backupNotificationSetting.update({
      where: { code },
      data,
    });
  }

  private async ensureDiskExists(id: number) {
    const disk = await this.prisma.backupDisk.findUnique({ where: { id } });
    if (!disk) {
      throw new NotFoundException(`No se encontró el disco con id ${id}`);
    }
  }

  private async ensureStatusExists(id: number) {
    const status = await this.prisma.backupStatus.findUnique({ where: { id } });
    if (!status) {
      throw new NotFoundException(`No se encontró el estado con id ${id}`);
    }
  }

  private async ensureFileTypeExists(id: number) {
    const fileType = await this.prisma.backupFileType.findUnique({ where: { id } });
    if (!fileType) {
      throw new NotFoundException(`No se encontró el tipo de archivo con id ${id}`);
    }
  }

  async createFileType(dto: CreateBackupFileTypeDto) {
    try {
      return await this.prisma.backupFileType.create({
        data: {
          code: dto.code,
          name: dto.name,
          description: dto.description,
          sequence: dto.sequence,
          icon: dto.icon,
          isActive: dto.isActive ?? true,
        },
      });
    } catch (error) {
      this.handlePrismaError(error, 'tipo de archivo');
    }
  }

  async updateFileType(id: number, dto: UpdateBackupFileTypeDto) {
    await this.ensureFileTypeExists(id);

    try {
      const data: Prisma.BackupFileTypeUpdateInput = {
        ...(dto.code !== undefined ? { code: dto.code } : {}),
        ...(dto.name !== undefined ? { name: dto.name } : {}),
        ...(dto.description !== undefined ? { description: dto.description } : {}),
        ...(dto.sequence !== undefined ? { sequence: dto.sequence } : {}),
        ...(dto.icon !== undefined ? { icon: dto.icon } : {}),
        ...(dto.isActive !== undefined ? { isActive: dto.isActive } : {}),
      };

      return await this.prisma.backupFileType.update({
        where: { id },
        data,
      });
    } catch (error) {
      this.handlePrismaError(error, 'tipo de archivo');
    }
  }

  async archiveFileType(id: number) {
    await this.ensureFileTypeExists(id);

    return this.prisma.backupFileType.update({
      where: { id },
      data: { isActive: false },
    });
  }

  private handlePrismaError(error: unknown, entity: string): never {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      throw new BadRequestException(`Ya existe un ${entity} con valores duplicados`);
    }

    throw error;
  }
}
