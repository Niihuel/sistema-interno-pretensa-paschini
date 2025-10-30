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
import { ZonesService } from './zones.service';
import { CreateZoneDto, UpdateZoneDto, QueryZoneDto } from './dto';
import { JwtAuthGuard, PermissionsGuard } from '@/common/guards';
import { RequirePermission } from '@/common/decorators';
import { Audit } from '@/audit/decorators/audit.decorator';
import { AuditAction, AuditCategory } from '@/audit/dto';

@Controller('zones')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class ZonesController {
  constructor(private zonesService: ZonesService) {}

  @Post()
  @RequirePermission('zones', 'create', 'all')
  @Audit({ entity: 'Zone', action: AuditAction.CREATE, category: AuditCategory.DATA })
  async create(@Body() dto: CreateZoneDto) {
    const zone = await this.zonesService.create(dto);
    return {
      success: true,
      data: zone,
      message: 'Zone created successfully',
    };
  }

  @Get()
  @RequirePermission('zones', 'view', 'all')
  async findAll(@Query() query: QueryZoneDto) {
    const result = await this.zonesService.findAll(query);
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

  @Get('all')
  @RequirePermission('zones', 'view', 'all')
  async getAllZones() {
    const zones = await this.zonesService.getAllZones();
    return {
      success: true,
      data: zones,
    };
  }

  @Get(':id')
  @RequirePermission('zones', 'view', 'all')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    const zone = await this.zonesService.findOne(id);
    return {
      success: true,
      data: zone,
    };
  }

  @Put(':id')
  @RequirePermission('zones', 'update', 'all')
  @Audit({ entity: 'Zone', action: AuditAction.UPDATE, category: AuditCategory.DATA, captureOldValue: true })
  async update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateZoneDto) {
    const zone = await this.zonesService.update(id, dto);
    return {
      success: true,
      data: zone,
      message: 'Zone updated successfully',
    };
  }

  @Delete(':id')
  @RequirePermission('zones', 'delete', 'all')
  @Audit({ entity: 'Zone', action: AuditAction.DELETE, category: AuditCategory.DATA, captureOldValue: true })
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id', ParseIntPipe) id: number) {
    await this.zonesService.remove(id);
  }
}
