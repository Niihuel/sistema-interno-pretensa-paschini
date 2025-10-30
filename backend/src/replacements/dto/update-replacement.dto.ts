import { IsInt, IsOptional, IsDateString, IsString } from 'class-validator';

export class UpdateReplacementDto {
  @IsInt()
  @IsOptional()
  consumableId?: number;

  @IsDateString()
  @IsOptional()
  replacementDate?: string;

  @IsDateString()
  @IsOptional()
  completionDate?: string;

  @IsInt()
  @IsOptional()
  rendimientoDays?: number;

  @IsString()
  @IsOptional()
  notes?: string;
}
