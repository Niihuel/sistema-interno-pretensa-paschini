import {
  Controller,
  Post,
  Delete,
  Get,
  Body,
  Param,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { PushNotificationsService } from './push-notifications.service';
import { SubscribePushDto, SendPushDto } from './dto';

@Controller('push-notifications')
@UseGuards(JwtAuthGuard)
export class PushNotificationsController {
  constructor(
    private readonly pushNotificationsService: PushNotificationsService,
  ) {}

  /**
   * Subscribe current user to push notifications
   */
  @Post('subscribe')
  @HttpCode(HttpStatus.CREATED)
  async subscribe(@Request() req, @Body() subscribeDto: SubscribePushDto) {
    return await this.pushNotificationsService.subscribe(
      req.user.userId,
      subscribeDto,
    );
  }

  /**
   * Unsubscribe current user from push notifications
   */
  @Delete('unsubscribe')
  @HttpCode(HttpStatus.NO_CONTENT)
  async unsubscribe(@Request() req, @Body('endpoint') endpoint: string) {
    await this.pushNotificationsService.unsubscribe(req.user.userId, endpoint);
  }

  /**
   * Get current user's subscriptions
   */
  @Get('subscriptions')
  async getSubscriptions(@Request() req) {
    return await this.pushNotificationsService.getUserSubscriptions(
      req.user.userId,
    );
  }

  /**
   * Send push notification to a specific user (admin only)
   * This will be used internally by the notifications service
   */
  @Post('send/:userId')
  async sendToUser(
    @Param('userId') userId: string,
    @Body() sendPushDto: SendPushDto,
  ) {
    return await this.pushNotificationsService.sendToUser(
      parseInt(userId),
      sendPushDto,
    );
  }

  /**
   * Send push notification to multiple users (admin only)
   */
  @Post('send-batch')
  async sendToUsers(@Body() body: { userIds: number[]; payload: SendPushDto }) {
    return await this.pushNotificationsService.sendToUsers(
      body.userIds,
      body.payload,
    );
  }

  /**
   * Broadcast push notification to all users (admin only)
   */
  @Post('broadcast')
  async broadcast(@Body() sendPushDto: SendPushDto) {
    return await this.pushNotificationsService.sendToAll(sendPushDto);
  }
}
