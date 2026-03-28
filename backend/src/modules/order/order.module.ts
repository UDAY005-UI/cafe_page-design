import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { OrderService } from './order.service';
import { OrderController } from './order.controller';
import { OrderProcessor, ORDER_QUEUE } from './order.processor';
import { OrderGateway } from './orders.gateway';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule, BullModule.registerQueue({ name: ORDER_QUEUE })],
  controllers: [OrderController],
  providers: [OrderService, OrderProcessor, OrderGateway],
  exports: [OrderService],
})
export class OrderModule {}
