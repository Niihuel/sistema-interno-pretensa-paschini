import { IsString, IsOptional, IsBoolean, IsDateString } from 'class-validator';

export class UpdateWindowsAccountDto {
  @IsString()
  @IsOptional()
  username?: string;

  @IsString()
  @IsOptional()
  domain?: string;

  @IsString()
  @IsOptional()
  password?: string;

  @IsString()
  @IsOptional()
  profilePath?: string;

  @IsString()
  @IsOptional()
  homeDirectory?: string;

  @IsString()
  @IsOptional()
  groups?: string;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @IsDateString()
  @IsOptional()
  lastLogin?: string;

  @IsString()
  @IsOptional()
  notes?: string;
}
