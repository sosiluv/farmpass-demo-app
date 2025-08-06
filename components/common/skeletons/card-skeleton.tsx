import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

interface CardSkeletonProps {
  count?: number;
  className?: string;
}

export function CardSkeleton({ count = 1, className = "" }: CardSkeletonProps) {
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

// 약관 관리 페이지 전용 스켈레톤
export function TermsSkeleton() {
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
