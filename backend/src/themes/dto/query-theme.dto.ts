import { IsOptional, IsString, IsIn } from 'class-validator';

export class QueryThemeDto {
  @IsOptional()
  @IsIn(['GLOBAL', 'DASHBOARD', 'WIDGET'])
  scope?: 'GLOBAL' | 'DASHBOARD' | 'WIDGET';

  @IsOptional()
  @IsString()
  scopeId?: string;

  @IsOptional()
  @IsIn(['LIGHT', 'DARK'])
  mode?: 'LIGHT' | 'DARK';
}
