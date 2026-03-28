import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { QrModule } from './modules/qr-management/qr.module';
import { PrismaModule } from './modules/prisma/prisma.module';
import { MenuModule } from './modules/menu/menu.module';
import { PaymentModule } from './modules/payment/payment.module';
import { SessionModule } from './modules/session/session.module';
import { OrderModule } from './modules/order/order.module';
import { IdempotencyInterceptor } from './common/interceptors/idempotency.interceptor';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { BullModule } from '@nestjs/bullmq';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    BullModule.forRoot({
      connection: {
        host: process.env.REDIS_HOST || 'localhost',
        port: Number(process.env.REDIS_PORT) || 6379,
      },
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
