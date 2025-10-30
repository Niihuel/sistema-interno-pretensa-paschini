import { Controller, Get, UseGuards } from '@nestjs/common';
import { SystemService } from './system.service';
import { RequirePermission } from '@/common/decorators';
import { JwtAuthGuard, PermissionsGuard } from '@/common/guards';
import { Audit } from '@/audit/decorators/audit.decorator';
import { AuditAction, AuditCategory, AuditSeverity } from '@/audit/dto';

@Controller('system')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class SystemController {
  constructor(private systemService: SystemService) {}

  @Get('status')
  @Audit({
    entity: 'System',
    action: AuditAction.VIEW,
    category: AuditCategory.SYSTEM,
    severity: AuditSeverity.INFO,
  })
  @RequirePermission('system', 'view', 'all')
  async getStatus() {
    return this.systemService.getSystemStatus();
  }
}
