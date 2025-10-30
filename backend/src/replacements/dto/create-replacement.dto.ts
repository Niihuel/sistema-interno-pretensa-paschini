import { IsInt, IsOptional, IsDateString, IsString } from 'class-validator';

export class CreateReplacementDto {
  @IsInt()
  printerId: number;

  @IsInt()
  @IsOptional()
  consumableId?: number;

  @IsDateString()
  replacementDate: string;

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
