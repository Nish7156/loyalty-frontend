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
    image?: string;
    tag?: string;
    renotify?: boolean;
    timestamp?: number;
    vibrate?: number[];
    requireInteraction?: boolean;
    actions?: { action: string; title: string }[];
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
    icon: payload.icon ?? '/icon-192.png',
    badge: payload.badge ?? '/badge-72.png',
    tag: payload.tag ?? 'loyalty',
    data: payload.data ?? { url: '/' },
    requireInteraction: payload.requireInteraction ?? false,
    // Fields not in TS NotificationOptions types yet — cast through unknown
    ...(({
      image: payload.image,
      vibrate: payload.vibrate ?? [100, 50, 100],
      renotify: payload.renotify ?? true,
      timestamp: payload.timestamp ?? Date.now(),
      actions: payload.actions ?? [],
    } as unknown) as NotificationOptions),
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', (event: NotificationEvent) => {
  event.notification.close();

  const data = event.notification.data as { url?: string; type?: string } | undefined;
  const action = event.action;

  // Map action buttons to specific URLs
  let url = data?.url ?? '/';
  if (action === 'redeem') url = '/rewards';
  else if (action === 'wallet') url = '/me';
  else if (action === 'view') url = data?.url ?? '/requests';
  else if (action === 'dismiss' || action === 'later') return; // just close

  event.waitUntil(
    self.clients
      .matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        for (const client of clientList) {
          if ('focus' in client) {
            void (client as WindowClient).navigate(url);
            return (client as WindowClient).focus();
          }
        }
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
