import { Badge } from "@/components/ui/badge";
import { Server, Wifi } from "lucide-react";
import type { DebugInfo } from "@/lib/types/debug";

interface SystemInfoSectionProps {
  debugInfo: DebugInfo;
  lastUpdate: Date;
}

export function SystemInfoSection({
  debugInfo,
  lastUpdate,
}: SystemInfoSectionProps) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-orange-700">
          <Server className="h-3 w-3" />
          <span className="font-medium">시스템 정보</span>
        </div>
        <span className="text-xs text-orange-500">
          {lastUpdate.toLocaleTimeString("ko-KR")}
        </span>
      </div>
      <div className="space-y-1 text-orange-600 ml-5">
        <div className="flex justify-between">
          <span>현재 페이지:</span>
          <span className="truncate max-w-32" title={debugInfo.pathname}>
            {debugInfo.pathname}
          </span>
        </div>
        <div className="flex justify-between items-center">
          <span>네트워크:</span>
          <Badge
            variant={
              debugInfo.networkStatus === "online" ? "default" : "destructive"
            }
            className="text-xs h-4"
          >
            <Wifi className="h-2 w-2 mr-1" />
            {debugInfo.networkStatus === "online" ? "온라인" : "오프라인"}
          </Badge>
        </div>
        {debugInfo.memoryUsage && (
          <div className="space-y-1">
            <div className="flex justify-between">
              <span>메모리 사용:</span>
              <span>{debugInfo.memoryUsage.used}MB</span>
            </div>
            <div className="flex justify-between">
              <span>메모리 할당:</span>
              <span>{debugInfo.memoryUsage.total}MB</span>
            </div>
            <div className="flex justify-between">
              <span>메모리 한계:</span>
              <span>{debugInfo.memoryUsage.limit}MB</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
