import { Module, Global } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { AuditService } from './audit.service';
import { AuditController } from './audit.controller';
import { AuditInterceptor } from './interceptors/audit.interceptor';
import { PrismaModule } from '@/common/prisma.module';

/**
 * Audit Module
 *
 * This module provides comprehensive audit logging capabilities:
 * - Automatic request/response auditing via AuditInterceptor
 * - Manual audit logging via AuditService
 * - Audit log querying via AuditController
 * - @Audit decorator to mark endpoints for auditing
 *
 * The module is global so AuditService can be injected anywhere
 */
@Global()
@Module({
  imports: [PrismaModule],
  controllers: [AuditController],
  providers: [
    AuditService,
    // Register AuditInterceptor globally
    // It will only audit endpoints marked with @Audit decorator
    {
      provide: APP_INTERCEPTOR,
      useClass: AuditInterceptor,
    },
  ],
  exports: [AuditService], // Export service so other modules can use it
})
export class AuditModule {}
