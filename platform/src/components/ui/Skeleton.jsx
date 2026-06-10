/**
 * Skeleton shimmer loaders (DSD §7.2 — skeletons over spinners).
 */
export function Skeleton({ className = '' }) {
  return <div className={`animate-pulse rounded-md bg-neutral-750/60 ${className}`} />;
}

export function SkeletonText({ lines = 3, className = '' }) {
  return (
    <div className={`space-y-2 ${className}`}>
      {Array.from({ length: lines }).map((_, index) => (
        <Skeleton key={index} className={`h-3 ${index === lines - 1 ? 'w-2/3' : 'w-full'}`} />
      ))}
    </div>
  );
}

export function SkeletonCard({ className = '' }) {
  return (
    <div className={`rounded-lg border border-neutral-750 bg-neutral-800 p-5 ${className}`}>
      <Skeleton className="h-4 w-1/3" />
      <Skeleton className="mt-3 h-8 w-2/3" />
      <SkeletonText className="mt-4" lines={2} />
    </div>
  );
}
