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
import { PurchaseRequestsService } from './purchase-requests.service';
import { CreatePurchaseRequestDto, UpdatePurchaseRequestDto, QueryPurchaseRequestDto } from './dto';
import { JwtAuthGuard, PermissionsGuard } from '@/common/guards';
import { RequirePermission } from '@/common/decorators';
import { Audit } from '@/audit/decorators/audit.decorator';
import { AuditAction, AuditCategory, AuditSeverity } from '@/audit/dto';

@Controller('purchase-requests')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class PurchaseRequestsController {
  constructor(private purchaseRequestsService: PurchaseRequestsService) {}

  @Post()
  @RequirePermission('purchase_requests', 'create', 'all')
  @Audit({ entity: 'PurchaseRequest', action: AuditAction.CREATE, category: AuditCategory.BUSINESS })
  async create(@Body() dto: CreatePurchaseRequestDto) {
    const purchaseRequest = await this.purchaseRequestsService.create(dto);
    return {
      success: true,
      data: purchaseRequest,
      message: 'Purchase request created successfully',
    };
  }

  @Get()
  @RequirePermission('purchase_requests', 'view', 'all')
  async findAll(@Query() query: QueryPurchaseRequestDto) {
    const result = await this.purchaseRequestsService.findAll(query);
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
  @RequirePermission('purchase_requests', 'view', 'all')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    const purchaseRequest = await this.purchaseRequestsService.findOne(id);
    return {
      success: true,
      data: purchaseRequest,
    };
  }

  @Put(':id')
  @RequirePermission('purchase_requests', 'update', 'all')
  @Audit({
    entity: 'PurchaseRequest',
    action: AuditAction.UPDATE,
    category: AuditCategory.BUSINESS,
    severity: AuditSeverity.MEDIUM,
    captureOldValue: true
  })
  async update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdatePurchaseRequestDto) {
    const purchaseRequest = await this.purchaseRequestsService.update(id, dto);
    return {
      success: true,
      data: purchaseRequest,
      message: 'Purchase request updated successfully',
    };
  }

  @Delete(':id')
  @RequirePermission('purchase_requests', 'delete', 'all')
  @Audit({
    entity: 'PurchaseRequest',
    action: AuditAction.DELETE,
    category: AuditCategory.BUSINESS,
    severity: AuditSeverity.HIGH,
    captureOldValue: true
  })
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id', ParseIntPipe) id: number) {
    await this.purchaseRequestsService.remove(id);
  }
}
