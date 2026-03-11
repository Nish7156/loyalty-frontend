interface EmptyStateProps {
  icon?: string;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

export function EmptyState({ icon = '📭', title, description, action, className = '' }: EmptyStateProps) {
  return (
    <div className={`flex flex-col items-center justify-center py-12 px-4 text-center ${className}`}>
      <div className="animate-empty-bounce mb-4">
        <div className="text-6xl opacity-60 mb-2">{icon}</div>
      </div>

      <h3 className="text-lg font-semibold user-text mb-2">
        {title}
      </h3>

      <p className="user-text-muted text-sm max-w-sm mb-6">
        {description}
      </p>

      {action && (
        <button
          onClick={action.onClick}
          className="btn-premium text-white font-medium px-6 py-3 rounded-xl"
        >
          {action.label}
        </button>
      )}
    </div>
  );
}
