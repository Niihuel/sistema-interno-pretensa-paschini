import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger, UseGuards } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { NotificationsService } from './notifications.service';

// Guard para WebSocket JWT
@WebSocketGateway({
  cors: {
    origin: process.env.FRONTEND_URL || 'http://192.168.0.219:4350',
    credentials: true,
  },
  namespace: '/notifications',
})
export class NotificationsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(NotificationsGateway.name);
  private userSockets = new Map<number, Set<string>>(); // userId => Set<socketId>

  constructor(
    private notificationsService: NotificationsService,
    private jwtService: JwtService,
  ) {}

  /**
   * Handle client connection
   */
  async handleConnection(client: Socket) {
    try {
      // Obtener el token del handshake
      const token = client.handshake.auth?.token || client.handshake.headers?.authorization?.replace('Bearer ', '');

      if (!token) {
        this.logger.warn(`Client ${client.id} attempted to connect without token`);
        client.disconnect();
        return;
      }

      // Verificar el token
      const payload = await this.jwtService.verifyAsync(token, {
        secret: process.env.JWT_SECRET,
      });

      const userId = payload.sub;

      // Guardar el userId en el socket
      client.data.userId = userId;

      // Agregar socket a la lista de sockets del usuario
      if (!this.userSockets.has(userId)) {
        this.userSockets.set(userId, new Set());
      }
      this.userSockets.get(userId)!.add(client.id);

      // Unir al room del usuario
      client.join(`user:${userId}`);

      this.logger.log(`Client ${client.id} connected for user ${userId}`);

      // Enviar conteo de notificaciones no leídas al conectarse
      const unreadCount = await this.notificationsService.getUnreadCount(userId);
      client.emit('unread-count', { count: unreadCount });

    } catch (error) {
      this.logger.error(`Connection error for client ${client.id}:`, error.message);
      client.disconnect();
    }
  }

  /**
   * Handle client disconnection
   */
  handleDisconnect(client: Socket) {
    const userId = client.data.userId;

    if (userId && this.userSockets.has(userId)) {
      const sockets = this.userSockets.get(userId)!;
      sockets.delete(client.id);

      if (sockets.size === 0) {
        this.userSockets.delete(userId);
      }
    }

    this.logger.log(`Client ${client.id} disconnected`);
  }

  /**
   * Client requests unread count
   */
  @SubscribeMessage('get-unread-count')
  async handleGetUnreadCount(@ConnectedSocket() client: Socket) {
    const userId = client.data.userId;

    if (!userId) {
      return { error: 'Unauthorized' };
    }

    const count = await this.notificationsService.getUnreadCount(userId);
    return { count };
  }

  /**
   * Client marks notification as read
   */
  @SubscribeMessage('mark-as-read')
  async handleMarkAsRead(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { notificationId: number },
  ) {
    const userId = client.data.userId;

    if (!userId) {
      return { error: 'Unauthorized' };
    }

    try {
      await this.notificationsService.markAsRead(data.notificationId, userId);

      // Enviar conteo actualizado
      const unreadCount = await this.notificationsService.getUnreadCount(userId);
      client.emit('unread-count', { count: unreadCount });

      return { success: true };
    } catch (error) {
      return { error: error.message };
    }
  }

  /**
   * Client marks all notifications as read
   */
  @SubscribeMessage('mark-all-as-read')
  async handleMarkAllAsRead(@ConnectedSocket() client: Socket) {
    const userId = client.data.userId;

    if (!userId) {
      return { error: 'Unauthorized' };
    }

    try {
      await this.notificationsService.markAllAsRead(userId);

      // Enviar conteo actualizado (debería ser 0)
      client.emit('unread-count', { count: 0 });

      return { success: true };
    } catch (error) {
      return { error: error.message };
    }
  }

  /**
   * Emit notification to specific user
   * Called by NotificationsService when creating a new notification
   */
  async emitToUser(userId: number, event: string, data: any) {
    this.server.to(`user:${userId}`).emit(event, data);
    this.logger.log(`Emitted ${event} to user ${userId}`);
  }

  /**
   * Emit notification to all users
   * Called by NotificationsService for broadcast notifications
   */
  async emitToAll(event: string, data: any) {
    this.server.emit(event, data);
    this.logger.log(`Broadcast ${event} to all connected clients`);
  }

  /**
   * Get unread count for a user and emit to their sockets
   */
  async emitUnreadCount(userId: number) {
    const count = await this.notificationsService.getUnreadCount(userId);
    this.server.to(`user:${userId}`).emit('unread-count', { count });
  }
}
