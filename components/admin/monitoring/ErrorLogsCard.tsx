import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { AlertCircle, AlertTriangle, Info } from "lucide-react";
import { cn } from "@/lib/utils";
import { LABELS, PAGE_HEADER } from "@/lib/constants/monitoring";
import type { ErrorLog } from "@/lib/types/monitoring";

interface ErrorLogsCardProps {
  errors: ErrorLog[];
}

export function ErrorLogsCard({ errors }: ErrorLogsCardProps) {
  // 데이터 유효성 검사
  if (!Array.isArray(errors)) {
    return (
      <Card className="bg-gradient-to-br from-background to-muted/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <AlertCircle className="h-5 w-5" />
            {PAGE_HEADER.RECENT_ERRORS}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-muted-foreground">
            {LABELS.LOADING_ERRORS}
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
          <CardTitle className="flex items-center gap-2 text-base">
            <AlertCircle className="h-5 w-5" />
            {PAGE_HEADER.RECENT_ERRORS}
          </CardTitle>
          {errors.length > 0 && (
            <div className="text-sm text-muted-foreground">
              {LABELS.TOTAL_ERRORS.replace("{count}", errors.length.toString())}
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
                  {LABELS.NO_RECENT_ERRORS}
                </p>
                <p className="text-xs text-muted-foreground/70 mt-1">
                  {LABELS.ALL_SYSTEMS_NORMAL}
                </p>
              </div>
            ) : (
              (errors || []).map((error, index) => {
                const ErrorIcon = getErrorIcon(error.level);
                return (
                  <div
                    key={`${error.timestamp}-${index}`}
                    className="rounded-lg bg-muted/50 p-3 sm:p-4 transition-colors hover:bg-muted/70 flex flex-col gap-2"
                  >
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-1 sm:gap-3 w-full">
                      <div className="flex items-center gap-2">
                        <ErrorIcon
                          className={cn("h-5 w-5", getErrorColor(error.level))}
                        />
                        <p
                          className={cn(
                            "text-sm font-medium break-words",
                            getErrorColor(error.level)
                          )}
                        >
                          {error.level.toUpperCase()}
                        </p>
                      </div>
                      <time className="text-xs text-muted-foreground ml-0 sm:ml-auto mt-1 sm:mt-0">
                        {new Date(error.timestamp).toLocaleString()}
                      </time>
                    </div>
                    <p className="text-sm break-words whitespace-pre-line w-full">
                      {error.message}
                    </p>
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
