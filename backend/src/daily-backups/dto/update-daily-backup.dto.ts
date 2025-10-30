import { PartialType } from '@nestjs/mapped-types';
import { CreateDailyBackupDto } from './create-daily-backup.dto';
import { IsInt, IsOptional, Min, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { UpdateFileStatusDto } from './update-file-status.dto';

export class UpdateDailyBackupDto extends PartialType(CreateDailyBackupDto) {
  @IsInt()
  @Min(1)
  @IsOptional()
  diskNumber?: number;

  @IsInt()
  @IsOptional()
  diskId?: number;

  // DEPRECATED: Mantener para compatibilidad temporal con frontend antiguo
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
  @Type(() => UpdateFileStatusDto)
  @IsOptional()
  fileStatuses?: UpdateFileStatusDto[];
}
