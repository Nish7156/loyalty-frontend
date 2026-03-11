interface SkeletonLoaderProps {
  type?: 'card' | 'list' | 'profile' | 'wallet';
  count?: number;
  className?: string;
}

export function SkeletonLoader({ type = 'card', count = 3, className = '' }: SkeletonLoaderProps) {
  const items = Array.from({ length: count }, (_, i) => i);

  if (type === 'card') {
    return (
      <div className={`space-y-4 ${className}`}>
        {items.map((i) => (
          <div key={i} className="glass-card rounded-2xl p-5 shadow-premium-md animate-fade-in-up" style={{ animationDelay: `${i * 0.1}s` }}>
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-full skeleton" />
              <div className="flex-1 space-y-3">
                <div className="h-5 w-3/4 skeleton" />
                <div className="h-4 w-1/2 skeleton" />
                <div className="h-4 w-full skeleton" />
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (type === 'list') {
    return (
      <div className={`space-y-3 ${className}`}>
        {items.map((i) => (
          <div key={i} className="flex items-center gap-3 p-3 rounded-xl glass-card animate-fade-in-up" style={{ animationDelay: `${i * 0.08}s` }}>
            <div className="w-10 h-10 rounded-full skeleton" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-2/3 skeleton" />
              <div className="h-3 w-1/3 skeleton" />
            </div>
            <div className="w-16 h-6 skeleton rounded-full" />
          </div>
        ))}
      </div>
    );
  }

  if (type === 'profile') {
    return (
      <div className={`space-y-6 ${className}`}>
        <div className="text-center animate-fade-in-up">
          <div className="w-24 h-24 rounded-full skeleton mx-auto mb-4" />
          <div className="h-6 w-48 skeleton mx-auto mb-2" />
          <div className="h-4 w-32 skeleton mx-auto" />
        </div>

        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="glass-card rounded-2xl p-5 animate-fade-in-up" style={{ animationDelay: `${i * 0.1}s` }}>
              <div className="flex justify-between items-start mb-3">
                <div className="h-5 w-1/3 skeleton" />
                <div className="h-8 w-20 skeleton rounded-lg" />
              </div>
              <div className="h-4 w-full skeleton mb-2" />
              <div className="h-4 w-3/4 skeleton" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (type === 'wallet') {
    return (
      <div className={`space-y-4 ${className}`}>
        {items.map((i) => (
          <div key={i} className="glass-card rounded-2xl p-5 shadow-premium-md animate-fade-in-up" style={{ animationDelay: `${i * 0.1}s` }}>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full skeleton" />
              <div className="flex-1">
                <div className="h-4 w-32 skeleton mb-2" />
                <div className="h-3 w-20 skeleton" />
              </div>
            </div>
            <div className="flex justify-between items-end">
              <div>
                <div className="h-3 w-16 skeleton mb-2" />
                <div className="h-8 w-24 skeleton" />
              </div>
              <div className="h-9 w-24 skeleton rounded-lg" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return null;
}
