import { IsNumber, Min } from 'class-validator';

export class CreateRazorpayOrderDto {
  @IsNumber()
  @Min(1)
  amount: number;
}
