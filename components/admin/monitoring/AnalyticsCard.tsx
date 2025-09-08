import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Eye, Clock, TrendingUp, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { LABELS, PAGE_HEADER } from "@/lib/constants/monitoring";
import type { AnalyticsData } from "@/lib/types/monitoring";

interface AnalyticsCardProps {
  data?: AnalyticsData;
}

export function AnalyticsCard({ data }: AnalyticsCardProps) {
  // GA 설정이 없거나 에러가 있는 경우
  if (!data?.success && data?.error) {
    let errorMessage = data.message || LABELS.GA_DATA_ERROR;

    // 구체적인 에러 메시지 제공
    switch (data.error) {
      case "GA_CONFIG_NOT_FOUND":
        errorMessage = LABELS.GA_CONFIG_NOT_FOUND;
        break;
      case "GA_JSON_PARSE_ERROR":
        errorMessage = LABELS.GA_JSON_PARSE_ERROR;
        break;
      case "GA_CREDENTIALS_INVALID":
        errorMessage = LABELS.GA_CREDENTIALS_INVALID;
        break;
      case "GA_API_ERROR":
        errorMessage = LABELS.GA_API_ERROR;
        break;
    }

    return (
      <Card className="bg-gradient-to-br from-background to-muted/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <TrendingUp className="h-5 w-5" />
            {PAGE_HEADER.ANALYTICS_TITLE}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {errorMessage}
              {data.details && (
                <div className="mt-2 text-xs text-muted-foreground">
                  {LABELS.DETAILED_ERROR} {data.details}
                </div>
              )}
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  // 데이터가 없거나 undefined인 경우 기본값 사용
  const safeData = {
    visitors: data?.visitors ?? 0,
    pageviews: data?.pageviews ?? 0,
    sessions: data?.sessions ?? 0,
    newUsers: data?.newUsers ?? 0,
    bounceRate: data?.bounceRate ?? 0,
    avgDuration: data?.avgDuration ?? 0,
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
        <CardTitle className="flex items-center gap-2 text-base">
          <TrendingUp className="h-5 w-5" />
          {PAGE_HEADER.ANALYTICS_TITLE}
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
                <p className="text-sm font-medium">{LABELS.VISITORS}</p>
                <p className="text-xs text-muted-foreground">
                  {LABELS.VISITORS_DESC}
                </p>
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
                <p className="text-sm font-medium">{LABELS.PAGEVIEWS}</p>
                <p className="text-xs text-muted-foreground">
                  {LABELS.PAGEVIEWS_DESC}
                </p>
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
                <p className="text-sm font-medium">{LABELS.SESSIONS}</p>
                <p className="text-xs text-muted-foreground">
                  {LABELS.SESSIONS_DESC}
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
                <p className="text-sm font-medium">{LABELS.NEW_USERS}</p>
                <p className="text-xs text-muted-foreground">
                  {LABELS.NEW_USERS_DESC}
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
                <p className="text-sm font-medium">{LABELS.BOUNCE_RATE}</p>
                <p className="text-xs text-muted-foreground">
                  {LABELS.BOUNCE_RATE_DESC}
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
                <p className="text-sm font-medium">{LABELS.AVG_SESSION_TIME}</p>
                <p className="text-xs text-muted-foreground">
                  {LABELS.AVG_SESSION_TIME_DESC}
                </p>
              </div>
            </div>
            <p className="text-lg font-bold">
              {formatDuration(safeData.avgDuration)}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
