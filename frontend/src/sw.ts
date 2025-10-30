/// <reference lib="webworker" />
import { precacheAndRoute, cleanupOutdatedCaches, createHandlerBoundToURL } from 'workbox-precaching';
import { registerRoute, NavigationRoute } from 'workbox-routing';
import { NetworkFirst, CacheFirst, StaleWhileRevalidate } from 'workbox-strategies';
import { ExpirationPlugin } from 'workbox-expiration';
import { CacheableResponsePlugin } from 'workbox-cacheable-response';

declare const self: ServiceWorkerGlobalScope;

// ============================================================================
// PRECACHE ASSETS (Auto-injected by Vite PWA)
// ============================================================================

// @ts-ignore
precacheAndRoute(self.__WB_MANIFEST);

// Clean up old caches
cleanupOutdatedCaches();

// ============================================================================
// NAVIGATION ROUTING (SPA support)
// ============================================================================

const handler = createHandlerBoundToURL('/index.html');
const navigationRoute = new NavigationRoute(handler, {
  denylist: [/^\/_/, /\/[^/?]+\.[^/]+$/], // Exclude API routes and static files
});
registerRoute(navigationRoute);

// ============================================================================
// CACHING STRATEGIES
// ============================================================================

// API calls - Network First (fresh data priority)
registerRoute(
  ({ url }) => url.pathname.startsWith('/api'),
  new NetworkFirst({
    cacheName: 'api-cache',
    networkTimeoutSeconds: 10,
    plugins: [
      new ExpirationPlugin({
        maxEntries: 100,
        maxAgeSeconds: 60 * 60 * 24, // 24 hours
      }),
      new CacheableResponsePlugin({
        statuses: [0, 200],
      }),
    ],
  })
);

// Images - Cache First (maximum performance)
registerRoute(
  ({ request }) => request.destination === 'image',
  new CacheFirst({
    cacheName: 'image-cache',
    plugins: [
      new ExpirationPlugin({
        maxEntries: 50,
        maxAgeSeconds: 60 * 60 * 24 * 30, // 30 days
      }),
      new CacheableResponsePlugin({
        statuses: [0, 200],
      }),
    ],
  })
);

// Scripts and Styles - Stale While Revalidate (balance)
registerRoute(
  ({ request }) => request.destination === 'style' || request.destination === 'script',
  new StaleWhileRevalidate({
    cacheName: 'static-resources',
    plugins: [
      new ExpirationPlugin({
        maxEntries: 60,
        maxAgeSeconds: 60 * 60 * 24 * 7, // 7 days
      }),
    ],
  })
);

// Fonts - Cache First (long expiration)
registerRoute(
  ({ request }) => request.destination === 'font',
  new CacheFirst({
    cacheName: 'font-cache',
    plugins: [
      new ExpirationPlugin({
        maxEntries: 30,
        maxAgeSeconds: 60 * 60 * 24 * 365, // 1 year
      }),
      new CacheableResponsePlugin({
        statuses: [0, 200],
      }),
    ],
  })
);

// ============================================================================
// PUSH NOTIFICATIONS HANDLERS
// ============================================================================

/**
 * Handle incoming push notifications
 */
self.addEventListener('push', (event: PushEvent) => {
  console.log('[Service Worker] Push notification received', event);

  let notificationData: any = {
    title: 'Nueva Notificación',
    message: 'Tienes una nueva notificación',
    icon: '/pwa-192x192.png',
    badge: '/badge-72x72.png',
    url: '/',
    priority: 'NORMAL',
    data: {},
  };

  // Parse notification data
  if (event.data) {
    try {
      notificationData = event.data.json();
    } catch (error) {
      console.error('[Service Worker] Error parsing push data:', error);
      notificationData.message = event.data.text();
    }
  }

  // Build notification options
  const options = {
    body: notificationData.message,
    icon: notificationData.icon || '/pwa-192x192.png',
    badge: notificationData.badge || '/badge-72x72.png',
    tag: notificationData.tag || `notification-${Date.now()}`,
    requireInteraction: notificationData.priority === 'URGENT',
    silent: notificationData.priority === 'LOW',
    data: {
      url: notificationData.url || '/',
      timestamp: notificationData.timestamp || new Date().toISOString(),
      ...notificationData.data,
    },
    actions: [
      {
        action: 'open',
        title: 'Abrir',
      },
      {
        action: 'close',
        title: 'Cerrar',
      },
    ],
  } as NotificationOptions;

  // Show notification
  event.waitUntil(
    self.registration.showNotification(notificationData.title, options)
  );
});

/**
 * Handle notification click events
 */
self.addEventListener('notificationclick', (event: NotificationEvent) => {
  console.log('[Service Worker] Notification click received', event);

  event.notification.close();

  // Handle action buttons
  if (event.action === 'close') {
    return;
  }

  // Open the URL
  const urlToOpen = event.notification.data?.url || '/';

  event.waitUntil(
    self.clients
      .matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList: readonly WindowClient[]) => {
        // Check if there's already a window open
        for (const client of clientList) {
          if (client.url.includes(urlToOpen) && 'focus' in client) {
            return client.focus();
          }
        }

        // Open new window
        if (self.clients.openWindow) {
          return self.clients.openWindow(urlToOpen);
        }
      })
  );
});

/**
 * Handle notification close events
 */
self.addEventListener('notificationclose', (event: NotificationEvent) => {
  console.log('[Service Worker] Notification closed', event);
  // Track notification closure analytics if needed
});

// ============================================================================
// SERVICE WORKER LIFECYCLE
// ============================================================================

/**
 * Install event - Prepare service worker
 */
self.addEventListener('install', (_event) => {
  console.log('[Service Worker] Installing...');
  // Skip waiting to activate immediately
  self.skipWaiting();
});

/**
 * Activate event - Clean up old caches and take control
 */
self.addEventListener('activate', (event) => {
  console.log('[Service Worker] Activating...');
  event.waitUntil(
    Promise.all([
      // Take control of all clients immediately
      self.clients.claim(),
      // Clean up old caches
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (!cacheName.startsWith('workbox-') &&
                !cacheName.includes('precache') &&
                !cacheName.includes('runtime')) {
              console.log('[Service Worker] Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      }),
    ])
  );
});

/**
 * Message event - Handle messages from clients
 */
self.addEventListener('message', (event) => {
  console.log('[Service Worker] Message received:', event.data);

  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }

  if (event.data && event.data.type === 'CLIENTS_CLAIM') {
    self.clients.claim();
  }

  // Respond to ping messages
  if (event.data && event.data.type === 'PING') {
    event.ports[0].postMessage({ type: 'PONG', timestamp: Date.now() });
  }
});

// ============================================================================
// BACKGROUND SYNC (Future feature)
// ============================================================================

// self.addEventListener('sync', (event: SyncEvent) => {
//   console.log('[Service Worker] Background sync:', event.tag);
//   if (event.tag === 'sync-notifications') {
//     event.waitUntil(syncNotifications());
//   }
// });

console.log('[Service Worker] Loaded successfully with push notification support');
