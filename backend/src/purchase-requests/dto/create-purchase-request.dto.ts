import { IsString, IsInt, IsOptional, IsNumber, IsDateString } from 'class-validator';

export class CreatePurchaseRequestDto {
  @IsString()
  @IsOptional()
  requestNumber?: string;

  @IsInt()
  @IsOptional()
  requestorId?: number;

  @IsString()
  itemName: string;

  @IsString()
  category: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  justification?: string;

  @IsInt()
  @IsOptional()
  quantity?: number;

  @IsNumber()
  @IsOptional()
  estimatedCost?: number;

  @IsString()
  priority: string;

  @IsString()
  @IsOptional()
  status?: string;

  @IsString()
  @IsOptional()
  notes?: string;
}
