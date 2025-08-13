import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

// 기본 Skeleton 컴포넌트
function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("animate-pulse rounded-md bg-muted", className)}
      {...props}
    />
  );
}

// CardSkeleton 컴포넌트
interface CardSkeletonProps {
  count?: number;
  className?: string;
}

function CardSkeleton({ count = 1, className = "" }: CardSkeletonProps) {
  return (
    <div className={`grid gap-4 ${className}`}>
      {(Array.from({ length: count }) || []).map((_, i) => (
        <div key={i} className="p-4 space-y-3 border rounded-lg">
          <Skeleton className="h-4 w-[250px]" />
          <Skeleton className="h-4 w-[200px]" />
        </div>
      ))}
    </div>
  );
}

// TermsSkeleton 컴포넌트
function TermsSkeleton() {
  return (
    <div className="space-y-6">
      {/* 상태 배지 스켈레톤 */}
      <div className="flex items-center justify-end gap-2">
        <Skeleton className="h-6 w-20" />
        <Skeleton className="h-6 w-16" />
      </div>

      {/* 탭 스켈레톤 */}
      <div className="grid w-full grid-cols-3 h-auto border rounded-lg p-1">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="flex flex-col items-center justify-center gap-1 p-2 sm:p-3 min-w-0 h-auto"
          >
            <Skeleton className="h-3.5 w-3.5 rounded-full" />
            <Skeleton className="h-3 w-16 sm:w-20" />
          </div>
        ))}
      </div>

      {/* 약관 편집 카드 스켈레톤 */}
      <Card>
        <div className="p-6 border-b">
          <div className="flex items-center gap-3 mb-2">
            <Skeleton className="h-8 w-8 rounded-full" />
            <div className="space-y-1">
              <Skeleton className="h-5 w-48" />
              <Skeleton className="h-4 w-64" />
            </div>
          </div>
          <div className="flex items-center gap-2 mt-3">
            <Skeleton className="h-5 w-16" />
            <Skeleton className="h-5 w-12" />
            <Skeleton className="h-5 w-24" />
          </div>
        </div>
        <CardContent className="p-6">
          {/* 에디터 영역 스켈레톤 */}
          <div className="h-[calc(100vh-400px)] min-h-[400px] sm:min-h-[500px] border rounded-lg">
            <div className="p-4 space-y-3">
              <Skeleton className="h-6 w-full" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-5/6" />
              <Skeleton className="h-4 w-2/3" />
              <Skeleton className="h-4 w-4/5" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          </div>

          <Separator className="my-4" />

          {/* 버튼 영역 스켈레톤 */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-1">
              <Skeleton className="h-4 w-4 rounded-full" />
              <Skeleton className="h-4 w-48 sm:w-64" />
            </div>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
              <div className="flex items-center gap-2">
                <Skeleton className="h-9 w-20 sm:w-24" />
                <Skeleton className="h-9 w-20 sm:w-28" />
              </div>
              <div className="flex flex-col sm:flex-row gap-2">
                <Skeleton className="h-9 w-full sm:w-20" />
                <Skeleton className="h-9 w-full sm:w-24" />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// FormSkeleton 컴포넌트
interface FormSkeletonProps {
  fields?: number;
  className?: string;
}

function FormSkeleton({
  fields = 6,
  className = "",
}: FormSkeletonProps) {
  return (
    <div className={`space-y-6 ${className}`}>
      {(Array.from({ length: fields }) || []).map((_, i) => (
        <div key={i} className="space-y-2">
          <Skeleton className="h-4 w-[100px]" />
          <Skeleton className="h-10 w-full" />
        </div>
      ))}
      <Skeleton className="h-12 w-full mt-8" /> {/* Submit button */}
    </div>
  );
}

// StatsSkeleton 컴포넌트
interface StatsSkeletonProps {
  columns?: number;
  className?: string;
}

function StatsSkeleton({
  columns = 4,
  className = "",
}: StatsSkeletonProps) {
  return (
    <div
      className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-${columns} gap-4 ${className}`}
    >
      {(Array.from({ length: columns }) || []).map((_, i) => (
        <div key={i} className="p-4 space-y-3 border rounded-lg">
          <Skeleton className="h-8 w-[100px]" />
          <Skeleton className="h-10 w-[150px]" />
          <Skeleton className="h-4 w-[100px]" />
        </div>
      ))}
    </div>
  );
}

// TableSkeleton 컴포넌트
interface TableSkeletonProps {
  rows?: number;
  columns?: number;
  className?: string;
}

function TableSkeleton({
  rows = 5,
  columns = 4,
  className = "",
}: TableSkeletonProps) {
  return (
    <div className={`space-y-4 ${className}`}>
      {/* 헤더 */}
      <div className={`grid grid-cols-${columns} gap-4 p-4 border-b`}>
        {(Array.from({ length: columns }) || []).map((_, i) => (
          <Skeleton key={i} className="h-4" />
        ))}
      </div>
      {/* 로우 */}
      {(Array.from({ length: rows }) || []).map((_, i) => (
        <div key={i} className={`grid grid-cols-${columns} gap-4 p-4`}>
          {(Array.from({ length: columns }) || []).map((_, j) => (
            <Skeleton key={j} className="h-4" />
          ))}
        </div>
      ))}
    </div>
  );
}

export { 
  Skeleton,
  CardSkeleton,
  TermsSkeleton,
  FormSkeleton,
  StatsSkeleton,
  TableSkeleton
};
