import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '@/common/prisma.service';
import { CreatePrinterDto, UpdatePrinterDto, QueryPrinterDto } from './dto';
import { Printer } from './entities/printer.entity';
import { Prisma } from '@prisma/client';

@Injectable()
export class PrintersService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreatePrinterDto): Promise<Printer> {
    if (dto.serialNumber) {
      const existing = await this.prisma.printer.findUnique({
        where: { serialNumber: dto.serialNumber },
      });

      if (existing) {
        throw new ConflictException('Serial number already exists');
      }
    }

    if (dto.ip) {
      const existing = await this.prisma.printer.findUnique({
        where: { ip: dto.ip },
      });

      if (existing) {
        throw new ConflictException('IP address already exists');
      }
    }

    return this.prisma.printer.create({
      data: {
        model: dto.model,
        serialNumber: dto.serialNumber,
        area: dto.area,
        location: dto.location,
        ip: dto.ip,
        macAddress: dto.macAddress,
        status: dto.status || 'ACTIVE',
        notes: dto.notes,
      },
    });
  }

  async findAll(query: QueryPrinterDto): Promise<{
    items: Printer[];
    total: number;
    page: number;
    limit: number;
  }> {
    const { search, area, status, page = 1, limit = 50 } = query;

    const where: Prisma.PrinterWhereInput = {};

    if (search) {
      where.OR = [
        { model: { contains: search, mode: 'insensitive' } },
        { serialNumber: { contains: search, mode: 'insensitive' } },
        { ip: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (area) where.area = area;
    if (status) where.status = status;

    const [items, total] = await Promise.all([
      this.prisma.printer.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        include: {
          consumables: true,
          replacements: true,
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.printer.count({ where }),
    ]);

    return { items, total, page, limit };
  }

  async findOne(id: number): Promise<Printer> {
    const printer = await this.prisma.printer.findUnique({
      where: { id },
      include: {
        consumables: true,
        replacements: true,
      },
    });

    if (!printer) {
      throw new NotFoundException(`Printer with ID ${id} not found`);
    }

    return printer;
  }

  async update(id: number, dto: UpdatePrinterDto): Promise<Printer> {
    await this.findOne(id);

    if (dto.serialNumber) {
      const existing = await this.prisma.printer.findFirst({
        where: {
          serialNumber: dto.serialNumber,
          id: { not: id },
        },
      });

      if (existing) {
        throw new ConflictException('Serial number already exists');
      }
    }

    if (dto.ip) {
      const existing = await this.prisma.printer.findFirst({
        where: {
          ip: dto.ip,
          id: { not: id },
        },
      });

      if (existing) {
        throw new ConflictException('IP address already exists');
      }
    }

    return this.prisma.printer.update({
      where: { id },
      data: dto,
    });
  }

  async remove(id: number): Promise<void> {
    await this.findOne(id);
    await this.prisma.printer.delete({ where: { id } });
  }
}
