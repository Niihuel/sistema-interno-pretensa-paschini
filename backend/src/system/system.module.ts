import { Module } from '@nestjs/common';
import { SystemController } from './system.controller';
import { SystemService } from './system.service';
import { PrismaModule } from '@/common/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [SystemController],
  providers: [SystemService],
})
export class SystemModule {}
