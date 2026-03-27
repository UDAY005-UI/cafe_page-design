import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { OrderGateway } from './orders.gateway';

@Injectable()
export class OrderService {
  constructor(
    private prisma: PrismaService,
    private gateway: OrderGateway,
  ) {}

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
    const { sessionId, tableId, items, paymentMethod } = dto;

    // ── 1. Validate session is active ────────────────────────────────────────
    const session = await this.prisma.session.findUnique({
      where: { id: sessionId },
    });

    if (!session || !session.isActive) {
      throw new BadRequestException('SESSION_EXPIRED');
    }

    // ── 2. Validate all menu items exist and are available ───────────────────
    const menuItemIds = items.map((i) => i.menuItemId);

    const menuItems = await this.prisma.menuItem.findMany({
      where: {
        id: { in: menuItemIds },
        isAvailable: true,
      },
    });

    if (menuItems.length !== menuItemIds.length) {
      throw new NotFoundException(
        'One or more menu items are unavailable or not found',
      );
    }

    // ── 3. Build price map ───────────────────────────────────────────────────
    const priceMap = new Map(menuItems.map((m) => [m.id, m.price]));

    const totalPrice = items.reduce((sum, item) => {
      const price = priceMap.get(item.menuItemId) ?? 0;
      return sum + price * item.quantity;
    }, 0);

    // ── 4. Create order with items ───────────────────────────────────────────
    const order = await this.prisma.order.create({
      data: {
        tableId,
        sessionId,
        totalPrice,
        status: 'PLACED',
        items: {
          create: items.map((item) => ({
            menuItemId: item.menuItemId,
            quantity: item.quantity,
            priceAtTime: priceMap.get(item.menuItemId) ?? 0,
          })),
        },
        ...(paymentMethod === 'OFFLINE' && {
          payment: {
            create: {
              method: 'CASH',
              status: 'PENDING',
              amount: totalPrice,
            },
          },
        }),
      },
      include: {
        items: { include: { menuItem: true } },
        payment: true,
        table: true,
      },
    });

    // ── 5. Touch session to keep it alive ────────────────────────────────────
    await this.prisma.session.update({
      where: { id: sessionId },
      data: { lastActivityAt: this.nowIST() }, // ← IST
    });

    // ── 6. Emit real-time event ──────────────────────────────────────────────
    this.gateway.emitNewOrder(order);

    return order;
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
    // ── 1. Validate status ───────────────────────────────────────────────
    const allowedStatuses = ['PREPARING', 'SERVED', 'CANCELLED'];
    if (!allowedStatuses.includes(status)) {
      throw new BadRequestException('INVALID_STATUS');
    }

    // ── 2. Check order exists ────────────────────────────────────────────
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!order) {
      throw new NotFoundException('ORDER_NOT_FOUND');
    }

    // ── 3. Enforce transition rules ──────────────────────────────────────
    const invalidTransition =
      order.status === 'CANCELLED' || order.status === 'SERVED';

    if (invalidTransition) {
      throw new BadRequestException('INVALID_STATUS_TRANSITION');
    }

    // ── 4. Update status with full relations for emit ────────────────────
    const updated = await this.prisma.order.update({
      where: { id: orderId },
      data: { status },
      include: {
        items: { include: { menuItem: true } },
        payment: true,
        table: true,
      },
    });

    // ── 5. Emit real-time event ──────────────────────────────────────────
    this.gateway.emitOrderUpdated(updated);

    return updated;
  }

  async getAllOrders() {
    return this.prisma.order.findMany({
      where: {
        status: {
          in: ['PLACED', 'PREPARING'],
        },
      },
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
      where: {
        status: 'SERVED',
        updatedAt: { gte: fromTime },
      },
      include: {
        items: { include: { menuItem: true } },
        payment: true,
        table: true,
      },
      orderBy: { updatedAt: 'desc' },
    });
  }
}
