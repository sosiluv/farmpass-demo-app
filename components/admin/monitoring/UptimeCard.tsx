import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, Activity, Hash, Calendar, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface UptimeCardProps {
  monitors?: Array<{
    id: number;
    friendly_name: string;
    status: number;
    all_time_uptime_ratio: number;
    custom_uptime_ratio?: number;
    url?: string;
    interval?: number;
    type?: number;
    port?: string;
    create_datetime?: number;
  }>;
  success?: boolean;
  error?: string;
  message?: string;
  details?: string;
}

export function UptimeCard({
  monitors,
  success,
  error,
  message,
  details,
}: UptimeCardProps) {
  // UptimeRobot 설정이 없거나 에러가 있는 경우
  if (!success && error) {
    let errorMessage = message || "UptimeRobot 데이터를 불러올 수 없습니다.";

    // 구체적인 에러 메시지 제공
    switch (error) {
      case "UPTIMEROBOT_API_KEY_NOT_CONFIGURED":
        errorMessage =
          "UptimeRobot API 키가 설정되지 않았습니다. 환경 변수를 확인해주세요.";
        break;
      case "UPTIMEROBOT_API_ERROR":
        errorMessage =
          "UptimeRobot API 호출에 실패했습니다. API 키와 권한을 확인해주세요.";
        break;
    }

    return (
      <Card className="bg-gradient-to-br from-background to-muted/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            가동시간
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {errorMessage}
              {details && (
                <div className="mt-2 text-xs text-muted-foreground">
                  상세 오류: {details}
                </div>
              )}
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  // 데이터 유효성 검사
  if (!monitors || monitors.length === 0) {
    return (
      <Card className="bg-gradient-to-br from-background to-muted/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            가동시간
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-muted-foreground">
            가동시간 모니터링 데이터가 없습니다.
          </div>
        </CardContent>
      </Card>
    );
  }

  // 체크 간격을 사람이 읽기 쉬운 형태로 변환
  const formatInterval = (seconds: number) => {
    // 안전한 숫자 변환
    const safeSeconds = typeof seconds === "number" ? seconds : 0;

    if (safeSeconds < 60) return `${safeSeconds}초`;
    if (safeSeconds < 3600) return `${Math.round(safeSeconds / 60)}분`;
    if (safeSeconds < 86400) return `${Math.round(safeSeconds / 3600)}시간`;
    return `${Math.round(safeSeconds / 86400)}일`;
  };

  // 생성 시간을 사람이 읽기 쉬운 형태로 변환
  const formatCreateTime = (timestamp: number) => {
    if (!timestamp) return "알 수 없음";

    const date = new Date(timestamp * 1000); // Unix timestamp를 밀리초로 변환
    const now = new Date();
    const diffInDays = Math.floor(
      (now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (diffInDays === 0) return "오늘";
    if (diffInDays === 1) return "어제";
    if (diffInDays < 7) return `${diffInDays}일 전`;
    if (diffInDays < 30) return `${Math.floor(diffInDays / 7)}주 전`;
    return `${Math.floor(diffInDays / 30)}개월 전`;
  };

  // 가동률 우선순위: custom_uptime_ratio > all_time_uptime_ratio
  const getUptimeRatio = (monitor: any) => {
    // custom_uptime_ratio가 있으면 사용
    if (
      monitor.custom_uptime_ratio !== undefined &&
      monitor.custom_uptime_ratio !== null
    ) {
      return Number(monitor.custom_uptime_ratio);
    }
    // all_time_uptime_ratio 사용
    if (
      monitor.all_time_uptime_ratio !== undefined &&
      monitor.all_time_uptime_ratio !== null
    ) {
      return Number(monitor.all_time_uptime_ratio);
    }
    // 기본값
    return 0;
  };

  return (
    <Card className="bg-gradient-to-br from-background to-muted/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          가동시간
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {(monitors || []).map((monitor) => {
            const uptimeRatio = getUptimeRatio(monitor);
            const isHealthy = monitor.status === 2;

            // 안전한 숫자 변환
            const safeUptimeRatio =
              typeof uptimeRatio === "number" ? uptimeRatio : 0;

            return (
              <div
                key={monitor.friendly_name}
                className="relative flex items-center gap-4 rounded-lg bg-muted/50 p-4"
              >
                <div className="relative h-16 w-16">
                  <svg className="h-full w-full" viewBox="0 0 36 36">
                    <path
                      d="M18 2.0845
                        a 15.9155 15.9155 0 0 1 0 31.831
                        a 15.9155 15.9155 0 0 1 0 -31.831"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      className="stroke-muted-foreground/20"
                    />
                    <path
                      d="M18 2.0845
                        a 15.9155 15.9155 0 0 1 0 31.831
                        a 15.9155 15.9155 0 0 1 0 -31.831"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeDasharray={`${safeUptimeRatio}, 100`}
                      className={
                        isHealthy ? "stroke-green-500" : "stroke-red-500"
                      }
                    />
                    <text
                      x="18"
                      y="20.35"
                      className="fill-current text-[0.5em] font-medium"
                      textAnchor="middle"
                    >
                      {safeUptimeRatio.toFixed(1)}%
                    </text>
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <h4 className="font-medium truncate">
                      {monitor.friendly_name}
                    </h4>
                    <Badge
                      variant={isHealthy ? "default" : "destructive"}
                      className="shrink-0"
                    >
                      {isHealthy ? "정상" : "문제 발생"}
                    </Badge>
                  </div>

                  {/* 가동률 정보 */}
                  <div className="space-y-1 mt-2">
                    <p className="text-sm text-muted-foreground">
                      가동률: {safeUptimeRatio.toFixed(1)}%
                      {monitor.custom_uptime_ratio !== undefined &&
                        monitor.custom_uptime_ratio !== null && (
                          <span className="text-xs text-muted-foreground/70 ml-1">
                            (30일)
                          </span>
                        )}
                    </p>

                    {/* 추가 정보 */}
                    <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                      {monitor.id && (
                        <div className="flex items-center gap-1">
                          <Hash className="h-3 w-3" />
                          <span>ID: {monitor.id}</span>
                        </div>
                      )}

                      {monitor.interval && (
                        <div className="flex items-center gap-1">
                          <Activity className="h-3 w-3" />
                          <span>체크: {formatInterval(monitor.interval)}</span>
                        </div>
                      )}

                      {monitor.create_datetime && (
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          <span>
                            생성: {formatCreateTime(monitor.create_datetime)}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
