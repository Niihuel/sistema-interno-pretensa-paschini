import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@/common/prisma.service';
import { CreateTicketDto, UpdateTicketDto, QueryTicketDto } from './dto';
import { Ticket } from './entities/ticket.entity';
import { Prisma } from '@prisma/client';

@Injectable()
export class TicketsService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateTicketDto): Promise<Ticket> {
    return this.prisma.ticket.create({
      data: {
        title: dto.title,
        description: dto.description,
        status: dto.status || 'OPEN',
        priority: dto.priority || 'MEDIUM',
        requestorId: dto.requestorId,
        technicianId: dto.technicianId,
        category: dto.category,
        area: dto.area,
        ipAddress: dto.ipAddress,
      },
    });
  }

  async findAll(query: QueryTicketDto): Promise<{
    items: Ticket[];
    total: number;
    page: number;
    limit: number;
  }> {
    const { search, status, priority, category, requestorId, technicianId, page = 1, limit = 50 } = query;

    const where: Prisma.TicketWhereInput = {};

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (status) where.status = status;
    if (priority) where.priority = priority;
    if (category) where.category = category;
    if (requestorId) where.requestorId = requestorId;
    if (technicianId) where.technicianId = technicianId;

    const [items, total] = await Promise.all([
      this.prisma.ticket.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        include: {
          requestor: true,
          technician: true,
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.ticket.count({ where }),
    ]);

    return { items, total, page, limit };
  }

  async findOne(id: number): Promise<Ticket> {
    const ticket = await this.prisma.ticket.findUnique({
      where: { id },
      include: {
        requestor: true,
        technician: true,
        comments: true,
        attachments: true,
      },
    });

    if (!ticket) {
      throw new NotFoundException(`Ticket with ID ${id} not found`);
    }

    return ticket;
  }

  async update(id: number, dto: UpdateTicketDto): Promise<Ticket> {
    await this.findOne(id);

    return this.prisma.ticket.update({
      where: { id },
      data: {
        ...dto,
        closedAt: dto.closedAt ? new Date(dto.closedAt) : undefined,
      },
    });
  }

  async remove(id: number): Promise<void> {
    await this.findOne(id);
    await this.prisma.ticket.delete({ where: { id } });
  }

  // Attachment methods
  async getAttachments(ticketId: number) {
    await this.findOne(ticketId); // Verify ticket exists
    return this.prisma.ticketAttachment.findMany({
      where: { ticketId },
      orderBy: { createdAt: 'asc' },
    });
  }

  async createAttachments(
    ticketId: number,
    files: Array<{
      filename: string;
      originalName: string;
      mimeType: string;
      size: number;
      url: string;
    }>,
    uploadedBy: string,
  ) {
    await this.findOne(ticketId); // Verify ticket exists

    return Promise.all(
      files.map((file) =>
        this.prisma.ticketAttachment.create({
          data: {
            ticketId,
            filename: file.filename,
            originalName: file.originalName,
            mimeType: file.mimeType,
            size: file.size,
            url: file.url,
            uploadedBy,
          },
        }),
      ),
    );
  }

  async removeAttachment(id: number): Promise<void> {
    const attachment = await this.prisma.ticketAttachment.findUnique({
      where: { id },
    });

    if (!attachment) {
      throw new NotFoundException(`Attachment with ID ${id} not found`);
    }

    await this.prisma.ticketAttachment.delete({ where: { id } });
  }
}
