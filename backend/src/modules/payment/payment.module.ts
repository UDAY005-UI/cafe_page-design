import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import IORedis from 'ioredis';

import { PaymentController } from './payment.controller';
import { PaymentService } from './payment.service';
import { PrismaService } from '../prisma/prisma.service';
import { ORDER_QUEUE } from '../order/order.processor';

const redisUrl = process.env.REDIS_PUBLIC_URL;

if (!redisUrl) {
  throw new Error('REDIS_PUBLIC_URL not set');
}

@Module({
  imports: [
    BullModule.registerQueue({
      name: ORDER_QUEUE,
      connection: new IORedis(redisUrl, {
        maxRetriesPerRequest: null,
      }),
    }),
  ],
  controllers: [PaymentController],
  providers: [PaymentService, PrismaService],
})
export class PaymentModule {}
