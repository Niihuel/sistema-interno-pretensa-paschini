import { IsDateString, IsOptional, IsString, IsInt, Min, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class FileStatusDto {
  @IsInt()
  fileTypeId: number;

  @IsInt()
  statusId: number;
}

export class CreateDailyBackupDto {
  @IsDateString()
  date: string;

  @IsInt()
  @Min(1)
  @IsOptional()
  diskNumber?: number;

  @IsInt()
  @IsOptional()
  diskId?: number;

  // DEPRECATED: Mantener para compatibilidad temporal
  @IsInt()
  @IsOptional()
  backupZipStatusId?: number;

  @IsInt()
  @IsOptional()
  backupAdjuntosStatusId?: number;

  @IsInt()
  @IsOptional()
  calipsoStatusId?: number;

  @IsInt()
  @IsOptional()
  presupuestacionStatusId?: number;

  // Nuevo sistema dinámico de archivos
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => FileStatusDto)
  @IsOptional()
  fileStatuses?: FileStatusDto[];

  @IsString()
  @IsOptional()
  notes?: string;
}
