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
import { NotificationsService } from './notifications.service';
import { CreateNotificationDto, UpdateNotificationDto, QueryNotificationDto } from './dto';
import { JwtAuthGuard } from '@/common/guards';
import { CurrentUser } from '@/common/decorators';

@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationsController {
  constructor(private notificationsService: NotificationsService) {}

  @Get()
  async findAll(@CurrentUser() user: any, @Query() query: QueryNotificationDto) {
    const result = await this.notificationsService.findAll(user.id, query);
    return {
      success: true,
      data: result.items,
      meta: {
        total: result.total,
        page: result.page,
        limit: result.limit,
        pages: result.pages,
      },
    };
  }

  @Get('unread-count')
  async getUnreadCount(@CurrentUser() user: any) {
    const count = await this.notificationsService.getUnreadCount(user.id);
    return {
      success: true,
      data: { count },
    };
  }

  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: any) {
    const notification = await this.notificationsService.findOne(id, user.id);
    return {
      success: true,
      data: notification,
    };
  }

  @Put(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: any,
    @Body() dto: UpdateNotificationDto,
  ) {
    const notification = await this.notificationsService.update(id, user.id, dto);
    return {
      success: true,
      data: notification,
      message: 'Notification updated successfully',
    };
  }

  @Post(':id/mark-as-read')
  @HttpCode(HttpStatus.OK)
  async markAsRead(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: any) {
    const notification = await this.notificationsService.markAsRead(id, user.id);
    return {
      success: true,
      data: notification,
      message: 'Notification marked as read',
    };
  }

  @Post('mark-all-as-read')
  @HttpCode(HttpStatus.OK)
  async markAllAsRead(@CurrentUser() user: any) {
    await this.notificationsService.markAllAsRead(user.id);
    return {
      success: true,
      message: 'All notifications marked as read',
    };
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: any) {
    await this.notificationsService.remove(id, user.id);
  }
}
