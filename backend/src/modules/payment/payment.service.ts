import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { PrismaService } from '../prisma/prisma.service';
import Razorpay from 'razorpay';
import * as crypto from 'crypto';
import { ORDER_QUEUE, CreateOrderJobData } from '../order/order.processor';

@Injectable()
export class PaymentService {
  private razorpay: Razorpay;

  constructor(
    private prisma: PrismaService,
    @InjectQueue(ORDER_QUEUE) private orderQueue: Queue,
  ) {
    this.razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID!,
      key_secret: process.env.RAZORPAY_KEY_SECRET!,
    });
    // ✅ No QueueEvents here — was the root cause of the hanging requests
  }

  // ── ONLINE STEP 1 ────────────────────────────────────────────────────────
  async createRazorpayOrder(amount: number) {
    if (!amount || amount <= 0) {
      throw new BadRequestException('Invalid amount');
    }

    const razorpayOrder = await this.razorpay.orders.create({
      amount: Math.round(amount * 100),
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

    // ── 1. Verify HMAC signature ──────────────────────────────────────────
    const body = `${razorpay_order_id}|${razorpay_payment_id}`;
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET!)
      .update(body)
      .digest('hex');

    if (expectedSignature !== razorpay_signature) {
      throw new BadRequestException('Payment verification failed');
    }

    // ── 2. Validate session ───────────────────────────────────────────────
    const session = await this.prisma.session.findUnique({
      where: { id: sessionId },
    });

    if (!session || !session.isActive) {
      throw new BadRequestException('SESSION_EXPIRED_AFTER_PAYMENT');
    }

    // ── 3. Push job ───────────────────────────────────────────────────────
    const job = await this.orderQueue.add(
      'create-order',
      {
        tableId,
        sessionId,
        items,
        paymentMethod: 'ONLINE',
        razorpay_payment_id,
      } satisfies CreateOrderJobData,
      {
        attempts: 3,
        backoff: { type: 'exponential', delay: 2000 },
        jobId: `online:${razorpay_payment_id}`,
      },
    );

    // ── 4. Poll for result instead of waitUntilFinished ───────────────────
    const result = await this.pollJobResult(job.id!);

    return {
      message: 'Payment verified. Order placed.',
      orderId: result.orderId,
    };
  }

  private async pollJobResult(
    jobId: string,
    timeoutMs = 15000,
    intervalMs = 300,
  ): Promise<{ orderId: string }> {
    const deadline = Date.now() + timeoutMs;

    while (Date.now() < deadline) {
      const job = await this.orderQueue.getJob(jobId);

      if (!job) throw new Error('JOB_NOT_FOUND');

      const state = await job.getState();

      if (state === 'completed') {
        return job.returnvalue as { orderId: string };
      }

      if (state === 'failed') {
        throw new Error(job.failedReason ?? 'JOB_FAILED');
      }

      await new Promise((res) => setTimeout(res, intervalMs));
    }

    throw new Error('JOB_TIMEOUT');
  }
}
