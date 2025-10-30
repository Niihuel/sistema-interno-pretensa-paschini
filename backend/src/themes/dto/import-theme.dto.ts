import { IsString, IsOptional, IsNotEmpty, IsIn } from 'class-validator';

export class ImportThemeDto {
  @IsString()
  @IsNotEmpty()
  json: string;

  @IsIn(['GLOBAL', 'DASHBOARD', 'WIDGET'])
  scope: 'GLOBAL' | 'DASHBOARD' | 'WIDGET';

  @IsOptional()
  @IsString()
  scopeId?: string;

  @IsOptional()
  @IsIn(['LIGHT', 'DARK'])
  mode?: 'LIGHT' | 'DARK';
}
