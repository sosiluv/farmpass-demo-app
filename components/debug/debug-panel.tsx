"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Bug, ChevronDown, ChevronUp, RefreshCw } from "lucide-react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

// 커스텀 훅과 컴포넌트 import
import { useDebugInfo } from "@/hooks/use-debug-info";
import { useDebugLogs } from "@/hooks/use-debug-logs";
import { SystemInfoSection } from "./system-info-section";
import { PerformanceInfoSection } from "./performance-info-section";
import { DebugLogsSection } from "./debug-logs-section";
import type { DebugPanelProps } from "@/lib/types/debug";

export function DebugPanel({ show }: DebugPanelProps) {
  const [isOpen, setIsOpen] = useState(false);

  // 커스텀 훅 사용
  const { debugInfo, lastUpdate, updateDebugInfo } = useDebugInfo(show);
  const { logs, addLog, clearLogs } = useDebugLogs();

  // 이벤트 리스너 설정
  useEffect(() => {
    if (!show) return;

    // 초기 정보 수집
    updateDebugInfo();
    addLog(`페이지 로드: ${window.location.pathname}`);

    // 네트워크 상태 모니터링
    const handleOnline = () => {
      updateDebugInfo();
      addLog("네트워크 연결됨");
    };

    const handleOffline = () => {
      updateDebugInfo();
      addLog("네트워크 연결 끊김");
    };

    // 페이지 가시성 변경 감지
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        updateDebugInfo();
        addLog("페이지 활성화");
      }
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [show, updateDebugInfo, addLog]);

  // 자동 새로고침 (10초마다)
  useEffect(() => {
    if (show && isOpen) {
      const interval = setInterval(() => {
        updateDebugInfo();
      }, 10000);

      return () => clearInterval(interval);
    }
  }, [show, isOpen, updateDebugInfo]);

  // 수동 새로고침
  const handleManualRefresh = () => {
    updateDebugInfo();
    addLog("수동 새로고침");
  };

  // 로그 초기화
  const handleClearLogs = () => {
    clearLogs();
    addLog("로그 초기화됨");
  };

  if (!show || !debugInfo) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 w-80">
      <Card className="border-orange-200 bg-orange-50/95 backdrop-blur-sm">
        <Collapsible open={isOpen} onOpenChange={setIsOpen}>
          <CollapsibleTrigger asChild>
            <CardHeader className="pb-2 cursor-pointer hover:bg-orange-100/50 transition-colors">
              <CardTitle className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <Bug className="h-4 w-4 text-orange-600" />
                  <span className="text-orange-800">디버그 패널</span>
                  <Badge
                    variant="outline"
                    className="text-xs border-orange-300 text-orange-700"
                  >
                    DEBUG
                  </Badge>
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleManualRefresh();
                    }}
                    className="h-6 w-6 p-0 text-orange-600 hover:text-orange-800 hover:bg-orange-100"
                  >
                    <RefreshCw className="h-3 w-3" />
                  </Button>
                  {isOpen ? (
                    <ChevronUp className="h-4 w-4 text-orange-600" />
                  ) : (
                    <ChevronDown className="h-4 w-4 text-orange-600" />
                  )}
                </div>
              </CardTitle>
            </CardHeader>
          </CollapsibleTrigger>

          <CollapsibleContent>
            <CardContent className="pt-0 space-y-3 text-xs">
              {/* 시스템 정보 섹션 */}
              <SystemInfoSection
                debugInfo={debugInfo}
                lastUpdate={lastUpdate}
              />

              <Separator className="bg-orange-200" />

              {/* 성능 정보 섹션 */}
              <PerformanceInfoSection
                performanceInfo={debugInfo.performanceInfo}
              />

              <Separator className="bg-orange-200" />

              {/* 로그 섹션 */}
              <DebugLogsSection logs={logs} onClearLogs={handleClearLogs} />
            </CardContent>
          </CollapsibleContent>
        </Collapsible>
      </Card>
    </div>
  );
}
