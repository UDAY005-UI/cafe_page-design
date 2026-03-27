import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SessionService {
  constructor(private prisma: PrismaService) {}

  private THIRTY_MIN = 30 * 60 * 1000;

  // Returns current time in IST as a Date object
  private nowIST(): Date {
    const now = new Date();
    const istOffset = 5.5 * 60 * 60 * 1000;
    return new Date(now.getTime() + istOffset);
  }

  // Returns current IST time in milliseconds — use this for comparisons
  private nowISTms(): number {
    return Date.now() + 5.5 * 60 * 60 * 1000;
  }

  async getOrCreateSession(tableId: string) {
    const existing = await this.prisma.session.findFirst({
      where: { tableId, isActive: true },
      orderBy: { createdAt: 'desc' },
    });

    if (existing) {
      // Both sides are now IST — comparison is consistent
      const isExpired =
        this.nowISTms() - new Date(existing.lastActivityAt).getTime() >
        this.THIRTY_MIN;

      if (!isExpired) {
        return this.prisma.session.update({
          where: { id: existing.id },
          data: { lastActivityAt: this.nowIST() },
        });
      }

      await this.prisma.session.update({
        where: { id: existing.id },
        data: { isActive: false },
      });
    }

    return this.prisma.session.create({
      data: {
        tableId,
        createdAt: this.nowIST(),
        lastActivityAt: this.nowIST(),
      },
    });
  }

  async touchSession(sessionId: string) {
    return this.prisma.session.update({
      where: { id: sessionId },
      data: { lastActivityAt: this.nowIST() },
    });
  }
}
