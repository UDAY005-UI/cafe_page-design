// src/modules/order/order.processor.ts
import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { PrismaService } from '../prisma/prisma.service';
import { OrderGateway } from './orders.gateway';

export const ORDER_QUEUE = 'order-queue';

export interface CreateOrderJobData {
  tableId: string;
  sessionId: string;
  items: { menuItemId: string; quantity: number }[];
  paymentMethod: 'ONLINE' | 'OFFLINE';
  // online only
  razorpay_payment_id?: string;
}

@Processor(ORDER_QUEUE)
export class OrderProcessor extends WorkerHost {
  constructor(
    private prisma: PrismaService,
    private gateway: OrderGateway,
  ) {
    super();
  }

  async process(job: Job<CreateOrderJobData>) {
    const { tableId, sessionId, items, paymentMethod, razorpay_payment_id } =
      job.data;

    // ── 1. Validate menu items + build price map ─────────────────────────
    const menuItemIds = items.map((i) => i.menuItemId);

    const menuItems = await this.prisma.menuItem.findMany({
      where: { id: { in: menuItemIds }, isAvailable: true },
    });

    if (menuItems.length !== menuItemIds.length) {
      throw new Error('ITEMS_UNAVAILABLE'); // BullMQ will retry
    }

    const priceMap = new Map(menuItems.map((m) => [m.id, m.price]));
    const totalPrice = items.reduce(
      (sum, item) => sum + (priceMap.get(item.menuItemId) ?? 0) * item.quantity,
      0,
    );

    const isOnline = paymentMethod === 'ONLINE';

    // ── 2. Create order + payment atomically ─────────────────────────────
    const order = await this.prisma.order.create({
      data: {
        tableId,
        sessionId,
        totalPrice,
        status: isOnline ? 'PREPARING' : 'PLACED',
        items: {
          create: items.map((item) => ({
            menuItemId: item.menuItemId,
            quantity: item.quantity,
            priceAtTime: priceMap.get(item.menuItemId) ?? 0,
          })),
        },
        payment: {
          create: {
            method: isOnline ? 'ONLINE' : 'CASH',
            status: isOnline ? 'SUCCESS' : 'PENDING',
            amount: totalPrice,
            ...(isOnline && {
              provider: 'razorpay',
              reference: razorpay_payment_id,
            }),
          },
        },
      },
      include: {
        items: { include: { menuItem: true } },
        payment: true,
        table: true,
      },
    });

    // ── 3. Touch session ──────────────────────────────────────────────────
    await this.prisma.session.update({
      where: { id: sessionId },
      data: { lastActivityAt: new Date() },
    });

    // ── 4. Emit to admin dashboard ────────────────────────────────────────
    this.gateway.emitNewOrder(order);

    return { orderId: order.id };
  }
}
