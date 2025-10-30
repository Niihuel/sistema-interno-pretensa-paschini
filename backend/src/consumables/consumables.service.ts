import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@/common/prisma.service';

@Injectable()
export class ConsumablesService {
  constructor(private readonly prisma: PrismaService) {}

  async getSummary() {
    const [totalItems, totalStockData, lowStockItems, outOfStock, byType] =
      await Promise.all([
        this.prisma.consumable.count(),
        this.prisma.consumable.aggregate({
          _sum: { quantityAvailable: true },
        }),
        this.prisma.consumable.count({
          where: {
            OR: [
              { quantityAvailable: { lte: 0 } },
              { status: 'LOW_STOCK' },
            ],
          },
        }),
        this.prisma.consumable.count({
          where: { quantityAvailable: 0 },
        }),
        this.prisma.consumable.groupBy({
          by: ['type'],
          _count: true,
          _sum: { quantityAvailable: true },
        }),
      ]);

    return {
      total: totalItems,
      totalStock: totalStockData._sum.quantityAvailable || 0,
      lowStock: lowStockItems,
      outOfStock,
      expired: 0,
      byType: byType.map((group) => ({
        type: group.type,
        count: group._count,
        totalStock: group._sum.quantityAvailable || 0,
      })),
    };
  }

  async getLowStock() {
    return this.prisma.consumable.findMany({
      where: {
        OR: [
          { quantityAvailable: 0 },
          { status: 'LOW_STOCK' },
        ],
      },
      include: {
        printer: true,
      },
      orderBy: { quantityAvailable: 'asc' },
    });
  }

  async getAll(filters?: {
    type?: string;
    printerId?: number;
    status?: string;
    location?: string;
  }) {
    return this.prisma.consumable.findMany({
      where: {
        type: filters?.type,
        printerId: filters?.printerId,
        status: filters?.status,
        location: filters?.location,
      },
      include: {
        printer: true,
        stockMovements: {
          orderBy: { createdAt: 'desc' },
          take: 5,
        },
      },
      orderBy: { itemName: 'asc' },
    });
  }

  async getOne(id: number) {
    const consumable = await this.prisma.consumable.findUnique({
      where: { id },
      include: {
        printer: true,
        stockMovements: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!consumable) {
      throw new NotFoundException(`Consumable with ID ${id} not found`);
    }

    return consumable;
  }

  async create(data: {
    itemName: string;
    type: string;
    color?: string;
    brand?: string;
    model?: string;
    productCode?: string;
    quantityAvailable: number;
    minimumStock: number;
    unitPrice?: number;
    status?: string;
    printerId?: number;
    location?: string;
    notes?: string;
  }) {
    return this.prisma.consumable.create({
      data,
      include: {
        printer: true,
      },
    });
  }

  async update(
    id: number,
    data: Partial<{
      itemName: string;
      type: string;
      color: string;
      brand: string;
      model: string;
      productCode: string;
      quantityAvailable: number;
      minimumStock: number;
      unitPrice: number;
      status: string;
      printerId: number;
      location: string;
      notes: string;
    }>,
  ) {
    await this.getOne(id);

    return this.prisma.consumable.update({
      where: { id },
      data,
      include: {
        printer: true,
      },
    });
  }

  async delete(id: number) {
    await this.getOne(id);

    return this.prisma.consumable.delete({ where: { id } });
  }
}
