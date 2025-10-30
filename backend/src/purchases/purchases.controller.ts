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
import { PurchasesService } from './purchases.service';
import { CreatePurchaseDto, UpdatePurchaseDto, QueryPurchaseDto } from './dto';
import { JwtAuthGuard, PermissionsGuard } from '@/common/guards';
import { RequirePermission } from '@/common/decorators';
import { Audit } from '@/audit/decorators/audit.decorator';
import { AuditAction, AuditCategory } from '@/audit/dto';

@Controller('purchases')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class PurchasesController {
  constructor(private purchasesService: PurchasesService) {}

  @Post()
  @RequirePermission('purchases', 'create', 'all')
  @Audit({ entity: 'Purchase', action: AuditAction.CREATE, category: AuditCategory.BUSINESS })
  async create(@Body() dto: CreatePurchaseDto) {
    const purchase = await this.purchasesService.create(dto);
    return {
      success: true,
      data: purchase,
      message: 'Purchase created successfully',
    };
  }

  @Get()
  @RequirePermission('purchases', 'view', 'all')
  async findAll(@Query() query: QueryPurchaseDto) {
    const result = await this.purchasesService.findAll(query);
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
  @RequirePermission('purchases', 'view', 'all')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    const purchase = await this.purchasesService.findOne(id);
    return {
      success: true,
      data: purchase,
    };
  }

  @Put(':id')
  @RequirePermission('purchases', 'update', 'all')
  @Audit({ entity: 'Purchase', action: AuditAction.UPDATE, category: AuditCategory.BUSINESS, captureOldValue: true })
  async update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdatePurchaseDto) {
    const purchase = await this.purchasesService.update(id, dto);
    return {
      success: true,
      data: purchase,
      message: 'Purchase updated successfully',
    };
  }

  @Delete(':id')
  @RequirePermission('purchases', 'delete', 'all')
  @Audit({ entity: 'Purchase', action: AuditAction.DELETE, category: AuditCategory.BUSINESS, captureOldValue: true })
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id', ParseIntPipe) id: number) {
    await this.purchasesService.remove(id);
  }
}
