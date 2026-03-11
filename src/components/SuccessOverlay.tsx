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
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-scale-in"
      onClick={onClose}
    >
      <div
        className="glass-card rounded-3xl p-8 max-w-sm w-full text-center shadow-premium-lg animate-success-bounce"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="text-7xl mb-4 animate-spring">{icon}</div>

        <h2 className="text-2xl font-bold text-gradient-premium mb-3">
          {title}
        </h2>

        <p className="user-text-muted text-base leading-relaxed">
          {message}
        </p>

        <div className="mt-6">
          <svg className="w-16 h-16 mx-auto" viewBox="0 0 52 52">
            <circle
              className="stroke-emerald-500/30"
              cx="26"
              cy="26"
              r="24"
              fill="none"
              strokeWidth="3"
            />
            <path
              className="checkmark-path stroke-emerald-500"
              fill="none"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M14 27l7 7 16-16"
            />
          </svg>
        </div>
      </div>
    </div>
  );
}
