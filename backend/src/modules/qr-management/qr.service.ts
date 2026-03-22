import {
  ConflictException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { PrismaService } from 'src/modules/prisma/prisma.service';
import QRCode from 'qrcode';

@Injectable()
export class QrService {
  constructor(private prisma: PrismaService) {}
  async generateQr(tableNumber: number): Promise<Buffer> {
    try {
      const result: string = await this.prisma.$transaction(
        async (tx) => {
          const existingTable = await tx.table.findUnique({
            where: { tableNumber },
          });

          if (existingTable) {
            const existingQr = await tx.qR.findUnique({
              where: { tableId: existingTable.id },
            });

            if (!existingQr) {
              throw new Error('QR missing for existing table');
            }

            return existingQr.url;
          }

          const table = await tx.table.create({
            data: { tableNumber },
          });

          const url = `${process.env.FRONTEND_URL}/t/${table.id}`;

          await tx.qR.create({
            data: {
              tableId: table.id,
              url,
            },
          });

          return url;
        },
        { timeout: 60000 },
      );

      return await QRCode.toBuffer(result);
    } catch (error) {
      console.error(error);
      if (error instanceof ConflictException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to generate qr');
    }
  }
  async getQrImageByTableNumber(tableNumber: number): Promise<Buffer> {
    const qr = await this.prisma.qR.findFirst({
      where: {
        table: { tableNumber },
      },
    });

    if (!qr) {
      throw new Error('QR not found');
    }

    return QRCode.toBuffer(qr.url);
  }
  async getAllQrImages() {
    const qrs = await this.prisma.qR.findMany({
      include: {
        table: {
          select: { tableNumber: true },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    const result = await Promise.all(
      qrs.map(async (qr) => {
        const buffer = await QRCode.toBuffer(qr.url);

        return {
          tableNumber: qr.table.tableNumber,
          qr: buffer.toString('base64'),
        };
      }),
    );

    return result;
  }
}
