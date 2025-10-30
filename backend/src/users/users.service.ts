import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '@/common/prisma.service';
import { CreateUserDto, UpdateUserDto, UpdatePasswordDto, QueryUserDto } from './dto';
import { User } from './entities/user.entity';
import { Prisma } from '@prisma/client';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  /**
   * Create a new user
   */
  async create(dto: CreateUserDto): Promise<User> {
    // Check if username already exists
    const existing = await this.prisma.user.findUnique({
      where: { username: dto.username },
    });

    if (existing) {
      throw new ConflictException('Username already exists');
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(dto.password, salt);

    // Create user with roles
    const user = await this.prisma.user.create({
      data: {
        username: dto.username,
        email: dto.email,
        passwordHash,
        firstName: dto.firstName,
        lastName: dto.lastName,
        isActive: dto.isActive ?? true,
        userRoles: dto.roleIds && dto.roleIds.length > 0 ? {
          create: dto.roleIds.map((roleId, index) => ({
            roleId,
            isPrimary: index === 0,
            isActive: true,
          })),
        } : undefined,
      },
      include: {
        userRoles: {
          include: {
            role: true,
          },
        },
      },
    });

    // Return user without password
    return this.excludePassword(user);
  }

  /**
   * Find all users with pagination and filtering
   */
  async findAll(query: QueryUserDto): Promise<{
    items: User[];
    total: number;
    page: number;
    limit: number;
  }> {
    const { search, isActive, roleId, page = 1, limit = 50 } = query;

    // Build where clause
    const where: Prisma.UserWhereInput = {};

    if (search) {
      where.OR = [
        { username: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (typeof isActive === 'boolean') {
      where.isActive = isActive;
    }

    if (roleId) {
      where.userRoles = {
        some: {
          roleId: roleId,
          isActive: true,
        },
      };
    }

    // Execute query
    const [items, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          userRoles: {
            where: { isActive: true },
            include: {
              role: true,
            },
          },
        },
      }),
      this.prisma.user.count({ where }),
    ]);

    return {
      items: items.map((user) => this.excludePassword(user)),
      total,
      page,
      limit,
    };
  }

  /**
   * Find one user by ID
   */
  async findOne(id: number): Promise<User> {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: {
        employee: true,
        userRoles: {
          include: {
            role: true,
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    return this.excludePassword(user);
  }

  /**
   * Find user by username
   */
  async findByUsername(username: string): Promise<User | null> {
    const user = await this.prisma.user.findUnique({
      where: { username },
    });

    if (!user) return null;

    return this.excludePassword(user);
  }

  /**
   * Update user
   */
  async update(id: number, dto: UpdateUserDto): Promise<User> {
    // Check if user exists
    const existing = await this.findOne(id);

    // If username is being changed, check it doesn't exist
    if (dto.username && dto.username !== existing.username) {
      const usernameExists = await this.prisma.user.findUnique({
        where: { username: dto.username },
      });

      if (usernameExists) {
        throw new ConflictException('Username already exists');
      }
    }

    // Handle role updates
    if (dto.roleIds !== undefined) {
      // Delete existing roles
      await this.prisma.userRole.deleteMany({
        where: { userId: id },
      });

      // Create new roles
      if (dto.roleIds.length > 0) {
        await this.prisma.userRole.createMany({
          data: dto.roleIds.map((roleId, index) => ({
            userId: id,
            roleId,
            isPrimary: index === 0,
            isActive: true,
          })),
        });
      }
    }

    // Update user
    const user = await this.prisma.user.update({
      where: { id },
      data: {
        username: dto.username,
        email: dto.email,
        firstName: dto.firstName,
        lastName: dto.lastName,
        isActive: dto.isActive,
      },
      include: {
        userRoles: {
          include: {
            role: true,
          },
        },
      },
    });

    return this.excludePassword(user);
  }

  /**
   * Update user password
   */
  async updatePassword(id: number, dto: UpdatePasswordDto): Promise<void> {
    // Check if user exists
    await this.findOne(id);

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(dto.newPassword, salt);

    // Update password
    await this.prisma.user.update({
      where: { id },
      data: {
        passwordHash,
        passwordExpiresAt: null,
        failedLoginAttempts: 0,
        lockedUntil: null,
      },
    });
  }

  /**
   * Reset user password
   * If password is provided, sets it as permanent
   * If not, generates a temporary password that expires in 24 hours
   */
  async resetPasswordTemporary(id: number, password?: string): Promise<{ tempPassword?: string }> {
    // Check if user exists
    await this.findOne(id);

    let passwordToUse: string;
    let isTemporary = false;

    if (password) {
      // Use provided password (permanent)
      passwordToUse = password;
    } else {
      // Generate temporary password
      passwordToUse = this.generateTemporaryPassword();
      isTemporary = true;
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(passwordToUse, salt);

    // Update password
    await this.prisma.user.update({
      where: { id },
      data: {
        passwordHash,
        passwordExpiresAt: isTemporary ? new Date(Date.now() + 24 * 60 * 60 * 1000) : null,
        failedLoginAttempts: 0,
        lockedUntil: null,
      },
    });

    return isTemporary ? { tempPassword: passwordToUse } : {};
  }

  /**
   * Generate a random temporary password
   */
  private generateTemporaryPassword(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%';
    let password = '';
    for (let i = 0; i < 12; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
  }

  /**
   * Delete user (hard delete)
   */
  async remove(id: number): Promise<void> {
    // Check if user exists
    await this.findOne(id);

    // Hard delete
    await this.prisma.user.delete({
      where: { id },
    });
  }

  /**
   * Get all available roles for user assignment
   */
  async getAvailableRoles() {
    return this.prisma.role.findMany({
      where: {
        isActive: true,
        deletedAt: null,
      },
      select: {
        id: true,
        name: true,
        displayName: true,
        description: true,
        color: true,
        icon: true,
        level: true,
      },
      orderBy: {
        level: 'desc',
      },
    });
  }

  /**
   * Get all users who can be assigned as technicians
   * (users with 'technician:assignable:all' permission)
   */
  async getAssignableTechnicians(): Promise<any[]> {
    const users = await this.prisma.user.findMany({
      where: {
        isActive: true,
        deletedAt: null,
        userRoles: {
          some: {
            isActive: true,
            OR: [
              { expiresAt: null },
              { expiresAt: { gt: new Date() } },
            ],
            role: {
              isActive: true,
              rolePermissions: {
                some: {
                  isActive: true,
                  permission: {
                    name: 'technician:assignable:all',
                    isActive: true,
                  },
                },
              },
            },
          },
        },
      },
      select: {
        id: true,
        username: true,
        firstName: true,
        lastName: true,
        email: true,
        userRoles: {
          where: {
            isActive: true,
          },
          include: {
            role: {
              select: {
                id: true,
                name: true,
                displayName: true,
                color: true,
              },
            },
          },
        },
      },
      orderBy: [
        { firstName: 'asc' },
        { lastName: 'asc' },
      ],
    });

    return users;
  }

  /**
   * Get all locked user accounts
   */
  async getLockedAccounts() {
    const now = new Date();

    const lockedUsers = await this.prisma.user.findMany({
      where: {
        OR: [
          // Accounts with active lock
          {
            lockedUntil: {
              gt: now,
            },
          },
          // Accounts with failed login attempts
          {
            failedLoginAttempts: {
              gte: 3,
            },
          },
        ],
      },
      select: {
        id: true,
        username: true,
        email: true,
        firstName: true,
        lastName: true,
        failedLoginAttempts: true,
        lockedUntil: true,
        lastLoginAt: true,
        isActive: true,
        createdAt: true,
        userRoles: {
          where: { isActive: true },
          include: {
            role: {
              select: {
                id: true,
                name: true,
                displayName: true,
                color: true,
              },
            },
          },
        },
      },
      orderBy: [
        { lockedUntil: 'desc' },
        { failedLoginAttempts: 'desc' },
      ],
    });

    return lockedUsers;
  }

  /**
   * Unlock a user account
   */
  async unlockAccount(id: number): Promise<void> {
    // Check if user exists
    await this.findOne(id);

    // Reset failed login attempts and remove lock
    await this.prisma.user.update({
      where: { id },
      data: {
        failedLoginAttempts: 0,
        lockedUntil: null,
      },
    });
  }

  /**
   * Lock a user account manually
   */
  async lockAccount(id: number): Promise<void> {
    // Check if user exists
    await this.findOne(id);

    // Lock account for 24 hours
    const lockDuration = 24 * 60 * 60 * 1000; // 24 hours
    await this.prisma.user.update({
      where: { id },
      data: {
        lockedUntil: new Date(Date.now() + lockDuration),
        failedLoginAttempts: 5,
      },
    });
  }

  /**
   * Exclude password from user object
   */
  private excludePassword(user: any): User {
    const { passwordHash, ...userWithoutPassword } = user;
    return userWithoutPassword as User;
  }
}
