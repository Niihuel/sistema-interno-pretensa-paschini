import { PartialType } from '@nestjs/mapped-types';
import { CreateBackupLogDto } from './create-backup-log.dto';

export class UpdateBackupLogDto extends PartialType(CreateBackupLogDto) {}
