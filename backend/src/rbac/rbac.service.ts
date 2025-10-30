/**
 * Discord-like Role Management Service - NestJS Version
 * Provides comprehensive role and permission management with hierarchy support
 */

import { Injectable, Logger, BadRequestException, NotFoundException, ConflictException } from '@nestjs/common'
import { PrismaService } from '@/common/prisma.service'
import type {
  Role,
  Permission,
  UserRole,
  RolePermission,
  UserPermission,
  Prisma
} from '@prisma/client'

// ============================================================================
// INTERFACES AND TYPES
// ============================================================================

interface RoleWithPermissions extends Role {
  rolePermissions: (RolePermission & {
    permission: Permission
  })[]
}

interface UserRoleWithDetails extends UserRole {
  role: RoleWithPermissions
}

interface EffectivePermission {
  resource: string
  action: string
  source: 'role' | 'override' | 'direct'
  granted: boolean
  roleId?: number
  expiresAt?: Date | null
}

interface RoleCreateInput {
  name: string
  displayName: string
  description?: string
  color?: string
  icon?: string
  permissions?: string[]
  level?: number
  parentRoleId?: number
  isDefault?: boolean
}

interface RoleUpdateInput {
  displayName?: string
  description?: string
  color?: string
  icon?: string
  permissions?: string[]
  level?: number
  isActive?: boolean
}

interface PermissionCheck {
  resource: string
  action: string
  scope?: string
}

interface AssignRoleOptions {
  expiresAt?: Date
  reason?: string
  assignedBy?: string
  isPrimary?: boolean
}

interface CreatePermissionInput {
  name: string
  displayName: string
  description?: string
  category: string
  resource: string
  action: string
  scope?: string
  requiresMFA?: boolean
  riskLevel?: string
}

/**
 * RBAC Service - Discord-like Role Management
 *
 * This service provides a complete role-based access control system with:
 * - Hierarchical roles with inheritance
 * - Fine-grained permissions (resource:action)
 * - User role assignments with expiration
 * - Permission calculation with caching
 * - Direct permission overrides
 * - Wildcard permissions support
 *
 * @example
 * ```typescript
 * // Check user permission
 * const canEdit = await rbacService.hasPermission(userId, 'documents', 'edit')
 *
 * // Assign role to user
 * await rbacService.assignRole(userId, roleId, { isPrimary: true })
 *
 * // Create new role
 * const role = await rbacService.createRole({
 *   name: 'moderator',
 *   displayName: 'Moderator',
 *   permissions: ['users:view', 'users:edit']
 * })
 * ```
 */
@Injectable()
export class RbacService {
  private readonly logger = new Logger(RbacService.name)
  private cacheStore: Map<string, { data: any; expires: number }> = new Map()
  private readonly CACHE_DURATION = 5 * 60 * 1000 // 5 minutes

  constructor(private readonly prisma: PrismaService) {
    this.logger.log('RBAC Service initialized')
  }

  // ============================================================================
  // ROLE MANAGEMENT
  // ============================================================================

  /**
   * Create a new role with permissions
   *
   * @param data - Role creation data
   * @param useTransaction - Whether to use a database transaction
   * @returns The created role with its permissions
   * @throws {ConflictException} If role name already exists
   */
  async createRole(data: RoleCreateInput, useTransaction: boolean = true): Promise<RoleWithPermissions> {
    this.logger.debug(`Creating role: ${data.name}`)

    // Check if role name already exists
    const existing = await this.prisma.role.findFirst({
      where: { name: data.name }
    })

    if (existing) {
      throw new ConflictException(`Role with name ${data.name} already exists`)
    }

    // Calculate level if not provided
    const level = data.level ?? await this.getNextLevel()

    // Create role with permissions
    if (useTransaction) {
      return await this.prisma.$transaction(async (tx) => {
        return await this.createRoleInternal(data, level, tx as any)
      })
    } else {
      return await this.createRoleInternal(data, level, this.prisma)
    }
  }

  /**
   * Internal method to create a role within a transaction context
   */
  private async createRoleInternal(
    data: RoleCreateInput,
    level: number,
    prisma: any
  ): Promise<RoleWithPermissions> {
    // Create the role
    const role = await prisma.role.create({
      data: {
        name: data.name,
        displayName: data.displayName,
        description: data.description,
        color: data.color || '#95A5A6',
        icon: data.icon,
        level,
        parentRoleId: data.parentRoleId,
        isActive: true,
        isSystem: false
      }
    })

    this.logger.log(`Role created: ${role.name} (ID: ${role.id}, Level: ${level})`)

    // Add permissions if provided
    if (data.permissions && data.permissions.length > 0) {
      const permissionRecords = await this.preparePermissions(data.permissions, prisma)

      await prisma.rolePermission.createMany({
        data: permissionRecords.map((p: Permission) => ({
          roleId: role.id,
          permissionId: p.id
        }))
      })

      this.logger.debug(`Added ${permissionRecords.length} permissions to role ${role.name}`)
    }

    // Fetch and return complete role
    return await this.getRoleWithPermissions(role.id, prisma)
  }

  /**
   * Update an existing role
   *
   * @param roleId - ID of the role to update
   * @param updates - Fields to update
   * @param useTransaction - Whether to use a database transaction
   * @returns The updated role
   * @throws {NotFoundException} If role not found
   * @throws {BadRequestException} If trying to modify system role
   */
  async updateRole(
    roleId: number,
    updates: RoleUpdateInput,
    useTransaction: boolean = true
  ): Promise<RoleWithPermissions> {
    this.logger.debug(`Updating role ID: ${roleId}`)

    const existingRole = await this.prisma.role.findUnique({
      where: { id: roleId }
    })

    if (!existingRole) {
      throw new NotFoundException('Role not found')
    }

    // Allow modifying permissions of system roles, but not other properties
    if (existingRole.isSystem) {
      const { permissions, ...otherUpdates } = updates
      const hasOtherUpdates = Object.keys(otherUpdates).length > 0

      if (hasOtherUpdates) {
        throw new BadRequestException('Cannot modify system role properties. Only permissions can be updated.')
      }
    }

    if (useTransaction) {
      return await this.prisma.$transaction(async (tx) => {
        return await this.updateRoleInternal(roleId, updates, tx as any)
      })
    } else {
      return await this.updateRoleInternal(roleId, updates, this.prisma)
    }
  }

  /**
   * Internal method to update a role within a transaction context
   */
  private async updateRoleInternal(
    roleId: number,
    updates: RoleUpdateInput,
    prisma: any
  ): Promise<RoleWithPermissions> {
    // Update role data
    const { permissions, ...roleData } = updates

    await prisma.role.update({
      where: { id: roleId },
      data: roleData
    })

    // Update permissions if provided
    if (permissions !== undefined) {
      await this.syncRolePermissions(roleId, permissions, prisma)
      this.logger.debug(`Updated permissions for role ID: ${roleId}`)
    }

    // Clear cache for affected users
    await this.invalidateRoleCache(roleId)

    this.logger.log(`Role updated: ID ${roleId}`)
    return await this.getRoleWithPermissions(roleId, prisma)
  }

  /**
   * Delete a role (hard delete)
   *
   * @param roleId - ID of the role to delete
   * @throws {NotFoundException} If role not found
   * @throws {BadRequestException} If trying to delete system role or role with active users
   */
  async deleteRole(roleId: number): Promise<void> {
    this.logger.debug(`Deleting role ID: ${roleId}`)

    const role = await this.prisma.role.findUnique({
      where: { id: roleId },
      include: { userRoles: true }
    })

    if (!role) {
      throw new NotFoundException('Role not found')
    }

    if (role.isSystem) {
      throw new BadRequestException('Cannot delete system roles')
    }

    if (role.userRoles.length > 0) {
      throw new BadRequestException(`Cannot delete role with ${role.userRoles.length} active users`)
    }

    // Delete associated role permissions first
    await this.prisma.rolePermission.deleteMany({
      where: { roleId }
    })

    // Hard delete the role
    await this.prisma.role.delete({
      where: { id: roleId }
    })

    await this.invalidateRoleCache(roleId)
    this.logger.log(`Role deleted (hard): ${role.name} (ID: ${roleId})`)
  }

  /**
   * Clone an existing role
   *
   * @param sourceRoleId - ID of the role to clone
   * @param newName - Name for the new role
   * @returns The cloned role
   * @throws {NotFoundException} If source role not found
   */
  async cloneRole(sourceRoleId: number, newName: string): Promise<RoleWithPermissions> {
    this.logger.debug(`Cloning role ID: ${sourceRoleId} as ${newName}`)

    const source = await this.getRoleWithPermissions(sourceRoleId)

    if (!source) {
      throw new NotFoundException('Source role not found')
    }

    const permissions = source.rolePermissions
      .filter(rp => rp.isActive)
      .map(rp => `${rp.permission.resource}:${rp.permission.action}`)

    const clonedRole = await this.createRole({
      name: newName,
      displayName: `${source.displayName} (Copy)`,
      description: source.description || undefined,
      color: source.color || undefined,
      icon: source.icon || undefined,
      permissions,
      level: source.level
    })

    this.logger.log(`Role cloned: ${source.name} -> ${newName}`)
    return clonedRole
  }

  // ============================================================================
  // ROLE HIERARCHY
  // ============================================================================

  /**
   * Get role hierarchy for display
   *
   * @returns Array of roles ordered by hierarchy level (descending)
   */
  async getRoleHierarchy(): Promise<RoleWithPermissions[]> {
    const cacheKey = 'role_hierarchy'
    const cached = this.getFromCache(cacheKey)

    if (cached) {
      this.logger.debug('Returning cached role hierarchy')
      return cached
    }

    const roles = await this.prisma.role.findMany({
      where: {
        isActive: true,
        deletedAt: null
      },
      orderBy: { level: 'desc' },
      include: {
        rolePermissions: {
          where: { isActive: true },
          include: { permission: true }
        },
        userRoles: {
          select: { userId: true }
        }
      }
    })

    this.setCache(cacheKey, roles)
    this.logger.debug(`Fetched role hierarchy: ${roles.length} roles`)
    return roles as RoleWithPermissions[]
  }

  /**
   * Reorder roles in hierarchy
   *
   * @param orderedRoleIds - Array of role IDs in desired order
   */
  async reorderRoles(orderedRoleIds: number[]): Promise<void> {
    this.logger.debug(`Reordering ${orderedRoleIds.length} roles`)

    const updates = orderedRoleIds.map((id, index) =>
      this.prisma.role.update({
        where: { id },
        data: { priority: orderedRoleIds.length - index }
      })
    )

    await this.prisma.$transaction(updates)
    this.clearCache()
    this.logger.log('Roles reordered successfully')
  }

  // ============================================================================
  // USER ROLE ASSIGNMENT
  // ============================================================================

  /**
   * Assign a role to a user
   *
   * @param userId - ID of the user
   * @param roleId - ID of the role to assign
   * @param options - Assignment options (expiration, reason, etc.)
   * @returns The created user role assignment
   * @throws {NotFoundException} If role not found or inactive
   * @throws {ConflictException} If user already has this role
   */
  async assignRole(
    userId: number,
    roleId: number,
    options?: AssignRoleOptions
  ): Promise<UserRoleWithDetails> {
    this.logger.debug(`Assigning role ${roleId} to user ${userId}`)

    // Verify role exists and is active
    const role = await this.prisma.role.findFirst({
      where: {
        id: roleId,
        isActive: true,
        deletedAt: null
      }
    })

    if (!role) {
      throw new NotFoundException('Role not found or inactive')
    }

    // Check if assignment already exists
    const existing = await this.prisma.userRole.findFirst({
      where: {
        userId,
        roleId,
        isActive: true
      }
    })

    if (existing) {
      throw new ConflictException('User already has this role')
    }

    // Create assignment
    const assignment = await this.prisma.userRole.create({
      data: {
        userId,
        roleId,
        assignedBy: options?.assignedBy,
        isActive: true,
        isPrimary: options?.isPrimary || false,
        isTemporary: !!options?.expiresAt,
        expiresAt: options?.expiresAt,
        reason: options?.reason
      },
      include: {
        role: {
          include: {
            rolePermissions: {
              where: { isActive: true },
              include: { permission: true }
            }
          }
        }
      }
    })

    // If this is primary, unset other primary roles
    if (options?.isPrimary) {
      await this.prisma.userRole.updateMany({
        where: {
          userId,
          id: { not: assignment.id },
          isPrimary: true
        },
        data: { isPrimary: false }
      })
    }

    await this.invalidateUserCache(userId)
    this.logger.log(`Role ${role.name} assigned to user ${userId}`)
    return assignment as UserRoleWithDetails
  }

  /**
   * Remove a role from a user
   *
   * @param userId - ID of the user
   * @param roleId - ID of the role to remove
   * @throws {NotFoundException} If role assignment not found
   */
  async removeRole(userId: number, roleId: number): Promise<void> {
    this.logger.debug(`Removing role ${roleId} from user ${userId}`)

    const assignment = await this.prisma.userRole.findFirst({
      where: {
        userId,
        roleId,
        isActive: true
      }
    })

    if (!assignment) {
      throw new NotFoundException('Role assignment not found')
    }

    await this.prisma.userRole.update({
      where: { id: assignment.id },
      data: { isActive: false }
    })

    await this.invalidateUserCache(userId)
    this.logger.log(`Role ${roleId} removed from user ${userId}`)
  }

  /**
   * Get all roles for a user
   *
   * @param userId - ID of the user
   * @returns Array of user role assignments with role details
   */
  async getUserRoles(userId: number): Promise<UserRoleWithDetails[]> {
    const cacheKey = `user_roles_${userId}`
    const cached = this.getFromCache(cacheKey)

    if (cached) {
      this.logger.debug(`Returning cached roles for user ${userId}`)
      return cached
    }

    const roles = await this.prisma.userRole.findMany({
      where: {
        userId,
        isActive: true,
        OR: [
          { expiresAt: null },
          { expiresAt: { gte: new Date() } }
        ]
      },
      include: {
        role: {
          include: {
            rolePermissions: {
              where: { isActive: true },
              include: { permission: true }
            }
          }
        }
      },
      orderBy: [
        { isPrimary: 'desc' },
        { role: { level: 'desc' } }
      ]
    })

    this.setCache(cacheKey, roles)
    this.logger.debug(`Fetched ${roles.length} roles for user ${userId}`)
    return roles as UserRoleWithDetails[]
  }

  // ============================================================================
  // PERMISSION CALCULATION
  // ============================================================================

  /**
   * Calculate all effective permissions for a user
   *
   * This method combines:
   * 1. Permissions from all assigned roles (higher level roles override lower)
   * 2. Direct user permissions (overrides and grants)
   *
   * @param userId - ID of the user
   * @returns Array of effective permissions with their sources
   */
  async calculateEffectivePermissions(userId: number): Promise<EffectivePermission[]> {
    const cacheKey = `permissions_${userId}`
    const cached = this.getFromCache(cacheKey)

    if (cached) {
      this.logger.debug(`Returning cached permissions for user ${userId}`)
      return cached
    }

    const permissions: Map<string, EffectivePermission> = new Map()

    // 1. Get permissions from roles
    const userRoles = await this.getUserRoles(userId)

    for (const userRole of userRoles) {
      for (const rp of userRole.role.rolePermissions) {
        const key = `${rp.permission.resource}:${rp.permission.action}`

        // Higher level roles override lower ones
        if (!permissions.has(key) || userRole.role.level > (permissions.get(key)?.roleId || 0)) {
          permissions.set(key, {
            resource: rp.permission.resource,
            action: rp.permission.action,
            source: 'role',
            granted: true,
            roleId: userRole.role.id,
            expiresAt: userRole.expiresAt
          })
        }
      }
    }

    // 2. Apply direct user permissions (overrides)
    const userPermissions = await this.prisma.userPermission.findMany({
      where: {
        userId,
        isActive: true,
        OR: [
          { expiresAt: null },
          { expiresAt: { gte: new Date() } }
        ]
      },
      include: { permission: true }
    })

    for (const up of userPermissions) {
      const key = `${up.permission.resource}:${up.permission.action}`

      permissions.set(key, {
        resource: up.permission.resource,
        action: up.permission.action,
        source: up.isDenied ? 'override' : 'direct',
        granted: !up.isDenied,
        expiresAt: up.expiresAt
      })
    }

    const result = Array.from(permissions.values())
    this.setCache(cacheKey, result)
    this.logger.debug(`Calculated ${result.length} effective permissions for user ${userId}`)
    return result
  }

  /**
   * Check if user has specific permission
   *
   * Supports wildcard permissions:
   * - resource: '*' matches all resources
   * - action: '*' matches all actions
   *
   * @param userId - ID of the user
   * @param resource - Resource identifier (e.g., 'documents', 'users')
   * @param action - Action identifier (e.g., 'view', 'edit', 'delete')
   * @param scope - Permission scope (default: 'ALL')
   * @returns true if user has the permission
   */
  async hasPermission(
    userId: number,
    resource: string,
    action: string,
    scope: string = 'ALL'
  ): Promise<boolean> {
    const permissions = await this.calculateEffectivePermissions(userId)

    // Check for exact match
    const hasExact = permissions.some(p =>
      p.resource === resource &&
      p.action === action &&
      p.granted
    )

    if (hasExact) return true

    // Check for wildcard permissions
    const hasWildcard = permissions.some(p =>
      (p.resource === '*' || p.resource === resource) &&
      (p.action === '*' || p.action === action) &&
      p.granted
    )

    return hasWildcard
  }

  /**
   * Check multiple permissions (AND logic)
   *
   * @param userId - ID of the user
   * @param checks - Array of permission checks
   * @returns true if user has ALL permissions
   */
  async hasAllPermissions(userId: number, checks: PermissionCheck[]): Promise<boolean> {
    for (const check of checks) {
      const has = await this.hasPermission(
        userId,
        check.resource,
        check.action,
        check.scope
      )
      if (!has) return false
    }
    return true
  }

  /**
   * Check multiple permissions (OR logic)
   *
   * @param userId - ID of the user
   * @param checks - Array of permission checks
   * @returns true if user has ANY of the permissions
   */
  async hasAnyPermission(userId: number, checks: PermissionCheck[]): Promise<boolean> {
    for (const check of checks) {
      const has = await this.hasPermission(
        userId,
        check.resource,
        check.action,
        check.scope
      )
      if (has) return true
    }
    return false
  }

  /**
   * Check if user can manage another role
   *
   * Users can only manage roles with a lower hierarchy level
   *
   * @param userId - ID of the user
   * @param targetRoleId - ID of the role to check
   * @returns true if user can manage the target role
   */
  async canManageRole(userId: number, targetRoleId: number): Promise<boolean> {
    const userRoles = await this.getUserRoles(userId)

    if (userRoles.length === 0) return false

    const highestUserLevel = Math.max(...userRoles.map(ur => ur.role.level))

    const targetRole = await this.prisma.role.findUnique({
      where: { id: targetRoleId }
    })

    if (!targetRole) return false

    // Can only manage roles with lower level
    return highestUserLevel > targetRole.level
  }

  // ============================================================================
  // PERMISSION MANAGEMENT
  // ============================================================================

  /**
   * Create a new permission
   *
   * @param data - Permission creation data
   * @returns The created permission
   * @throws {ConflictException} If permission already exists
   */
  async createPermission(data: CreatePermissionInput): Promise<Permission> {
    this.logger.debug(`Creating permission: ${data.resource}:${data.action}`)

    // Check if permission already exists
    const existing = await this.prisma.permission.findFirst({
      where: {
        resource: data.resource,
        action: data.action,
        scope: data.scope || 'ALL'
      }
    })

    if (existing) {
      throw new ConflictException('Permission already exists')
    }

    const permission = await this.prisma.permission.create({
      data: {
        ...data,
        scope: data.scope || 'ALL',
        riskLevel: data.riskLevel || 'LOW',
        requiresMFA: data.requiresMFA || false,
        isActive: true,
        isSystem: false,
        auditRequired: data.riskLevel === 'HIGH' || data.riskLevel === 'CRITICAL'
      }
    })

    this.logger.log(`Permission created: ${permission.resource}:${permission.action}`)
    return permission
  }

  /**
   * Get all available permissions grouped by category
   *
   * @returns Object with categories as keys and permission arrays as values
   */
  async getPermissionsByCategory(): Promise<Record<string, Permission[]>> {
    const permissions = await this.prisma.permission.findMany({
      where: {
        isActive: true
      },
      orderBy: [
        { category: 'asc' },
        { resource: 'asc' },
        { action: 'asc' }
      ]
    })

    const grouped: Record<string, Permission[]> = {}

    for (const permission of permissions) {
      if (!grouped[permission.category]) {
        grouped[permission.category] = []
      }
      grouped[permission.category].push(permission)
    }

    this.logger.debug(`Fetched permissions: ${permissions.length} total, ${Object.keys(grouped).length} categories`)
    return grouped
  }

  // ============================================================================
  // PRIVATE HELPER METHODS
  // ============================================================================

  /**
   * Get a role with its permissions
   */
  private async getRoleWithPermissions(
    roleId: number,
    tx?: any
  ): Promise<RoleWithPermissions> {
    const client = tx || this.prisma

    const role = await client.role.findUnique({
      where: { id: roleId },
      include: {
        rolePermissions: {
          where: { isActive: true },
          include: { permission: true }
        }
      }
    })

    if (!role) {
      throw new NotFoundException('Role not found')
    }

    return role
  }

  /**
   * Prepare permissions from string identifiers
   */
  private async preparePermissions(
    permissions: string[],
    tx?: any
  ): Promise<Permission[]> {
    const client = tx || this.prisma
    const prepared: Permission[] = []

    for (const perm of permissions) {
      const [resource, action] = perm.split(':')

      const permission = await client.permission.findFirst({
        where: {
          resource,
          action,
          isActive: true
        }
      })

      if (permission) {
        prepared.push(permission)
      } else {
        this.logger.warn(`Permission not found: ${perm}`)
      }
    }

    return prepared
  }

  /**
   * Sync role permissions (replace all)
   */
  private async syncRolePermissions(
    roleId: number,
    permissions: string[],
    tx?: any
  ): Promise<void> {
    const client = tx || this.prisma

    // Deactivate existing permissions
    await client.rolePermission.updateMany({
      where: { roleId },
      data: { isActive: false }
    })

    // Add new permissions
    const permissionRecords = await this.preparePermissions(permissions, client)

    for (const permission of permissionRecords) {
      await client.rolePermission.upsert({
        where: {
          roleId_permissionId: {
            roleId,
            permissionId: permission.id
          }
        },
        update: { isActive: true },
        create: {
          roleId,
          permissionId: permission.id,
          isActive: true
        }
      })
    }
  }

  /**
   * Calculate next role level
   */
  private async getNextLevel(): Promise<number> {
    const maxRole = await this.prisma.role.findFirst({
      orderBy: { level: 'desc' }
    })
    return (maxRole?.level || 0) + 10
  }

  // ============================================================================
  // CACHE MANAGEMENT
  // ============================================================================

  /**
   * Get data from cache
   */
  private getFromCache(key: string): any {
    const cached = this.cacheStore.get(key)

    if (!cached) return null
    if (Date.now() > cached.expires) {
      this.cacheStore.delete(key)
      return null
    }

    return cached.data
  }

  /**
   * Set data in cache
   */
  private setCache(key: string, data: any): void {
    this.cacheStore.set(key, {
      data,
      expires: Date.now() + this.CACHE_DURATION
    })
  }

  /**
   * Invalidate cache for a specific user
   */
  private async invalidateUserCache(userId: number): Promise<void> {
    const keys = [
      `user_roles_${userId}`,
      `permissions_${userId}`
    ]

    keys.forEach(key => this.cacheStore.delete(key))
    this.logger.debug(`Invalidated cache for user ${userId}`)
  }

  /**
   * Invalidate cache for a specific role
   */
  private async invalidateRoleCache(roleId: number): Promise<void> {
    // Clear hierarchy cache
    this.cacheStore.delete('role_hierarchy')

    // Clear cache for all users with this role
    const userRoles = await this.prisma.userRole.findMany({
      where: { roleId },
      select: { userId: true }
    })

    for (const ur of userRoles) {
      await this.invalidateUserCache(ur.userId)
    }

    this.logger.debug(`Invalidated cache for role ${roleId}`)
  }

  /**
   * Clear all cache
   */
  private clearCache(): void {
    this.cacheStore.clear()
    this.logger.debug('All cache cleared')
  }
}
