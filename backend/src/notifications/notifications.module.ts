import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { NotificationsController } from './notifications.controller';
import { NotificationsService } from './notifications.service';
import { NotificationsGateway } from './notifications.gateway';
import { PrismaModule } from '@/common/prisma.module';

@Module({
  imports: [
    PrismaModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'CHANGE_THIS_SECRET_IN_PRODUCTION',
      signOptions: { expiresIn: '7d' },
    }),
  ],
  controllers: [NotificationsController],
  providers: [
    NotificationsService,
    NotificationsGateway,
    {
      provide: 'NOTIFICATIONS_GATEWAY_SETUP',
      useFactory: (service: NotificationsService, gateway: NotificationsGateway) => {
        // Inyectar gateway en service para evitar circular dependency
        service.setGateway(gateway);
        return true;
      },
      inject: [NotificationsService, NotificationsGateway],
    },
  ],
  exports: [NotificationsService, NotificationsGateway],
})
export class NotificationsModule {}
