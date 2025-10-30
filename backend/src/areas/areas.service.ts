import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '@/common/prisma.service';
import { CreateAreaDto, UpdateAreaDto, QueryAreaDto } from './dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class AreasService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateAreaDto) {
    // Check if area name already exists
    const existing = await this.prisma.area.findUnique({
      where: { name: dto.name },
    });

    if (existing) {
      throw new ConflictException(`Area with name "${dto.name}" already exists`);
    }

    // Check if code already exists
    if (dto.code) {
      const existingCode = await this.prisma.area.findUnique({
        where: { code: dto.code },
      });

      if (existingCode) {
        throw new ConflictException(`Area with code "${dto.code}" already exists`);
      }
    }

    // Validate manager exists if provided
    if (dto.managerId) {
      const manager = await this.prisma.employee.findUnique({
        where: { id: dto.managerId },
      });
      if (!manager) {
        throw new NotFoundException(`Employee with ID ${dto.managerId} not found`);
      }
    }

    return this.prisma.area.create({
      data: {
        name: dto.name,
        code: dto.code,
        description: dto.description,
        managerId: dto.managerId,
        status: dto.status || 'ACTIVE',
        color: dto.color,
        icon: dto.icon,
      },
      include: {
        manager: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        _count: {
          select: {
            employees: true,
            zones: true,
          },
        },
      },
    });
  }

  async findAll(query: QueryAreaDto) {
    const { name, status, page = 1, limit = 50 } = query;

    const where: Prisma.AreaWhereInput = {};

    if (name) {
      where.name = { contains: name, mode: 'insensitive' };
    }

    if (status) {
      where.status = status;
    }

    const [items, total] = await Promise.all([
      this.prisma.area.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { name: 'asc' },
        include: {
          manager: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
          _count: {
            select: {
              employees: true,
              zones: true,
            },
          },
        },
      }),
      this.prisma.area.count({ where }),
    ]);

    return { items, total, page, limit };
  }

  async findOne(id: number) {
    const area = await this.prisma.area.findUnique({
      where: { id },
      include: {
        manager: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        zones: {
          select: {
            id: true,
            name: true,
            code: true,
            _count: {
              select: {
                employees: true,
              },
            },
          },
        },
        _count: {
          select: {
            employees: true,
            zones: true,
          },
        },
      },
    });

    if (!area) {
      throw new NotFoundException(`Area with ID ${id} not found`);
    }

    return area;
  }

  async update(id: number, dto: UpdateAreaDto) {
    await this.findOne(id);

    // Check if new name already exists
    if (dto.name) {
      const existing = await this.prisma.area.findUnique({
        where: { name: dto.name },
      });

      if (existing && existing.id !== id) {
        throw new ConflictException(`Area with name "${dto.name}" already exists`);
      }
    }

    // Check if new code already exists
    if (dto.code) {
      const existingCode = await this.prisma.area.findUnique({
        where: { code: dto.code },
      });

      if (existingCode && existingCode.id !== id) {
        throw new ConflictException(`Area with code "${dto.code}" already exists`);
      }
    }

    // Validate manager exists if provided
    if (dto.managerId) {
      const manager = await this.prisma.employee.findUnique({
        where: { id: dto.managerId },
      });
      if (!manager) {
        throw new NotFoundException(`Employee with ID ${dto.managerId} not found`);
      }
    }

    return this.prisma.area.update({
      where: { id },
      data: {
        name: dto.name,
        code: dto.code,
        description: dto.description,
        managerId: dto.managerId,
        status: dto.status,
        color: dto.color,
        icon: dto.icon,
      },
      include: {
        manager: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        _count: {
          select: {
            employees: true,
            zones: true,
          },
        },
      },
    });
  }

  async remove(id: number): Promise<void> {
    await this.findOne(id);

    // Check if area has zones or employees
    const area = await this.prisma.area.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            zones: true,
            employees: true,
          },
        },
      },
    });

    if (area && (area._count.zones > 0 || area._count.employees > 0)) {
      throw new BadRequestException(
        `Cannot delete area with ${area._count.zones} zones and ${area._count.employees} employees. Please reassign or remove them first.`
      );
    }

    await this.prisma.area.delete({ where: { id } });
  }

  // Get all areas without pagination (for dropdowns)
  async getAllAreas() {
    return this.prisma.area.findMany({
      orderBy: { name: 'asc' },
      select: {
        id: true,
        name: true,
        code: true,
      },
    });
  }
}
