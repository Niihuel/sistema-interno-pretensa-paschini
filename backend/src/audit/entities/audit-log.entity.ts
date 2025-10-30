import { AuditLog as PrismaAuditLog } from '@prisma/client';

export class AuditLog implements PrismaAuditLog {
  id: number;
  userId: number | null;
  userName: string | null;
  sessionId: string | null;
  action: string;
  entity: string;
  entityId: number | null;
  oldValue: string | null;
  newValue: string | null;
  changes: string | null;
  ipAddress: string | null;
  userAgent: string | null;
  source: string | null;
  category: string | null;
  severity: string;
  description: string | null;
  isSuccess: boolean;
  errorMessage: string | null;
  duration: number | null;
  endpoint: string | null;
  method: string | null;
  statusCode: number | null;
  requestId: string | null;
  tags: string | null;
  metadata: string | null;
  requiresReview: boolean;
  reviewedBy: string | null;
  reviewedAt: Date | null;
  expiresAt: Date | null;
  createdBy: string | null;
  createdAt: Date;
}
