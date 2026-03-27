import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { QrModule } from './modules/qr-management/qr.module';
import { PrismaModule } from './modules/prisma/prisma.module';
import { MenuModule } from './modules/menu/menu.module';
import { PaymentModule } from './modules/payment/payment.module';
import { SessionModule } from './modules/session/session.module';
import { OrderModule } from './modules/order/order.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    QrModule,
    PrismaModule,
    MenuModule,
    PaymentModule,
    SessionModule,
    OrderModule,
  ],
})
export class AppModule {}
