import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '@/common/prisma.service';
import * as bcrypt from 'bcrypt';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { AccountLockedException } from '@/common/exceptions/account-locked.exception';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  /**
   * Register a new user
   */
  async register(dto: RegisterDto) {
    // Check if username already exists
    const existingUser = await this.prisma.user.findUnique({
      where: { username: dto.username },
    });

    if (existingUser) {
      throw new ConflictException('Username already exists');
    }

    // Check if email already exists (if provided)
    if (dto.email) {
      const existingEmail = await this.prisma.user.findFirst({
        where: { email: dto.email },
      });

      if (existingEmail) {
        throw new ConflictException('Email already exists');
      }
    }

    // Hash password
    const passwordHash = await bcrypt.hash(dto.password, 10);

    // Get User role from Role table
    const userRole = await this.prisma.role.findUnique({
      where: { name: 'User' },
    });

    if (!userRole) {
      throw new Error('Default User role not found. Please run database seed.');
    }

    // Create user with User role
    const user = await this.prisma.user.create({
      data: {
        username: dto.username,
        email: dto.email,
        passwordHash,
        firstName: dto.firstName,
        lastName: dto.lastName,
        isActive: true,
        userRoles: {
          create: {
            roleId: userRole.id,
            isPrimary: true,
            isActive: true,
          },
        },
      },
      select: {
        id: true,
        username: true,
        email: true,
        firstName: true,
        lastName: true,
        createdAt: true,
        userRoles: {
          where: { isActive: true },
          include: {
            role: {
              select: {
                id: true,
                name: true,
                displayName: true,
                level: true,
              },
            },
          },
        },
      },
    });

    this.logger.log(`New user registered: ${user.username} (ID: ${user.id})`);

    return {
      user,
      message: 'User registered successfully',
    };
  }

  /**
   * Login user and return JWT token
   */
  async login(dto: LoginDto) {
    // Find user with roles and permissions
    const user = await this.prisma.user.findUnique({
      where: { username: dto.username },
      include: {
        userRoles: {
          where: { isActive: true },
          include: {
            role: {
              include: {
                rolePermissions: {
                  where: { isActive: true },
                  include: {
                    permission: {
                      select: {
                        name: true,
                        resource: true,
                        action: true,
                        scope: true,
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Check if user is active
    if (!user.isActive) {
      throw new UnauthorizedException('Account is inactive');
    }

    // Check if account is locked
    if (user.lockedUntil && user.lockedUntil > new Date()) {
      throw new AccountLockedException(user.lockedUntil);
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(
      dto.password,
      user.passwordHash,
    );

    if (!isPasswordValid) {
      // Increment failed login attempts
      await this.handleFailedLogin(user.id);
      throw new UnauthorizedException('Invalid credentials');
    }

    // Reset failed login attempts and update last login
    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        failedLoginAttempts: 0,
        lockedUntil: null,
        lastLoginAt: new Date(),
      },
    });

    // Generate JWT with roles and permissions
    const token = this.generateToken(user);

    // Extract permissions from all roles
    const permissions = user.userRoles.flatMap(ur =>
      ur.role.rolePermissions.map(rp => rp.permission.name)
    );

    // Extract role names
    const roles = user.userRoles.map(ur => ({
      id: ur.role.id,
      name: ur.role.name,
      displayName: ur.role.displayName,
      level: ur.role.level,
    }));

    this.logger.log(`User logged in: ${user.username} (ID: ${user.id})`);

    return {
      access_token: token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        roles,
        permissions,
      },
    };
  }

  /**
   * Get current user info
   */
  async getMe(userId: number) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        userRoles: {
          where: { isActive: true },
          include: {
            role: {
              include: {
                rolePermissions: {
                  where: { isActive: true },
                  include: {
                    permission: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    // Extract permissions from all roles (same as login method)
    const permissions = user.userRoles.flatMap(ur =>
      ur.role.rolePermissions.map(rp => rp.permission.name)
    );

    // Extract role info
    const roles = user.userRoles.map(ur => ({
      id: ur.role.id,
      name: ur.role.name,
      displayName: ur.role.displayName,
      level: ur.role.level,
      color: ur.role.color,
    }));

    return {
      id: user.id,
      username: user.username,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      isActive: user.isActive,
      lastLoginAt: user.lastLoginAt,
      createdAt: user.createdAt,
      roles,
      permissions,
    };
  }

  /**
   * Generate JWT token with RBAC information
   */
  private generateToken(user: any): string {
    // Extract roles and permissions for JWT payload
    const roles = user.userRoles?.map((ur: any) => ur.role.name) || [];
    const permissions = user.userRoles?.flatMap((ur: any) =>
      ur.role.rolePermissions.map((rp: any) => rp.permission.name)
    ) || [];

    const payload = {
      sub: user.id,
      username: user.username,
      roles,
      permissions,
    };

    return this.jwtService.sign(payload);
  }

  /**
   * Handle failed login attempt
   */
  private async handleFailedLogin(userId: number) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { failedLoginAttempts: true },
    });

    const attempts = (user?.failedLoginAttempts || 0) + 1;
    const maxAttempts = 5;

    const updateData: any = {
      failedLoginAttempts: attempts,
    };

    // Lock account after max attempts
    if (attempts >= maxAttempts) {
      const lockDuration = 15 * 60 * 1000; // 15 minutes
      updateData.lockedUntil = new Date(Date.now() + lockDuration);

      this.logger.warn(`Account locked due to failed login attempts: User ID ${userId}`);
    }

    await this.prisma.user.update({
      where: { id: userId },
      data: updateData,
    });
  }

  /**
   * Validate user (used by guards)
   */
  async validateUser(userId: number) {
    return this.prisma.user.findUnique({
      where: { id: userId, isActive: true },
    });
  }
}
