import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  ParseIntPipe,
} from '@nestjs/common';
import { ConsumablesService } from './consumables.service';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { RbacGuard } from '@/rbac/guards/rbac.guard';
import { RequireAnyPermission } from '@/common/decorators/permissions.decorator';

@Controller('consumables')
@UseGuards(JwtAuthGuard, RbacGuard)
export class ConsumablesController {
  constructor(private readonly consumablesService: ConsumablesService) {}

  @Get('summary')
  @RequireAnyPermission(
    { resource: 'consumables', action: 'view', scope: 'all' },
    { resource: 'consumables', action: 'view', scope: 'own' },
  )
  getSummary() {
    return this.consumablesService.getSummary();
  }

  @Get('low-stock')
  @RequireAnyPermission(
    { resource: 'consumables', action: 'view', scope: 'all' },
    { resource: 'consumables', action: 'view', scope: 'own' },
  )
  getLowStock() {
    return this.consumablesService.getLowStock();
  }

  @Get()
  @RequireAnyPermission(
    { resource: 'consumables', action: 'view', scope: 'all' },
    { resource: 'consumables', action: 'view', scope: 'own' },
  )
  getAll(
    @Query('type') type?: string,
    @Query('printerId') printerId?: string,
    @Query('status') status?: string,
    @Query('location') location?: string,
  ) {
    return this.consumablesService.getAll({
      type,
      printerId: printerId ? parseInt(printerId, 10) : undefined,
      status,
      location,
    });
  }

  @Get(':id')
  @RequireAnyPermission(
    { resource: 'consumables', action: 'view', scope: 'all' },
    { resource: 'consumables', action: 'view', scope: 'own' },
  )
  getOne(@Param('id', ParseIntPipe) id: number) {
    return this.consumablesService.getOne(id);
  }

  @Post()
  @RequireAnyPermission(
    { resource: 'consumables', action: 'create', scope: 'all' },
  )
  create(@Body() data: any) {
    return this.consumablesService.create(data);
  }

  @Put(':id')
  @RequireAnyPermission(
    { resource: 'consumables', action: 'update', scope: 'all' },
  )
  update(@Param('id', ParseIntPipe) id: number, @Body() data: any) {
    return this.consumablesService.update(id, data);
  }

  @Delete(':id')
  @RequireAnyPermission(
    { resource: 'consumables', action: 'delete', scope: 'all' },
  )
  delete(@Param('id', ParseIntPipe) id: number) {
    return this.consumablesService.delete(id);
  }
}
