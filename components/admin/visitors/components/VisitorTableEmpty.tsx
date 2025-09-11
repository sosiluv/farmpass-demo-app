import { Card, CardContent } from "@/components/ui/card";
import { User } from "lucide-react";
import { LABELS } from "@/lib/constants/visitor";

/**
 * 방문자 테이블 빈 상태 컴포넌트
 */
export function VisitorTableEmpty() {
  return (
    <Card className="border-0 shadow-sm bg-gradient-to-br from-gray-50 to-white dark:from-slate-800 dark:to-slate-700">
      <CardContent className="p-6 sm:p-8 md:p-12 text-center">
        <div className="w-12 h-12 sm:w-16 sm:h-16 md:w-20 md:h-20 mx-auto mb-4 sm:mb-6 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-slate-600 dark:to-slate-500 rounded-full flex items-center justify-center shadow-inner">
          <User className="w-6 h-6 sm:w-8 sm:h-8 md:w-10 md:h-10 text-gray-400 dark:text-slate-400" />
        </div>
        <h3 className="text-base sm:text-lg md:text-xl font-semibold text-gray-900 dark:text-slate-100 mb-2 sm:mb-3">
          {LABELS.VISITOR_TABLE_EMPTY_TITLE}
        </h3>
        <p className="text-xs sm:text-sm md:text-base text-gray-500 dark:text-slate-400 max-w-xs sm:max-w-md mx-auto leading-relaxed">
          {LABELS.VISITOR_TABLE_EMPTY_DESC}
        </p>
      </CardContent>
    </Card>
  );
}
