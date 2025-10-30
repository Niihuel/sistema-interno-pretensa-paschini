import { Injectable, CanActivate, ExecutionContext, Logger, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RbacService } from '../rbac.service';
import { PERMISSIONS_KEY, REQUIRE_ALL_KEY, PermissionConfig } from '@/common/decorators/permissions.decorator';

/**
 * RBAC Guard - Role-Based Access Control
 *
 * This guard enforces permission-based access control on routes.
 * It works in conjunction with the JwtAuthGuard which must run first to populate req.user.
 *
 * Usage:
 * ```typescript
 * @Controller('users')
 * @UseGuards(JwtAuthGuard, RbacGuard)
 * export class UsersController {
 *   @Get()
 *   @RequirePermission('users', 'view', 'all')
 *   findAll() { }
 *
 *   @Post()
 *   @RequireAnyPermission(
 *     { resource: 'users', action: 'create', scope: 'all' },
 *     { resource: 'users', action: 'create', scope: 'team' }
 *   )
 *   create() { }
 * }
 * ```
 *
 * @requires JwtAuthGuard - Must be applied before this guard to populate req.user
 */
@Injectable()
export class RbacGuard implements CanActivate {
  private readonly logger = new Logger(RbacGuard.name);

  constructor(
    private reflector: Reflector,
    private rbacService: RbacService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // Get required permissions from route metadata
    const requiredPermissions = this.reflector.getAllAndOverride<PermissionConfig[]>(
      PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()]
    );

    // If no permissions required, allow access
    if (!requiredPermissions || requiredPermissions.length === 0) {
      this.logger.debug('No permissions required for this route');
      return true;
    }

    // Get user from request (populated by JwtAuthGuard)
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user || !user.id) {
      this.logger.warn('User not found in request. Ensure JwtAuthGuard runs before RbacGuard');
      throw new ForbiddenException('Authentication required');
    }

    // Check if ALL permissions are required (AND logic) or ANY (OR logic)
    const requireAll = this.reflector.getAllAndOverride<boolean>(
      REQUIRE_ALL_KEY,
      [context.getHandler(), context.getClass()]
    );

    const userId = user.id;
    const routeName = `${context.getClass().name}.${context.getHandler().name}`;

    this.logger.debug(
      `Checking permissions for user ${userId} on route ${routeName}: ` +
      `${requiredPermissions.map(p => `${p.resource}:${p.action}`).join(', ')} ` +
      `(${requireAll ? 'ALL' : 'ANY'})`
    );

    try {
      let hasAccess: boolean;

      if (requireAll) {
        // User must have ALL permissions
        hasAccess = await this.rbacService.hasAllPermissions(
          userId,
          requiredPermissions.map(p => ({
            resource: p.resource,
            action: p.action,
            scope: p.scope
          }))
        );
      } else {
        // User must have ANY of the permissions
        hasAccess = await this.rbacService.hasAnyPermission(
          userId,
          requiredPermissions.map(p => ({
            resource: p.resource,
            action: p.action,
            scope: p.scope
          }))
        );
      }

      if (!hasAccess) {
        this.logger.warn(
          `Access denied for user ${userId} on route ${routeName}: ` +
          `missing permissions ${requiredPermissions.map(p => `${p.resource}:${p.action}`).join(', ')}`
        );
        throw new ForbiddenException(
          'Insufficient permissions to access this resource'
        );
      }

      this.logger.debug(`Access granted for user ${userId} on route ${routeName}`);
      return true;
    } catch (error) {
      if (error instanceof ForbiddenException) {
        throw error;
      }

      this.logger.error(
        `Error checking permissions for user ${userId} on route ${routeName}`,
        error.stack
      );
      throw new ForbiddenException('Error validating permissions');
    }
  }
}
