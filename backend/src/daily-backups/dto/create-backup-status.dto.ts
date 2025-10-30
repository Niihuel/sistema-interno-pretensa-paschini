import { IsBoolean, IsInt, IsOptional, IsString } from 'class-validator';

export class CreateBackupStatusDto {
  @IsString()
  code: string;

  @IsString()
  label: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  color?: string;

  @IsOptional()
  @IsInt()
  sortOrder?: number;

  @IsOptional()
  @IsBoolean()
  isFinal?: boolean;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
