import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Eye, Clock, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";

interface AnalyticsCardProps {
  data: {
    visitors: number;
    pageviews: number;
    sessions?: number;
    newUsers?: number;
    bounceRate?: number;
    avgSessionDuration?: number;
  };
}

export function AnalyticsCard({ data }: AnalyticsCardProps) {
  // 데이터가 없거나 undefined인 경우 기본값 사용
  const safeData = {
    visitors: data?.visitors ?? 0,
    pageviews: data?.pageviews ?? 0,
    sessions: data?.sessions ?? 0,
    newUsers: data?.newUsers ?? 0,
    bounceRate: data?.bounceRate ?? 0,
    avgSessionDuration: data?.avgSessionDuration ?? 0,
  };

  const formatDuration = (seconds: number) => {
    if (!seconds || seconds < 0) return "0초";
    if (seconds < 60) return `${Math.round(seconds)}초`;
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.round(seconds % 60);
    return `${minutes}분 ${remainingSeconds}초`;
  };

  const formatNumber = (num: number) => {
    if (!num || num < 0) return "0";
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  const formatPercent = (num: number) => {
    if (typeof num !== "number" || isNaN(num)) return "0%";
    return `${num.toFixed(1)}%`;
  };

  return (
    <Card className="bg-gradient-to-br from-background to-muted/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          방문자 통계
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                <Users className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-sm font-medium">방문자</p>
                <p className="text-xs text-muted-foreground">고유 방문자 수</p>
              </div>
            </div>
            <p className="text-lg font-bold">
              {formatNumber(safeData.visitors)}
            </p>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 dark:bg-green-900/20 rounded-lg">
                <Eye className="h-4 w-4 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-sm font-medium">페이지뷰</p>
                <p className="text-xs text-muted-foreground">총 조회 수</p>
              </div>
            </div>
            <p className="text-lg font-bold">
              {formatNumber(safeData.pageviews)}
            </p>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-100 dark:bg-orange-900/20 rounded-lg">
                <TrendingUp className="h-4 w-4 text-orange-600 dark:text-orange-400" />
              </div>
              <div>
                <p className="text-sm font-medium">세션 수</p>
                <p className="text-xs text-muted-foreground">
                  총 세션(방문) 횟수
                </p>
              </div>
            </div>
            <p className="text-lg font-bold">
              {formatNumber(safeData.sessions)}
            </p>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-cyan-100 dark:bg-cyan-900/20 rounded-lg">
                <Users className="h-4 w-4 text-cyan-600 dark:text-cyan-400" />
              </div>
              <div>
                <p className="text-sm font-medium">신규 방문자</p>
                <p className="text-xs text-muted-foreground">
                  7일간 새로 방문한 사용자
                </p>
              </div>
            </div>
            <p className="text-lg font-bold">
              {formatNumber(safeData.newUsers)}
            </p>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-pink-100 dark:bg-pink-900/20 rounded-lg">
                <TrendingUp className="h-4 w-4 text-pink-600 dark:text-pink-400" />
              </div>
              <div>
                <p className="text-sm font-medium">이탈률</p>
                <p className="text-xs text-muted-foreground">
                  한 페이지만 보고 떠난 비율
                </p>
              </div>
            </div>
            <p className="text-lg font-bold">
              {formatPercent(safeData.bounceRate)}
            </p>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 dark:bg-purple-900/20 rounded-lg">
                <Clock className="h-4 w-4 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <p className="text-sm font-medium">평균 세션 시간</p>
                <p className="text-xs text-muted-foreground">
                  세션당 평균 체류시간
                </p>
              </div>
            </div>
            <p className="text-lg font-bold">
              {formatDuration(safeData.avgSessionDuration)}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
