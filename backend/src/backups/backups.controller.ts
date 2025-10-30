import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  ParseIntPipe,
  UseGuards,
  HttpCode,
  HttpStatus,
  Res,
  StreamableFile,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { Response } from 'express';
import { createReadStream } from 'fs';
import { FileInterceptor } from '@nestjs/platform-express';
import { BackupsService } from './backups.service';
import { CreateBackupLogDto, UpdateBackupLogDto, QueryBackupLogDto } from './dto';
import { JwtAuthGuard, PermissionsGuard } from '@/common/guards';
import { RequirePermission, Public } from '@/common/decorators';
import { Audit } from '@/audit/decorators/audit.decorator';
import { AuditAction, AuditCategory } from '@/audit/dto';

@Controller('backups')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class BackupsController {
  constructor(private backupsService: BackupsService) {}

  @Post()
  @RequirePermission('backups', 'create', 'all')
  @Audit({ entity: 'BackupLog', action: AuditAction.CREATE, category: AuditCategory.SYSTEM })
  async create(@Body() dto: CreateBackupLogDto) {
    const backupLog = await this.backupsService.create(dto);
    return {
      success: true,
      data: backupLog,
      message: 'Backup log created successfully',
    };
  }

  @Get()
  @RequirePermission('backups', 'view', 'all')
  async findAll(@Query() query: QueryBackupLogDto) {
    const result = await this.backupsService.findAll(query);
    return {
      success: true,
      data: result.items,
      meta: {
        total: result.total,
        page: result.page,
        limit: result.limit,
      },
    };
  }

  // IMPORTANTE: Las rutas específicas deben ir ANTES de las rutas dinámicas (:id)
  // para evitar que NestJS intente hacer match con el parámetro dinámico primero

  @Get('restore-status')
  @RequirePermission('backups', 'view', 'all')
  async getRestoreStatus() {
    const status = await this.backupsService.isRestoring();
    return {
      success: true,
      data: status,
    };
  }

  @Get('stats')
  @RequirePermission('backups', 'view', 'all')
  async getStats() {
    const stats = await this.backupsService.getBackupStats();
    return {
      success: true,
      data: stats,
    };
  }

  @Get('recent')
  @RequirePermission('backups', 'view', 'all')
  async getRecent(@Query('limit', ParseIntPipe) limit: number = 10) {
    const backups = await this.backupsService.getRecentBackups(limit);
    return {
      success: true,
      data: backups,
    };
  }

  @Get(':id/download')
  @RequirePermission('backups', 'download', 'all') // Solo administradores
  @Audit({ entity: 'BackupLog', action: AuditAction.EXPORT, category: AuditCategory.SYSTEM })
  async downloadBackup(@Param('id', ParseIntPipe) id: number, @Res({ passthrough: true }) res: Response) {
    const backupLog = await this.backupsService.findOne(id);

    if (backupLog.status !== 'SUCCESS') {
      throw new Error('Only successful backups can be downloaded');
    }

    const file = createReadStream(backupLog.destination);

    res.set({
      'Content-Type': 'application/octet-stream',
      'Content-Disposition': `attachment; filename="${backupLog.backupName}"`,
    });

    return new StreamableFile(file);
  }

  @Get(':id')
  @RequirePermission('backups', 'view', 'all')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    const backupLog = await this.backupsService.findOne(id);
    return {
      success: true,
      data: backupLog,
    };
  }

  @Put(':id')
  @RequirePermission('backups', 'update', 'all')
  @Audit({ entity: 'BackupLog', action: AuditAction.UPDATE, category: AuditCategory.SYSTEM, captureOldValue: true })
  async update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateBackupLogDto) {
    const backupLog = await this.backupsService.update(id, dto);
    return {
      success: true,
      data: backupLog,
      message: 'Backup log updated successfully',
    };
  }

  @Delete(':id')
  @RequirePermission('backups', 'delete', 'all')
  @Audit({ entity: 'BackupLog', action: AuditAction.DELETE, category: AuditCategory.SYSTEM, captureOldValue: true })
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id', ParseIntPipe) id: number) {
    await this.backupsService.remove(id);
  }

  @Post('create')
  @RequirePermission('backups', 'create', 'all')
  @Audit({ entity: 'BackupLog', action: AuditAction.CREATE, category: AuditCategory.SYSTEM })
  async createBackup() {
    const backupLog = await this.backupsService.createDatabaseBackup('MANUAL');
    return {
      success: true,
      data: backupLog,
      message: 'Database backup created successfully',
    };
  }

  @Post(':id/restore')
  @RequirePermission('backups', 'restore', 'all') // Requiere permiso crítico específico para restaurar
  @Audit({ entity: 'BackupLog', action: AuditAction.UPDATE, category: AuditCategory.SYSTEM })
  async restoreBackup(@Param('id', ParseIntPipe) id: number) {
    await this.backupsService.restoreDatabaseBackup(id);
    return {
      success: true,
      message: 'Database restored successfully from backup',
    };
  }

  @Post('restore-from-file')
  @RequirePermission('backups', 'restore', 'all') // Requiere permiso crítico específico para restaurar
  @Audit({ entity: 'BackupLog', action: AuditAction.UPDATE, category: AuditCategory.SYSTEM })
  @UseInterceptors(FileInterceptor('file'))
  async restoreFromFile(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    // Validar que sea un archivo de backup válido (extensión .sql, .backup, .dump)
    const validExtensions = ['.sql', '.backup', '.dump'];
    const hasValidExtension = validExtensions.some(ext => file.originalname.toLowerCase().endsWith(ext));

    if (!hasValidExtension) {
      throw new BadRequestException('Invalid file type. Only .sql, .backup, and .dump files are allowed');
    }

    await this.backupsService.restoreFromUploadedFile(file.buffer, file.originalname);

    return {
      success: true,
      message: 'Database restored successfully from uploaded file',
    };
  }
}
