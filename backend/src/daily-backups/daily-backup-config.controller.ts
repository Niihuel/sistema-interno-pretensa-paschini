import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { DailyBackupConfigService } from './daily-backup-config.service';
import {
  CreateBackupDiskDto,
  UpdateBackupDiskDto,
  CreateBackupStatusDto,
  UpdateBackupStatusDto,
  UpdateNotificationSettingDto,
  CreateBackupFileTypeDto,
  UpdateBackupFileTypeDto,
} from './dto';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { RbacGuard } from '@/rbac/guards/rbac.guard';
import { RequireAnyPermission } from '@/common/decorators/permissions.decorator';
import { Audit } from '@/audit/decorators/audit.decorator';
import { AuditAction, AuditCategory, AuditSeverity } from '@/audit/dto';

@Controller('daily-backups/config')
@UseGuards(JwtAuthGuard, RbacGuard)
export class DailyBackupConfigController {
  constructor(private readonly configService: DailyBackupConfigService) {}

  @Get()
  @Audit({
    entity: 'DailyBackupConfig',
    action: AuditAction.VIEW,
    category: AuditCategory.SYSTEM,
    severity: AuditSeverity.INFO,
  })
  @RequireAnyPermission({ resource: 'daily_backups', action: 'manage', scope: 'all' })
  getConfiguration() {
    return this.configService.getConfiguration();
  }

  @Post('disks')
  @Audit({
    entity: 'BackupDisk',
    action: AuditAction.CREATE,
    category: AuditCategory.SYSTEM,
    severity: AuditSeverity.MEDIUM,
  })
  @RequireAnyPermission({ resource: 'daily_backups', action: 'manage', scope: 'all' })
  createDisk(@Body() dto: CreateBackupDiskDto) {
    return this.configService.createDisk(dto);
  }

  @Patch('disks/:id')
  @Audit({
    entity: 'BackupDisk',
    action: AuditAction.UPDATE,
    category: AuditCategory.SYSTEM,
    severity: AuditSeverity.MEDIUM,
  })
  @RequireAnyPermission({ resource: 'daily_backups', action: 'manage', scope: 'all' })
  updateDisk(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateBackupDiskDto,
  ) {
    return this.configService.updateDisk(id, dto);
  }

  @Delete('disks/:id')
  @Audit({
    entity: 'BackupDisk',
    action: AuditAction.DELETE,
    category: AuditCategory.SYSTEM,
    severity: AuditSeverity.MEDIUM,
  })
  @RequireAnyPermission({ resource: 'daily_backups', action: 'delete', scope: 'all' })
  archiveDisk(@Param('id', ParseIntPipe) id: number) {
    return this.configService.archiveDisk(id);
  }

  @Post('statuses')
  @Audit({
    entity: 'BackupStatus',
    action: AuditAction.CREATE,
    category: AuditCategory.SYSTEM,
    severity: AuditSeverity.MEDIUM,
  })
  @RequireAnyPermission({ resource: 'daily_backups', action: 'manage', scope: 'all' })
  createStatus(@Body() dto: CreateBackupStatusDto) {
    return this.configService.createStatus(dto);
  }

  @Patch('statuses/:id')
  @Audit({
    entity: 'BackupStatus',
    action: AuditAction.UPDATE,
    category: AuditCategory.SYSTEM,
    severity: AuditSeverity.MEDIUM,
  })
  @RequireAnyPermission({ resource: 'daily_backups', action: 'manage', scope: 'all' })
  updateStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateBackupStatusDto,
  ) {
    return this.configService.updateStatus(id, dto);
  }

  @Delete('statuses/:id')
  @Audit({
    entity: 'BackupStatus',
    action: AuditAction.DELETE,
    category: AuditCategory.SYSTEM,
    severity: AuditSeverity.MEDIUM,
  })
  @RequireAnyPermission({ resource: 'daily_backups', action: 'delete', scope: 'all' })
  archiveStatus(@Param('id', ParseIntPipe) id: number) {
    return this.configService.archiveStatus(id);
  }

  @Patch('notifications/:code')
  @Audit({
    entity: 'BackupNotificationSetting',
    action: AuditAction.UPDATE,
    category: AuditCategory.SYSTEM,
    severity: AuditSeverity.MEDIUM,
  })
  @RequireAnyPermission({ resource: 'daily_backups', action: 'manage', scope: 'all' })
  updateNotification(
    @Param('code') code: string,
    @Body() dto: UpdateNotificationSettingDto,
  ) {
    return this.configService.updateNotificationSetting(code, dto);
  }

  @Post('file-types')
  @Audit({
    entity: 'BackupFileType',
    action: AuditAction.CREATE,
    category: AuditCategory.SYSTEM,
    severity: AuditSeverity.MEDIUM,
  })
  @RequireAnyPermission({ resource: 'daily_backups', action: 'manage', scope: 'all' })
  createFileType(@Body() dto: CreateBackupFileTypeDto) {
    return this.configService.createFileType(dto);
  }

  @Patch('file-types/:id')
  @Audit({
    entity: 'BackupFileType',
    action: AuditAction.UPDATE,
    category: AuditCategory.SYSTEM,
    severity: AuditSeverity.MEDIUM,
  })
  @RequireAnyPermission({ resource: 'daily_backups', action: 'manage', scope: 'all' })
  updateFileType(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateBackupFileTypeDto,
  ) {
    return this.configService.updateFileType(id, dto);
  }

  @Delete('file-types/:id')
  @Audit({
    entity: 'BackupFileType',
    action: AuditAction.DELETE,
    category: AuditCategory.SYSTEM,
    severity: AuditSeverity.MEDIUM,
  })
  @RequireAnyPermission({ resource: 'daily_backups', action: 'delete', scope: 'all' })
  archiveFileType(@Param('id', ParseIntPipe) id: number) {
    return this.configService.archiveFileType(id);
  }
}
