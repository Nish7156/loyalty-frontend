import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';

interface Toast {
  id: string;
  title: string;
  body: string;
  type?: string;
  url?: string;
}

const ICONS: Record<string, string> = {
  CHECKIN_APPROVED: 'task_alt',
  REWARD_EARNED: 'redeem',
  REWARD_EXPIRING: 'timer',
  REWARD_EXPIRING_TODAY: 'alarm',
  POINTS_EARNED: 'generating_tokens',
  PROMOTION: 'campaign',
  GENERIC: 'notifications',
};

const ACCENT_COLORS: Record<string, string> = {
  CHECKIN_APPROVED: 'var(--gr)',
  REWARD_EARNED: 'var(--a)',
  REWARD_EXPIRING: 'var(--am)',
  REWARD_EXPIRING_TODAY: 'var(--re)',
  POINTS_EARNED: 'var(--gr)',
  PROMOTION: 'var(--adm)',
  GENERIC: 'var(--a)',
};

const BG_COLORS: Record<string, string> = {
  CHECKIN_APPROVED: 'var(--grbg)',
  REWARD_EARNED: 'var(--abg)',
  REWARD_EXPIRING: 'var(--ambg)',
  REWARD_EXPIRING_TODAY: 'var(--rebg)',
  POINTS_EARNED: 'var(--grbg)',
  PROMOTION: 'var(--admbg)',
  GENERIC: 'var(--abg)',
};

let toastListeners: Array<(toast: Toast) => void> = [];

// Call this from anywhere to show a toast
export function showPushToast(toast: Omit<Toast, 'id'>) {
  const id = Math.random().toString(36).slice(2);
  toastListeners.forEach((fn) => fn({ ...toast, id }));
}

export function PushToastContainer() {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const navigate = useNavigate();
  const timersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
    const timer = timersRef.current.get(id);
    if (timer) {
      clearTimeout(timer);
      timersRef.current.delete(id);
    }
  }, []);

  const addToast = useCallback(
    (toast: Toast) => {
      setToasts((prev) => {
        // Max 3 toasts
        const next = [...prev.slice(-2), toast];
        return next;
      });
      const timer = setTimeout(() => dismiss(toast.id), 5000);
      timersRef.current.set(toast.id, timer);
    },
    [dismiss],
  );

  useEffect(() => {
    toastListeners.push(addToast);
    return () => {
      toastListeners = toastListeners.filter((fn) => fn !== addToast);
    };
  }, [addToast]);

  if (toasts.length === 0) return null;

  return (
    <div
      className="fixed top-4 left-4 right-4 z-[100] flex flex-col gap-2 pointer-events-none"
      style={{ maxWidth: '480px', margin: '0 auto' }}
    >
      {toasts.map((toast) => {
        const type = toast.type ?? 'GENERIC';
        const icon = ICONS[type] ?? 'notifications';
        const accent = ACCENT_COLORS[type] ?? 'var(--a)';
        const bgColor = BG_COLORS[type] ?? 'var(--abg)';

        return (
          <div
            key={toast.id}
            className="pointer-events-auto animate-slide-in-up"
            style={{ animationDuration: '0.25s' }}
          >
            <div
              className="rounded-2xl p-3.5 flex items-start gap-3"
              style={{
                background: 'var(--s)',
                border: `1.5px solid ${accent}33`,
                boxShadow: '0 4px 24px rgba(0,0,0,0.10)',
              }}
            >
              {/* Icon */}
              <div
                className="flex-shrink-0 flex items-center justify-center rounded-xl"
                style={{
                  width: 38,
                  height: 38,
                  background: bgColor,
                }}
              >
                <span
                  className="material-symbols-rounded"
                  style={{ fontSize: 20, color: accent }}
                >
                  {icon}
                </span>
              </div>

              {/* Content */}
              <div
                className="flex-1 min-w-0 cursor-pointer"
                onClick={() => {
                  if (toast.url) navigate(toast.url);
                  dismiss(toast.id);
                }}
              >
                <p
                  className="font-semibold text-sm leading-snug truncate"
                  style={{ color: 'var(--t)' }}
                >
                  {toast.title}
                </p>
                <p
                  className="text-xs mt-0.5 leading-relaxed line-clamp-2"
                  style={{ color: 'var(--t2)' }}
                >
                  {toast.body}
                </p>
              </div>

              {/* Dismiss */}
              <button
                onClick={() => dismiss(toast.id)}
                className="flex-shrink-0 p-0.5 rounded-lg"
                style={{ color: 'var(--t3)' }}
                aria-label="Close"
              >
                <span className="material-symbols-rounded" style={{ fontSize: 16 }}>
                  close
                </span>
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
