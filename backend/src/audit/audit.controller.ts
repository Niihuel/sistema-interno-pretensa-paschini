import {
  Controller,
  Get,
  Post,
  Param,
  Query,
  ParseIntPipe,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { AuditService } from './audit.service';
import { QueryAuditLogDto } from './dto';
import { JwtAuthGuard, PermissionsGuard } from '@/common/guards';
import { RequirePermission } from '@/common/decorators';

@Controller('audit')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class AuditController {
  constructor(private auditService: AuditService) {}

  /**
   * GET /api/audit
   * Get audit logs with filtering and pagination
   * Requires 'audit:view' permission
   */
  @Get()
  @RequirePermission('audit', 'view', 'all')
  async findAll(@Query() query: QueryAuditLogDto) {
    const result = await this.auditService.findAll(query);
    return {
      success: true,
      data: result.items,
      meta: {
        total: result.total,
        page: result.page,
        limit: result.limit,
        totalPages: result.totalPages,
      },
    };
  }

  /**
   * GET /api/audit/stats
   * Get audit statistics
   * Requires 'audit:view' permission
   */
  @Get('stats')
  @RequirePermission('audit', 'view', 'all')
  async getStats(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const stats = await this.auditService.getStats(
      startDate ? new Date(startDate) : undefined,
      endDate ? new Date(endDate) : undefined,
    );

    return {
      success: true,
      data: stats,
    };
  }

  /**
   * GET /api/audit/:id
   * Get audit log by ID
   * Requires 'audit:view' permission
   */
  @Get(':id')
  @RequirePermission('audit', 'view', 'all')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    const log = await this.auditService.findOne(id);
    return {
      success: true,
      data: log,
    };
  }

  /**
   * GET /api/audit/entity/:entity/:entityId
   * Get audit logs for a specific entity
   * Requires 'audit:view' permission
   */
  @Get('entity/:entity/:entityId')
  @RequirePermission('audit', 'view', 'all')
  async findByEntity(
    @Param('entity') entity: string,
    @Param('entityId', ParseIntPipe) entityId: number,
  ) {
    const logs = await this.auditService.findByEntity(entity, entityId);
    return {
      success: true,
      data: logs,
    };
  }

  /**
   * POST /api/audit/:id/review
   * Mark audit log as reviewed
   * Requires 'audit:review' permission
   */
  @Post(':id/review')
  @RequirePermission('audit', 'review', 'all')
  @HttpCode(HttpStatus.OK)
  async markAsReviewed(
    @Param('id', ParseIntPipe) id: number,
    @Query('reviewedBy') reviewedBy: string,
  ) {
    const log = await this.auditService.markAsReviewed(id, reviewedBy);
    return {
      success: true,
      data: log,
      message: 'Audit log marked as reviewed',
    };
  }

  /**
   * POST /api/audit/cleanup
   * Delete expired audit logs
   * Requires 'audit:delete' permission
   */
  @Post('cleanup')
  @RequirePermission('audit', 'delete', 'all')
  @HttpCode(HttpStatus.OK)
  async cleanup() {
    const count = await this.auditService.deleteExpired();
    return {
      success: true,
      message: `${count} expired audit logs deleted`,
      count,
    };
  }
}
