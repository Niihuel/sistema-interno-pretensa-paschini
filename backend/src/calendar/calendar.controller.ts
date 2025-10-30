import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { CalendarService } from './calendar.service';
import {
  CreateCalendarEventDto,
  QueryCalendarEventDto,
  UpdateCalendarEventDto,
} from './dto';
import { JwtAuthGuard, PermissionsGuard } from '@/common/guards';
import {
  CurrentUser,
  RequireAnyPermission,
  RequirePermission,
} from '@/common/decorators';
import { Audit } from '@/audit/decorators/audit.decorator';
import { AuditAction, AuditCategory } from '@/audit/dto';

@Controller('calendar/events')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class CalendarController {
  constructor(private readonly calendarService: CalendarService) {}

  @Post()
  @RequirePermission('calendar', 'create', 'all')
  @Audit({
    entity: 'CalendarEvent',
    action: AuditAction.CREATE,
    category: AuditCategory.DATA,
  })
  async create(@Body() dto: CreateCalendarEventDto, @CurrentUser() user: any) {
    const event = await this.calendarService.create(dto, user);
    return {
      success: true,
      data: event,
      message: 'Evento creado correctamente',
    };
  }

  @Get()
  @RequireAnyPermission(
    { resource: 'calendar', action: 'view', scope: 'all' },
    { resource: 'calendar', action: 'view', scope: 'own' },
  )
  async findAll(@Query() query: QueryCalendarEventDto, @CurrentUser() user: any) {
    const result = await this.calendarService.findAll(query, user);
    return {
      success: true,
      data: result.items,
      meta: {
        total: result.total,
      },
    };
  }

  @Get(':id')
  @RequireAnyPermission(
    { resource: 'calendar', action: 'view', scope: 'all' },
    { resource: 'calendar', action: 'view', scope: 'own' },
  )
  async findOne(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: any,
  ) {
    const event = await this.calendarService.findOne(id, user);
    return {
      success: true,
      data: event,
    };
  }

  @Put(':id')
  @RequireAnyPermission(
    { resource: 'calendar', action: 'update', scope: 'all' },
    { resource: 'calendar', action: 'update', scope: 'own' },
  )
  @Audit({
    entity: 'CalendarEvent',
    action: AuditAction.UPDATE,
    category: AuditCategory.DATA,
    captureOldValue: true,
  })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateCalendarEventDto,
    @CurrentUser() user: any,
  ) {
    const event = await this.calendarService.update(id, dto, user);
    return {
      success: true,
      data: event,
      message: 'Evento actualizado correctamente',
    };
  }

  @Delete(':id')
  @RequireAnyPermission(
    { resource: 'calendar', action: 'delete', scope: 'all' },
    { resource: 'calendar', action: 'delete', scope: 'own' },
  )
  @Audit({
    entity: 'CalendarEvent',
    action: AuditAction.DELETE,
    category: AuditCategory.DATA,
    captureOldValue: true,
  })
  async remove(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: any,
  ) {
    await this.calendarService.remove(id, user);
    return {
      success: true,
      message: 'Evento eliminado correctamente',
    };
  }
}
