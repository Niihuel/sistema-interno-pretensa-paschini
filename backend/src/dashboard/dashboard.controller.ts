import { Controller, Get, Post, Delete, Body, Param, Request, UseGuards } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { JwtAuthGuard, PermissionsGuard } from '@/common/guards';
import { RequirePermission } from '@/common/decorators';
import { Audit } from '@/audit/decorators/audit.decorator';
import { AuditAction, AuditCategory, AuditSeverity } from '@/audit/dto';

@Controller('dashboard')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('summary')
  @Audit({
    entity: 'Dashboard',
    action: AuditAction.VIEW,
    category: AuditCategory.DATA,
    severity: AuditSeverity.INFO,
  })
  @RequirePermission('dashboard', 'view')
  async getSummary() {
    return this.dashboardService.getSummary();
  }

  @Get('widget-config-metadata')
  @RequirePermission('dashboard', 'view')
  async getWidgetConfigMetadata() {
    return this.dashboardService.getWidgetConfigMetadata();
  }

  @Get('tickets-stats')
  @Audit({
    entity: 'Dashboard',
    action: AuditAction.VIEW,
    category: AuditCategory.DATA,
    severity: AuditSeverity.INFO,
  })
  @RequirePermission('dashboard', 'view')
  async getTicketsStats() {
    const stats = await this.dashboardService.getTicketsStats();
    return stats; // Devolver directamente para que los widgets puedan acceder a las propiedades
  }

  @Get('equipment-stats')
  @Audit({
    entity: 'Dashboard',
    action: AuditAction.VIEW,
    category: AuditCategory.DATA,
    severity: AuditSeverity.INFO,
  })
  @RequirePermission('dashboard', 'view')
  async getEquipmentStats() {
    const stats = await this.dashboardService.getEquipmentStats();
    return stats;
  }

  @Get('printers-stats')
  @Audit({
    entity: 'Dashboard',
    action: AuditAction.VIEW,
    category: AuditCategory.DATA,
    severity: AuditSeverity.INFO,
  })
  @RequirePermission('dashboard', 'view')
  async getPrintersStats() {
    const stats = await this.dashboardService.getPrintersStats();
    return stats;
  }

  @Get('inventory-stats')
  @Audit({
    entity: 'Dashboard',
    action: AuditAction.VIEW,
    category: AuditCategory.DATA,
    severity: AuditSeverity.INFO,
  })
  @RequirePermission('dashboard', 'view')
  async getInventoryStats() {
    const stats = await this.dashboardService.getInventoryStats();
    return stats;
  }

  @Get('employees-stats')
  @Audit({
    entity: 'Dashboard',
    action: AuditAction.VIEW,
    category: AuditCategory.DATA,
    severity: AuditSeverity.INFO,
  })
  @RequirePermission('dashboard', 'view')
  async getEmployeesStats() {
    const stats = await this.dashboardService.getEmployeesStats();
    return stats;
  }

  @Get('consumables-stats')
  @Audit({
    entity: 'Dashboard',
    action: AuditAction.VIEW,
    category: AuditCategory.DATA,
    severity: AuditSeverity.INFO,
  })
  @RequirePermission('dashboard', 'view')
  async getConsumablesStats() {
    const stats = await this.dashboardService.getConsumablesStats();
    return stats;
  }

  @Get('my-layout')
  @Audit({
    entity: 'Dashboard',
    action: AuditAction.VIEW,
    category: AuditCategory.DATA,
    severity: AuditSeverity.INFO,
  })
  @RequirePermission('dashboard', 'view')
  async getMyLayout(@Request() req) {
    const userId = req.user.id;
    const layout = await this.dashboardService.getMyLayout(userId);
    return {
      success: true,
      data: layout
    };
  }

  @Post('save-layout')
  @Audit({
    entity: 'Dashboard',
    action: AuditAction.UPDATE,
    category: AuditCategory.DATA,
    severity: AuditSeverity.MEDIUM,
  })
  @RequirePermission('dashboard', 'view')
  async saveLegacyLayout(@Request() req, @Body() body: { layouts: any; widgets: any; settings?: any }) {
    const userId = req.user.id;
    await this.dashboardService.saveLayout(userId, body);
    return {
      success: true,
      message: 'Layout guardado exitosamente'
    };
  }

  @Get('recent-activity')
  @Audit({
    entity: 'Dashboard',
    action: AuditAction.VIEW,
    category: AuditCategory.DATA,
    severity: AuditSeverity.INFO,
  })
  @RequirePermission('dashboard', 'view')
  async getRecentActivity(@Request() req) {
    const userId = req.user.id;
    const activities = await this.dashboardService.getRecentActivity(userId);
    return {
      success: true,
      data: activities
    };
  }

  @Get('purchase-requests-stats')
  @Audit({
    entity: 'Dashboard',
    action: AuditAction.VIEW,
    category: AuditCategory.DATA,
    severity: AuditSeverity.INFO,
  })
  @RequirePermission('dashboard', 'view')
  async getPurchaseRequestsStats() {
    const stats = await this.dashboardService.getPurchaseRequestsStats();
    return stats;
  }

  @Get('daily-backups-stats')
  @Audit({
    entity: 'Dashboard',
    action: AuditAction.VIEW,
    category: AuditCategory.DATA,
    severity: AuditSeverity.INFO,
  })
  @RequirePermission('dashboard', 'view')
  async getDailyBackupsStats() {
    const stats = await this.dashboardService.getDailyBackupsStats();
    return stats;
  }

  // ============================================================================
  // DASHBOARD LAYOUTS ENDPOINTS
  // ============================================================================

  @Get('layouts')
  @Audit({
    entity: 'DashboardLayout',
    action: AuditAction.VIEW,
    category: AuditCategory.DATA,
    severity: AuditSeverity.INFO,
  })
  @RequirePermission('dashboard', 'view')
  async getUserLayouts(@Request() req) {
    const layouts = await this.dashboardService.getUserDashboardLayouts(req.user.userId);
    return {
      success: true,
      data: layouts,
    };
  }

  @Get('layouts/:layoutId')
  @Audit({
    entity: 'DashboardLayout',
    action: AuditAction.VIEW,
    category: AuditCategory.DATA,
    severity: AuditSeverity.INFO,
  })
  @RequirePermission('dashboard', 'view')
  async getLayout(@Request() req, @Param('layoutId') layoutId: string) {
    const layout = await this.dashboardService.getDashboardLayout(req.user.userId, layoutId);

    if (!layout) {
      return {
        success: false,
        error: 'Layout not found',
      };
    }

    return {
      success: true,
      data: layout,
    };
  }

  @Post('layouts')
  @Audit({
    entity: 'DashboardLayout',
    action: AuditAction.CREATE,
    category: AuditCategory.DATA,
    severity: AuditSeverity.MEDIUM,
  })
  @RequirePermission('dashboard', 'edit')
  async saveLayout(@Request() req, @Body() layoutData: {
    layoutId: string;
    name: string;
    description?: string;
    widgets: any[];
    theme?: string;
    isDefault?: boolean;
    isPublic?: boolean;
  }) {
    return this.dashboardService.saveDashboardLayout(req.user.userId, layoutData);
  }

  @Delete('layouts/:layoutId')
  @Audit({
    entity: 'DashboardLayout',
    action: AuditAction.DELETE,
    category: AuditCategory.DATA,
    severity: AuditSeverity.HIGH,
  })
  @RequirePermission('dashboard', 'delete')
  async deleteLayout(@Request() req, @Param('layoutId') layoutId: string) {
    return this.dashboardService.deleteDashboardLayout(req.user.userId, layoutId);
  }
}
