import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { QueueEvents } from 'bullmq';
import IORedis from 'ioredis';

@Injectable()
export class OrderQueueEventsService implements OnModuleDestroy, OnModuleInit {
  public events: QueueEvents;

  async onModuleInit() {
    const redisUrl = process.env.REDIS_PUBLIC_URL;

    if (!redisUrl) {
      throw new Error('REDIS_PUBLIC_URL not set');
    }

    const connection = new IORedis(redisUrl, {
      maxRetriesPerRequest: null, // required for BullMQ
    });

    this.events = new QueueEvents('order-queue', {
      connection, // ✅ type-safe + correct
    });

    await this.events.waitUntilReady();

    console.log('QueueEvents ready');
  }

  async onModuleDestroy() {
    if (this.events) {
      await this.events.close();
    }
  }
}
