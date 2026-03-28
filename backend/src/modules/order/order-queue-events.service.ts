import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { QueueEvents } from 'bullmq';

@Injectable()
export class OrderQueueEventsService implements OnModuleDestroy, OnModuleInit {
  public events: QueueEvents;

  async onModuleInit() {
    const redisUrl = process.env.REDIS_PUBLIC_URL;

    if (!redisUrl) {
      throw new Error('REDIS_URL not set');
    }

    this.events = new QueueEvents('order-queue', {
      connection: {
        url: redisUrl,
        maxRetriesPerRequest: null, // 🔥 IMPORTANT
      },
    });

    // 🔥 THIS IS THE ACTUAL FIX
    await this.events.waitUntilReady();

    console.log('QueueEvents ready');
  }

  async onModuleDestroy() {
    await this.events?.close();
  }
}
