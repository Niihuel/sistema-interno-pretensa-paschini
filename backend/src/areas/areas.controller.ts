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
import { AreasService } from './areas.service';
import { CreateAreaDto, UpdateAreaDto, QueryAreaDto } from './dto';
import { JwtAuthGuard, PermissionsGuard } from '@/common/guards';
import { RequirePermission } from '@/common/decorators';
import { Audit } from '@/audit/decorators/audit.decorator';
import { AuditAction, AuditCategory } from '@/audit/dto';

@Controller('areas')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class AreasController {
  constructor(private areasService: AreasService) {}

  @Post()
  @RequirePermission('areas', 'create', 'all')
  @Audit({ entity: 'Area', action: AuditAction.CREATE, category: AuditCategory.DATA })
  async create(@Body() dto: CreateAreaDto) {
    const area = await this.areasService.create(dto);
    return {
      success: true,
      data: area,
      message: 'Area created successfully',
    };
  }

  @Get()
  @RequirePermission('areas', 'view', 'all')
  async findAll(@Query() query: QueryAreaDto) {
    const result = await this.areasService.findAll(query);
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
  @RequirePermission('areas', 'view', 'all')
  async getAllAreas() {
    const areas = await this.areasService.getAllAreas();
    return {
      success: true,
      data: areas,
    };
  }

  @Get(':id')
  @RequirePermission('areas', 'view', 'all')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    const area = await this.areasService.findOne(id);
    return {
      success: true,
      data: area,
    };
  }

  @Put(':id')
  @RequirePermission('areas', 'update', 'all')
  @Audit({ entity: 'Area', action: AuditAction.UPDATE, category: AuditCategory.DATA, captureOldValue: true })
  async update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateAreaDto) {
    const area = await this.areasService.update(id, dto);
    return {
      success: true,
      data: area,
      message: 'Area updated successfully',
    };
  }

  @Delete(':id')
  @RequirePermission('areas', 'delete', 'all')
  @Audit({ entity: 'Area', action: AuditAction.DELETE, category: AuditCategory.DATA, captureOldValue: true })
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id', ParseIntPipe) id: number) {
    await this.areasService.remove(id);
  }
}
