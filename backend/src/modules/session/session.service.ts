import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SessionService {
  constructor(private prisma: PrismaService) {}

  private THIRTY_MIN = 30 * 60 * 1000;

  // Helper: current time as IST-offset Date
  private nowIST(): Date {
    const now = new Date();
    // Convert to IST (UTC+5:30)
    const istOffset = 5.5 * 60 * 60 * 1000;
    return new Date(now.getTime() + istOffset);
  }

  async getOrCreateSession(tableId: string) {
    const existing = await this.prisma.session.findFirst({
      where: { tableId, isActive: true },
      orderBy: { createdAt: 'desc' },
    });

    if (existing) {
      const isExpired =
        Date.now() - new Date(existing.lastActivityAt).getTime() >
        this.THIRTY_MIN;

      if (!isExpired) {
        return this.prisma.session.update({
          where: { id: existing.id },
          data: { lastActivityAt: this.nowIST() }, // ← IST timestamp
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
        createdAt: this.nowIST(), // ← IST timestamp
        lastActivityAt: this.nowIST(), // ← IST timestamp
      },
    });
  }

  async touchSession(sessionId: string) {
    return this.prisma.session.update({
      where: { id: sessionId },
      data: { lastActivityAt: this.nowIST() }, // ← IST timestamp
    });
  }
}
