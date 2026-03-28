import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import IORedis from 'ioredis';

import { OrderService } from './order.service';
import { OrderController } from './order.controller';
import { OrderProcessor, ORDER_QUEUE } from './order.processor';
import { OrderGateway } from './orders.gateway';
import { PrismaModule } from '../prisma/prisma.module';
import { OrderQueueEventsService } from './order-queue-events.service';

const redisUrl = process.env.REDIS_PUBLIC_URL;

if (!redisUrl) {
  throw new Error('REDIS_PUBLIC_URL not set');
}

@Module({
  imports: [
    PrismaModule,

    // ✅ FIXED: explicit Redis connection
    BullModule.registerQueue({
      name: ORDER_QUEUE,
      connection: new IORedis(redisUrl, {
        maxRetriesPerRequest: null,
      }),
    }),
  ],
  controllers: [OrderController],
  providers: [
    OrderService,
    OrderProcessor,
    OrderGateway,
    OrderQueueEventsService,
  ],
  exports: [OrderService],
})
export class OrderModule {}
