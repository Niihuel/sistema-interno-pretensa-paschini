import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import { ThemesService } from './themes.service';
import { JwtAuthGuard, PermissionsGuard } from '@/common/guards';
import { RequirePermission } from '@/common/decorators';
import { Audit } from '@/audit/decorators/audit.decorator';
import { AuditAction, AuditCategory, AuditSeverity } from '@/audit/dto';
import { CreateThemeDto, UpdateThemeDto, QueryThemeDto, ImportThemeDto } from './dto';

@Controller('themes')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class ThemesController {
  constructor(private readonly themesService: ThemesService) {}

  /**
   * GET /api/themes
   * Get theme for specific scope with computed inheritance
   */
  @Get()
  @Audit({
    entity: 'Theme',
    action: AuditAction.VIEW,
    category: AuditCategory.DATA,
    severity: AuditSeverity.INFO,
  })
  @RequirePermission('dashboard', 'view')
  async getTheme(@Request() req, @Query() query: QueryThemeDto) {
    const userId = req.user.userId;
    const result = await this.themesService.getTheme(userId, query);

    if (!result) {
      return {
        success: true,
        data: null,
        message: 'No theme found for this scope, using default',
      };
    }

    return {
      success: true,
      data: result,
    };
  }

  /**
   * POST /api/themes
   * Create or update theme
   */
  @Post()
  @Audit({
    entity: 'Theme',
    action: AuditAction.CREATE,
    category: AuditCategory.DATA,
    severity: AuditSeverity.MEDIUM,
  })
  @RequirePermission('dashboard', 'edit')
  async upsertTheme(@Request() req, @Body() dto: CreateThemeDto) {
    const userId = req.user.userId;
    return this.themesService.upsertTheme(userId, dto);
  }

  /**
   * DELETE /api/themes/:id
   * Delete theme
   */
  @Delete(':id')
  @Audit({
    entity: 'Theme',
    action: AuditAction.DELETE,
    category: AuditCategory.DATA,
    severity: AuditSeverity.HIGH,
  })
  @RequirePermission('dashboard', 'delete')
  async deleteTheme(@Request() req, @Param('id') themeId: string) {
    const userId = req.user.userId;
    return this.themesService.deleteTheme(userId, themeId);
  }

  /**
   * GET /api/themes/presets
   * Get all available theme presets
   */
  @Get('presets')
  @Audit({
    entity: 'Theme',
    action: AuditAction.VIEW,
    category: AuditCategory.DATA,
    severity: AuditSeverity.INFO,
  })
  @RequirePermission('dashboard', 'view')
  async getPresets() {
    return this.themesService.getPresets();
  }

  /**
   * POST /api/themes/import
   * Import theme from JSON
   */
  @Post('import')
  @Audit({
    entity: 'Theme',
    action: AuditAction.CREATE,
    category: AuditCategory.DATA,
    severity: AuditSeverity.MEDIUM,
  })
  @RequirePermission('dashboard', 'edit')
  async importTheme(@Request() req, @Body() dto: ImportThemeDto) {
    const userId = req.user.userId;
    return this.themesService.importTheme(userId, dto);
  }

  /**
   * GET /api/themes/:id/export
   * Export theme as JSON
   */
  @Get(':id/export')
  @Audit({
    entity: 'Theme',
    action: AuditAction.VIEW,
    category: AuditCategory.DATA,
    severity: AuditSeverity.INFO,
  })
  @RequirePermission('dashboard', 'view')
  async exportTheme(@Request() req, @Param('id') themeId: string) {
    const userId = req.user.userId;
    return this.themesService.exportTheme(userId, themeId);
  }
}
