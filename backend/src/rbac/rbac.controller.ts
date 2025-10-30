import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  ParseIntPipe,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { RbacService } from './rbac.service';
import {
  CreateRoleDto,
  UpdateRoleDto,
  AssignRoleDto,
  CreatePermissionDto,
} from './dto';
import { JwtAuthGuard, PermissionsGuard } from '@/common/guards';
import { RequirePermission, CurrentUser } from '@/common/decorators';

@Controller('rbac')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class RbacController {
  constructor(private rbacService: RbacService) {}

  // ============================================================================
  // ROLES ENDPOINTS
  // ============================================================================

  /**
   * GET /api/rbac/roles
   * Get role hierarchy
   */
  @Get('roles')
  @RequirePermission('roles', 'view', 'all')
  async getRoles() {
    const roles = await this.rbacService.getRoleHierarchy();

    // Transform roles to include permissions array in expected format
    const transformedRoles = roles.map(role => ({
      ...role,
      permissions: role.rolePermissions
        .filter(rp => rp.isActive)
        .map(rp => `${rp.permission.resource}:${rp.permission.action}:${rp.permission.scope || 'ALL'}`)
    }));

    return {
      success: true,
      data: transformedRoles,
    };
  }

  /**
   * POST /api/rbac/roles
   * Create new role
   */
  @Post('roles')
  @RequirePermission('roles', 'create', 'all')
  async createRole(@Body() dto: CreateRoleDto) {
    const role = await this.rbacService.createRole(dto);

    // Transform role to include permissions array in expected format
    const transformedRole = {
      ...role,
      permissions: role.rolePermissions
        .filter(rp => rp.isActive)
        .map(rp => `${rp.permission.resource}:${rp.permission.action}:${rp.permission.scope || 'ALL'}`)
    };

    return {
      success: true,
      data: transformedRole,
      message: 'Role created successfully',
    };
  }

  /**
   * PUT /api/rbac/roles/:id
   * Update role
   */
  @Put('roles/:id')
  @RequirePermission('roles', 'update', 'all')
  async updateRole(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateRoleDto,
  ) {
    const role = await this.rbacService.updateRole(id, dto);

    // Transform role to include permissions array in expected format
    const transformedRole = {
      ...role,
      permissions: role.rolePermissions
        .filter(rp => rp.isActive)
        .map(rp => `${rp.permission.resource}:${rp.permission.action}:${rp.permission.scope || 'ALL'}`)
    };

    return {
      success: true,
      data: transformedRole,
      message: 'Role updated successfully',
    };
  }

  /**
   * DELETE /api/rbac/roles/:id
   * Delete role (soft delete)
   */
  @Delete('roles/:id')
  @RequirePermission('roles', 'delete', 'all')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteRole(@Param('id', ParseIntPipe) id: number) {
    await this.rbacService.deleteRole(id);
  }

  /**
   * POST /api/rbac/roles/:id/clone
   * Clone existing role
   */
  @Post('roles/:id/clone')
  @RequirePermission('roles', 'create', 'all')
  async cloneRole(
    @Param('id', ParseIntPipe) id: number,
    @Body('newName') newName: string,
  ) {
    const role = await this.rbacService.cloneRole(id, newName);

    // Transform role to include permissions array in expected format
    const transformedRole = {
      ...role,
      permissions: role.rolePermissions
        .filter(rp => rp.isActive)
        .map(rp => `${rp.permission.resource}:${rp.permission.action}:${rp.permission.scope || 'ALL'}`)
    };

    return {
      success: true,
      data: transformedRole,
      message: 'Role cloned successfully',
    };
  }

  // ============================================================================
  // USER ROLES ENDPOINTS
  // ============================================================================

  /**
   * POST /api/rbac/assign
   * Assign role to user
   */
  @Post('assign')
  @RequirePermission('roles', 'assign', 'all')
  async assignRole(@Body() dto: AssignRoleDto, @CurrentUser('id') assignedBy: number) {
    const assignment = await this.rbacService.assignRole(
      dto.userId,
      dto.roleId,
      {
        expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : undefined,
        reason: dto.reason,
        assignedBy: assignedBy.toString(),
        isPrimary: dto.isPrimary,
      },
    );

    return {
      success: true,
      data: assignment,
      message: 'Role assigned successfully',
    };
  }

  /**
   * DELETE /api/rbac/users/:userId/roles/:roleId
   * Remove role from user
   */
  @Delete('users/:userId/roles/:roleId')
  @RequirePermission('roles', 'assign', 'all')
  @HttpCode(HttpStatus.NO_CONTENT)
  async removeRole(
    @Param('userId', ParseIntPipe) userId: number,
    @Param('roleId', ParseIntPipe) roleId: number,
  ) {
    await this.rbacService.removeRole(userId, roleId);
  }

  /**
   * GET /api/rbac/users/:userId/roles
   * Get user's roles
   */
  @Get('users/:userId/roles')
  @RequirePermission('roles', 'view', 'all')
  async getUserRoles(@Param('userId', ParseIntPipe) userId: number) {
    const roles = await this.rbacService.getUserRoles(userId);
    return {
      success: true,
      data: roles,
    };
  }

  /**
   * GET /api/rbac/users/:userId/permissions
   * Get user's effective permissions
   */
  @Get('users/:userId/permissions')
  @RequirePermission('permissions', 'view', 'all')
  async getUserPermissions(@Param('userId', ParseIntPipe) userId: number) {
    const permissions = await this.rbacService.calculateEffectivePermissions(userId);
    return {
      success: true,
      data: permissions,
    };
  }

  // ============================================================================
  // PERMISSIONS ENDPOINTS
  // ============================================================================

  /**
   * GET /api/rbac/permissions
   * Get all permissions grouped by category
   */
  @Get('permissions')
  @RequirePermission('permissions', 'view', 'all')
  async getPermissions() {
    const permissions = await this.rbacService.getPermissionsByCategory();
    return {
      success: true,
      data: permissions,
    };
  }

  /**
   * POST /api/rbac/permissions
   * Create new permission
   */
  @Post('permissions')
  @RequirePermission('permissions', 'create', 'all')
  async createPermission(@Body() dto: CreatePermissionDto) {
    const permission = await this.rbacService.createPermission(dto);
    return {
      success: true,
      data: permission,
      message: 'Permission created successfully',
    };
  }

  /**
   * POST /api/rbac/check-permission
   * Check if user has specific permission
   */
  @Post('check-permission')
  async checkPermission(
    @Body('userId') userId: number,
    @Body('resource') resource: string,
    @Body('action') action: string,
    @Body('scope') scope?: string,
  ) {
    const hasPermission = await this.rbacService.hasPermission(
      userId,
      resource,
      action,
      scope,
    );

    return {
      success: true,
      hasPermission,
    };
  }

  /**
   * GET /api/rbac/users/:userId/can-manage-role/:targetRoleId
   * Check if user can manage a specific role
   */
  @Get('users/:userId/can-manage-role/:targetRoleId')
  async canManageRole(
    @Param('userId', ParseIntPipe) userId: number,
    @Param('targetRoleId', ParseIntPipe) targetRoleId: number,
  ) {
    const canManage = await this.rbacService.canManageRole(userId, targetRoleId);
    return {
      success: true,
      canManage,
    };
  }
}
