import { Module } from '@nestjs/common';
import { ReplacementsController } from './replacements.controller';
import { ReplacementsService } from './replacements.service';
import { PrismaModule } from '@/common/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [ReplacementsController],
  providers: [ReplacementsService],
  exports: [ReplacementsService],
})
export class ReplacementsModule {}
