import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@/common/prisma.service';
import { CreatePurchaseRequestDto, UpdatePurchaseRequestDto, QueryPurchaseRequestDto } from './dto';
import { PurchaseRequest } from './entities/purchase-request.entity';
import { Prisma } from '@prisma/client';

@Injectable()
export class PurchaseRequestsService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreatePurchaseRequestDto): Promise<PurchaseRequest> {
    return this.prisma.purchaseRequest.create({
      data: {
        requestNumber: dto.requestNumber,
        requestorId: dto.requestorId,
        itemName: dto.itemName,
        category: dto.category,
        description: dto.description,
        justification: dto.justification,
        quantity: dto.quantity || 1,
        estimatedCost: dto.estimatedCost,
        priority: dto.priority,
        status: dto.status || 'PENDING',
        notes: dto.notes,
      },
    });
  }

  async findAll(query: QueryPurchaseRequestDto): Promise<{
    items: PurchaseRequest[];
    total: number;
    page: number;
    limit: number;
  }> {
    const { search, status, priority, category, requestorId, page = 1, limit = 50 } = query;

    const where: Prisma.PurchaseRequestWhereInput = {};

    if (search) {
      where.OR = [
        { itemName: { contains: search, mode: 'insensitive' } },
        { requestNumber: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (status) where.status = status;
    if (priority) where.priority = priority;
    if (category) where.category = category;
    if (requestorId) where.requestorId = requestorId;

    const [items, total] = await Promise.all([
      this.prisma.purchaseRequest.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        include: {
          requestor: true,
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.purchaseRequest.count({ where }),
    ]);

    return { items, total, page, limit };
  }

  async findOne(id: number): Promise<PurchaseRequest> {
    const purchaseRequest = await this.prisma.purchaseRequest.findUnique({
      where: { id },
      include: {
        requestor: true,
      },
    });

    if (!purchaseRequest) {
      throw new NotFoundException(`Purchase request with ID ${id} not found`);
    }

    return purchaseRequest;
  }

  async update(id: number, dto: UpdatePurchaseRequestDto): Promise<PurchaseRequest> {
    await this.findOne(id);

    return this.prisma.purchaseRequest.update({
      where: { id },
      data: {
        ...dto,
        approvalDate: dto.approvalDate ? new Date(dto.approvalDate) : undefined,
        purchaseDate: dto.purchaseDate ? new Date(dto.purchaseDate) : undefined,
        receivedDate: dto.receivedDate ? new Date(dto.receivedDate) : undefined,
      },
    });
  }

  async remove(id: number): Promise<void> {
    await this.findOne(id);
    await this.prisma.purchaseRequest.delete({ where: { id } });
  }
}
