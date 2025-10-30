import { IsString, IsInt, IsOptional, IsBoolean, IsEnum } from 'class-validator';

export enum AuditAction {
  CREATE = 'CREATE',
  UPDATE = 'UPDATE',
  DELETE = 'DELETE',
  VIEW = 'VIEW',
  LOGIN = 'LOGIN',
  LOGOUT = 'LOGOUT',
  EXPORT = 'EXPORT',
  IMPORT = 'IMPORT',
  APPROVE = 'APPROVE',
  REJECT = 'REJECT',
  ASSIGN = 'ASSIGN',
  UNASSIGN = 'UNASSIGN',
}

export enum AuditSeverity {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL',
  INFO = 'INFO',
}

export enum AuditCategory {
  SECURITY = 'SECURITY',
  DATA = 'DATA',
  SYSTEM = 'SYSTEM',
  USER = 'USER',
  BUSINESS = 'BUSINESS',
}

export enum AuditSource {
  WEB = 'WEB',
  API = 'API',
  SYSTEM = 'SYSTEM',
  MOBILE = 'MOBILE',
}

export class CreateAuditLogDto {
  @IsInt()
  @IsOptional()
  userId?: number | null;

  @IsString()
  @IsOptional()
  userName?: string | null;

  @IsString()
  @IsOptional()
  sessionId?: string;

  @IsEnum(AuditAction)
  action: AuditAction;

  @IsString()
  entity: string;

  @IsInt()
  @IsOptional()
  entityId?: number;

  @IsOptional()
  oldValue?: any; // Will be stringified to JSON

  @IsOptional()
  newValue?: any; // Will be stringified to JSON

  @IsOptional()
  changes?: any; // Will be stringified to JSON

  @IsString()
  @IsOptional()
  ipAddress?: string;

  @IsString()
  @IsOptional()
  userAgent?: string;

  @IsEnum(AuditSource)
  @IsOptional()
  source?: AuditSource;

  @IsEnum(AuditCategory)
  @IsOptional()
  category?: AuditCategory;

  @IsEnum(AuditSeverity)
  @IsOptional()
  severity?: AuditSeverity;

  @IsString()
  @IsOptional()
  description?: string;

  @IsBoolean()
  @IsOptional()
  isSuccess?: boolean;

  @IsString()
  @IsOptional()
  errorMessage?: string;

  @IsInt()
  @IsOptional()
  duration?: number;

  @IsString()
  @IsOptional()
  endpoint?: string;

  @IsString()
  @IsOptional()
  method?: string;

  @IsInt()
  @IsOptional()
  statusCode?: number;

  @IsString()
  @IsOptional()
  requestId?: string;

  @IsOptional()
  tags?: string[];

  @IsOptional()
  metadata?: any;

  @IsBoolean()
  @IsOptional()
  requiresReview?: boolean;
}
