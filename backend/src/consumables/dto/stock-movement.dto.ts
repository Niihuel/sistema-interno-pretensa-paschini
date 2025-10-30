import { IsString, IsInt, IsOptional, IsEnum } from 'class-validator';

export enum MovementType {
  IN = 'IN',
  OUT = 'OUT',
  ADJUSTMENT = 'ADJUSTMENT',
}

export class CreateStockMovementDto {
  @IsInt()
  consumableId: number;

  @IsEnum(MovementType)
  movementType: MovementType;

  @IsInt()
  quantity: number;

  @IsString()
  @IsOptional()
  reason?: string;

  @IsString()
  @IsOptional()
  reference?: string;

  @IsString()
  @IsOptional()
  performedBy?: string;

  @IsString()
  @IsOptional()
  notes?: string;
}
