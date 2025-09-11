import { Card, CardContent } from "@/components/ui/card";

/**
 * 방문자 테이블 로딩 스켈레톤 컴포넌트
 */
export function VisitorTableLoading() {
  return (
    <Card className="border-0 shadow-sm bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm">
      <CardContent className="p-3 sm:p-4 md:p-6">
        <div className="space-y-3 sm:space-y-4">
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              className="flex items-center space-x-3 sm:space-x-4 animate-pulse"
            >
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-gray-200 to-gray-300 dark:from-slate-600 dark:to-slate-500 rounded-full flex-shrink-0" />
              <div className="flex-1 space-y-1.5 sm:space-y-2">
                <div className="h-3 sm:h-4 bg-gradient-to-r from-gray-200 to-gray-300 dark:from-slate-600 dark:to-slate-500 rounded-lg w-1/3" />
                <div className="h-2.5 sm:h-3 bg-gradient-to-r from-gray-200 to-gray-300 dark:from-slate-600 dark:to-slate-500 rounded w-1/2" />
              </div>
              <div className="w-12 sm:w-16 h-5 sm:h-6 bg-gradient-to-r from-gray-200 to-gray-300 dark:from-slate-600 dark:to-slate-500 rounded-full" />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
