import { BackupLog as PrismaBackupLog } from '@prisma/client';

export class BackupLog implements PrismaBackupLog {
  id: number;
  backupName: string;
  backupType: string;
  source: string;
  destination: string;
  status: string;
  startTime: Date | null;
  endTime: Date | null;
  duration: number | null;
  sizeBytes: bigint | null;
  errorMessage: string | null;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
}
