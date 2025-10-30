import { apiClient } from '../api/client';

/**
 * Utility function to convert VAPID key from base64 to Uint8Array
 */
function urlBase64ToUint8Array(base64String: string): Uint8Array<ArrayBuffer> {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding)
    .replace(/\-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray as Uint8Array<ArrayBuffer>;
}

export class PushService {
  private vapidPublicKey: string;

  constructor() {
    this.vapidPublicKey = import.meta.env.VITE_VAPID_PUBLIC_KEY;

    if (!this.vapidPublicKey) {
      console.warn('[Push Service] VAPID public key not configured');
    }
  }

  /**
   * Check if push notifications are supported
   */
  isSupported(): boolean {
    return (
      'serviceWorker' in navigator &&
      'PushManager' in window &&
      'Notification' in window
    );
  }

  /**
   * Check current notification permission status
   */
  getPermissionStatus(): NotificationPermission {
    if (!this.isSupported()) {
      return 'denied';
    }
    return Notification.permission;
  }

  /**
   * Request notification permission from user
   */
  async requestPermission(): Promise<NotificationPermission> {
    if (!this.isSupported()) {
      console.warn('[Push Service] Push notifications not supported');
      return 'denied';
    }

    try {
      const permission = await Notification.requestPermission();
      console.log('[Push Service] Permission status:', permission);
      return permission;
    } catch (error) {
      console.error('[Push Service] Error requesting permission:', error);
      return 'denied';
    }
  }

  /**
   * Subscribe user to push notifications
   */
  async subscribe(): Promise<boolean> {
    if (!this.isSupported()) {
      console.warn('[Push Service] Push notifications not supported');
      return false;
    }

    if (!this.vapidPublicKey) {
      console.error('[Push Service] VAPID public key not configured');
      return false;
    }

    try {
      // Check permission
      let permission = this.getPermissionStatus();

      if (permission === 'default') {
        permission = await this.requestPermission();
      }

      if (permission !== 'granted') {
        console.warn('[Push Service] Permission not granted');
        return false;
      }

      // Wait for service worker to be ready
      const registration = await navigator.serviceWorker.ready;
      console.log('[Push Service] Service Worker ready');

      // Check if already subscribed
      let subscription = await registration.pushManager.getSubscription();

      if (!subscription) {
        // Create new subscription
        console.log('[Push Service] Creating new subscription...');

        const applicationServerKey = urlBase64ToUint8Array(this.vapidPublicKey);

        subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey,
        });

        console.log('[Push Service] Push subscription created', subscription);
      } else {
        console.log('[Push Service] Already subscribed', subscription);
      }

      // Send subscription to backend
      await this.sendSubscriptionToBackend(subscription);

      return true;
    } catch (error) {
      console.error('[Push Service] Error subscribing:', error);
      return false;
    }
  }

  /**
   * Unsubscribe user from push notifications
   */
  async unsubscribe(): Promise<boolean> {
    if (!this.isSupported()) {
      return false;
    }

    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();

      if (subscription) {
        // Unsubscribe from push manager
        await subscription.unsubscribe();
        console.log('[Push Service] Unsubscribed from push');

        // Notify backend
        await this.removeSubscriptionFromBackend(subscription);

        return true;
      }

      return false;
    } catch (error) {
      console.error('[Push Service] Error unsubscribing:', error);
      return false;
    }
  }

  /**
   * Get current push subscription
   */
  async getSubscription(): Promise<PushSubscription | null> {
    if (!this.isSupported()) {
      return null;
    }

    try {
      const registration = await navigator.serviceWorker.ready;
      return await registration.pushManager.getSubscription();
    } catch (error) {
      console.error('[Push Service] Error getting subscription:', error);
      return null;
    }
  }

  /**
   * Check if user is currently subscribed
   */
  async isSubscribed(): Promise<boolean> {
    const subscription = await this.getSubscription();
    return subscription !== null;
  }

  /**
   * Send subscription to backend
   */
  private async sendSubscriptionToBackend(subscription: PushSubscription): Promise<void> {
    try {
      const subscriptionJson = subscription.toJSON();

      await apiClient.post('/push-notifications/subscribe', {
        endpoint: subscription.endpoint,
        keys: {
          p256dh: subscriptionJson.keys?.p256dh,
          auth: subscriptionJson.keys?.auth,
        },
        userAgent: navigator.userAgent,
      });

      console.log('[Push Service] Subscription sent to backend');
    } catch (error) {
      console.error('[Push Service] Error sending subscription to backend:', error);
      throw error;
    }
  }

  /**
   * Remove subscription from backend
   */
  private async removeSubscriptionFromBackend(subscription: PushSubscription): Promise<void> {
    try {
      await apiClient.delete('/push-notifications/unsubscribe', {
        data: {
          endpoint: subscription.endpoint,
        },
      });

      console.log('[Push Service] Subscription removed from backend');
    } catch (error) {
      console.error('[Push Service] Error removing subscription from backend:', error);
      throw error;
    }
  }

  /**
   * Show a test notification (local only)
   */
  async showTestNotification(): Promise<void> {
    if (!this.isSupported() || this.getPermissionStatus() !== 'granted') {
      console.warn('[Push Service] Cannot show notification');
      return;
    }

    try {
      const registration = await navigator.serviceWorker.ready;

      await registration.showNotification('Notificación de Prueba', {
        body: 'Las notificaciones están funcionando correctamente',
        icon: '/pwa-192x192.png',
        badge: '/badge-72x72.png',
        tag: 'test-notification',
        data: {
          url: '/',
        },
      });

      console.log('[Push Service] Test notification shown');
    } catch (error) {
      console.error('[Push Service] Error showing test notification:', error);
    }
  }
}

// Export singleton instance
export const pushService = new PushService();
