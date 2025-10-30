import { IsString, IsInt, IsOptional, IsDateString } from 'class-validator';

export class UpdateTicketDto {
  @IsString()
  @IsOptional()
  title?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  status?: string;

  @IsString()
  @IsOptional()
  priority?: string;

  @IsInt()
  @IsOptional()
  technicianId?: number;

  @IsString()
  @IsOptional()
  solution?: string;

  @IsString()
  @IsOptional()
  category?: string;

  @IsString()
  @IsOptional()
  area?: string;

  @IsString()
  @IsOptional()
  ipAddress?: string;

  @IsDateString()
  @IsOptional()
  closedAt?: string;
}
