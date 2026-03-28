import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { QueueEvents } from 'bullmq';

@Injectable()
export class OrderQueueEventsService implements OnModuleDestroy {
  public readonly events: QueueEvents;

  constructor() {
    const redisUrl =
      process.env.REDIS_URL ||
      (process.env.NODE_ENV !== 'production' ? 'redis://127.0.0.1:6379' : null);

    if (!redisUrl) {
      throw new Error('REDIS_URL not set');
    }

    this.events = new QueueEvents('order-queue', {
      connection: {
        url: redisUrl,
      },
    });
  }

  async onModuleDestroy() {
    await this.events.close();
  }
}
