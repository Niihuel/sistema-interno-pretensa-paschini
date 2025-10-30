import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '@/common/prisma.service';
import { CreateEmployeeDto, UpdateEmployeeDto, QueryEmployeeDto, CreateWindowsAccountDto, UpdateWindowsAccountDto, CreateQnapAccountDto, UpdateQnapAccountDto, CreateCalipsoAccountDto, UpdateCalipsoAccountDto, CreateEmailAccountDto, UpdateEmailAccountDto } from './dto';
import { Employee } from './entities/employee.entity';
import { Prisma } from '@prisma/client';

@Injectable()
export class EmployeesService {
  constructor(private prisma: PrismaService) {}

  private async ensureEmployeeExists(employeeId: number) {
    const exists = await this.prisma.employee.findFirst({
      where: { id: employeeId },
      select: { id: true },
    });

    if (!exists) {
      throw new NotFoundException(`Employee with ID ${employeeId} not found`);
    }
  }

  private getWindowsAccountSelect(includePassword: boolean): Prisma.WindowsAccountSelect {
    return {
      id: true,
      employeeId: true,
      username: true,
      domain: true,
      password: includePassword,
      profilePath: true,
      homeDirectory: true,
      groups: true,
      isActive: true,
      lastLogin: true,
      notes: true,
      createdAt: true,
      updatedAt: true,
    };
  }

  private getQnapAccountSelect(includePassword: boolean): Prisma.QnapAccountSelect {
    return {
      id: true,
      employeeId: true,
      username: true,
      password: includePassword,
      userGroup: true,
      folderPermissions: true,
      quotaLimit: true,
      isActive: true,
      lastAccess: true,
      notes: true,
      createdAt: true,
      updatedAt: true,
    };
  }

  private getCalipsoAccountSelect(includePassword: boolean): Prisma.CalipsoAccountSelect {
    return {
      id: true,
      employeeId: true,
      username: true,
      password: includePassword,
      profile: true,
      permissions: true,
      modules: true,
      isActive: true,
      lastLogin: true,
      notes: true,
      createdAt: true,
      updatedAt: true,
    };
  }

  private getEmailAccountSelect(includePassword: boolean): Prisma.EmailAccountSelect {
    return {
      id: true,
      employeeId: true,
      email: true,
      password: includePassword,
      accountType: true,
      forwardingTo: true,
      aliases: true,
      isActive: true,
      lastSync: true,
      notes: true,
      createdAt: true,
      updatedAt: true,
    };
  }

  async create(dto: CreateEmployeeDto): Promise<Employee> {
    // Check if email already exists
    if (dto.email) {
      const existing = await this.prisma.employee.findUnique({
        where: { email: dto.email },
      });

      if (existing) {
        throw new ConflictException('Email already exists');
      }
    }

    return this.prisma.employee.create({
      data: {
        firstName: dto.firstName,
        lastName: dto.lastName,
        area: dto.area,
        email: dto.email,
        phone: dto.phone,
        position: dto.position,
        status: dto.status || 'ACTIVE',
      },
    });
  }

  async findAll(query: QueryEmployeeDto): Promise<{
    items: Employee[];
    total: number;
    page: number;
    limit: number;
  }> {
    const { search, area, status, page = 1, limit = 50 } = query;

    const where: Prisma.EmployeeWhereInput = {};

    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (area) where.area = area;
    if (status) where.status = status;

    const [items, total] = await Promise.all([
      this.prisma.employee.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.employee.count({ where }),
    ]);

    return { items, total, page, limit };
  }

  async findOne(id: number): Promise<Employee> {
    const employee = await this.prisma.employee.findUnique({
      where: { id },
      include: {
        users: true,
        equipmentAssigned: true,
        inventoryAssigned: true,
      },
    });

    if (!employee) {
      throw new NotFoundException(`Employee with ID ${id} not found`);
    }

    return employee;
  }

  async createWindowsAccount(employeeId: number, dto: CreateWindowsAccountDto, includePassword = false) {
    await this.ensureEmployeeExists(employeeId);

    return this.prisma.windowsAccount.create({
      data: {
        employeeId,
        username: dto.username,
        domain: dto.domain ?? 'PRETENSA',
        password: dto.password,
        profilePath: dto.profilePath,
        homeDirectory: dto.homeDirectory,
        groups: dto.groups,
        isActive: dto.isActive ?? true,
        lastLogin: dto.lastLogin ? new Date(dto.lastLogin) : undefined,
        notes: dto.notes,
      },
      select: this.getWindowsAccountSelect(includePassword),
    });
  }

  async updateWindowsAccount(employeeId: number, accountId: number, dto: UpdateWindowsAccountDto, includePassword = false) {
    await this.ensureEmployeeExists(employeeId);

    const account = await this.prisma.windowsAccount.findFirst({
      where: { id: accountId, employeeId },
    });

    if (!account) {
      throw new NotFoundException('Windows account not found for this employee');
    }

    const data: Prisma.WindowsAccountUpdateInput = {};

    if (dto.username !== undefined) data.username = dto.username;
    if (dto.domain !== undefined) data.domain = dto.domain;
    if (dto.password !== undefined) data.password = dto.password;
    if (dto.profilePath !== undefined) data.profilePath = dto.profilePath;
    if (dto.homeDirectory !== undefined) data.homeDirectory = dto.homeDirectory;
    if (dto.groups !== undefined) data.groups = dto.groups;
    if (dto.isActive !== undefined) data.isActive = dto.isActive;
    if (dto.lastLogin !== undefined) data.lastLogin = dto.lastLogin ? new Date(dto.lastLogin) : null;
    if (dto.notes !== undefined) data.notes = dto.notes;

    return this.prisma.windowsAccount.update({
      where: { id: accountId },
      data,
      select: this.getWindowsAccountSelect(includePassword),
    });
  }

  async deleteWindowsAccount(employeeId: number, accountId: number): Promise<void> {
    await this.ensureEmployeeExists(employeeId);

    const account = await this.prisma.windowsAccount.findFirst({
      where: { id: accountId, employeeId },
    });

    if (!account) {
      throw new NotFoundException('Windows account not found for this employee');
    }

    await this.prisma.windowsAccount.delete({ where: { id: accountId } });
  }

  async createQnapAccount(employeeId: number, dto: CreateQnapAccountDto, includePassword = false) {
    await this.ensureEmployeeExists(employeeId);

    return this.prisma.qnapAccount.create({
      data: {
        employeeId,
        username: dto.username,
        password: dto.password,
        userGroup: dto.userGroup,
        folderPermissions: dto.folderPermissions,
        quotaLimit: dto.quotaLimit,
        isActive: dto.isActive ?? true,
        lastAccess: dto.lastAccess ? new Date(dto.lastAccess) : undefined,
        notes: dto.notes,
      },
      select: this.getQnapAccountSelect(includePassword),
    });
  }

  async updateQnapAccount(employeeId: number, accountId: number, dto: UpdateQnapAccountDto, includePassword = false) {
    await this.ensureEmployeeExists(employeeId);

    const account = await this.prisma.qnapAccount.findFirst({
      where: { id: accountId, employeeId },
    });

    if (!account) {
      throw new NotFoundException('QNAP account not found for this employee');
    }

    const data: Prisma.QnapAccountUpdateInput = {};

    if (dto.username !== undefined) data.username = dto.username;
    if (dto.password !== undefined) data.password = dto.password;
    if (dto.userGroup !== undefined) data.userGroup = dto.userGroup;
    if (dto.folderPermissions !== undefined) data.folderPermissions = dto.folderPermissions;
    if (dto.quotaLimit !== undefined) data.quotaLimit = dto.quotaLimit;
    if (dto.isActive !== undefined) data.isActive = dto.isActive;
    if (dto.lastAccess !== undefined) data.lastAccess = dto.lastAccess ? new Date(dto.lastAccess) : null;
    if (dto.notes !== undefined) data.notes = dto.notes;

    return this.prisma.qnapAccount.update({
      where: { id: accountId },
      data,
      select: this.getQnapAccountSelect(includePassword),
    });
  }

  async deleteQnapAccount(employeeId: number, accountId: number): Promise<void> {
    await this.ensureEmployeeExists(employeeId);

    const account = await this.prisma.qnapAccount.findFirst({
      where: { id: accountId, employeeId },
    });

    if (!account) {
      throw new NotFoundException('QNAP account not found for this employee');
    }

    await this.prisma.qnapAccount.delete({ where: { id: accountId } });
  }

  async createCalipsoAccount(employeeId: number, dto: CreateCalipsoAccountDto, includePassword = false) {
    await this.ensureEmployeeExists(employeeId);

    return this.prisma.calipsoAccount.create({
      data: {
        employeeId,
        username: dto.username,
        password: dto.password,
        profile: dto.profile,
        permissions: dto.permissions,
        modules: dto.modules,
        isActive: dto.isActive ?? true,
        lastLogin: dto.lastLogin ? new Date(dto.lastLogin) : undefined,
        notes: dto.notes,
      },
      select: this.getCalipsoAccountSelect(includePassword),
    });
  }

  async updateCalipsoAccount(employeeId: number, accountId: number, dto: UpdateCalipsoAccountDto, includePassword = false) {
    await this.ensureEmployeeExists(employeeId);

    const account = await this.prisma.calipsoAccount.findFirst({
      where: { id: accountId, employeeId },
    });

    if (!account) {
      throw new NotFoundException('Calipso account not found for this employee');
    }

    const data: Prisma.CalipsoAccountUpdateInput = {};

    if (dto.username !== undefined) data.username = dto.username;
    if (dto.password !== undefined) data.password = dto.password;
    if (dto.profile !== undefined) data.profile = dto.profile;
    if (dto.permissions !== undefined) data.permissions = dto.permissions;
    if (dto.modules !== undefined) data.modules = dto.modules;
    if (dto.isActive !== undefined) data.isActive = dto.isActive;
    if (dto.lastLogin !== undefined) data.lastLogin = dto.lastLogin ? new Date(dto.lastLogin) : null;
    if (dto.notes !== undefined) data.notes = dto.notes;

    return this.prisma.calipsoAccount.update({
      where: { id: accountId },
      data,
      select: this.getCalipsoAccountSelect(includePassword),
    });
  }

  async deleteCalipsoAccount(employeeId: number, accountId: number): Promise<void> {
    await this.ensureEmployeeExists(employeeId);

    const account = await this.prisma.calipsoAccount.findFirst({
      where: { id: accountId, employeeId },
    });

    if (!account) {
      throw new NotFoundException('Calipso account not found for this employee');
    }

    await this.prisma.calipsoAccount.delete({ where: { id: accountId } });
  }

  async createEmailAccount(employeeId: number, dto: CreateEmailAccountDto, includePassword = false) {
    await this.ensureEmployeeExists(employeeId);

    const existing = await this.prisma.emailAccount.findUnique({
      where: { email: dto.email },
    });

    if (existing) {
      throw new ConflictException('Email account already exists');
    }

    return this.prisma.emailAccount.create({
      data: {
        employeeId,
        email: dto.email,
        accountType: dto.accountType,
        password: dto.password,
        forwardingTo: dto.forwardingTo,
        aliases: dto.aliases,
        isActive: dto.isActive ?? true,
        lastSync: dto.lastSync ? new Date(dto.lastSync) : undefined,
        notes: dto.notes,
      },
      select: this.getEmailAccountSelect(includePassword),
    });
  }

  async updateEmailAccount(employeeId: number, accountId: number, dto: UpdateEmailAccountDto, includePassword = false) {
    await this.ensureEmployeeExists(employeeId);

    const account = await this.prisma.emailAccount.findFirst({
      where: { id: accountId, employeeId },
    });

    if (!account) {
      throw new NotFoundException('Email account not found for this employee');
    }

    if (dto.email) {
      const existing = await this.prisma.emailAccount.findFirst({
        where: { email: dto.email, id: { not: accountId } },
      });

      if (existing) {
        throw new ConflictException('Email account already exists');
      }
    }

    const data: Prisma.EmailAccountUpdateInput = {};

    if (dto.email !== undefined) data.email = dto.email;
    if (dto.accountType !== undefined) data.accountType = dto.accountType;
    if (dto.password !== undefined) data.password = dto.password;
    if (dto.forwardingTo !== undefined) data.forwardingTo = dto.forwardingTo;
    if (dto.aliases !== undefined) data.aliases = dto.aliases;
    if (dto.isActive !== undefined) data.isActive = dto.isActive;
    if (dto.lastSync !== undefined) data.lastSync = dto.lastSync ? new Date(dto.lastSync) : null;
    if (dto.notes !== undefined) data.notes = dto.notes;

    return this.prisma.emailAccount.update({
      where: { id: accountId },
      data,
      select: this.getEmailAccountSelect(includePassword),
    });
  }

  async deleteEmailAccount(employeeId: number, accountId: number): Promise<void> {
    await this.ensureEmployeeExists(employeeId);

    const account = await this.prisma.emailAccount.findFirst({
      where: { id: accountId, employeeId },
    });

    if (!account) {
      throw new NotFoundException('Email account not found for this employee');
    }

    await this.prisma.emailAccount.delete({ where: { id: accountId } });
  }

  async findOneDetailed(id: number, userPermissions: string[] = []): Promise<any> {
    // Check if user has permission to view passwords
    const canViewPasswords = userPermissions.includes('employees:view-passwords:all');

    const employee = await this.prisma.employee.findUnique({
      where: { id },
      include: {
        users: {
          select: {
            id: true,
            username: true,
            email: true,
            isActive: true,
            lastLoginAt: true,
          },
        },
        windowsAccounts: {
          select: {
            id: true,
            employeeId: true,
            username: true,
            domain: true,
            password: canViewPasswords,
            profilePath: true,
            homeDirectory: true,
            groups: true,
            isActive: true,
            lastLogin: true,
            notes: true,
            createdAt: true,
            updatedAt: true,
          },
          orderBy: { createdAt: 'desc' },
        },
        qnapAccounts: {
          select: {
            id: true,
            employeeId: true,
            username: true,
            password: canViewPasswords,
            userGroup: true,
            folderPermissions: true,
            quotaLimit: true,
            isActive: true,
            lastAccess: true,
            notes: true,
            createdAt: true,
            updatedAt: true,
          },
          orderBy: { createdAt: 'desc' },
        },
        calipsoAccounts: {
          select: {
            id: true,
            employeeId: true,
            username: true,
            password: canViewPasswords,
            profile: true,
            permissions: true,
            modules: true,
            isActive: true,
            lastLogin: true,
            notes: true,
            createdAt: true,
            updatedAt: true,
          },
          orderBy: { createdAt: 'desc' },
        },
        emailAccounts: {
          select: {
            id: true,
            employeeId: true,
            email: true,
            password: canViewPasswords,
            accountType: true,
            forwardingTo: true,
            aliases: true,
            isActive: true,
            lastSync: true,
            notes: true,
            createdAt: true,
            updatedAt: true,
          },
          orderBy: { createdAt: 'desc' },
        },
        equipmentAssigned: {
          orderBy: { createdAt: 'desc' },
        },
        inventoryAssigned: {
          orderBy: { createdAt: 'desc' },
        },
        ticketsRequested: {
          orderBy: { createdAt: 'desc' },
          take: 50, // Últimos 50 tickets
          include: {
            technician: {
              select: {
                id: true,
                username: true,
                firstName: true,
                lastName: true,
              },
            },
          },
        },
        purchaseRequests: {
          orderBy: { createdAt: 'desc' },
          take: 50, // Últimas 50 solicitudes
        },
      },
    });

    if (!employee) {
      throw new NotFoundException(`Employee with ID ${id} not found`);
    }

    return employee;
  }

  async update(id: number, dto: UpdateEmployeeDto): Promise<Employee> {
    await this.findOne(id);

    if (dto.email) {
      const existing = await this.prisma.employee.findFirst({
        where: {
          email: dto.email,
          id: { not: id },
        },
      });

      if (existing) {
        throw new ConflictException('Email already exists');
      }
    }

    return this.prisma.employee.update({
      where: { id },
      data: dto,
    });
  }

  async remove(id: number): Promise<void> {
    await this.findOne(id);
    await this.prisma.employee.delete({ where: { id } });
  }
}
