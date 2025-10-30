import { Module, forwardRef } from '@nestjs/common';
import { DailyBackupsController } from './daily-backups.controller';
import { DailyBackupsService } from './daily-backups.service';
import { DailyBackupConfigController } from './daily-backup-config.controller';
import { DailyBackupConfigService } from './daily-backup-config.service';
import { PrismaModule } from '@/common/prisma.module';
import { NotificationsModule } from '@/notifications/notifications.module';
import { RbacModule } from '@/rbac/rbac.module';

@Module({
  imports: [
    PrismaModule,
    forwardRef(() => NotificationsModule),
    RbacModule,
  ],
  controllers: [DailyBackupsController, DailyBackupConfigController],
  providers: [DailyBackupsService, DailyBackupConfigService],
  exports: [DailyBackupsService, DailyBackupConfigService],
})
export class DailyBackupsModule {}
