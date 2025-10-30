import { IsNumber, IsNotEmpty, IsOptional, IsString, IsBoolean, IsDateString } from 'class-validator';

export class AssignRoleDto {
  @IsNumber()
  @IsNotEmpty()
  userId: number;

  @IsNumber()
  @IsNotEmpty()
  roleId: number;

  @IsDateString()
  @IsOptional()
  expiresAt?: string;

  @IsString()
  @IsOptional()
  reason?: string;

  @IsString()
  @IsOptional()
  assignedBy?: string;

  @IsBoolean()
  @IsOptional()
  isPrimary?: boolean;
}
