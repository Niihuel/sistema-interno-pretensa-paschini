import { IsString, IsInt, IsOptional, IsNumber } from 'class-validator';

export class CreateConsumableDto {
  @IsString()
  itemName: string;

  @IsString()
  @IsOptional()
  type?: string;

  @IsString()
  @IsOptional()
  color?: string;

  @IsString()
  @IsOptional()
  brand?: string;

  @IsString()
  @IsOptional()
  model?: string;

  @IsString()
  @IsOptional()
  productCode?: string;

  @IsInt()
  @IsOptional()
  quantityAvailable?: number;

  @IsInt()
  @IsOptional()
  minimumStock?: number;

  @IsNumber()
  @IsOptional()
  unitPrice?: number;

  @IsString()
  @IsOptional()
  status?: string;

  @IsInt()
  @IsOptional()
  printerId?: number;

  @IsString()
  @IsOptional()
  location?: string;

  @IsString()
  @IsOptional()
  notes?: string;
}
