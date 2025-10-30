import { useState, useEffect, useCallback } from 'react';
import { pushService } from '../services/push.service';

export interface UsePushNotificationsReturn {
  isSupported: boolean;
  permission: NotificationPermission;
  isSubscribed: boolean;
  isLoading: boolean;
  subscribe: () => Promise<boolean>;
  unsubscribe: () => Promise<boolean>;
  requestPermission: () => Promise<NotificationPermission>;
  showTestNotification: () => Promise<void>;
}

export function usePushNotifications(): UsePushNotificationsReturn {
  const [isSupported, setIsSupported] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Check support and initial state
  useEffect(() => {
    const checkStatus = async () => {
      setIsLoading(true);

      const supported = pushService.isSupported();
      setIsSupported(supported);

      if (supported) {
        const currentPermission = pushService.getPermissionStatus();
        setPermission(currentPermission);

        const subscribed = await pushService.isSubscribed();
        setIsSubscribed(subscribed);
      }

      setIsLoading(false);
    };

    checkStatus();

    // Listen for permission changes
    if ('permissions' in navigator) {
      navigator.permissions
        .query({ name: 'notifications' as PermissionName })
        .then((permissionStatus) => {
          permissionStatus.addEventListener('change', () => {
            setPermission(pushService.getPermissionStatus());
          });
        })
        .catch((error) => {
          console.warn('[usePushNotifications] Error querying permissions:', error);
        });
    }
  }, []);

  // Subscribe to push notifications
  const subscribe = useCallback(async (): Promise<boolean> => {
    if (!isSupported) {
      console.warn('[usePushNotifications] Push not supported');
      return false;
    }

    setIsLoading(true);

    try {
      const success = await pushService.subscribe();

      if (success) {
        setIsSubscribed(true);
        setPermission(pushService.getPermissionStatus());
      }

      return success;
    } catch (error) {
      console.error('[usePushNotifications] Error subscribing:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [isSupported]);

  // Unsubscribe from push notifications
  const unsubscribe = useCallback(async (): Promise<boolean> => {
    if (!isSupported) {
      return false;
    }

    setIsLoading(true);

    try {
      const success = await pushService.unsubscribe();

      if (success) {
        setIsSubscribed(false);
      }

      return success;
    } catch (error) {
      console.error('[usePushNotifications] Error unsubscribing:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [isSupported]);

  // Request notification permission
  const requestPermission = useCallback(async (): Promise<NotificationPermission> => {
    if (!isSupported) {
      return 'denied';
    }

    const newPermission = await pushService.requestPermission();
    setPermission(newPermission);
    return newPermission;
  }, [isSupported]);

  // Show test notification
  const showTestNotification = useCallback(async (): Promise<void> => {
    if (!isSupported || permission !== 'granted') {
      console.warn('[usePushNotifications] Cannot show test notification');
      return;
    }

    await pushService.showTestNotification();
  }, [isSupported, permission]);

  return {
    isSupported,
    permission,
    isSubscribed,
    isLoading,
    subscribe,
    unsubscribe,
    requestPermission,
    showTestNotification,
  };
}
