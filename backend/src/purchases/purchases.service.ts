import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@/common/prisma.service';
import { CreatePurchaseDto, UpdatePurchaseDto, QueryPurchaseDto } from './dto';
import { Purchase } from './entities/purchase.entity';
import { Prisma } from '@prisma/client';

@Injectable()
export class PurchasesService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreatePurchaseDto): Promise<Purchase> {
    return this.prisma.purchase.create({
      data: {
        requestId: dto.requestId,
        itemName: dto.itemName,
        requestedQty: dto.requestedQty || 0,
        requestedDate: dto.requestedDate ? new Date(dto.requestedDate) : null,
        receivedQty: dto.receivedQty || 0,
        receivedDate: dto.receivedDate ? new Date(dto.receivedDate) : null,
        pendingQty: dto.pendingQty || 0,
        status: dto.status || 'PENDING',
      },
    });
  }

  async findAll(query: QueryPurchaseDto): Promise<{
    items: Purchase[];
    total: number;
    page: number;
    limit: number;
  }> {
    const { search, status, page = 1, limit = 50 } = query;

    const where: Prisma.PurchaseWhereInput = {};

    if (search) {
      where.OR = [
        { itemName: { contains: search, mode: 'insensitive' } },
        { requestId: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (status) where.status = status;

    const [items, total] = await Promise.all([
      this.prisma.purchase.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.purchase.count({ where }),
    ]);

    return { items, total, page, limit };
  }

  async findOne(id: number): Promise<Purchase> {
    const purchase = await this.prisma.purchase.findUnique({
      where: { id },
    });

    if (!purchase) {
      throw new NotFoundException(`Purchase with ID ${id} not found`);
    }

    return purchase;
  }

  async update(id: number, dto: UpdatePurchaseDto): Promise<Purchase> {
    await this.findOne(id);

    return this.prisma.purchase.update({
      where: { id },
      data: {
        ...dto,
        requestedDate: dto.requestedDate ? new Date(dto.requestedDate) : undefined,
        receivedDate: dto.receivedDate ? new Date(dto.receivedDate) : undefined,
      },
    });
  }

  async remove(id: number): Promise<void> {
    await this.findOne(id);
    await this.prisma.purchase.delete({ where: { id } });
  }
}
