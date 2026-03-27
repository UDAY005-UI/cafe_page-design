// src/modules/payment/dto/verify-payment.dto.ts
export class VerifyPaymentDto {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
  paymentId: string; // your Payment.id
}
