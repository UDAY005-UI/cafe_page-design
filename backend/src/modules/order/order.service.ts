import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateOrderDto } from './dto/create-order.dto';

@Injectable()
export class OrderService {
  constructor(private prisma: PrismaService) {}

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
        // OFFLINE → default PLACED; ONLINE → stays PLACED until payment confirms
        status: 'PLACED',
        items: {
          create: items.map((item) => ({
            menuItemId: item.menuItemId,
            quantity: item.quantity,
            priceAtTime: priceMap.get(item.menuItemId) ?? 0,
          })),
        },
        // For OFFLINE, create a cash payment record immediately
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
        items: {
          include: { menuItem: true },
        },
        payment: true,
      },
    });

    // ── 5. Touch session to keep it alive ────────────────────────────────────
    await this.prisma.session.update({
      where: { id: sessionId },
      data: { lastActivityAt: new Date() },
    });

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

    // ── 3. Optional: enforce transition rules (recommended) ──────────────
    const invalidTransition =
      order.status === 'CANCELLED' || order.status === 'SERVED';

    if (invalidTransition) {
      throw new BadRequestException('INVALID_STATUS_TRANSITION');
    }

    // ── 4. Update status ─────────────────────────────────────────────────
    return this.prisma.order.update({
      where: { id: orderId },
      data: { status },
    });
  }
  async getAllOrders() {
    return this.prisma.order.findMany({
      include: {
        items: {
          include: {
            menuItem: true,
          },
        },
        payment: true,
        table: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }
}
