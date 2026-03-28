import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue, QueueEvents } from 'bullmq';
import { PrismaService } from '../prisma/prisma.service';
import { OrderGateway } from './orders.gateway';
import { CreateOrderDto } from './dto/create-order.dto';
import { ORDER_QUEUE, CreateOrderJobData } from './order.processor';

@Injectable()
export class OrderService {
  private queueEvents: QueueEvents;

  constructor(
    private prisma: PrismaService,
    private gateway: OrderGateway,
    @InjectQueue(ORDER_QUEUE) private orderQueue: Queue,
  ) {
    this.queueEvents = new QueueEvents(ORDER_QUEUE, {
      connection: {
        host: process.env.REDIS_HOST || 'localhost',
        port: Number(process.env.REDIS_PORT) || 6379,
      },
    });
  }

  private nowIST(): Date {
    return new Date(Date.now() + 5.5 * 60 * 60 * 1000);
  }

  async getMenuItems() {
    return this.prisma.menuItem.findMany({
      where: { isAvailable: true },
      orderBy: { category: 'asc' },
    });
  }

  async createOrder(dto: CreateOrderDto) {
    const { sessionId, tableId, items } = dto;

    // ── 1. Validate session is active ────────────────────────────────────
    const session = await this.prisma.session.findUnique({
      where: { id: sessionId },
    });

    if (!session || !session.isActive) {
      throw new BadRequestException('SESSION_EXPIRED');
    }

    // ── 2. Push job and wait for result ──────────────────────────────────
    const job = await this.orderQueue.add(
      'create-order',
      {
        tableId,
        sessionId,
        items,
        paymentMethod: 'OFFLINE',
      } satisfies CreateOrderJobData,
      {
        attempts: 3,
        backoff: { type: 'exponential', delay: 2000 },
        jobId: `offline:${sessionId}:${Date.now()}`,
      },
    );

    const result = await job.waitUntilFinished(this.queueEvents);

    return {
      message: 'Order received.',
      orderId: result.orderId,
    };
  }

  async getOrdersBySession(sessionId: string) {
    return this.prisma.order.findMany({
      where: { sessionId },
      include: {
        items: { include: { menuItem: true } },
        payment: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async updateOrderStatus(
    orderId: string,
    status: 'PREPARING' | 'SERVED' | 'CANCELLED',
  ) {
    const allowedStatuses = ['PREPARING', 'SERVED', 'CANCELLED'];
    if (!allowedStatuses.includes(status)) {
      throw new BadRequestException('INVALID_STATUS');
    }

    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!order) throw new NotFoundException('ORDER_NOT_FOUND');

    if (order.status === 'CANCELLED' || order.status === 'SERVED') {
      throw new BadRequestException('INVALID_STATUS_TRANSITION');
    }

    const updated = await this.prisma.order.update({
      where: { id: orderId },
      data: { status },
      include: {
        items: { include: { menuItem: true } },
        payment: true,
        table: true,
      },
    });

    this.gateway.emitOrderUpdated(updated);
    return updated;
  }

  async getAllOrders() {
    return this.prisma.order.findMany({
      where: { status: { in: ['PLACED', 'PREPARING'] } },
      include: {
        items: { include: { menuItem: true } },
        payment: true,
        table: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getServedOrdersWithin(minutes: number) {
    const fromTime = new Date(Date.now() - minutes * 60 * 1000);
    return this.prisma.order.findMany({
      where: { status: 'SERVED', updatedAt: { gte: fromTime } },
      include: {
        items: { include: { menuItem: true } },
        payment: true,
        table: true,
      },
      orderBy: { updatedAt: 'desc' },
    });
  }
}
