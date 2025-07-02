import { Skeleton } from "@/components/ui/skeleton";

interface TableSkeletonProps {
  rows?: number;
  columns?: number;
  className?: string;
}

export function TableSkeleton({
  rows = 5,
  columns = 4,
  className = "",
}: TableSkeletonProps) {
  return (
    <div className={`space-y-4 ${className}`}>
      {/* 헤더 */}
      <div className="grid grid-cols-{columns} gap-4 p-4 border-b">
        {Array.from({ length: columns }).map((_, i) => (
          <Skeleton key={i} className="h-4" />
        ))}
      </div>
      {/* 로우 */}
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="grid grid-cols-{columns} gap-4 p-4">
          {Array.from({ length: columns }).map((_, j) => (
            <Skeleton key={j} className="h-4" />
          ))}
        </div>
      ))}
    </div>
  );
}
