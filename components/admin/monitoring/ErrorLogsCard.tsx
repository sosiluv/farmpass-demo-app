import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ScrollArea } from "@/components/ui/scroll-area";
import { AlertCircle, AlertTriangle, Info } from "lucide-react";
import { cn } from "@/lib/utils";

interface ErrorLogsCardProps {
  errors: Array<{
    timestamp: string;
    level: string;
    message: string;
  }>;
}

export function ErrorLogsCard({ errors }: ErrorLogsCardProps) {
  // 데이터 유효성 검사
  if (!Array.isArray(errors)) {
    return (
      <Card className="bg-gradient-to-br from-background to-muted/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5" />
            최근 에러
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-muted-foreground">
            에러 로그를 불러오는 중입니다.
          </div>
        </CardContent>
      </Card>
    );
  }

  const getErrorIcon = (level: string) => {
    switch (level.toLowerCase()) {
      case "error":
        return AlertCircle;
      case "warning":
        return AlertTriangle;
      default:
        return Info;
    }
  };

  const getErrorColor = (level: string) => {
    switch (level.toLowerCase()) {
      case "error":
        return "text-red-500";
      case "warning":
        return "text-yellow-500";
      default:
        return "text-blue-500";
    }
  };

  return (
    <Card className="bg-gradient-to-br from-background to-muted/20">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5" />
            최근 에러
          </CardTitle>
          {errors.length > 0 && (
            <div className="text-sm text-muted-foreground">
              총 {errors.length}건
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[400px] pr-4">
          <div className="space-y-4">
            {errors.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <Info className="h-12 w-12 text-muted-foreground/50 mb-4" />
                <p className="text-sm text-muted-foreground">
                  최근 발생한 에러가 없습니다.
                </p>
                <p className="text-xs text-muted-foreground/70 mt-1">
                  모든 시스템이 정상적으로 작동 중입니다.
                </p>
              </div>
            ) : (
              (errors || []).map((error, index) => {
                const ErrorIcon = getErrorIcon(error.level);
                return (
                  <div
                    key={`${error.timestamp}-${index}`}
                    className="rounded-lg bg-muted/50 p-4 transition-colors hover:bg-muted/70"
                  >
                    <div className="flex items-start gap-3">
                      <ErrorIcon
                        className={cn(
                          "h-5 w-5 mt-0.5",
                          getErrorColor(error.level)
                        )}
                      />
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center justify-between">
                          <p
                            className={cn(
                              "text-sm font-medium",
                              getErrorColor(error.level)
                            )}
                          >
                            {error.level.toUpperCase()}
                          </p>
                          <time className="text-xs text-muted-foreground">
                            {new Date(error.timestamp).toLocaleString()}
                          </time>
                        </div>
                        <p className="text-sm">{error.message}</p>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
