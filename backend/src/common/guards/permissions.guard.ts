import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import {
  PERMISSIONS_KEY,
  REQUIRE_ALL_KEY,
  PermissionConfig,
} from '../decorators/permissions.decorator';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';

/**
 * Permissions Guard
 * Validates that the user has required permissions based on decorators
 * Works together with RbacService to check permissions
 */
@Injectable()
export class PermissionsGuard implements CanActivate {
  private readonly logger = new Logger(PermissionsGuard.name);

  constructor(private reflector: Reflector) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // Check if route is public
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    // Get required permissions from decorator
    const requiredPermissions = this.reflector.getAllAndOverride<
      PermissionConfig[]
    >(PERMISSIONS_KEY, [context.getHandler(), context.getClass()]);

    // No permissions required - allow access
    if (!requiredPermissions || requiredPermissions.length === 0) {
      return true;
    }

    // Check if ALL permissions are required (AND) or ANY (OR)
    const requireAll = this.reflector.getAllAndOverride<boolean>(
      REQUIRE_ALL_KEY,
      [context.getHandler(), context.getClass()],
    );

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new UnauthorizedException('User not authenticated');
    }

    // Get user permissions (should be attached by JWT strategy)
    const userPermissions = user.permissions || [];

    this.logger.debug(
      `Checking permissions for user ${user.id}: ${JSON.stringify(requiredPermissions)}`,
    );
    this.logger.debug(`User has permissions: ${JSON.stringify(userPermissions)}`);

    // Check if user is SuperAdmin (has wildcard permission)
    const isSuperAdmin =
      userPermissions.includes('*:*:*') ||
      userPermissions.includes('*:*');

    if (isSuperAdmin) {
      this.logger.debug('User is SuperAdmin - access granted');
      return true;
    }

    // Check permissions
    const hasPermission = this.checkPermissions(
      userPermissions,
      requiredPermissions,
      requireAll,
    );

    if (!hasPermission) {
      const permissionsStr = requiredPermissions
        .map((p) => `${p.resource}:${p.action}:${p.scope || 'all'}`)
        .join(', ');

      this.logger.warn(
        `User ${user.id} missing permissions: ${permissionsStr}`,
      );

      throw new ForbiddenException(
        `Missing required permissions: ${permissionsStr}`,
      );
    }

    this.logger.debug('Permission check passed');
    return true;
  }

  /**
   * Check if user has required permissions
   */
  private checkPermissions(
    userPermissions: string[],
    requiredPermissions: PermissionConfig[],
    requireAll: boolean = false,
  ): boolean {
    if (requireAll) {
      // ALL permissions required (AND logic)
      return requiredPermissions.every((required) =>
        this.hasPermission(userPermissions, required),
      );
    } else {
      // ANY permission required (OR logic)
      return requiredPermissions.some((required) =>
        this.hasPermission(userPermissions, required),
      );
    }
  }

  /**
   * Check if user has a specific permission
   */
  private hasPermission(
    userPermissions: string[],
    required: PermissionConfig,
  ): boolean {
    const scope = required.scope || 'all';
    const permissionKey = `${required.resource}:${required.action}:${scope}`;

    // Direct match
    if (userPermissions.includes(permissionKey)) {
      return true;
    }

    // Wildcard matches
    const wildcards = [
      '*:*:*', // SuperAdmin
      `${required.resource}:*:*`, // All actions on resource
      `${required.resource}:${required.action}:*`, // Action on all scopes
      `*:${required.action}:*`, // Action on all resources
    ];

    return wildcards.some((wildcard) => userPermissions.includes(wildcard));
  }
}
