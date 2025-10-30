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
} from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto, UpdateUserDto, UpdatePasswordDto, QueryUserDto } from './dto';
import { JwtAuthGuard, PermissionsGuard } from '@/common/guards';
import { RequirePermission } from '@/common/decorators';
import { Audit } from '@/audit/decorators/audit.decorator';
import { AuditAction, AuditSeverity, AuditCategory } from '@/audit/dto';

@Controller('users')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class UsersController {
  constructor(private usersService: UsersService) {}

  /**
   * POST /api/users
   * Create new user
   */
  @Post()
  @RequirePermission('users', 'create', 'all')
  @Audit({
    entity: 'User',
    action: AuditAction.CREATE,
    category: AuditCategory.USER,
    severity: AuditSeverity.MEDIUM,
    description: 'User created new user account',
  })
  async create(@Body() dto: CreateUserDto) {
    const user = await this.usersService.create(dto);
    return {
      success: true,
      data: user,
      message: 'User created successfully',
    };
  }

  /**
   * GET /api/users
   * Get all users with pagination
   */
  @Get()
  @RequirePermission('users', 'view', 'all')
  async findAll(@Query() query: QueryUserDto) {
    const result = await this.usersService.findAll(query);
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

  /**
   * GET /api/users/assignable-technicians
   * Get all users who can be assigned as technicians
   */
  @Get('assignable-technicians')
  @RequirePermission('tickets', 'view', 'all')
  @Audit({
    entity: 'User',
    action: AuditAction.VIEW,
    category: AuditCategory.USER,
    severity: AuditSeverity.LOW,
    description: 'User retrieved list of assignable technicians',
  })
  async getAssignableTechnicians() {
    const technicians = await this.usersService.getAssignableTechnicians();
    return {
      success: true,
      data: technicians,
    };
  }

  /**
   * GET /api/users/available-roles
   * Get all available roles for user assignment
   */
  @Get('available-roles')
  @RequirePermission('users', 'view', 'all')
  async getAvailableRoles() {
    const roles = await this.usersService.getAvailableRoles();
    return {
      success: true,
      data: roles,
    };
  }

  /**
   * GET /api/users/locked
   * Get all locked/blocked user accounts
   */
  @Get('locked')
  @RequirePermission('users', 'view', 'all')
  async getLockedAccounts() {
    const lockedUsers = await this.usersService.getLockedAccounts();
    return {
      success: true,
      data: lockedUsers,
    };
  }

  /**
   * GET /api/users/:id
   * Get user by ID
   */
  @Get(':id')
  @RequirePermission('users', 'view', 'all')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    const user = await this.usersService.findOne(id);
    return {
      success: true,
      data: user,
    };
  }

  /**
   * PUT /api/users/:id
   * Update user
   */
  @Put(':id')
  @RequirePermission('users', 'update', 'all')
  @Audit({
    entity: 'User',
    action: AuditAction.UPDATE,
    category: AuditCategory.USER,
    severity: AuditSeverity.MEDIUM,
    description: 'User updated user account',
    captureOldValue: true,
  })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateUserDto,
  ) {
    const user = await this.usersService.update(id, dto);
    return {
      success: true,
      data: user,
      message: 'User updated successfully',
    };
  }

  /**
   * PUT /api/users/:id/password
   * Update user password
   */
  @Put(':id/password')
  @RequirePermission('users', 'update', 'all')
  @Audit({
    entity: 'User',
    action: AuditAction.UPDATE,
    category: AuditCategory.SECURITY,
    severity: AuditSeverity.HIGH,
    description: 'User password changed',
    requiresReview: true,
  })
  @HttpCode(HttpStatus.OK)
  async updatePassword(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdatePasswordDto,
  ) {
    await this.usersService.updatePassword(id, dto);
    return {
      success: true,
      message: 'Password updated successfully',
    };
  }

  /**
   * POST /api/users/:id/reset-password
   * Reset user password (admin only)
   * If password provided in body, sets it as permanent
   * Otherwise generates temporary password
   */
  @Post(':id/reset-password')
  @RequirePermission('users', 'update', 'all')
  @Audit({
    entity: 'User',
    action: AuditAction.UPDATE,
    category: AuditCategory.SECURITY,
    severity: AuditSeverity.CRITICAL,
    description: 'Admin reset user password',
    requiresReview: true,
  })
  async resetPasswordTemporary(
    @Param('id', ParseIntPipe) id: number,
    @Body('password') password?: string,
  ) {
    const result = await this.usersService.resetPasswordTemporary(id, password);
    const message = password
      ? 'Password set successfully.'
      : 'Password reset to temporary. User must change it within 24 hours.';

    return {
      success: true,
      data: result,
      message,
    };
  }

  /**
   * POST /api/users/:id/unlock
   * Unlock a locked user account
   */
  @Post(':id/unlock')
  @RequirePermission('users', 'update', 'all')
  @Audit({
    entity: 'User',
    action: AuditAction.UPDATE,
    category: AuditCategory.SECURITY,
    severity: AuditSeverity.MEDIUM,
    description: 'Admin unlocked user account',
    requiresReview: false,
  })
  async unlockAccount(@Param('id', ParseIntPipe) id: number) {
    await this.usersService.unlockAccount(id);
    return {
      success: true,
      message: 'Account unlocked successfully',
    };
  }

  /**
   * POST /api/users/:id/lock
   * Manually lock a user account
   */
  @Post(':id/lock')
  @RequirePermission('users', 'update', 'all')
  @Audit({
    entity: 'User',
    action: AuditAction.UPDATE,
    category: AuditCategory.SECURITY,
    severity: AuditSeverity.HIGH,
    description: 'Admin manually locked user account',
    requiresReview: true,
  })
  async lockAccount(@Param('id', ParseIntPipe) id: number) {
    await this.usersService.lockAccount(id);
    return {
      success: true,
      message: 'Account locked successfully',
    };
  }

  /**
   * DELETE /api/users/:id
   * Delete user (hard delete - permanent)
   */
  @Delete(':id')
  @RequirePermission('users', 'delete', 'all')
  @Audit({
    entity: 'User',
    action: AuditAction.DELETE,
    category: AuditCategory.USER,
    severity: AuditSeverity.HIGH,
    description: 'User permanently deleted user account',
    requiresReview: true,
    captureOldValue: true,
  })
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id', ParseIntPipe) id: number) {
    await this.usersService.remove(id);
  }
}
