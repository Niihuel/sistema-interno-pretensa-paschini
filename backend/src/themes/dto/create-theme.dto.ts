import { IsString, IsEnum, IsOptional, IsObject, IsNotEmpty, MinLength, MaxLength, IsIn } from 'class-validator';

export class CreateThemeDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  @MaxLength(100)
  name: string;

  @IsIn(['GLOBAL', 'DASHBOARD', 'WIDGET'])
  scope: 'GLOBAL' | 'DASHBOARD' | 'WIDGET';

  @IsOptional()
  @IsString()
  scopeId?: string;

  @IsOptional()
  @IsIn(['LIGHT', 'DARK'])
  mode?: 'LIGHT' | 'DARK';

  @IsObject()
  variables: Record<string, any>;

  @IsOptional()
  @IsString()
  parentId?: string;
}
