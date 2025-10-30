import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '@/common/prisma.service';
import { CreateZoneDto, UpdateZoneDto, QueryZoneDto } from './dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class ZonesService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateZoneDto) {
    // Validate area exists if provided
    if (dto.areaId) {
      const area = await this.prisma.area.findUnique({
        where: { id: dto.areaId },
      });
      if (!area) {
        throw new NotFoundException(`Area with ID ${dto.areaId} not found`);
      }

      // Check if zone name already exists in this area
      const existing = await this.prisma.zone.findFirst({
        where: {
          name: dto.name,
          areaId: dto.areaId,
        },
      });

      if (existing) {
        throw new ConflictException(`Zone with name "${dto.name}" already exists in this area`);
      }
    }

    return this.prisma.zone.create({
      data: {
        name: dto.name,
        code: dto.code,
        description: dto.description,
        areaId: dto.areaId,
        status: dto.status || 'ACTIVE',
        color: dto.color,
        icon: dto.icon,
      },
      include: {
        area: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
        _count: {
          select: {
            employees: true,
          },
        },
      },
    });
  }

  async findAll(query: QueryZoneDto) {
    const { search, areaId, status, page = 1, limit = 50 } = query;

    const where: Prisma.ZoneWhereInput = {};

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { code: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (areaId) {
      where.areaId = areaId;
    }

    if (status) {
      where.status = status;
    }

    const [items, total] = await Promise.all([
      this.prisma.zone.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { name: 'asc' },
        include: {
          area: {
            select: {
              id: true,
              name: true,
              code: true,
            },
          },
          _count: {
            select: {
              employees: true,
            },
          },
        },
      }),
      this.prisma.zone.count({ where }),
    ]);

    return { items, total, page, limit };
  }

  async findOne(id: number) {
    const zone = await this.prisma.zone.findUnique({
      where: { id },
      include: {
        area: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
        _count: {
          select: {
            employees: true,
          },
        },
      },
    });

    if (!zone) {
      throw new NotFoundException(`Zone with ID ${id} not found`);
    }

    return zone;
  }

  async update(id: number, dto: UpdateZoneDto) {
    await this.findOne(id);

    // Validate area exists if provided
    if (dto.areaId) {
      const area = await this.prisma.area.findUnique({
        where: { id: dto.areaId },
      });
      if (!area) {
        throw new NotFoundException(`Area with ID ${dto.areaId} not found`);
      }

      // Check if zone name already exists in the new area
      const existing = await this.prisma.zone.findFirst({
        where: {
          name: dto.name || undefined,
          areaId: dto.areaId,
          NOT: { id },
        },
      });

      if (existing) {
        throw new ConflictException(`Zone with name "${dto.name}" already exists in this area`);
      }
    }

    return this.prisma.zone.update({
      where: { id },
      data: {
        name: dto.name,
        code: dto.code,
        description: dto.description,
        areaId: dto.areaId,
        status: dto.status,
        color: dto.color,
        icon: dto.icon,
      },
      include: {
        area: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
        _count: {
          select: {
            employees: true,
          },
        },
      },
    });
  }

  async remove(id: number): Promise<void> {
    await this.findOne(id);

    // Check if zone has employees
    const zone = await this.prisma.zone.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            employees: true,
          },
        },
      },
    });

    if (zone && zone._count.employees > 0) {
      throw new BadRequestException(
        `Cannot delete zone with ${zone._count.employees} employees. Please reassign or remove them first.`
      );
    }

    await this.prisma.zone.delete({ where: { id } });
  }

  // Get all zones without pagination (for dropdowns)
  async getAllZones(areaId?: number) {
    const where: Prisma.ZoneWhereInput = {};

    if (areaId) {
      where.areaId = areaId;
    }

    return this.prisma.zone.findMany({
      where,
      orderBy: { name: 'asc' },
      select: {
        id: true,
        name: true,
        code: true,
        areaId: true,
      },
    });
  }
}
