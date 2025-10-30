import { IsString, IsOptional, IsInt, IsBoolean, IsEnum } from 'class-validator';

export enum ConsumableTypeEnum {
  TONER = 'TONER',
  INK_CARTRIDGE = 'INK_CARTRIDGE',
  DRUM = 'DRUM',
  FUSER = 'FUSER',
  MAINTENANCE_KIT = 'MAINTENANCE_KIT',
}

export enum ConsumableColorEnum {
  BLACK = 'BLACK',
  CYAN = 'CYAN',
  MAGENTA = 'MAGENTA',
  YELLOW = 'YELLOW',
  TRI_COLOR = 'TRI_COLOR',
  PHOTO_BLACK = 'PHOTO_BLACK',
  LIGHT_CYAN = 'LIGHT_CYAN',
  LIGHT_MAGENTA = 'LIGHT_MAGENTA',
}

export class CreateConsumableTypeDto {
  @IsString()
  name: string;

  @IsEnum(ConsumableTypeEnum)
  type: ConsumableTypeEnum;

  @IsOptional()
  @IsEnum(ConsumableColorEnum)
  color?: ConsumableColorEnum;

  @IsString()
  brand: string;

  @IsString()
  model: string;

  @IsOptional()
  @IsString()
  productCode?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsInt()
  avgYield?: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
