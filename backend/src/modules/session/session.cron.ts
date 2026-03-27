import { Injectable } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SessionCron {
  constructor(private prisma: PrismaService) {}

  @Cron('*/5 * * * *') // every 5 min
  async expireSessions() {
    const threshold = new Date(Date.now() - 30 * 60 * 1000);

    await this.prisma.session.updateMany({
      where: {
        isActive: true,
        lastActivityAt: {
          lt: threshold,
        },
      },
      data: {
        isActive: false,
      },
    });
  }
}
