import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { getCustomerTokenIfPresent } from '../lib/api';
import { pushApi } from '../lib/api';

interface NotificationContextValue {
  isSupported: boolean;
  permission: NotificationPermission;
  isSubscribed: boolean;
  requestPermission: () => Promise<boolean>;
  unsubscribe: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextValue>({
  isSupported: false,
  permission: 'default',
  isSubscribed: false,
  requestPermission: async () => false,
  unsubscribe: async () => {},
});

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const isSupported =
    typeof window !== 'undefined' &&
    'serviceWorker' in navigator &&
    'PushManager' in window &&
    'Notification' in window;

  const [permission, setPermission] = useState<NotificationPermission>(
    isSupported ? Notification.permission : 'denied',
  );
  const [isSubscribed, setIsSubscribed] = useState(false);
  const subscriptionRef = useRef<PushSubscription | null>(null);

  // On mount: check if already subscribed
  useEffect(() => {
    if (!isSupported) return;

    navigator.serviceWorker.ready.then(async (reg) => {
      const existing = await reg.pushManager.getSubscription();
      if (existing) {
        subscriptionRef.current = existing;
        setIsSubscribed(true);
      }
    });
  }, [isSupported]);

  const requestPermission = useCallback(async (): Promise<boolean> => {
    if (!isSupported) return false;
    if (!getCustomerTokenIfPresent()) return false;

    try {
      const result = await Notification.requestPermission();
      setPermission(result);
      if (result !== 'granted') return false;

      const reg = await navigator.serviceWorker.ready;

      // Fetch VAPID public key from backend
      const { publicKey } = await pushApi.getVapidPublicKey();

      const subscription = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey).buffer as ArrayBuffer,
      });

      subscriptionRef.current = subscription;

      // Save subscription to backend
      await pushApi.subscribe(subscription.toJSON());
      setIsSubscribed(true);
      return true;
    } catch (err) {
      console.error('Push subscription failed:', err);
      return false;
    }
  }, [isSupported]);

  const unsubscribe = useCallback(async (): Promise<void> => {
    if (!subscriptionRef.current) return;
    const endpoint = subscriptionRef.current.endpoint;
    await subscriptionRef.current.unsubscribe();
    subscriptionRef.current = null;
    setIsSubscribed(false);
    try {
      await pushApi.unsubscribe(endpoint);
    } catch {
      // Best effort
    }
  }, []);

  return (
    <NotificationContext.Provider
      value={{ isSupported, permission, isSubscribed, requestPermission, unsubscribe }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  return useContext(NotificationContext);
}

// Utility: convert VAPID base64 public key to Uint8Array
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = atob(base64);
  return Uint8Array.from([...rawData].map((c) => c.charCodeAt(0)));
}
