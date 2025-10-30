import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable, throwError } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { Request, Response } from 'express';
import { AuditService } from '../audit.service';
import { AUDIT_KEY, AuditOptions } from '../decorators/audit.decorator';
import { AuditAction, AuditSource } from '../dto';

@Injectable()
export class AuditInterceptor implements NestInterceptor {
  private readonly logger = new Logger(AuditInterceptor.name);

  constructor(
    private readonly auditService: AuditService,
    private readonly reflector: Reflector,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    // Get audit options from decorator metadata
    const auditOptions = this.reflector.get<AuditOptions>(
      AUDIT_KEY,
      context.getHandler(),
    );

    // If no @Audit decorator, skip auditing
    if (!auditOptions) {
      return next.handle();
    }

    const startTime = Date.now();
    const request = context.switchToHttp().getRequest<Request>();
    const response = context.switchToHttp().getResponse<Response>();

    // Extract user info from request (set by JWT guard)
    const user = (request as any).user;
    const userId = user?.id || user?.sub;
    const userName = user?.username || user?.email || 'Anonymous';

    // Extract request info
    const httpMethod = request.method;
    const endpoint = request.route?.path || request.url;
    const ipAddress = this.getClientIp(request);
    const userAgent = request.headers['user-agent'];
    const requestId = request.headers['x-request-id'] as string;

    // Auto-detect action from HTTP method if not specified
    const action = auditOptions.action || this.detectAction(httpMethod);

    // Extract entity ID from params or body
    const entityId = this.extractEntityId(request, auditOptions);

    // Capture "before" state for UPDATE/DELETE operations
    let oldValuePromise: Promise<any> | null = null;
    if (
      (action === AuditAction.UPDATE || action === AuditAction.DELETE) &&
      (auditOptions.captureOldValue !== false) &&
      entityId
    ) {
      // This would need to be implemented by each module
      // For now, we'll skip capturing old value in the interceptor
      // Modules should call auditService.create() manually with oldValue
    }

    return next.handle().pipe(
      tap(async (responseData) => {
        // Calculate duration
        const duration = Date.now() - startTime;

        // Determine if body should be captured
        const shouldCaptureBody =
          auditOptions.captureBody !== false &&
          (action === AuditAction.CREATE || action === AuditAction.UPDATE);

        // Create audit log
        try {
          await this.auditService.create({
            userId: userId ?? undefined,
            userName: userName ?? undefined,
            sessionId: requestId,
            action,
            entity: auditOptions.entity,
            entityId: entityId ?? undefined,
            oldValue: null, // Would be set manually by controller
            newValue: shouldCaptureBody ? this.sanitizeBody(request.body) : null,
            ipAddress,
            userAgent,
            source: AuditSource.API,
            category: auditOptions.category,
            severity: auditOptions.severity,
            description:
              auditOptions.description ||
              this.generateDescription(action, auditOptions.entity, userName),
            isSuccess: true,
            duration,
            endpoint,
            method: httpMethod,
            statusCode: response.statusCode,
            requestId,
            requiresReview: auditOptions.requiresReview,
          });
        } catch (error) {
          this.logger.error(`Failed to create audit log: ${error.message}`);
        }
      }),
      catchError((error) => {
        // Log failed operations
        const duration = Date.now() - startTime;

        this.auditService
          .create({
            userId: userId ?? undefined,
            userName: userName ?? undefined,
            sessionId: requestId,
            action,
            entity: auditOptions.entity,
            entityId: entityId ?? undefined,
            ipAddress,
            userAgent,
            source: AuditSource.API,
            category: (auditOptions.category || 'DATA') as any,
            severity: 'HIGH' as any,
            description: `Failed to ${action} ${auditOptions.entity}`,
            isSuccess: false,
            errorMessage: error.message,
            duration,
            endpoint,
            method: httpMethod,
            statusCode: error.status || 500,
            requestId,
            requiresReview: true,
          })
          .catch((err) => {
            this.logger.error(`Failed to log error audit: ${err.message}`);
          });

        return throwError(() => error);
      }),
    );
  }

  /**
   * Auto-detect action from HTTP method
   */
  private detectAction(method: string): AuditAction {
    switch (method.toUpperCase()) {
      case 'POST':
        return AuditAction.CREATE;
      case 'PUT':
      case 'PATCH':
        return AuditAction.UPDATE;
      case 'DELETE':
        return AuditAction.DELETE;
      case 'GET':
        return AuditAction.VIEW;
      default:
        return AuditAction.VIEW;
    }
  }

  /**
   * Extract entity ID from request params or body
   */
  private extractEntityId(request: Request, options: AuditOptions): number | null {
    // Try to get from params.id
    if (request.params?.id) {
      const id = parseInt(request.params.id, 10);
      if (!isNaN(id)) return id;
    }

    // Try to get from body.id
    if (request.body?.id) {
      const id = parseInt(request.body.id, 10);
      if (!isNaN(id)) return id;
    }

    return null;
  }

  /**
   * Get client IP address from request
   */
  private getClientIp(request: Request): string {
    return (
      (request.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ||
      (request.headers['x-real-ip'] as string) ||
      request.socket.remoteAddress ||
      'Unknown'
    );
  }

  /**
   * Sanitize request body (remove sensitive fields)
   */
  private sanitizeBody(body: any): any {
    if (!body) return null;

    const sanitized = { ...body };
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

    sensitiveFields.forEach((field) => {
      if (sanitized[field]) {
        sanitized[field] = '***REDACTED***';
      }
    });

    return sanitized;
  }

  /**
   * Generate default description
   */
  private generateDescription(action: AuditAction, entity: string, userName: string): string {
    const actionText = action.toLowerCase();
    return `${userName} ${actionText}d ${entity}`;
  }
}
