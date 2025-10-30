import { Controller, Get, UseGuards } from '@nestjs/common';
import { AdminService } from './admin.service';
import { JwtAuthGuard, PermissionsGuard } from '@/common/guards';
import { RequirePermission } from '@/common/decorators';
import { Audit } from '@/audit/decorators/audit.decorator';
import { AuditAction, AuditCategory, AuditSeverity } from '@/audit/dto';

@Controller('admin')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class AdminController {
  constructor(private adminService: AdminService) {}

  /**
   * GET /api/admin/stats
   * Get system-wide statistics
   */
  @Get('stats')
  @Audit({
    entity: 'Admin',
    action: AuditAction.VIEW,
    category: AuditCategory.SYSTEM,
    severity: AuditSeverity.INFO,
  })
  @RequirePermission('users', 'view', 'all')
  async getStats() {
    const stats = await this.adminService.getStats();
    return {
      success: true,
      data: stats,
    };
  }
}
