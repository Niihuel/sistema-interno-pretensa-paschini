import { IsString, IsNotEmpty, IsOptional, IsBoolean, IsIn, MaxLength } from 'class-validator';

export class CreatePermissionDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  displayName: string;

  @IsString()
  @IsOptional()
  @MaxLength(500)
  description?: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  category: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  resource: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  action: string;

  @IsString()
  @IsOptional()
  @MaxLength(20)
  @IsIn(['own', 'team', 'all'], {
    message: 'Scope must be one of: own, team, all',
  })
  scope?: string;

  @IsBoolean()
  @IsOptional()
  requiresMFA?: boolean;

  @IsString()
  @IsOptional()
  @IsIn(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'], {
    message: 'Risk level must be one of: LOW, MEDIUM, HIGH, CRITICAL',
  })
  riskLevel?: string;
}
