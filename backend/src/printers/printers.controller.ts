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
} from '@nestjs/common';
import { PrintersService } from './printers.service';
import { CreatePrinterDto, UpdatePrinterDto, QueryPrinterDto } from './dto';
import { JwtAuthGuard, PermissionsGuard } from '@/common/guards';
import { RequirePermission } from '@/common/decorators';
import { Audit } from '@/audit/decorators/audit.decorator';
import { AuditAction, AuditCategory } from '@/audit/dto';

@Controller('printers')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class PrintersController {
  constructor(private printersService: PrintersService) {}

  @Post()
  @RequirePermission('printers', 'create', 'all')
  @Audit({ entity: 'Printer', action: AuditAction.CREATE, category: AuditCategory.DATA })
  async create(@Body() dto: CreatePrinterDto) {
    const printer = await this.printersService.create(dto);
    return {
      success: true,
      data: printer,
      message: 'Printer created successfully',
    };
  }

  @Get()
  @RequirePermission('printers', 'view', 'all')
  async findAll(@Query() query: QueryPrinterDto) {
    const result = await this.printersService.findAll(query);
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
  @RequirePermission('printers', 'view', 'all')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    const printer = await this.printersService.findOne(id);
    return {
      success: true,
      data: printer,
    };
  }

  @Put(':id')
  @RequirePermission('printers', 'update', 'all')
  @Audit({ entity: 'Printer', action: AuditAction.UPDATE, category: AuditCategory.DATA, captureOldValue: true })
  async update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdatePrinterDto) {
    const printer = await this.printersService.update(id, dto);
    return {
      success: true,
      data: printer,
      message: 'Printer updated successfully',
    };
  }

  @Delete(':id')
  @RequirePermission('printers', 'delete', 'all')
  @Audit({ entity: 'Printer', action: AuditAction.DELETE, category: AuditCategory.DATA, captureOldValue: true })
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id', ParseIntPipe) id: number) {
    await this.printersService.remove(id);
  }
}
