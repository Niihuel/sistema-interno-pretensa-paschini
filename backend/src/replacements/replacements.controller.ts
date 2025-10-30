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
import { ReplacementsService } from './replacements.service';
import { CreateReplacementDto, UpdateReplacementDto, QueryReplacementDto } from './dto';
import { JwtAuthGuard, PermissionsGuard } from '@/common/guards';
import { RequirePermission } from '@/common/decorators';
import { Audit } from '@/audit/decorators/audit.decorator';
import { AuditAction, AuditCategory } from '@/audit/dto';

@Controller('replacements')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class ReplacementsController {
  constructor(private replacementsService: ReplacementsService) {}

  @Post()
  @RequirePermission('replacements', 'create', 'all')
  @Audit({ entity: 'Replacement', action: AuditAction.CREATE, category: AuditCategory.DATA })
  async create(@Body() dto: CreateReplacementDto) {
    const replacement = await this.replacementsService.create(dto);
    return {
      success: true,
      data: replacement,
      message: 'Replacement created successfully',
    };
  }

  @Get()
  @RequirePermission('replacements', 'view', 'all')
  async findAll(@Query() query: QueryReplacementDto) {
    const result = await this.replacementsService.findAll(query);
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
  @RequirePermission('replacements', 'view', 'all')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    const replacement = await this.replacementsService.findOne(id);
    return {
      success: true,
      data: replacement,
    };
  }

  @Put(':id')
  @RequirePermission('replacements', 'update', 'all')
  @Audit({ entity: 'Replacement', action: AuditAction.UPDATE, category: AuditCategory.DATA, captureOldValue: true })
  async update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateReplacementDto) {
    const replacement = await this.replacementsService.update(id, dto);
    return {
      success: true,
      data: replacement,
      message: 'Replacement updated successfully',
    };
  }

  @Delete(':id')
  @RequirePermission('replacements', 'delete', 'all')
  @Audit({ entity: 'Replacement', action: AuditAction.DELETE, category: AuditCategory.DATA, captureOldValue: true })
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id', ParseIntPipe) id: number) {
    await this.replacementsService.remove(id);
  }
}
