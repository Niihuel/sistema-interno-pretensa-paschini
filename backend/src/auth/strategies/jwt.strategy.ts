import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '@/common/prisma.service';

export interface JwtPayload {
  sub: number;
  username: string;
  roles: string[];
  permissions: string[];
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private configService: ConfigService,
    private prisma: PrismaService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET') || 'default-secret-change-in-production',
    });
  }

  /**
   * Validate JWT payload and attach user + permissions to request
   */
  async validate(payload: JwtPayload) {
    // Find user with their roles and permissions
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      include: {
        userRoles: {
          where: {
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
                  include: {
                    permission: true
                  }
                }
              }
            }
          },
          orderBy: {
            role: {
              level: 'desc'
            }
          }
        },
        userPermissions: {
          where: {
            isActive: true,
            OR: [
              { expiresAt: null },
              { expiresAt: { gte: new Date() } }
            ]
          },
          include: {
            permission: true
          }
        }
      }
    });

    if (!user || !user.isActive) {
      throw new UnauthorizedException('User not found or inactive');
    }

    // Calculate effective permissions
    const permissions = this.calculatePermissions(user);

    // Extract role names from RBAC system
    const roleNames = user.userRoles.map(ur => ur.role.name);

    // Return user object that will be attached to request
    return {
      id: user.id,
      username: user.username,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      permissions,
      roles: roleNames,
      userRoles: user.userRoles.map(ur => ({
        id: ur.role.id,
        name: ur.role.name,
        displayName: ur.role.displayName,
        level: ur.role.level,
      })),
    };
  }

  /**
   * Calculate all effective permissions for the user
   */
  private calculatePermissions(user: any): string[] {
    const permissionsSet = new Set<string>();

    // Add permissions from roles
    for (const userRole of user.userRoles) {
      for (const rolePermission of userRole.role.rolePermissions) {
        const perm = rolePermission.permission;
        const key = `${perm.resource}:${perm.action}:${perm.scope || 'all'}`;
        permissionsSet.add(key);
      }
    }

    // Add direct user permissions (overrides)
    for (const userPermission of user.userPermissions) {
      const perm = userPermission.permission;
      if (userPermission.isDenied) {
        // Remove permission if explicitly denied
        const key = `${perm.resource}:${perm.action}:${perm.scope || 'all'}`;
        permissionsSet.delete(key);
      } else {
        // Add permission
        const key = `${perm.resource}:${perm.action}:${perm.scope || 'all'}`;
        permissionsSet.add(key);
      }
    }

    return Array.from(permissionsSet);
  }
}
