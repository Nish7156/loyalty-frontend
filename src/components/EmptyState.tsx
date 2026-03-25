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

export function EmptyState({ icon = 'inventory_2', title, description, action, className = '' }: EmptyStateProps) {
  return (
    <div className={`flex flex-col items-center justify-center py-12 px-4 text-center ${className}`}>
      <div className="animate-float mb-4">
        <span className="material-symbols-rounded" style={{ fontSize: '56px', color: 'var(--bd)' }}>{icon}</span>
      </div>

      <h3 className="text-lg font-semibold mb-2" style={{ color: 'var(--t)' }}>
        {title}
      </h3>

      <p className="text-sm max-w-sm mb-6" style={{ color: 'var(--t2)' }}>
        {description}
      </p>

      {action && (
        <button
          onClick={action.onClick}
          className="font-semibold px-6 py-3 rounded-xl transition"
          style={{ background: 'var(--a)', color: 'var(--s)' }}
        >
          {action.label}
        </button>
      )}
    </div>
  );
}
