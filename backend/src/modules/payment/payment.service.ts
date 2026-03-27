import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import Razorpay from 'razorpay';
import * as crypto from 'crypto';

@Injectable()
export class PaymentService {
  private razorpay: Razorpay;

  constructor(private prisma: PrismaService) {
    this.razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID!,
      key_secret: process.env.RAZORPAY_KEY_SECRET!,
    });
  }

  // ── ONLINE STEP 1 ────────────────────────────────────────────────────────
  // Creates a Razorpay order for the given cart total.
  // No DB write — purely a handshake with Razorpay to get an order_id.
  async createRazorpayOrder(amount: number) {
    if (!amount || amount <= 0) {
      throw new BadRequestException('Invalid amount');
    }

    const razorpayOrder = await this.razorpay.orders.create({
      amount: Math.round(amount * 100), // ₹ → paise
      currency: 'INR',
      receipt: `receipt_${Date.now()}`,
    });

    return {
      razorpayOrderId: razorpayOrder.id,
      amount: razorpayOrder.amount,
      currency: razorpayOrder.currency,
      key: process.env.RAZORPAY_KEY_ID,
    };
  }

  // ── ONLINE STEP 2 ────────────────────────────────────────────────────────
  // Called only after Razorpay confirms payment.
  // Verifies HMAC signature, then atomically creates DB order + payment.
  // Order is created directly with status PREPARING since payment is done.
  async verifyAndCreateOrder(data: {
    razorpay_order_id: string;
    razorpay_payment_id: string;
    razorpay_signature: string;
    sessionId: string;
    tableId: string;
    items: { menuItemId: string; quantity: number }[];
  }) {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      sessionId,
      tableId,
      items,
    } = data;

    // ── 1. Verify Razorpay HMAC signature ──────────────────────────────────
    const body = `${razorpay_order_id}|${razorpay_payment_id}`;
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET!)
      .update(body)
      .digest('hex');

    if (expectedSignature !== razorpay_signature) {
      throw new BadRequestException('Payment verification failed');
    }

    // ── 2. Validate session ────────────────────────────────────────────────
    const session = await this.prisma.session.findUnique({
      where: { id: sessionId },
    });

    if (!session || !session.isActive) {
      // Money was charged but session expired — staff must reconcile
      throw new BadRequestException('SESSION_EXPIRED_AFTER_PAYMENT');
    }

    // ── 3. Validate menu items ─────────────────────────────────────────────
    const menuItemIds = items.map((i) => i.menuItemId);

    const menuItems = await this.prisma.menuItem.findMany({
      where: { id: { in: menuItemIds }, isAvailable: true },
    });

    if (menuItems.length !== menuItemIds.length) {
      throw new NotFoundException('ITEMS_CHANGED_AFTER_PAYMENT');
    }

    // ── 4. Build price map + total from server-side prices ─────────────────
    // Never trust client-sent prices — always recompute from DB
    const priceMap = new Map(menuItems.map((m) => [m.id, m.price]));
    const totalPrice = items.reduce((sum, item) => {
      return sum + (priceMap.get(item.menuItemId) ?? 0) * item.quantity;
    }, 0);

    // ── 5. Atomically create order + payment record ────────────────────────
    const order = await this.prisma.order.create({
      data: {
        tableId,
        sessionId,
        totalPrice,
        status: 'PREPARING', // payment already confirmed, skip PLACED
        items: {
          create: items.map((item) => ({
            menuItemId: item.menuItemId,
            quantity: item.quantity,
            priceAtTime: priceMap.get(item.menuItemId) ?? 0,
          })),
        },
        payment: {
          create: {
            method: 'ONLINE',
            status: 'SUCCESS',
            amount: totalPrice,
            provider: 'razorpay',
            reference: razorpay_payment_id,
          },
        },
      },
      include: {
        items: { include: { menuItem: true } },
        payment: true,
      },
    });

    // ── 6. Touch session ───────────────────────────────────────────────────
    await this.prisma.session.update({
      where: { id: sessionId },
      data: { lastActivityAt: new Date() },
    });

    return {
      message: 'Payment verified. Order placed.',
      orderId: order.id,
    };
  }
}
