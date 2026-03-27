import { Module } from '@nestjs/common';
import { SessionService } from './session.service';
import { SessionController } from './session.controller';
import { PrismaService } from '../prisma/prisma.service';
import { SessionCron } from './session.cron';

@Module({
  controllers: [SessionController],
  providers: [SessionService, PrismaService, SessionCron],
  exports: [SessionService],
})
export class SessionModule {}
