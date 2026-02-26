interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className = '' }: SkeletonProps) {
  return <div className={`user-skeleton animate-pulse rounded-lg bg-white/10 ${className}`} aria-hidden />;
}

export function SkeletonLine({ className = '' }: SkeletonProps) {
  return <Skeleton className={`h-4 ${className}`} />;
}

export function SkeletonCard({ className = '' }: SkeletonProps) {
  return (
    <div className={`user-skeleton-card rounded-2xl border border-white/10 bg-white/[0.04] p-5 sm:p-6 ${className}`}>
      <Skeleton className="h-5 w-2/3 mb-3" />
      <SkeletonLine className="w-full mb-2" />
      <SkeletonLine className="w-[85%] mb-2" />
      <SkeletonLine className="w-1/2" />
    </div>
  );
}

export function ProfileSkeleton() {
  return (
    <div className="max-w-md mx-auto space-y-6 pb-8 w-full min-w-0">
      <Skeleton className="h-9 w-48 mb-2" />
      <SkeletonCard />
      <Skeleton className="h-4 w-32 mb-4" />
      <SkeletonCard />
      <SkeletonCard />
      <SkeletonCard />
    </div>
  );
}

export function RewardsSkeleton() {
  return (
    <div className="max-w-md mx-auto space-y-6 pb-8 w-full min-w-0">
      <Skeleton className="h-9 w-28 mb-2" />
      <SkeletonLine className="w-full max-w-sm" />
      <div className="space-y-4">
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
      </div>
    </div>
  );
}

export function HistorySkeleton() {
  return (
    <div className="max-w-md mx-auto space-y-6 pb-8 w-full min-w-0">
      <Skeleton className="h-9 w-24 mb-2" />
      <SkeletonLine className="w-full max-w-xs mb-6" />
      <div className="space-y-4">
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
      </div>
    </div>
  );
}

export function ScanSkeleton() {
  return (
    <div className="max-w-md mx-auto w-full min-w-0 space-y-5">
      <Skeleton className="h-9 w-40 mb-4" />
      <div className="user-skeleton-card rounded-2xl border border-white/10 bg-white/[0.04] p-5 space-y-4">
        <SkeletonLine className="w-16" />
        <Skeleton className="h-12 w-full rounded-xl" />
        <Skeleton className="h-12 w-full rounded-xl" />
      </div>
    </div>
  );
}
