import { Module } from '@nestjs/common';
import { ConsumablesController } from './consumables.controller';
import { ConsumablesService } from './consumables.service';
import { PrismaModule } from '@/common/prisma.module';
import { NotificationsModule } from '@/notifications/notifications.module';
import { RbacModule } from '@/rbac/rbac.module';

@Module({
  imports: [PrismaModule, NotificationsModule, RbacModule],
  controllers: [ConsumablesController],
  providers: [ConsumablesService],
  exports: [ConsumablesService],
})
export class ConsumablesModule {}
