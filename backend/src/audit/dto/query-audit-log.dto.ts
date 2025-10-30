import { IsOptional, IsString, IsInt, IsEnum, IsDateString, IsBoolean } from 'class-validator';
import { Type } from 'class-transformer';
import { AuditAction, AuditSeverity, AuditCategory, AuditSource } from './create-audit-log.dto';

export class QueryAuditLogDto {
  @IsInt()
  @IsOptional()
  @Type(() => Number)
  userId?: number;

  @IsString()
  @IsOptional()
  userName?: string;

  @IsEnum(AuditAction)
  @IsOptional()
  action?: AuditAction;

  @IsString()
  @IsOptional()
  entity?: string;

  @IsInt()
  @IsOptional()
  @Type(() => Number)
  entityId?: number;

  @IsEnum(AuditCategory)
  @IsOptional()
  category?: AuditCategory;

  @IsEnum(AuditSeverity)
  @IsOptional()
  severity?: AuditSeverity;

  @IsEnum(AuditSource)
  @IsOptional()
  source?: AuditSource;

  @IsBoolean()
  @IsOptional()
  @Type(() => Boolean)
  isSuccess?: boolean;

  @IsBoolean()
  @IsOptional()
  @Type(() => Boolean)
  requiresReview?: boolean;

  @IsDateString()
  @IsOptional()
  startDate?: string;

  @IsDateString()
  @IsOptional()
  endDate?: string;

  @IsInt()
  @IsOptional()
  @Type(() => Number)
  page?: number;

  @IsInt()
  @IsOptional()
  @Type(() => Number)
  limit?: number;

  @IsString()
  @IsOptional()
  sortBy?: string;

  @IsString()
  @IsOptional()
  sortOrder?: 'asc' | 'desc';
}
