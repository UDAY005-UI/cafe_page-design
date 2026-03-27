import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Patch,
  BadRequestException,
} from '@nestjs/common';
import { OrderService } from './order.service';
import { CreateOrderDto } from './dto/create-order.dto';

@Controller('orders')
export class OrderController {
  constructor(private orderService: OrderService) {}

  @Get('menu-items')
  getMenuItems() {
    return this.orderService.getMenuItems();
  }

  @Post()
  createOrder(@Body() dto: CreateOrderDto) {
    return this.orderService.createOrder(dto);
  }

  @Get('session/:sessionId')
  getOrdersBySession(@Param('sessionId') sessionId: string) {
    return this.orderService.getOrdersBySession(sessionId);
  }

  @Patch(':orderId/status')
  updateOrderStatus(
    @Param('orderId') orderId: string,
    @Body('status') status: 'PREPARING' | 'SERVED' | 'CANCELLED',
  ) {
    return this.orderService.updateOrderStatus(orderId, status);
  }
  @Get('all-orders')
  getAllOrders() {
    return this.orderService.getAllOrders();
  }
  @Get('served/:minutes')
  getServedOrders(@Param('minutes') minutes: string) {
    const num = Number(minutes);

    if (!num || isNaN(num) || num <= 0 || num > 1440) {
      throw new BadRequestException('INVALID_TIMEFRAME');
    }

    return this.orderService.getServedOrdersWithin(num);
  }
}
