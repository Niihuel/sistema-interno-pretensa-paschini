import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@/common/prisma.service';
import { CreateReplacementDto, UpdateReplacementDto, QueryReplacementDto } from './dto';
import { Replacement } from './entities/replacement.entity';
import { Prisma } from '@prisma/client';

@Injectable()
export class ReplacementsService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateReplacementDto): Promise<Replacement> {
    return this.prisma.replacement.create({
      data: {
        printerId: dto.printerId,
        consumableId: dto.consumableId,
        replacementDate: new Date(dto.replacementDate),
        completionDate: dto.completionDate ? new Date(dto.completionDate) : null,
        rendimientoDays: dto.rendimientoDays,
        notes: dto.notes,
      },
    });
  }

  async findAll(query: QueryReplacementDto): Promise<{
    items: Replacement[];
    total: number;
    page: number;
    limit: number;
  }> {
    const { printerId, consumableId, startDate, endDate, page = 1, limit = 50 } = query;

    const where: Prisma.ReplacementWhereInput = {};

    if (printerId) where.printerId = printerId;
    if (consumableId) where.consumableId = consumableId;

    if (startDate || endDate) {
      where.replacementDate = {};
      if (startDate) where.replacementDate.gte = new Date(startDate);
      if (endDate) where.replacementDate.lte = new Date(endDate);
    }

    const [items, total] = await Promise.all([
      this.prisma.replacement.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        include: {
          printer: true,
          consumable: true,
        },
        orderBy: { replacementDate: 'desc' },
      }),
      this.prisma.replacement.count({ where }),
    ]);

    return { items, total, page, limit };
  }

  async findOne(id: number): Promise<Replacement> {
    const replacement = await this.prisma.replacement.findUnique({
      where: { id },
      include: {
        printer: true,
        consumable: true,
      },
    });

    if (!replacement) {
      throw new NotFoundException(`Replacement with ID ${id} not found`);
    }

    return replacement;
  }

  async update(id: number, dto: UpdateReplacementDto): Promise<Replacement> {
    await this.findOne(id);

    return this.prisma.replacement.update({
      where: { id },
      data: {
        ...dto,
        replacementDate: dto.replacementDate ? new Date(dto.replacementDate) : undefined,
        completionDate: dto.completionDate ? new Date(dto.completionDate) : undefined,
      },
    });
  }

  async remove(id: number): Promise<void> {
    await this.findOne(id);
    await this.prisma.replacement.delete({ where: { id } });
  }
}
