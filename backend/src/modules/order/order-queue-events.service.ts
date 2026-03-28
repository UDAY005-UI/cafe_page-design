import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { QueueEvents } from 'bullmq';

@Injectable()
export class OrderQueueEventsService implements OnModuleDestroy {
  public readonly events: QueueEvents;

  constructor() {
    if (!process.env.REDIS_HOST) {
      throw new Error('REDIS_HOST not set');
    }

    this.events = new QueueEvents('order-queue', {
      connection: {
        host: process.env.REDIS_HOST,
        port: Number(process.env.REDIS_PORT),
      },
    });
  }

  async onModuleDestroy() {
    await this.events.close(); // important cleanup
  }
}
