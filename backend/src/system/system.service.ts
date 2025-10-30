import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/common/prisma.service';

@Injectable()
export class SystemService {
  constructor(private prisma: PrismaService) {}

  async getSystemStatus() {
    let database = false;

    try {
      // Try to query database to check connection
      await this.prisma.$queryRaw`SELECT 1`;
      database = true;
    } catch (error) {
      database = false;
    }

    return {
      server: true,
      database,
      timestamp: new Date().toISOString(),
    };
  }
}
