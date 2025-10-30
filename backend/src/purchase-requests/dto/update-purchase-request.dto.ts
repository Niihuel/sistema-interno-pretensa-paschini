import { IsString, IsInt, IsOptional, IsNumber, IsDateString } from 'class-validator';

export class UpdatePurchaseRequestDto {
  @IsString()
  @IsOptional()
  itemName?: string;

  @IsString()
  @IsOptional()
  category?: string;

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
  @IsOptional()
  priority?: string;

  @IsString()
  @IsOptional()
  status?: string;

  @IsString()
  @IsOptional()
  approvedBy?: string;

  @IsDateString()
  @IsOptional()
  approvalDate?: string;

  @IsDateString()
  @IsOptional()
  purchaseDate?: string;

  @IsDateString()
  @IsOptional()
  receivedDate?: string;

  @IsString()
  @IsOptional()
  vendor?: string;

  @IsNumber()
  @IsOptional()
  actualCost?: number;

  @IsString()
  @IsOptional()
  notes?: string;
}
