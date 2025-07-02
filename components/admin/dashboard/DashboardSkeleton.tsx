import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function DashboardSkeleton() {
  return (
    <div className="flex-1 space-y-6 sm:space-y-8 p-4 sm:p-6 lg:p-8">
      {/* 헤더 섹션 스켈레톤 */}
      <div className="space-y-4">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-3 lg:gap-4">
          <Skeleton className="h-7 sm:h-8 md:h-9 w-24 sm:w-28 md:w-32" />
          <Skeleton className="h-8 sm:h-9 md:h-10 w-full sm:w-[250px] md:w-[280px]" />
        </div>
      </div>

      {/* 통계 카드 섹션 스켈레톤 */}
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <Skeleton className="w-5 h-5 rounded" />
          <Skeleton className="h-6 w-20" />
        </div>

        {/* 메인 통계 카드들 */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {[...Array(4)].map((_, i) => (
            <Card
              key={i}
              className="relative overflow-hidden border-0 shadow-sm bg-gradient-to-br from-white to-slate-50 dark:from-slate-900 dark:to-slate-800"
            >
              <CardContent className="p-4 sm:p-5">
                <div className="flex items-start justify-between">
                  <Skeleton className="w-10 h-10 rounded-lg" />
                  <Skeleton className="w-12 h-4 rounded" />
                </div>
                <div className="mt-4">
                  <Skeleton className="h-8 sm:h-9 w-16 sm:w-20" />
                </div>
                <div className="mt-2">
                  <Skeleton className="h-4 w-20 sm:w-24" />
                  <Skeleton className="h-3 w-16 sm:w-20 mt-1" />
                </div>
                <Skeleton className="absolute bottom-0 left-0 right-0 h-1" />
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* 차트 섹션 스켈레톤 */}
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <Skeleton className="w-5 h-5 rounded" />
          <Skeleton className="h-6 w-20" />
        </div>

        {/* 주요 차트들 - 2열 레이아웃 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
          {[...Array(2)].map((_, i) => (
            <Card
              key={i}
              className="group relative overflow-hidden shadow-sm bg-gradient-to-br from-white to-slate-50 dark:from-slate-900 dark:to-slate-800 border-slate-200 dark:border-slate-700"
            >
              <div className="p-4 sm:p-5">
                <div className="flex items-center gap-3 mb-3">
                  <Skeleton className="w-10 h-10 rounded-lg" />
                  <Skeleton className="h-5 w-32" />
                </div>
                <Skeleton className="h-4 w-48 mb-2" />
                <Skeleton className="h-[300px] w-full rounded-lg" />
                <Skeleton className="absolute bottom-0 left-0 right-0 h-1" />
              </div>
            </Card>
          ))}
        </div>

        {/* 중간 차트들 - 태블릿과 아이패드에서는 1열, 큰 데스크톱에서만 3열 레이아웃 */}
        <div className="grid grid-cols-1 md:grid-cols-1 lg:grid-cols-1 xl:grid-cols-3 gap-4 sm:gap-6">
          {[...Array(3)].map((_, i) => (
            <Card
              key={i}
              className="group relative overflow-hidden shadow-sm bg-gradient-to-br from-white to-slate-50 dark:from-slate-900 dark:to-slate-800 border-slate-200 dark:border-slate-700"
            >
              <div className="p-4 sm:p-5">
                <div className="flex items-center gap-3 mb-3">
                  <Skeleton className="w-10 h-10 rounded-lg" />
                  <Skeleton className="h-5 w-24" />
                </div>
                <Skeleton className="h-4 w-36 mb-2" />
                <Skeleton className="h-[250px] w-full rounded-lg" />
                <Skeleton className="absolute bottom-0 left-0 right-0 h-1" />
              </div>
            </Card>
          ))}
        </div>
      </section>
    </div>
  );
}
