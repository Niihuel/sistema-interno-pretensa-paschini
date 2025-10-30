import { Module } from '@nestjs/common';
import { ZonesController } from './zones.controller';
import { ZonesService } from './zones.service';
import { PrismaModule } from '@/common/prisma.module';
import { AuditModule } from '@/audit/audit.module';

@Module({
  imports: [PrismaModule, AuditModule],
  controllers: [ZonesController],
  providers: [ZonesService],
  exports: [ZonesService],
})
export class ZonesModule {}
