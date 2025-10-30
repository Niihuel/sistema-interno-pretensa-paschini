import { PartialType } from '@nestjs/mapped-types';
import { CreateBackupStatusDto } from './create-backup-status.dto';

export class UpdateBackupStatusDto extends PartialType(CreateBackupStatusDto) {}
