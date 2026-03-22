import { Body, Controller, Get, Param, Post, Res } from '@nestjs/common';
import { QrService } from './qr.service';
import type { Response } from 'express';

@Controller('qr')
export class QrController {
  constructor(private qrService: QrService) {}

  @Post('generate')
  async generateQr(
    @Body() body: { tableNumber: number },
    @Res() res: Response,
  ) {
    const qr = await this.qrService.generateQr(body.tableNumber);

    res.setHeader('Content-Type', 'image/png');
    res.send(qr);
  }

  // ✅ GET /qr/t/:tableNumber → return QR image
  @Get('t/:tableNumber')
  async getQrByTableNumber(
    @Param('tableNumber') tableNumber: string,
    @Res() res: Response,
  ) {
    const qr = await this.qrService.getQrImageByTableNumber(
      Number(tableNumber),
    );

    res.setHeader('Content-Type', 'image/png');
    res.send(qr);
  }

  // ✅ GET /qr → return ALL QR images (as JSON base64)
  @Get()
  async getAllQr() {
    return this.qrService.getAllQrImages();
  }
}
