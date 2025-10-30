import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Put,
  Param,
  Delete,
  Query,
  UseGuards,
  Req,
  ParseIntPipe,
} from '@nestjs/common';
import { DailyBackupsService } from './daily-backups.service';
import {
  UpdateDailyBackupDto,
} from './dto';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { RbacGuard } from '@/rbac/guards/rbac.guard';
import { RequireAnyPermission } from '@/common/decorators/permissions.decorator';
import { Audit } from '@/audit/decorators/audit.decorator';
import { AuditAction, AuditCategory, AuditSeverity } from '@/audit/dto';

@Controller('daily-backups')
@UseGuards(JwtAuthGuard, RbacGuard)
export class DailyBackupsController {
  constructor(private readonly dailyBackupsService: DailyBackupsService) {}

  /**
   * GET /daily-backups/today
   * Obtener el backup de hoy
   */
  @Get('today')
  @Audit({
    entity: 'DailyBackup',
    action: AuditAction.VIEW,
    category: AuditCategory.SYSTEM,
    severity: AuditSeverity.INFO,
  })
  @RequireAnyPermission(
    { resource: 'daily_backups', action: 'view', scope: 'all' },
    { resource: 'daily_backups', action: 'view', scope: 'own' }
  )
  getTodayBackup() {
    return this.dailyBackupsService.getTodayBackup();
  }

  /**
   * POST /daily-backups/today
   * Crear o actualizar el backup de hoy
   */
  @Post('today')
  @Audit({
    entity: 'DailyBackup',
    action: AuditAction.CREATE,
    category: AuditCategory.SYSTEM,
    severity: AuditSeverity.MEDIUM,
  })
  @RequireAnyPermission(
    { resource: 'daily_backups', action: 'manage', scope: 'all' }
  )
  createOrUpdateToday(@Body() updateDto: UpdateDailyBackupDto, @Req() req: any) {
    const userId = req.user?.id;
    return this.dailyBackupsService.createOrUpdateToday(updateDto, userId);
  }

  /**
   * PATCH /daily-backups/today/disk/:diskNumber
   * Marcar un disco como completado/no completado (toggle) - DEPRECATED
   */
  @Patch('today/disk/:diskNumber')
  @Audit({
    entity: 'DailyBackup',
    action: AuditAction.UPDATE,
    category: AuditCategory.SYSTEM,
    severity: AuditSeverity.MEDIUM,
  })
  @RequireAnyPermission(
    { resource: 'daily_backups', action: 'manage', scope: 'all' }
  )
  toggleDisk(
    @Param('diskNumber', ParseIntPipe) diskNumber: number,
    @Req() req: any,
  ) {
    const userId = req.user?.id;
    return this.dailyBackupsService.toggleDisk(diskNumber, userId);
  }

  /**
   * PATCH /daily-backups/today/file/:fileType
   * Marcar un archivo específico como completado/no completado (toggle)
   * Soporta strings legacy y códigos dinámicos
   */
  @Patch('today/file/:fileType')
  @Audit({
    entity: 'DailyBackup',
    action: AuditAction.UPDATE,
    category: AuditCategory.SYSTEM,
    severity: AuditSeverity.MEDIUM,
  })
  @RequireAnyPermission(
    { resource: 'daily_backups', action: 'manage', scope: 'all' }
  )
  toggleFile(
    @Param('fileType') fileType: string,
    @Req() req: any,
  ) {
    const userId = req.user?.id;
    return this.dailyBackupsService.toggleFile(fileType, userId);
  }

  /**
   * PATCH /daily-backups/today/file-type/:fileTypeId
   * Marcar un archivo por ID de tipo (método moderno y dinámico)
   */
  @Patch('today/file-type/:fileTypeId')
  @Audit({
    entity: 'DailyBackup',
    action: AuditAction.UPDATE,
    category: AuditCategory.SYSTEM,
    severity: AuditSeverity.MEDIUM,
  })
  @RequireAnyPermission(
    { resource: 'daily_backups', action: 'manage', scope: 'all' }
  )
  toggleFileById(
    @Param('fileTypeId', ParseIntPipe) fileTypeId: number,
    @Req() req: any,
  ) {
    const userId = req.user?.id;
    return this.dailyBackupsService.toggleFileById(fileTypeId, userId);
  }

  /**
   * PUT /daily-backups/today/file-type/:fileTypeId/status/:statusId
   * Actualizar el estado de un archivo específico a un estado determinado
   */
  @Put('today/file-type/:fileTypeId/status/:statusId')
  @Audit({
    entity: 'DailyBackup',
    action: AuditAction.UPDATE,
    category: AuditCategory.SYSTEM,
    severity: AuditSeverity.MEDIUM,
  })
  @RequireAnyPermission(
    { resource: 'daily_backups', action: 'manage', scope: 'all' }
  )
  updateFileStatus(
    @Param('fileTypeId', ParseIntPipe) fileTypeId: number,
    @Param('statusId', ParseIntPipe) statusId: number,
    @Req() req: any,
  ) {
    const userId = req.user?.id;
    return this.dailyBackupsService.updateFileStatus(fileTypeId, statusId, userId);
  }

  /**
   * GET /daily-backups/month/:year/:month
   * Obtener backups por mes
   */
  @Get('month/:year/:month')
  @Audit({
    entity: 'DailyBackup',
    action: AuditAction.VIEW,
    category: AuditCategory.SYSTEM,
    severity: AuditSeverity.INFO,
  })
  @RequireAnyPermission(
    { resource: 'daily_backups', action: 'view', scope: 'all' },
    { resource: 'daily_backups', action: 'view', scope: 'own' }
  )
  getBackupsByMonth(
    @Param('year', ParseIntPipe) year: number,
    @Param('month', ParseIntPipe) month: number,
  ) {
    return this.dailyBackupsService.getBackupsByMonth(year, month);
  }

  /**
   * GET /daily-backups/calendar/:year/:month
   * Obtener backups como eventos de calendario
   */
  @Get('calendar/:year/:month')
  @Audit({
    entity: 'DailyBackup',
    action: AuditAction.VIEW,
    category: AuditCategory.SYSTEM,
    severity: AuditSeverity.INFO,
  })
  @RequireAnyPermission(
    { resource: 'daily_backups', action: 'view', scope: 'all' },
    { resource: 'daily_backups', action: 'view', scope: 'own' }
  )
  getBackupsAsCalendarEvents(
    @Param('year', ParseIntPipe) year: number,
    @Param('month', ParseIntPipe) month: number,
  ) {
    return this.dailyBackupsService.getBackupsAsCalendarEvents(year, month);
  }

  /**
   * GET /daily-backups/history
   * Obtener historial completo (paginado)
   */
  @Get('history')
  @Audit({
    entity: 'DailyBackup',
    action: AuditAction.VIEW,
    category: AuditCategory.SYSTEM,
    severity: AuditSeverity.INFO,
  })
  @RequireAnyPermission(
    { resource: 'daily_backups', action: 'view', scope: 'all' },
    { resource: 'daily_backups', action: 'view', scope: 'own' }
  )
  getHistory(
    @Query('page', ParseIntPipe) page: number = 1,
    @Query('limit', ParseIntPipe) limit: number = 30,
  ) {
    return this.dailyBackupsService.getHistory(page, limit);
  }

  /**
   * GET /daily-backups/stats
   * Obtener estadísticas de backups
   */
  @Get('stats')
  @Audit({
    entity: 'DailyBackup',
    action: AuditAction.VIEW,
    category: AuditCategory.SYSTEM,
    severity: AuditSeverity.INFO,
  })
  @RequireAnyPermission(
    { resource: 'daily_backups', action: 'view', scope: 'all' },
    { resource: 'daily_backups', action: 'view', scope: 'own' }
  )
  getStats() {
    return this.dailyBackupsService.getStats();
  }
}
