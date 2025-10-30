import { IsString, IsInt, IsOptional, IsDateString } from 'class-validator';

export class CreatePurchaseDto {
  @IsString()
  @IsOptional()
  requestId?: string;

  @IsString()
  itemName: string;

  @IsInt()
  @IsOptional()
  requestedQty?: number;

  @IsDateString()
  @IsOptional()
  requestedDate?: string;

  @IsInt()
  @IsOptional()
  receivedQty?: number;

  @IsDateString()
  @IsOptional()
  receivedDate?: string;

  @IsInt()
  @IsOptional()
  pendingQty?: number;

  @IsString()
  @IsOptional()
  status?: string;
}
