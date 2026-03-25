import { useEffect } from 'react';

interface SuccessOverlayProps {
  show: boolean;
  title: string;
  message: string;
  icon?: string;
  onClose: () => void;
  duration?: number;
}

export function SuccessOverlay({
  show,
  title,
  message,
  icon = '🎉',
  onClose,
  duration = 3000,
}: SuccessOverlayProps) {
  useEffect(() => {
    if (show && duration > 0) {
      const timer = setTimeout(onClose, duration);
      return () => clearTimeout(timer);
    }
  }, [show, duration, onClose]);

  if (!show) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-scale-in"
      style={{ backgroundColor: 'rgba(93,64,55,0.3)' }}
      onClick={onClose}
    >
      <div
        className="rounded-3xl p-8 max-w-sm w-full text-center shadow-xl animate-success-bounce"
        style={{ background: 'var(--s)', border: '1px solid var(--bdl)' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="text-7xl mb-4 animate-spring">{icon}</div>

        <h2 className="text-2xl font-bold mb-3" style={{ color: 'var(--a)' }}>
          {title}
        </h2>

        <p className="text-base leading-relaxed" style={{ color: 'var(--t2)' }}>
          {message}
        </p>

        <div className="mt-6">
          <svg className="w-16 h-16 mx-auto" viewBox="0 0 52 52">
            <circle
              style={{ stroke: 'rgba(42,96,64,0.3)' }}
              cx="26"
              cy="26"
              r="24"
              fill="none"
              strokeWidth="3"
            />
            <path
              style={{ stroke: 'var(--gr)' }}
              fill="none"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M14 27l7 7 16-16"
              className="checkmark-path"
            />
          </svg>
        </div>
      </div>
    </div>
  );
}
