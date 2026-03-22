import {
  Injectable,
  NotFoundException,
  InternalServerErrorException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateMenuItemDto } from './dto/create-menu-item.dto';
import { UpdateMenuItemDto } from './dto/update-menu-item.dto';

@Injectable()
export class MenuService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateMenuItemDto) {
    try {
      return await this.prisma.menuItem.create({
        data: dto,
      });
    } catch (error) {
      console.error(error);
      throw new InternalServerErrorException('Failed to create menu item');
    }
  }

  async findAll() {
    return this.prisma.menuItem.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const item = await this.prisma.menuItem.findUnique({
      where: { id },
    });

    if (!item) {
      throw new NotFoundException('Menu item not found');
    }

    return item;
  }

  async update(id: string, dto: UpdateMenuItemDto) {
    try {
      return await this.prisma.menuItem.update({
        where: { id },
        data: dto,
      });
    } catch (error) {
      console.error(error);
      throw new NotFoundException('Menu item not found or update failed');
    }
  }

  async remove(id: string) {
    try {
      await this.prisma.menuItem.delete({
        where: { id },
      });

      return { message: 'Menu item deleted successfully' };
    } catch (error) {
      console.error(error);
      throw new NotFoundException('Menu item not found or delete failed');
    }
  }
}
