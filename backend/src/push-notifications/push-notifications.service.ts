import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../common/prisma.service';
import * as webpush from 'web-push';
import { SubscribePushDto, SendPushDto } from './dto';

@Injectable()
export class PushNotificationsService {
  private readonly logger = new Logger(PushNotificationsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {
    // Configure web-push with VAPID keys
    const publicKey = this.configService.get<string>('VAPID_PUBLIC_KEY');
    const privateKey = this.configService.get<string>('VAPID_PRIVATE_KEY');
    const subject = this.configService.get<string>('VAPID_SUBJECT');

    if (!publicKey || !privateKey || !subject) {
      this.logger.error('VAPID keys not configured in environment variables');
      throw new Error('VAPID configuration missing');
    }

    webpush.setVapidDetails(subject, publicKey, privateKey);
    this.logger.log('Push notifications service initialized with VAPID keys');
  }

  /**
   * Subscribe a user to push notifications
   */
  async subscribe(userId: number, subscribeDto: SubscribePushDto) {
    try {
      const { endpoint, keys, userAgent } = subscribeDto;

      // Check if subscription already exists
      const existing = await this.prisma.pushSubscription.findFirst({
        where: {
          userId,
          endpoint,
        },
      });

      if (existing) {
        // Update existing subscription
        return await this.prisma.pushSubscription.update({
          where: { id: existing.id },
          data: {
            p256dh: keys.p256dh,
            auth: keys.auth,
            userAgent,
            isActive: true,
            lastUsedAt: new Date(),
          },
        });
      }

      // Create new subscription
      return await this.prisma.pushSubscription.create({
        data: {
          userId,
          endpoint,
          p256dh: keys.p256dh,
          auth: keys.auth,
          userAgent,
        },
      });
    } catch (error) {
      this.logger.error(`Error subscribing user ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Unsubscribe a user from push notifications
   */
  async unsubscribe(userId: number, endpoint: string) {
    try {
      const subscription = await this.prisma.pushSubscription.findFirst({
        where: { userId, endpoint },
      });

      if (!subscription) {
        throw new NotFoundException('Subscription not found');
      }

      await this.prisma.pushSubscription.update({
        where: { id: subscription.id },
        data: { isActive: false },
      });

      this.logger.log(`User ${userId} unsubscribed from endpoint: ${endpoint}`);
    } catch (error) {
      this.logger.error(`Error unsubscribing user ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Get all active subscriptions for a user
   */
  async getUserSubscriptions(userId: number) {
    return await this.prisma.pushSubscription.findMany({
      where: {
        userId,
        isActive: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Send push notification to a specific user
   */
  async sendToUser(userId: number, payload: SendPushDto) {
    try {
      const subscriptions = await this.getUserSubscriptions(userId);

      if (subscriptions.length === 0) {
        this.logger.warn(`No active subscriptions for user ${userId}`);
        return { sent: 0, failed: 0 };
      }

      const results = await Promise.allSettled(
        subscriptions.map((sub) => this.sendPushNotification(sub, payload)),
      );

      const sent = results.filter((r) => r.status === 'fulfilled').length;
      const failed = results.filter((r) => r.status === 'rejected').length;

      this.logger.log(
        `Sent push to user ${userId}: ${sent} successful, ${failed} failed`,
      );

      return { sent, failed };
    } catch (error) {
      this.logger.error(`Error sending push to user ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Send push notification to multiple users
   */
  async sendToUsers(userIds: number[], payload: SendPushDto) {
    const results = await Promise.allSettled(
      userIds.map((userId) => this.sendToUser(userId, payload)),
    );

    const totalSent = results
      .filter((r) => r.status === 'fulfilled')
      .reduce((sum, r: any) => sum + r.value.sent, 0);

    const totalFailed = results
      .filter((r) => r.status === 'fulfilled')
      .reduce((sum, r: any) => sum + r.value.failed, 0);

    this.logger.log(
      `Batch push sent to ${userIds.length} users: ${totalSent} successful, ${totalFailed} failed`,
    );

    return { sent: totalSent, failed: totalFailed, userCount: userIds.length };
  }

  /**
   * Send push notification to all users (broadcast)
   */
  async sendToAll(payload: SendPushDto) {
    try {
      // Get all active subscriptions
      const subscriptions = await this.prisma.pushSubscription.findMany({
        where: { isActive: true },
        select: {
          userId: true,
          endpoint: true,
          p256dh: true,
          auth: true,
        },
      });

      if (subscriptions.length === 0) {
        this.logger.warn('No active subscriptions for broadcast');
        return { sent: 0, failed: 0 };
      }

      const results = await Promise.allSettled(
        subscriptions.map((sub) => this.sendPushNotification(sub, payload)),
      );

      const sent = results.filter((r) => r.status === 'fulfilled').length;
      const failed = results.filter((r) => r.status === 'rejected').length;

      this.logger.log(`Broadcast push sent: ${sent} successful, ${failed} failed`);

      return { sent, failed, total: subscriptions.length };
    } catch (error) {
      this.logger.error('Error broadcasting push notification:', error);
      throw error;
    }
  }

  /**
   * Private method to send push notification to a single subscription
   */
  private async sendPushNotification(
    subscription: {
      endpoint: string;
      p256dh: string;
      auth: string;
      userId?: number;
    },
    payload: SendPushDto,
  ): Promise<void> {
    try {
      const pushSubscription = {
        endpoint: subscription.endpoint,
        keys: {
          p256dh: subscription.p256dh,
          auth: subscription.auth,
        },
      };

      const notificationPayload = JSON.stringify({
        title: payload.title,
        message: payload.message,
        icon: payload.icon || '/pwa-192x192.png',
        badge: payload.badge || '/badge-72x72.png',
        url: payload.url || '/',
        priority: payload.priority || 'NORMAL',
        timestamp: new Date().toISOString(),
        data: payload.data || {},
      });

      const options: webpush.RequestOptions = {
        TTL: 60 * 60 * 24, // 24 hours
      };

      // Set urgency based on priority
      if (payload.priority === 'URGENT' || payload.priority === 'HIGH') {
        options.urgency = 'high';
      } else if (payload.priority === 'LOW') {
        options.urgency = 'low';
      } else {
        options.urgency = 'normal';
      }

      await webpush.sendNotification(
        pushSubscription,
        notificationPayload,
        options,
      );

      // Update lastUsedAt
      if (subscription.userId) {
        await this.prisma.pushSubscription.updateMany({
          where: {
            userId: subscription.userId,
            endpoint: subscription.endpoint,
          },
          data: { lastUsedAt: new Date() },
        });
      }
    } catch (error: any) {
      // Handle subscription errors (expired, invalid, etc.)
      if (error.statusCode === 410 || error.statusCode === 404) {
        this.logger.warn(
          `Subscription expired or invalid: ${subscription.endpoint}`,
        );
        // Deactivate subscription
        await this.prisma.pushSubscription.updateMany({
          where: { endpoint: subscription.endpoint },
          data: { isActive: false },
        });
      } else {
        this.logger.error(`Error sending push notification:`, error);
      }
      throw error;
    }
  }

  /**
   * Cleanup: Remove inactive subscriptions older than 30 days
   */
  async cleanupInactiveSubscriptions() {
    try {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const result = await this.prisma.pushSubscription.deleteMany({
        where: {
          isActive: false,
          updatedAt: { lt: thirtyDaysAgo },
        },
      });

      this.logger.log(`Cleaned up ${result.count} inactive subscriptions`);
      return result.count;
    } catch (error) {
      this.logger.error('Error cleaning up subscriptions:', error);
      throw error;
    }
  }
}
