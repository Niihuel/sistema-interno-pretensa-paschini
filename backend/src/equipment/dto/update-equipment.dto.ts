import { IsString, IsInt, IsOptional, IsBoolean, IsDateString } from 'class-validator';

export class UpdateEquipmentDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  type?: string;

  @IsString()
  @IsOptional()
  status?: string;

  @IsString()
  @IsOptional()
  location?: string;

  @IsString()
  @IsOptional()
  serialNumber?: string;

  @IsInt()
  @IsOptional()
  assignedToId?: number;

  @IsString()
  @IsOptional()
  ip?: string;

  @IsString()
  @IsOptional()
  macAddress?: string;

  @IsString()
  @IsOptional()
  area?: string;

  @IsString()
  @IsOptional()
  brand?: string;

  @IsString()
  @IsOptional()
  model?: string;

  @IsString()
  @IsOptional()
  processor?: string;

  @IsString()
  @IsOptional()
  ram?: string;

  @IsString()
  @IsOptional()
  storage?: string;

  @IsString()
  @IsOptional()
  operatingSystem?: string;

  @IsString()
  @IsOptional()
  notes?: string;

  @IsBoolean()
  @IsOptional()
  isPersonalProperty?: boolean;

  @IsDateString()
  @IsOptional()
  purchaseDate?: string;
}
