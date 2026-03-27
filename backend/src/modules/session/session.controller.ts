import { Body, Controller, Post } from '@nestjs/common';
import { SessionService } from './session.service';

@Controller('session')
export class SessionController {
  constructor(private sessionService: SessionService) {}

  @Post('start')
  async start(@Body() body: { tableId: string }) {
    return this.sessionService.getOrCreateSession(body.tableId);
  }

  @Post('heartbeat')
  async heartbeat(@Body() body: { sessionId: string }) {
    return this.sessionService.touchSession(body.sessionId);
  }
}
