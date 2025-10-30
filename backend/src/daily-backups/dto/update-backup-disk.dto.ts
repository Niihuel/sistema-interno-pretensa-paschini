import { PartialType } from '@nestjs/mapped-types';
import { CreateBackupDiskDto } from './create-backup-disk.dto';
import { IsInt, IsOptional, Min } from 'class-validator';

export class UpdateBackupDiskDto extends PartialType(CreateBackupDiskDto) {
  @IsOptional()
  @IsInt()
  @Min(1)
  sequence?: number;
}
