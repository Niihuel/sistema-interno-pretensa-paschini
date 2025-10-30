import { io, Socket } from 'socket.io-client';

export type NotificationEventHandler = (data: any) => void;

class NotificationsWebSocketService {
  private socket: Socket | null = null;
  private isConnected = false;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 2000;
  private listeners = new Map<string, Set<NotificationEventHandler>>();

  /**
   * Connect to notifications WebSocket
   */
  connect(token: string) {
    if (this.socket?.connected) {
      return;
    }

    const backendUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';

    this.socket = io(`${backendUrl}/notifications`, {
      auth: {
        token,
      },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: this.reconnectDelay,
      reconnectionAttempts: this.maxReconnectAttempts,
    });

    this.setupEventHandlers();
  }

  /**
   * Setup socket event handlers
   */
  private setupEventHandlers() {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      this.isConnected = true;
      this.reconnectAttempts = 0;
      this.emitToListeners('connected', {});
    });

    this.socket.on('disconnect', (reason) => {
      this.isConnected = false;
      this.emitToListeners('disconnected', { reason });
    });

    this.socket.on('connect_error', () => {
      this.reconnectAttempts++;

      if (this.reconnectAttempts >= this.maxReconnectAttempts) {
        this.disconnect();
      }
    });

    // Real-time notification events
    this.socket.on('new-notification', (data) => {
      this.emitToListeners('new-notification', data);

      // Show native browser notification if permission granted
      this.showBrowserNotification(data);
    });

    this.socket.on('new-broadcast-notification', (data) => {
      this.emitToListeners('new-broadcast-notification', data);

      // Show native browser notification if permission granted
      this.showBrowserNotification(data);
    });

    this.socket.on('unread-count', (data) => {
      this.emitToListeners('unread-count', data);
    });
  }

  /**
   * Show native browser notification (PWA)
   */
  private showBrowserNotification(notification: any) {
    // Check if browser supports notifications
    if (!('Notification' in window)) {
      return;
    }

    // Check if permission is granted
    if (Notification.permission !== 'granted') {
      return;
    }

    // Show notification
    const title = notification.title || 'Nueva notificación';
    const body = notification.message || '';
    const icon = '/logo.png';
    const badge = '/logo.png';

    // Determine notification options based on priority
    const options: NotificationOptions = {
      body,
      icon,
      badge,
      tag: `notification-${notification.id || Date.now()}`,
      requireInteraction: notification.priority === 'URGENT',
      silent: notification.priority === 'LOW',
      data: notification,
    };

    try {
      const notif = new Notification(title, options);

      notif.onclick = () => {
        window.focus();
        notif.close();
      };
    } catch {
      // Silently fail if browser notification fails
    }
  }

  /**
   * Request browser notification permission
   */
  async requestNotificationPermission(): Promise<NotificationPermission> {
    if (!('Notification' in window)) {
      return 'denied';
    }

    if (Notification.permission === 'granted') {
      return 'granted';
    }

    if (Notification.permission !== 'denied') {
      const permission = await Notification.requestPermission();
      return permission;
    }

    return Notification.permission;
  }

  /**
   * Disconnect from WebSocket
   */
  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
    }
  }

  /**
   * Subscribe to an event
   */
  on(event: string, handler: NotificationEventHandler) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(handler);
  }

  /**
   * Unsubscribe from an event
   */
  off(event: string, handler: NotificationEventHandler) {
    const handlers = this.listeners.get(event);
    if (handlers) {
      handlers.delete(handler);
      if (handlers.size === 0) {
        this.listeners.delete(event);
      }
    }
  }

  /**
   * Emit event to all listeners
   */
  private emitToListeners(event: string, data: any) {
    const handlers = this.listeners.get(event);
    if (handlers) {
      handlers.forEach((handler) => {
        try {
          handler(data);
        } catch {
          // Silently handle handler errors in production
        }
      });
    }
  }

  /**
   * Emit event to server
   */
  emit(event: string, data?: any): Promise<any> {
    return new Promise((resolve, reject) => {
      if (!this.socket || !this.isConnected) {
        reject(new Error('Not connected to WebSocket'));
        return;
      }

      this.socket.emit(event, data, (response: any) => {
        if (response?.error) {
          reject(new Error(response.error));
        } else {
          resolve(response);
        }
      });
    });
  }

  /**
   * Get connection status
   */
  getConnectionStatus() {
    return {
      isConnected: this.isConnected,
      reconnectAttempts: this.reconnectAttempts,
    };
  }

  /**
   * Mark notification as read via WebSocket
   */
  async markAsRead(notificationId: number) {
    return this.emit('mark-as-read', { notificationId });
  }

  /**
   * Mark all notifications as read via WebSocket
   */
  async markAllAsRead() {
    return this.emit('mark-all-as-read');
  }

  /**
   * Get unread count via WebSocket
   */
  async getUnreadCount() {
    return this.emit('get-unread-count');
  }
}

// Export singleton instance
export const notificationsWS = new NotificationsWebSocketService();
