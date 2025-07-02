import { Card, CardContent } from "@/components/ui/card";
import { User } from "lucide-react";

/**
 * 방문자 테이블 빈 상태 컴포넌트
 */
export function VisitorTableEmpty() {
  return (
    <Card className="border-0 shadow-sm bg-gradient-to-br from-gray-50 to-white">
      <CardContent className="p-6 sm:p-8 md:p-12 text-center">
        <div className="w-12 h-12 sm:w-16 sm:h-16 md:w-20 md:h-20 mx-auto mb-4 sm:mb-6 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center shadow-inner">
          <User className="w-6 h-6 sm:w-8 sm:h-8 md:w-10 md:h-10 text-gray-400" />
        </div>
        <h3 className="text-base sm:text-lg md:text-xl font-semibold text-gray-900 mb-2 sm:mb-3">
          방문자 기록이 없습니다
        </h3>
        <p className="text-xs sm:text-sm md:text-base text-gray-500 max-w-xs sm:max-w-md mx-auto leading-relaxed">
          현재 설정된 필터 조건에 맞는 방문자 기록을 찾을 수 없습니다.
          <br />
          다른 조건으로 검색해보세요.
        </p>
      </CardContent>
    </Card>
  );
}
