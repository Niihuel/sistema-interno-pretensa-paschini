import { SetMetadata } from '@nestjs/common';

/**
 * Permission configuration for route guards
 */
export interface PermissionConfig {
  resource: string;
  action: string;
  scope?: 'own' | 'team' | 'all';
}

export const PERMISSIONS_KEY = 'permissions';
export const REQUIRE_ALL_KEY = 'require_all_permissions';

/**
 * Decorator to require a single permission on a route
 *
 * @example
 * @RequirePermission('users', 'create', 'all')
 * createUser() { }
 */
export const RequirePermission = (
  resource: string,
  action: string,
  scope: 'own' | 'team' | 'all' = 'all',
) => {
  const permission: PermissionConfig = { resource, action, scope };
  return SetMetadata(PERMISSIONS_KEY, [permission]);
};

/**
 * Decorator to require ANY of multiple permissions (OR logic)
 *
 * @example
 * @RequireAnyPermission(
 *   { resource: 'users', action: 'view', scope: 'all' },
 *   { resource: 'users', action: 'view', scope: 'team' }
 * )
 */
export const RequireAnyPermission = (...permissions: PermissionConfig[]) => {
  return SetMetadata(PERMISSIONS_KEY, permissions);
};

/**
 * Decorator to require ALL permissions (AND logic)
 *
 * @example
 * @RequireAllPermissions(
 *   { resource: 'users', action: 'delete', scope: 'all' },
 *   { resource: 'audit', action: 'create', scope: 'all' }
 * )
 */
export const RequireAllPermissions = (...permissions: PermissionConfig[]) => {
  return (target: any, propertyKey: string, descriptor: PropertyDescriptor) => {
    SetMetadata(PERMISSIONS_KEY, permissions)(target, propertyKey, descriptor);
    SetMetadata(REQUIRE_ALL_KEY, true)(target, propertyKey, descriptor);
    return descriptor;
  };
};
