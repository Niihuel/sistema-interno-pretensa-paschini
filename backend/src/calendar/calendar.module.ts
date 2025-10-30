import { Module } from '@nestjs/common';
import { CalendarController } from './calendar.controller';
import { CalendarService } from './calendar.service';
import { PrismaModule } from '@/common/prisma.module';
import { NotificationsModule } from '@/notifications/notifications.module';

@Module({
  imports: [PrismaModule, NotificationsModule],
  controllers: [CalendarController],
  providers: [CalendarService],
  exports: [CalendarService],
})
export class CalendarModule {}
