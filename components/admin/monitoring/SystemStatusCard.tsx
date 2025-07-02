import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Activity, Server, HardDrive, Cpu, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

interface SystemStatusCardProps {
  data: {
    timestamp: string;
    services: {
      health: {
        status: string;
        timestamp: string;
        uptime: number;
        responseTime: string;
        version: string;
        performance: {
          totalResponseTime: string;
          databaseResponseTime: string;
          cpu: {
            user: string;
            system: string;
            total: string;
          };
        };
        system: {
          farmCount: number;
          visitorCount: number;
          memory: {
            used: number;
            total: number;
            external: number;
            status: string;
          };
          cpu: {
            user: number;
            system: number;
            total: number;
            threshold: number;
            status: string;
          };
          nodeVersion: string;
          platform: string;
          arch: string;
        };
        services: {
          database: string;
          api: string;
          memory: string;
        };
      };
    };
  };
}

export function SystemStatusCard({ data }: SystemStatusCardProps) {
  // 데이터 유효성 검사
  if (!data?.services?.health) {
    return (
      <Card className="bg-gradient-to-br from-background to-muted/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            시스템 상태
          </CardTitle>
          <CardDescription>데이터를 불러오는 중...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-muted-foreground">
            시스템 상태 정보를 불러오고 있습니다.
          </div>
        </CardContent>
      </Card>
    );
  }

  const { health } = data.services;

  // CPU와 메모리 상태 데이터 유효성 검사
  const cpuStatus = health.system?.cpu?.status ?? "unknown";
  const cpuTotal = health.system?.cpu?.total ?? 0;
  const cpuUser = health.system?.cpu?.user ?? 0;
  const cpuSystem = health.system?.cpu?.system ?? 0;

  const memoryStatus = health.system?.memory?.status ?? "unknown";
  const memoryUsed = health.system?.memory?.used ?? 0;
  const memoryTotal = health.system?.memory?.total ?? 0;
  const memoryExternal = health.system?.memory?.external ?? 0;
  const memoryUsagePercent =
    memoryTotal > 0 ? (memoryUsed / memoryTotal) * 100 : 0;

  const getStatusText = (status: string) => {
    switch (status) {
      case "healthy":
        return "정상";
      case "unhealthy":
        return "비정상";
      case "warning":
        return "주의";
      default:
        return "알 수 없음";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "warning":
        return "text-yellow-500";
      case "error":
        return "text-red-500";
      case "unhealthy":
        return "text-red-500";
      default:
        return "text-green-500";
    }
  };

  const getProgressColor = (percent: number) => {
    if (percent >= 90) return "bg-red-500";
    if (percent >= 70) return "bg-yellow-500";
    return "bg-green-500";
  };

  return (
    <Card className="bg-gradient-to-br from-background to-muted/20">
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5 flex-shrink-0" />
              <span>시스템 상태</span>
            </CardTitle>
            <CardDescription className="mt-1">
              마지막 업데이트: {new Date(data.timestamp).toLocaleString()}
            </CardDescription>
          </div>
          <Badge
            variant={health.status === "healthy" ? "default" : "destructive"}
            className="h-7 w-fit"
          >
            {getStatusText(health.status)}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* CPU 상태 */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Cpu
                className={cn(
                  "h-5 w-5 flex-shrink-0",
                  getStatusColor(cpuStatus)
                )}
              />
              <span className="font-medium">CPU</span>
            </div>
            <div className="space-y-2">
              <Progress
                value={cpuTotal}
                className={cn("h-2", getProgressColor(cpuTotal))}
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>사용량: {cpuTotal}%</span>
                <span>User: {cpuUser}%</span>
                <span>System: {cpuSystem}%</span>
              </div>
            </div>
          </div>

          {/* 메모리 상태 */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <HardDrive
                className={cn(
                  "h-5 w-5 flex-shrink-0",
                  getStatusColor(memoryStatus)
                )}
              />
              <span className="font-medium">메모리</span>
            </div>
            <div className="space-y-2">
              <Progress
                value={memoryUsagePercent}
                className={cn("h-2", getProgressColor(memoryUsagePercent))}
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>사용: {memoryUsed}MB</span>
                <span>전체: {memoryTotal}MB</span>
                <span>External: {memoryExternal}MB</span>
              </div>
            </div>
          </div>

          {/* 응답 시간 */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 flex-shrink-0 text-blue-500" />
              <span className="font-medium">응답 시간</span>
            </div>
            <div className="space-y-2">
              <div className="text-2xl font-bold">
                {health.performance?.totalResponseTime ?? "N/A"}
              </div>
              <div className="text-xs text-muted-foreground">
                서버 상태: {getStatusText(health.status ?? "unknown")}
              </div>
            </div>
          </div>

          {/* 시스템 정보 */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Server className="h-5 w-5 flex-shrink-0 text-purple-500" />
              <span className="font-medium">시스템 정보</span>
            </div>
            <div className="space-y-2">
              <div className="text-sm">
                Node: {health.system?.nodeVersion ?? "N/A"}
              </div>
              <div className="text-sm text-muted-foreground">
                OS: {health.system?.platform ?? "N/A"} (
                {health.system?.arch ?? "N/A"})
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
