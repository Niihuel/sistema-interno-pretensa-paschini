import { IsOptional, IsInt, IsDateString } from 'class-validator';
import { Type } from 'class-transformer';

export class QueryReplacementDto {
  @IsInt()
  @IsOptional()
  @Type(() => Number)
  printerId?: number;

  @IsInt()
  @IsOptional()
  @Type(() => Number)
  consumableId?: number;

  @IsDateString()
  @IsOptional()
  startDate?: string;

  @IsDateString()
  @IsOptional()
  endDate?: string;

  @IsInt()
  @IsOptional()
  @Type(() => Number)
  page?: number;

  @IsInt()
  @IsOptional()
  @Type(() => Number)
  limit?: number;
}
