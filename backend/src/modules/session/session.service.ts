import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SessionService {
  constructor(private prisma: PrismaService) {}

  private THIRTY_MIN = 30 * 60 * 1000;

  async getOrCreateSession(tableId: string) {
    const existing = await this.prisma.session.findFirst({
      where: {
        tableId,
        isActive: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    if (existing) {
      const isExpired =
        Date.now() - new Date(existing.lastActivityAt).getTime() >
        this.THIRTY_MIN;

      if (!isExpired) {
        return this.prisma.session.update({
          where: { id: existing.id },
          data: { lastActivityAt: new Date() },
        });
      }

      // expire old
      await this.prisma.session.update({
        where: { id: existing.id },
        data: { isActive: false },
      });
    }

    // create new
    return this.prisma.session.create({
      data: {
        tableId,
      },
    });
  }

  async touchSession(sessionId: string) {
    return this.prisma.session.update({
      where: { id: sessionId },
      data: { lastActivityAt: new Date() },
    });
  }
}
