// src/order/order.gateway.ts
import { WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server } from 'socket.io';

@WebSocketGateway({
  cors: {
    origin: process.env.FRONTEND_URL ?? 'http://localhost:3000',
    credentials: true,
  },
})
export class OrderGateway {
  @WebSocketServer()
  server: Server;

  emitNewOrder(order: any) {
    this.server.emit('order:new', order);
  }

  emitOrderUpdated(order: any) {
    this.server.emit('order:updated', order);
  }
}
