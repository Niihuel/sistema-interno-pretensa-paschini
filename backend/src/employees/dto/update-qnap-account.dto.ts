import { IsString, IsOptional, IsBoolean, IsDateString } from 'class-validator';

export class UpdateQnapAccountDto {
  @IsString()
  @IsOptional()
  username?: string;

  @IsString()
  @IsOptional()
  password?: string;

  @IsString()
  @IsOptional()
  userGroup?: string;

  @IsString()
  @IsOptional()
  folderPermissions?: string;

  @IsString()
  @IsOptional()
  quotaLimit?: string;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @IsDateString()
  @IsOptional()
  lastAccess?: string;

  @IsString()
  @IsOptional()
  notes?: string;
}
