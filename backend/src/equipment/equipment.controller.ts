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
import { EquipmentService } from './equipment.service';
import { CreateEquipmentDto, UpdateEquipmentDto, QueryEquipmentDto } from './dto';
import { JwtAuthGuard, PermissionsGuard } from '@/common/guards';
import { RequirePermission } from '@/common/decorators';
import { Audit } from '@/audit/decorators/audit.decorator';
import { AuditAction, AuditCategory } from '@/audit/dto';

@Controller('equipment')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class EquipmentController {
  constructor(private equipmentService: EquipmentService) {}

  @Post()
  @RequirePermission('equipment', 'create', 'all')
  @Audit({ entity: 'Equipment', action: AuditAction.CREATE, category: AuditCategory.DATA })
  async create(@Body() dto: CreateEquipmentDto) {
    const equipment = await this.equipmentService.create(dto);
    return {
      success: true,
      data: equipment,
      message: 'Equipment created successfully',
    };
  }

  @Get()
  @RequirePermission('equipment', 'view', 'all')
  async findAll(@Query() query: QueryEquipmentDto) {
    const result = await this.equipmentService.findAll(query);
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
  @RequirePermission('equipment', 'view', 'all')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    const equipment = await this.equipmentService.findOne(id);
    return {
      success: true,
      data: equipment,
    };
  }

  @Put(':id')
  @RequirePermission('equipment', 'update', 'all')
  @Audit({ entity: 'Equipment', action: AuditAction.UPDATE, category: AuditCategory.DATA, captureOldValue: true })
  async update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateEquipmentDto) {
    const equipment = await this.equipmentService.update(id, dto);
    return {
      success: true,
      data: equipment,
      message: 'Equipment updated successfully',
    };
  }

  @Delete(':id')
  @RequirePermission('equipment', 'delete', 'all')
  @Audit({ entity: 'Equipment', action: AuditAction.DELETE, category: AuditCategory.DATA, captureOldValue: true })
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id', ParseIntPipe) id: number) {
    await this.equipmentService.remove(id);
  }
}
