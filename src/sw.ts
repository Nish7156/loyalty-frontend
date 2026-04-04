/// <reference lib="webworker" />
import { cleanupOutdatedCaches, precacheAndRoute } from 'workbox-precaching';

declare const self: ServiceWorkerGlobalScope;

// Injected by vite-plugin-pwa at build time
precacheAndRoute(self.__WB_MANIFEST);
cleanupOutdatedCaches();

self.addEventListener('push', (event: PushEvent) => {
  if (!event.data) return;

  let payload: {
    title?: string;
    body?: string;
    icon?: string;
    badge?: string;
    tag?: string;
    data?: { url?: string; type?: string; partnerId?: string };
  };

  try {
    payload = event.data.json() as typeof payload;
  } catch {
    payload = { title: 'Loyalty', body: event.data.text() };
  }

  const title = payload.title ?? 'Loyalty';
  const options: NotificationOptions = {
    body: payload.body ?? '',
    icon: payload.icon ?? '/icons/icon-192x192.png',
    badge: payload.badge ?? '/icons/badge-72x72.png',
    tag: payload.tag ?? 'loyalty',
    data: payload.data ?? { url: '/' },
    // vibrate for mobile (cast needed — TS lib types lag behind the spec)
    ...(({ vibrate: [100, 50, 100] } as unknown) as NotificationOptions),
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', (event: NotificationEvent) => {
  event.notification.close();

  const url: string = (event.notification.data as { url?: string })?.url ?? '/';

  event.waitUntil(
    self.clients
      .matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        // Focus existing tab if open
        for (const client of clientList) {
          if ('focus' in client) {
            void (client as WindowClient).navigate(url);
            return (client as WindowClient).focus();
          }
        }
        // Open new tab
        if (self.clients.openWindow) {
          return self.clients.openWindow(url);
        }
      }),
  );
});

// New SW activates immediately — no waiting for tabs to close
self.addEventListener('install', () => {
  void self.skipWaiting();
});

// Take control of all open pages instantly
self.addEventListener('activate', (event: ExtendableEvent) => {
  event.waitUntil(self.clients.claim());
});

// Also handle explicit SKIP_WAITING message (belt-and-suspenders)
self.addEventListener('message', (event: ExtendableMessageEvent) => {
  if (event.data?.type === 'SKIP_WAITING') {
    void self.skipWaiting();
  }
});
