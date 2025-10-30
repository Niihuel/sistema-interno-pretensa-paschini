import { IsOptional, IsString, IsBoolean, IsInt } from 'class-validator';
import { Type } from 'class-transformer';

export class QueryUserDto {
  @IsString()
  @IsOptional()
  search?: string;

  @IsBoolean()
  @IsOptional()
  @Type(() => Boolean)
  isActive?: boolean;

  @IsInt()
  @IsOptional()
  @Type(() => Number)
  roleId?: number;

  @IsInt()
  @IsOptional()
  @Type(() => Number)
  page?: number;

  @IsInt()
  @IsOptional()
  @Type(() => Number)
  limit?: number;
}
