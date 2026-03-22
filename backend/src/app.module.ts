import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { QrModule } from './modules/qr-management/qr.module';
import { PrismaModule } from './modules/prisma/prisma.module';
import { MenuModule } from './modules/menu/menu.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    QrModule,
    PrismaModule,
    MenuModule
  ],
})
export class AppModule {}
