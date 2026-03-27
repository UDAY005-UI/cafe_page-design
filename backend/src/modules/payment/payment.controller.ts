import { Controller, Post, Body } from '@nestjs/common';
import { PaymentService } from './payment.service';
import { CreateRazorpayOrderDto } from './dto/create-razorpay-order.dto';
import { VerifyAndCreateOrderDto } from './dto/verify-and-create-order.dto';

@Controller('payments')
export class PaymentController {
  constructor(private paymentService: PaymentService) {}

  // POST /payments/create-razorpay-order
  // Called before opening Razorpay modal — no DB write
  @Post('create-razorpay-order')
  createRazorpayOrder(@Body() dto: CreateRazorpayOrderDto) {
    return this.paymentService.createRazorpayOrder(dto.amount);
  }

  // POST /payments/verify-and-create
  // Called after Razorpay payment success — creates DB order atomically
  @Post('verify-and-create')
  verifyAndCreateOrder(@Body() dto: VerifyAndCreateOrderDto) {
    return this.paymentService.verifyAndCreateOrder(dto);
  }
}
