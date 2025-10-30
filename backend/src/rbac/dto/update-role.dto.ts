import { IsString, IsOptional, IsArray, IsNumber, IsBoolean, Matches, MaxLength } from 'class-validator';

export class UpdateRoleDto {
  @IsString()
  @IsOptional()
  @MaxLength(100)
  displayName?: string;

  @IsString()
  @IsOptional()
  @MaxLength(500)
  description?: string;

  @IsString()
  @IsOptional()
  @Matches(/^#[0-9A-F]{6}$/i, {
    message: 'Color must be a valid hex color (e.g., #FF5733)',
  })
  color?: string;

  @IsString()
  @IsOptional()
  icon?: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  permissions?: string[];

  @IsNumber()
  @IsOptional()
  level?: number;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
