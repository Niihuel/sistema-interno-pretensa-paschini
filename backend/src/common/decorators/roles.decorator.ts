import { SetMetadata } from '@nestjs/common';

export const ROLES_KEY = 'roles';

/**
 * Decorator to require specific roles (simple role-based access)
 * Use this for simple cases. For complex permissions, use @RequirePermission
 *
 * @example
 * @Roles('Admin', 'SuperAdmin')
 * adminOnly() { }
 */
export const Roles = (...roles: string[]) => SetMetadata(ROLES_KEY, roles);
