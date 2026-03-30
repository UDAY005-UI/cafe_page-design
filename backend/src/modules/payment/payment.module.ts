import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';

import { redisClient } from '../../common/redis/redis.client';

import { PaymentController } from './payment.controller';
import { PaymentService } from './payment.service';
import { PrismaService } from '../prisma/prisma.service';
import { ORDER_QUEUE } from '../order/order.processor';

@Module({
  imports: [
    BullModule.registerQueue({
      name: ORDER_QUEUE,
      connection: redisClient,
    }),
  ],
  controllers: [PaymentController],
  providers: [PaymentService, PrismaService],
})
export class PaymentModule {}
