import { Database } from "lucide-react";

interface PerformanceInfo {
  navigationStart: number;
  domContentLoaded: number;
  loadComplete: number;
  firstContentfulPaint?: number;
  largestContentfulPaint?: number;
}

interface PerformanceInfoSectionProps {
  performanceInfo?: PerformanceInfo;
}

export function PerformanceInfoSection({
  performanceInfo,
}: PerformanceInfoSectionProps) {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 text-orange-700">
        <Database className="h-3 w-3" />
        <span className="font-medium">성능 정보</span>
      </div>
      <div className="space-y-1 text-orange-600 ml-5">
        {performanceInfo && (
          <>
            <div className="flex justify-between">
              <span>DOM 준비:</span>
              <span>{performanceInfo.domContentLoaded}ms</span>
            </div>
            <div className="flex justify-between">
              <span>페이지 로드:</span>
              <span>{performanceInfo.loadComplete}ms</span>
            </div>
            {performanceInfo.firstContentfulPaint && (
              <div className="flex justify-between">
                <span>첫 콘텐츠:</span>
                <span>{performanceInfo.firstContentfulPaint}ms</span>
              </div>
            )}
            {performanceInfo.largestContentfulPaint && (
              <div className="flex justify-between">
                <span>최대 콘텐츠:</span>
                <span>{performanceInfo.largestContentfulPaint}ms</span>
              </div>
            )}
          </>
        )}
        <div className="flex justify-between">
          <span>현재 실행 시간:</span>
          <span>{Math.round(performance.now())}ms</span>
        </div>
      </div>
    </div>
  );
}
