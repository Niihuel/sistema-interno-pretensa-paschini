import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { APP_GUARD } from '@nestjs/core';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './common/prisma.module';
import { AuthModule } from './auth/auth.module';
import { RbacModule } from './rbac/rbac.module';
import { AuditModule } from './audit/audit.module';
import { UsersModule } from './users/users.module';
import { EmployeesModule } from './employees/employees.module';
import { EquipmentModule } from './equipment/equipment.module';
import { TicketsModule } from './tickets/tickets.module';
import { PrintersModule } from './printers/printers.module';
import { PurchaseRequestsModule } from './purchase-requests/purchase-requests.module';
import { InventoryModule } from './inventory/inventory.module';
import { AdminModule } from './admin/admin.module';
import { ConsumablesModule } from './consumables/consumables.module'; // ✅ Simplified version compatible with current schema
import { ReplacementsModule } from './replacements/replacements.module';
import { PurchasesModule } from './purchases/purchases.module';
import { BackupsModule } from './backups/backups.module';
import { DailyBackupsModule } from './daily-backups/daily-backups.module';
import { AreasModule } from './areas/areas.module';
import { ZonesModule } from './zones/zones.module';
import { SystemModule } from './system/system.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { NotificationsModule } from './notifications/notifications.module';
import { CalendarModule } from './calendar/calendar.module';
import { PushNotificationsModule } from './push-notifications/push-notifications.module';
import { ThemesModule } from './themes/themes.module';
import { JwtAuthGuard } from './common/guards';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    ScheduleModule.forRoot(),
    PrismaModule,
    AuthModule,
    RbacModule,
    AuditModule,
    UsersModule,
    EmployeesModule,
    EquipmentModule,
    TicketsModule,
    PrintersModule,
    PurchaseRequestsModule,
    InventoryModule,
    AdminModule,
    ConsumablesModule, // ✅ Simplified version - only /summary endpoint
    ReplacementsModule,
    PurchasesModule,
    BackupsModule,
    DailyBackupsModule,
    AreasModule,
    ZonesModule,
    SystemModule,
    DashboardModule,
    NotificationsModule,
    CalendarModule,
    PushNotificationsModule,
    ThemesModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    // Apply JwtAuthGuard globally to all routes
    // Routes can opt-out using @Public() decorator
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
  ],
})
export class AppModule {}
