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
import { InventoryService } from './inventory.service';
import { CreateInventoryDto, UpdateInventoryDto, QueryInventoryDto } from './dto';
import { JwtAuthGuard, PermissionsGuard } from '@/common/guards';
import { RequirePermission } from '@/common/decorators';
import { Audit } from '@/audit/decorators/audit.decorator';
import { AuditAction, AuditCategory } from '@/audit/dto';

@Controller('inventory')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class InventoryController {
  constructor(private inventoryService: InventoryService) {}

  @Post()
  @RequirePermission('inventory', 'create', 'all')
  @Audit({ entity: 'InventoryItem', action: AuditAction.CREATE, category: AuditCategory.DATA })
  async create(@Body() dto: CreateInventoryDto) {
    const item = await this.inventoryService.create(dto);
    return {
      success: true,
      data: item,
      message: 'Inventory item created successfully',
    };
  }

  @Get()
  @RequirePermission('inventory', 'view', 'all')
  async findAll(@Query() query: QueryInventoryDto) {
    const result = await this.inventoryService.findAll(query);
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
  @RequirePermission('inventory', 'view', 'all')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    const item = await this.inventoryService.findOne(id);
    return {
      success: true,
      data: item,
    };
  }

  @Put(':id')
  @RequirePermission('inventory', 'update', 'all')
  @Audit({ entity: 'InventoryItem', action: AuditAction.UPDATE, category: AuditCategory.DATA, captureOldValue: true })
  async update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateInventoryDto) {
    const item = await this.inventoryService.update(id, dto);
    return {
      success: true,
      data: item,
      message: 'Inventory item updated successfully',
    };
  }

  @Delete(':id')
  @RequirePermission('inventory', 'delete', 'all')
  @Audit({ entity: 'InventoryItem', action: AuditAction.DELETE, category: AuditCategory.DATA, captureOldValue: true })
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id', ParseIntPipe) id: number) {
    await this.inventoryService.remove(id);
  }
}
