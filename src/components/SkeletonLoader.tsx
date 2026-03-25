interface SkeletonLoaderProps {
  type?: 'card' | 'list' | 'profile' | 'wallet';
  count?: number;
  className?: string;
}

const skeletonBg = 'rgba(250,236,231,0.6)';
const cardStyle = { background: 'var(--s)', border: '1px solid var(--bdl)', boxShadow: '0 1px 3px rgba(26,24,22,0.05)' };

export function SkeletonLoader({ type = 'card', count = 3, className = '' }: SkeletonLoaderProps) {
  const items = Array.from({ length: count }, (_, i) => i);

  if (type === 'card') {
    return (
      <div className={`space-y-4 ${className}`}>
        {items.map((i) => (
          <div key={i} className="rounded-2xl p-5 animate-fade-in-up" style={{ ...cardStyle, animationDelay: `${i * 0.1}s` }}>
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-full animate-pulse" style={{ background: skeletonBg }} />
              <div className="flex-1 space-y-3">
                <div className="h-5 w-3/4 animate-pulse rounded" style={{ background: skeletonBg }} />
                <div className="h-4 w-1/2 animate-pulse rounded" style={{ background: skeletonBg }} />
                <div className="h-4 w-full animate-pulse rounded" style={{ background: skeletonBg }} />
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
          <div key={i} className="flex items-center gap-3 p-3 rounded-xl animate-fade-in-up" style={{ ...cardStyle, animationDelay: `${i * 0.08}s` }}>
            <div className="w-10 h-10 rounded-full animate-pulse" style={{ background: skeletonBg }} />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-2/3 animate-pulse rounded" style={{ background: skeletonBg }} />
              <div className="h-3 w-1/3 animate-pulse rounded" style={{ background: skeletonBg }} />
            </div>
            <div className="w-16 h-6 animate-pulse rounded-full" style={{ background: skeletonBg }} />
          </div>
        ))}
      </div>
    );
  }

  if (type === 'profile') {
    return (
      <div className={`space-y-6 ${className}`}>
        <div className="text-center animate-fade-in-up">
          <div className="w-24 h-24 rounded-full mx-auto mb-4 animate-pulse" style={{ background: skeletonBg }} />
          <div className="h-6 w-48 mx-auto mb-2 animate-pulse rounded" style={{ background: skeletonBg }} />
          <div className="h-4 w-32 mx-auto animate-pulse rounded" style={{ background: skeletonBg }} />
        </div>

        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="rounded-2xl p-5 animate-fade-in-up" style={{ ...cardStyle, animationDelay: `${i * 0.1}s` }}>
              <div className="flex justify-between items-start mb-3">
                <div className="h-5 w-1/3 animate-pulse rounded" style={{ background: skeletonBg }} />
                <div className="h-8 w-20 animate-pulse rounded-lg" style={{ background: skeletonBg }} />
              </div>
              <div className="h-4 w-full animate-pulse rounded mb-2" style={{ background: skeletonBg }} />
              <div className="h-4 w-3/4 animate-pulse rounded" style={{ background: skeletonBg }} />
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
          <div key={i} className="rounded-2xl p-5 animate-fade-in-up" style={{ ...cardStyle, animationDelay: `${i * 0.1}s` }}>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full animate-pulse" style={{ background: skeletonBg }} />
              <div className="flex-1">
                <div className="h-4 w-32 animate-pulse rounded mb-2" style={{ background: skeletonBg }} />
                <div className="h-3 w-20 animate-pulse rounded" style={{ background: skeletonBg }} />
              </div>
            </div>
            <div className="flex justify-between items-end">
              <div>
                <div className="h-3 w-16 animate-pulse rounded mb-2" style={{ background: skeletonBg }} />
                <div className="h-8 w-24 animate-pulse rounded" style={{ background: skeletonBg }} />
              </div>
              <div className="h-9 w-24 animate-pulse rounded-lg" style={{ background: skeletonBg }} />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return null;
}
