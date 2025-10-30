import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '@/common/prisma.service';
import { CreateThemeDto, UpdateThemeDto, QueryThemeDto, ImportThemeDto } from './dto';
import { THEME_PRESETS } from './data/presets';

@Injectable()
export class ThemesService {
  constructor(private prisma: PrismaService) {}

  /**
   * Get theme with computed inheritance
   */
  async getTheme(userId: number, query: QueryThemeDto) {
    const { scope, scopeId, mode = 'DARK' } = query;

    // Find the theme for the requested scope
    const theme = await this.prisma.theme.findFirst({
      where: {
        userId,
        scope: scope || 'GLOBAL',
        scopeId: scopeId || null,
        mode,
      },
    });

    // If no theme found, return null (will use default)
    if (!theme) {
      return null;
    }

    // Compute theme with inheritance
    const computed = await this.computeThemeWithInheritance(theme, userId, mode);

    return {
      theme,
      computed,
    };
  }

  /**
   * Create or update theme
   */
  async upsertTheme(userId: number, dto: CreateThemeDto) {
    const { scope, scopeId, mode = 'DARK', name, variables, parentId } = dto;

    // Validate scope-specific rules
    if (scope === 'GLOBAL' && scopeId) {
      throw new BadRequestException('Global themes cannot have a scopeId');
    }

    if ((scope === 'DASHBOARD' || scope === 'WIDGET') && !scopeId) {
      throw new BadRequestException(`${scope} themes must have a scopeId`);
    }

    // Validate parent theme if provided
    if (parentId) {
      const parent = await this.prisma.theme.findUnique({
        where: { id: parentId },
      });

      if (!parent) {
        throw new NotFoundException(`Parent theme with ID ${parentId} not found`);
      }

      if (parent.userId !== userId) {
        throw new ForbiddenException('Cannot use another user\'s theme as parent');
      }
    }

    // Validate variables structure
    this.validateThemeVariables(variables);

    // Check if theme exists
    const existingTheme = await this.prisma.theme.findFirst({
      where: {
        userId,
        scope,
        scopeId: scopeId || null,
        mode,
      },
    });

    let theme;
    if (existingTheme) {
      // Update existing theme
      theme = await this.prisma.theme.update({
        where: { id: existingTheme.id },
        data: {
          name,
          variables,
          parentId,
        },
      });
    } else {
      // Create new theme
      theme = await this.prisma.theme.create({
        data: {
          userId,
          name,
          scope,
          scopeId: scopeId || null,
          mode,
          variables,
          parentId,
        },
      });
    }

    // Return with computed values
    const computed = await this.computeThemeWithInheritance(theme, userId, mode);

    return {
      success: true,
      data: {
        theme,
        computed,
      },
    };
  }

  /**
   * Delete theme
   */
  async deleteTheme(userId: number, themeId: string) {
    const theme = await this.prisma.theme.findUnique({
      where: { id: themeId },
    });

    if (!theme) {
      throw new NotFoundException(`Theme with ID ${themeId} not found`);
    }

    if (theme.userId !== userId) {
      throw new ForbiddenException('You can only delete your own themes');
    }

    // Check if any themes depend on this as parent
    const children = await this.prisma.theme.count({
      where: { parentId: themeId },
    });

    if (children > 0) {
      throw new BadRequestException(
        `Cannot delete theme that is used as parent by ${children} other theme(s)`
      );
    }

    await this.prisma.theme.delete({
      where: { id: themeId },
    });

    return {
      success: true,
      message: 'Theme deleted successfully',
    };
  }

  /**
   * Get all presets
   */
  async getPresets() {
    return {
      success: true,
      data: THEME_PRESETS,
    };
  }

  /**
   * Import theme from JSON
   */
  async importTheme(userId: number, dto: ImportThemeDto) {
    const { json, scope, scopeId, mode = 'DARK' } = dto;

    let themeData: any;
    try {
      themeData = JSON.parse(json);
    } catch (error) {
      throw new BadRequestException('Invalid JSON format');
    }

    // Validate imported theme structure
    if (!themeData.name || !themeData.variables) {
      throw new BadRequestException('Theme JSON must contain "name" and "variables" fields');
    }

    this.validateThemeVariables(themeData.variables);

    // Create theme from imported data
    const createDto: CreateThemeDto = {
      name: themeData.name,
      scope,
      scopeId,
      mode,
      variables: themeData.variables,
    };

    return this.upsertTheme(userId, createDto);
  }

  /**
   * Export theme as JSON
   */
  async exportTheme(userId: number, themeId: string) {
    const theme = await this.prisma.theme.findUnique({
      where: { id: themeId },
    });

    if (!theme) {
      throw new NotFoundException(`Theme with ID ${themeId} not found`);
    }

    if (theme.userId !== userId) {
      throw new ForbiddenException('You can only export your own themes');
    }

    const exportData = {
      name: theme.name,
      scope: theme.scope,
      mode: theme.mode,
      variables: theme.variables,
      exportedAt: new Date().toISOString(),
    };

    return {
      success: true,
      data: {
        json: JSON.stringify(exportData, null, 2),
      },
    };
  }

  /**
   * Compute theme with inheritance chain
   * Priority: widget > dashboard > global
   */
  private async computeThemeWithInheritance(
    theme: any,
    userId: number,
    mode: 'LIGHT' | 'DARK'
  ): Promise<any> {
    const variables = { ...theme.variables };

    // If this is a widget or dashboard theme, inherit from parent scopes
    if (theme.scope === 'WIDGET' && theme.scopeId) {
      // Try to get dashboard theme for the same dashboard
      const dashboardId = this.extractDashboardIdFromWidgetScope(theme.scopeId);
      if (dashboardId) {
        const dashboardTheme = await this.prisma.theme.findUnique({
          where: {
            userId_scope_scopeId_mode: {
              userId,
              scope: 'DASHBOARD',
              scopeId: dashboardId,
              mode,
            },
          },
        });

        if (dashboardTheme) {
          // Merge dashboard variables (widget overrides dashboard)
          Object.keys(dashboardTheme.variables as any).forEach((key) => {
            if (!variables[key]) {
              variables[key] = (dashboardTheme.variables as any)[key];
            }
          });
        }
      }
    }

    if (theme.scope === 'WIDGET' || theme.scope === 'DASHBOARD') {
      // Inherit from global theme
      const globalTheme = await this.prisma.theme.findFirst({
        where: {
          userId,
          scope: 'GLOBAL',
          scopeId: null,
          mode,
        },
      });

      if (globalTheme) {
        // Merge global variables (specific scope overrides global)
        Object.keys(globalTheme.variables as any).forEach((key) => {
          if (!variables[key]) {
            variables[key] = (globalTheme.variables as any)[key];
          }
        });
      }
    }

    return {
      ...theme,
      variables,
    };
  }

  /**
   * Extract dashboard ID from widget scopeId
   * Assumes format like "dashboard-{id}-widget-{id}"
   */
  private extractDashboardIdFromWidgetScope(scopeId: string): string | null {
    const match = scopeId.match(/dashboard-([^-]+)/);
    return match ? match[1] : null;
  }

  /**
   * Validate theme variables structure
   */
  private validateThemeVariables(variables: any): void {
    if (typeof variables !== 'object' || variables === null) {
      throw new BadRequestException('Variables must be an object');
    }

    // Validate each variable has proper structure
    for (const [key, value] of Object.entries(variables)) {
      if (typeof value !== 'object' || value === null) {
        throw new BadRequestException(`Variable "${key}" must be an object`);
      }

      const varValue = value as any;

      // Check for required color properties
      if (!varValue.hex && !varValue.rgb && !varValue.hsl) {
        throw new BadRequestException(
          `Variable "${key}" must have at least one color format (hex, rgb, or hsl)`
        );
      }

      // Validate hex format if present
      if (varValue.hex && !/^#[0-9A-Fa-f]{6}$/.test(varValue.hex)) {
        throw new BadRequestException(
          `Variable "${key}" has invalid hex format. Expected #RRGGBB`
        );
      }

      // Validate RGB if present
      if (varValue.rgb) {
        const { r, g, b } = varValue.rgb;
        if (
          typeof r !== 'number' || r < 0 || r > 255 ||
          typeof g !== 'number' || g < 0 || g > 255 ||
          typeof b !== 'number' || b < 0 || b > 255
        ) {
          throw new BadRequestException(
            `Variable "${key}" has invalid RGB values. Expected r, g, b between 0-255`
          );
        }
      }

      // Validate HSL if present
      if (varValue.hsl) {
        const { h, s, l } = varValue.hsl;
        if (
          typeof h !== 'number' || h < 0 || h > 360 ||
          typeof s !== 'number' || s < 0 || s > 100 ||
          typeof l !== 'number' || l < 0 || l > 100
        ) {
          throw new BadRequestException(
            `Variable "${key}" has invalid HSL values. Expected h (0-360), s (0-100), l (0-100)`
          );
        }
      }

      // Validate alpha if present
      if (varValue.alpha !== undefined) {
        if (typeof varValue.alpha !== 'number' || varValue.alpha < 0 || varValue.alpha > 1) {
          throw new BadRequestException(
            `Variable "${key}" has invalid alpha value. Expected 0-1`
          );
        }
      }
    }
  }
}
