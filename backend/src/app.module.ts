import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { BullModule } from '@nestjs/bullmq';
import { APP_INTERCEPTOR } from '@nestjs/core';

import { redisClient } from './common/redis/redis.client';

import { QrModule } from './modules/qr-management/qr.module';
import { PrismaModule } from './modules/prisma/prisma.module';
import { MenuModule } from './modules/menu/menu.module';
import { PaymentModule } from './modules/payment/payment.module';
import { SessionModule } from './modules/session/session.module';
import { OrderModule } from './modules/order/order.module';
import { IdempotencyInterceptor } from './common/interceptors/idempotency.interceptor';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),

    BullModule.forRoot({
      connection: redisClient,
    }),

    QrModule,
    PrismaModule,
    MenuModule,
    PaymentModule,
    SessionModule,
    OrderModule,
  ],
  providers: [
    {
      provide: APP_INTERCEPTOR,
      useClass: IdempotencyInterceptor,
    },
  ],
})
export class AppModule {}
