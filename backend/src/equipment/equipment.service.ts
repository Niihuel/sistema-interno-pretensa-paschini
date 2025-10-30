import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '@/common/prisma.service';
import { CreateEquipmentDto, UpdateEquipmentDto, QueryEquipmentDto } from './dto';
import { Equipment } from './entities/equipment.entity';
import { Prisma } from '@prisma/client';

@Injectable()
export class EquipmentService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateEquipmentDto): Promise<Equipment> {
    if (dto.serialNumber) {
      const existing = await this.prisma.equipment.findUnique({
        where: { serialNumber: dto.serialNumber },
      });

      if (existing) {
        throw new ConflictException('Serial number already exists');
      }
    }

    return this.prisma.equipment.create({
      data: {
        name: dto.name,
        type: dto.type,
        status: dto.status || 'Activo',
        location: dto.location,
        serialNumber: dto.serialNumber,
        assignedToId: dto.assignedToId,
        ip: dto.ip,
        macAddress: dto.macAddress,
        area: dto.area,
        brand: dto.brand,
        model: dto.model,
        processor: dto.processor,
        ram: dto.ram,
        storage: dto.storage,
        operatingSystem: dto.operatingSystem,
        notes: dto.notes,
        isPersonalProperty: dto.isPersonalProperty || false,
        purchaseDate: dto.purchaseDate ? new Date(dto.purchaseDate) : null,
      },
    });
  }

  async findAll(query: QueryEquipmentDto): Promise<{
    items: Equipment[];
    total: number;
    page: number;
    limit: number;
  }> {
    const { search, type, status, area, assignedToId, page = 1, limit = 50 } = query;

    const where: Prisma.EquipmentWhereInput = {};

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { serialNumber: { contains: search, mode: 'insensitive' } },
        { model: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (type) where.type = type;
    if (status) where.status = status;
    if (area) where.area = area;
    if (assignedToId) where.assignedToId = assignedToId;

    const [items, total] = await Promise.all([
      this.prisma.equipment.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        include: {
          assignedTo: true,
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.equipment.count({ where }),
    ]);

    return { items, total, page, limit };
  }

  async findOne(id: number): Promise<Equipment> {
    const equipment = await this.prisma.equipment.findUnique({
      where: { id },
      include: {
        assignedTo: true,
      },
    });

    if (!equipment) {
      throw new NotFoundException(`Equipment with ID ${id} not found`);
    }

    return equipment;
  }

  async update(id: number, dto: UpdateEquipmentDto): Promise<Equipment> {
    await this.findOne(id);

    if (dto.serialNumber) {
      const existing = await this.prisma.equipment.findFirst({
        where: {
          serialNumber: dto.serialNumber,
          id: { not: id },
        },
      });

      if (existing) {
        throw new ConflictException('Serial number already exists');
      }
    }

    return this.prisma.equipment.update({
      where: { id },
      data: {
        ...dto,
        purchaseDate: dto.purchaseDate ? new Date(dto.purchaseDate) : undefined,
      },
    });
  }

  async remove(id: number): Promise<void> {
    await this.findOne(id);
    await this.prisma.equipment.delete({ where: { id } });
  }
}
