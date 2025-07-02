import { Skeleton } from "@/components/ui/skeleton";

interface StatsSkeletonProps {
  columns?: number;
  className?: string;
}

export function StatsSkeleton({
  columns = 4,
  className = "",
}: StatsSkeletonProps) {
  return (
    <div
      className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-${columns} gap-4 ${className}`}
    >
      {Array.from({ length: columns }).map((_, i) => (
        <div key={i} className="p-4 space-y-3 border rounded-lg">
          <Skeleton className="h-8 w-[100px]" />
          <Skeleton className="h-10 w-[150px]" />
          <Skeleton className="h-4 w-[100px]" />
        </div>
      ))}
    </div>
  );
}
