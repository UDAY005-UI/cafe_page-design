import { Module } from '@nestjs/common';
import { QrController } from './qr.controller';
import { QrService } from './qr.service';
import { PrismaModule } from '../prisma/prisma.module';
@Module({
  imports: [PrismaModule],
  controllers: [QrController],
  providers: [QrService],
})
export class QrModule {}
