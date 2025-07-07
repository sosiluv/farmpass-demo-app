import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock } from "lucide-react";

interface UptimeCardProps {
  monitors: Array<{
    friendly_name: string;
    status: number;
    all_time_uptime_ratio: number;
  }>;
}

export function UptimeCard({ monitors }: UptimeCardProps) {
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
          {(monitors || []).map((monitor) => (
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
                    strokeDasharray={`${monitor.all_time_uptime_ratio}, 100`}
                    className={
                      monitor.status === 2
                        ? "stroke-green-500"
                        : "stroke-red-500"
                    }
                  />
                  <text
                    x="18"
                    y="20.35"
                    className="fill-current text-[0.5em] font-medium"
                    textAnchor="middle"
                  >
                    {monitor.all_time_uptime_ratio}%
                  </text>
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <h4 className="font-medium truncate">
                    {monitor.friendly_name}
                  </h4>
                  <Badge
                    variant={monitor.status === 2 ? "default" : "destructive"}
                    className="shrink-0"
                  >
                    {monitor.status === 2 ? "정상" : "문제 발생"}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  전체 가동률: {monitor.all_time_uptime_ratio}%
                </p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
