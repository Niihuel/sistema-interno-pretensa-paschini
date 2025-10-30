import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '@/common/prisma.service';
import { CreateInventoryDto, UpdateInventoryDto, QueryInventoryDto } from './dto';
import { InventoryItem } from './entities/inventory.entity';
import { Prisma } from '@prisma/client';

@Injectable()
export class InventoryService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateInventoryDto): Promise<InventoryItem> {
    if (dto.serialNumber) {
      const existing = await this.prisma.inventoryItem.findUnique({
        where: { serialNumber: dto.serialNumber },
      });

      if (existing) {
        throw new ConflictException('Serial number already exists');
      }
    }

    return this.prisma.inventoryItem.create({
      data: {
        name: dto.name,
        category: dto.category,
        brand: dto.brand,
        model: dto.model,
        serialNumber: dto.serialNumber,
        quantity: dto.quantity || 0,
        location: dto.location,
        status: dto.status || 'AVAILABLE',
        condition: dto.condition || 'NEW',
        notes: dto.notes,
        assignedToId: dto.assignedToId,
        isPersonalProperty: dto.isPersonalProperty || false,
      },
    });
  }

  async findAll(query: QueryInventoryDto): Promise<{
    items: InventoryItem[];
    total: number;
    page: number;
    limit: number;
  }> {
    const { search, category, status, condition, assignedToId, page = 1, limit = 50 } = query;

    const where: Prisma.InventoryItemWhereInput = {};

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { serialNumber: { contains: search, mode: 'insensitive' } },
        { model: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (category) where.category = category;
    if (status) where.status = status;
    if (condition) where.condition = condition;
    if (assignedToId) where.assignedToId = assignedToId;

    const [items, total] = await Promise.all([
      this.prisma.inventoryItem.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        include: {
          assignedTo: true,
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.inventoryItem.count({ where }),
    ]);

    return { items, total, page, limit };
  }

  async findOne(id: number): Promise<InventoryItem> {
    const item = await this.prisma.inventoryItem.findUnique({
      where: { id },
      include: {
        assignedTo: true,
      },
    });

    if (!item) {
      throw new NotFoundException(`Inventory item with ID ${id} not found`);
    }

    return item;
  }

  async update(id: number, dto: UpdateInventoryDto): Promise<InventoryItem> {
    await this.findOne(id);

    if (dto.serialNumber) {
      const existing = await this.prisma.inventoryItem.findFirst({
        where: {
          serialNumber: dto.serialNumber,
          id: { not: id },
        },
      });

      if (existing) {
        throw new ConflictException('Serial number already exists');
      }
    }

    return this.prisma.inventoryItem.update({
      where: { id },
      data: dto,
    });
  }

  async remove(id: number): Promise<void> {
    await this.findOne(id);
    await this.prisma.inventoryItem.delete({ where: { id } });
  }
}
