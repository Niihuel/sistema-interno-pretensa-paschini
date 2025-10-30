import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '@/common/prisma.service';
import { CreateAuditLogDto, QueryAuditLogDto } from './dto';
import { AuditLog } from './entities/audit-log.entity';
import { Prisma } from '@prisma/client';

@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * Create an audit log entry
   * This method is used by the AuditInterceptor and can be called manually
   */
  async create(dto: CreateAuditLogDto): Promise<AuditLog | null> {
    try {
      // Convert objects to JSON strings
      const data: any = {
        userId: dto.userId || null, // Permitir null si no hay usuario autenticado
        userName: dto.userName || 'Sistema',
        sessionId: dto.sessionId,
        action: dto.action,
        entity: dto.entity,
        entityId: dto.entityId,
        oldValue: dto.oldValue ? JSON.stringify(dto.oldValue) : null,
        newValue: dto.newValue ? JSON.stringify(dto.newValue) : null,
        changes: dto.changes ? JSON.stringify(this.calculateChanges(dto.oldValue, dto.newValue)) : null,
        ipAddress: dto.ipAddress,
        userAgent: dto.userAgent,
        source: dto.source || 'API',
        category: dto.category || 'DATA',
        severity: dto.severity || 'INFO',
        description: dto.description,
        isSuccess: dto.isSuccess ?? true,
        errorMessage: dto.errorMessage,
        duration: dto.duration,
        endpoint: dto.endpoint,
        method: dto.method,
        statusCode: dto.statusCode,
        requestId: dto.requestId,
        tags: dto.tags ? JSON.stringify(dto.tags) : null,
        metadata: dto.metadata ? JSON.stringify(dto.metadata) : null,
        requiresReview: dto.requiresReview || false,
        createdBy: dto.userName,
      };

      return await this.prisma.auditLog.create({ data });
    } catch (error) {
      // Don't throw errors in audit logging - just log them
      this.logger.error(`Failed to create audit log: ${error.message}`, error.stack);
      return null;
    }
  }

  /**
   * Calculate specific changes between old and new values
   */
  private calculateChanges(oldValue: any, newValue: any): Record<string, { old: any; new: any }> {
    if (!oldValue || !newValue) return {};

    const changes: Record<string, { old: any; new: any }> = {};

    // Get all unique keys from both objects
    const allKeys = new Set([
      ...Object.keys(oldValue || {}),
      ...Object.keys(newValue || {}),
    ]);

    allKeys.forEach((key) => {
      const oldVal = oldValue?.[key];
      const newVal = newValue?.[key];

      // Skip if values are the same
      if (JSON.stringify(oldVal) === JSON.stringify(newVal)) return;

      // Skip sensitive fields
      if (this.isSensitiveField(key)) return;

      changes[key] = {
        old: oldVal,
        new: newVal,
      };
    });

    return changes;
  }

  /**
   * Check if a field is sensitive and should not be logged
   */
  private isSensitiveField(fieldName: string): boolean {
    const sensitiveFields = [
      'password',
      'passwordHash',
      'twoFactorSecret',
      'sessionToken',
      'passwordResetToken',
      'emailVerificationToken',
      'secret',
      'apiKey',
      'privateKey',
    ];

    return sensitiveFields.some((sensitive) =>
      fieldName.toLowerCase().includes(sensitive.toLowerCase()),
    );
  }

  /**
   * Query audit logs with filters and pagination
   */
  async findAll(query: QueryAuditLogDto): Promise<{
    items: AuditLog[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const {
      userId,
      userName,
      action,
      entity,
      entityId,
      category,
      severity,
      source,
      isSuccess,
      requiresReview,
      startDate,
      endDate,
      page = 1,
      limit = 50,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = query;

    // Build where clause
    const where: Prisma.AuditLogWhereInput = {};

    if (userId) where.userId = userId;
    if (userName) where.userName = { contains: userName, mode: 'insensitive' };
    if (action) where.action = action;
    if (entity) where.entity = entity;
    if (entityId) where.entityId = entityId;
    if (category) where.category = category;
    if (severity) where.severity = severity;
    if (source) where.source = source;
    if (typeof isSuccess === 'boolean') where.isSuccess = isSuccess;
    if (typeof requiresReview === 'boolean') where.requiresReview = requiresReview;

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate);
      if (endDate) where.createdAt.lte = new Date(endDate);
    }

    // Execute query with pagination
    const [items, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        where,
        orderBy: { [sortBy]: sortOrder },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.auditLog.count({ where }),
    ]);

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Get audit log by ID
   */
  async findOne(id: number): Promise<AuditLog | null> {
    return this.prisma.auditLog.findUnique({
      where: { id },
    });
  }

  /**
   * Get audit logs for a specific entity
   */
  async findByEntity(entity: string, entityId: number): Promise<AuditLog[]> {
    return this.prisma.auditLog.findMany({
      where: {
        entity,
        entityId,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  /**
   * Get audit statistics
   */
  async getStats(startDate?: Date, endDate?: Date): Promise<any> {
    const where: Prisma.AuditLogWhereInput = {};

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = startDate;
      if (endDate) where.createdAt.lte = endDate;
    }

    const [
      totalLogs,
      totalUsers,
      actionStats,
      severityStats,
      categoryStats,
      failedActions,
    ] = await Promise.all([
      this.prisma.auditLog.count({ where }),
      this.prisma.auditLog.groupBy({
        by: ['userId'],
        where,
        _count: true,
      }),
      this.prisma.auditLog.groupBy({
        by: ['action'],
        where,
        _count: true,
      }),
      this.prisma.auditLog.groupBy({
        by: ['severity'],
        where,
        _count: true,
      }),
      this.prisma.auditLog.groupBy({
        by: ['category'],
        where,
        _count: true,
      }),
      this.prisma.auditLog.count({
        where: {
          ...where,
          isSuccess: false,
        },
      }),
    ]);

    return {
      totalLogs,
      uniqueUsers: totalUsers.length,
      actionStats,
      severityStats,
      categoryStats,
      failedActions,
      successRate: totalLogs > 0 ? ((totalLogs - failedActions) / totalLogs) * 100 : 0,
    };
  }

  /**
   * Mark audit log as reviewed
   */
  async markAsReviewed(id: number, reviewedBy: string): Promise<AuditLog> {
    return this.prisma.auditLog.update({
      where: { id },
      data: {
        requiresReview: false,
        reviewedBy,
        reviewedAt: new Date(),
      },
    });
  }

  /**
   * Delete old audit logs (for cleanup jobs)
   */
  async deleteExpired(): Promise<number> {
    const result = await this.prisma.auditLog.deleteMany({
      where: {
        expiresAt: {
          lte: new Date(),
        },
      },
    });

    return result.count;
  }

  /**
   * Helper method to log user actions
   */
  async logUserAction(
    userId: number,
    userName: string,
    action: string,
    entity: string,
    entityId?: number,
    description?: string,
  ): Promise<void> {
    await this.create({
      userId,
      userName,
      action: action as any,
      entity,
      entityId,
      description,
      category: 'USER' as any,
      severity: 'INFO' as any,
    });
  }

  /**
   * Helper method to log security events
   */
  async logSecurityEvent(
    userId: number | null,
    userName: string | null,
    action: string,
    description: string,
    severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL',
    isSuccess: boolean = true,
  ): Promise<void> {
    await this.create({
      userId: userId ?? undefined,
      userName: userName ?? undefined,
      action: action as any,
      entity: 'Security',
      description,
      category: 'SECURITY' as any,
      severity: severity as any,
      isSuccess,
      requiresReview: severity === 'HIGH' || severity === 'CRITICAL',
    });
  }
}
