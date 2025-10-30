import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  ParseIntPipe,
  UseGuards,
  HttpCode,
  HttpStatus,
  UseInterceptors,
  UploadedFiles,
  BadRequestException,
  Req,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { TicketsService } from './tickets.service';
import { CreateTicketDto, UpdateTicketDto, QueryTicketDto } from './dto';
import { JwtAuthGuard, PermissionsGuard } from '@/common/guards';
import { RequirePermission, CurrentUser } from '@/common/decorators';
import { Audit } from '@/audit/decorators/audit.decorator';
import { AuditAction, AuditCategory } from '@/audit/dto';

@Controller('tickets')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class TicketsController {
  constructor(private ticketsService: TicketsService) {}

  @Post()
  @RequirePermission('tickets', 'create', 'all')
  @Audit({ entity: 'Ticket', action: AuditAction.CREATE, category: AuditCategory.DATA })
  async create(@Body() dto: CreateTicketDto) {
    const ticket = await this.ticketsService.create(dto);
    return {
      success: true,
      data: ticket,
      message: 'Ticket created successfully',
    };
  }

  @Get()
  @RequirePermission('tickets', 'view', 'all')
  async findAll(@Query() query: QueryTicketDto) {
    const result = await this.ticketsService.findAll(query);
    return {
      success: true,
      data: result.items,
      meta: {
        total: result.total,
        page: result.page,
        limit: result.limit,
      },
    };
  }

  @Get(':id')
  @RequirePermission('tickets', 'view', 'all')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    const ticket = await this.ticketsService.findOne(id);
    return {
      success: true,
      data: ticket,
    };
  }

  @Put(':id')
  @RequirePermission('tickets', 'update', 'all')
  @Audit({ entity: 'Ticket', action: AuditAction.UPDATE, category: AuditCategory.DATA, captureOldValue: true })
  async update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateTicketDto) {
    const ticket = await this.ticketsService.update(id, dto);
    return {
      success: true,
      data: ticket,
      message: 'Ticket updated successfully',
    };
  }

  @Delete(':id')
  @RequirePermission('tickets', 'delete', 'all')
  @Audit({ entity: 'Ticket', action: AuditAction.DELETE, category: AuditCategory.DATA, captureOldValue: true })
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id', ParseIntPipe) id: number) {
    await this.ticketsService.remove(id);
  }

  // Attachment endpoints
  @Get(':id/attachments')
  @RequirePermission('tickets', 'view', 'all')
  async getAttachments(@Param('id', ParseIntPipe) id: number) {
    const attachments = await this.ticketsService.getAttachments(id);
    return {
      success: true,
      data: attachments,
    };
  }

  @Post(':id/attachments')
  @RequirePermission('tickets', 'update', 'all')
  @UseInterceptors(FilesInterceptor('files', 10)) // Max 10 files
  @Audit({ entity: 'TicketAttachment', action: AuditAction.CREATE, category: AuditCategory.DATA })
  async uploadAttachments(
    @Param('id', ParseIntPipe) id: number,
    @UploadedFiles() files: Express.Multer.File[],
    @CurrentUser() user: any,
  ) {
    if (!files || files.length === 0) {
      throw new BadRequestException('No files provided');
    }

    // Validate file sizes (max 10MB per file)
    const maxSize = 10 * 1024 * 1024; // 10MB
    for (const file of files) {
      if (file.size > maxSize) {
        throw new BadRequestException(`File ${file.originalname} exceeds 10MB limit`);
      }
    }

    // Process files and convert to base64
    const attachmentsData = files.map((file) => {
      const base64 = file.buffer.toString('base64');
      const mimeType = file.mimetype || 'application/octet-stream';
      const dataUrl = `data:${mimeType};base64,${base64}`;

      return {
        filename: `ticket-${id}-${Date.now()}-${file.originalname}`,
        originalName: file.originalname,
        mimeType,
        size: file.size,
        url: dataUrl,
      };
    });

    const attachments = await this.ticketsService.createAttachments(
      id,
      attachmentsData,
      user.username || 'Sistema',
    );

    return {
      success: true,
      data: attachments,
      message: 'Attachments uploaded successfully',
    };
  }

  @Delete('attachments/:attachmentId')
  @RequirePermission('tickets', 'update', 'all')
  @Audit({ entity: 'TicketAttachment', action: AuditAction.DELETE, category: AuditCategory.DATA })
  @HttpCode(HttpStatus.NO_CONTENT)
  async removeAttachment(@Param('attachmentId', ParseIntPipe) attachmentId: number) {
    await this.ticketsService.removeAttachment(attachmentId);
  }
}
