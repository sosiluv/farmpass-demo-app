"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { RefreshCw, AlertCircle, Wifi } from "lucide-react";
import { createErrorLog } from "@/lib/utils/logging/system-log";
import { devLog } from "@/lib/utils/logging/dev-logger";

interface AdminErrorProps {
  error: Error & { digest?: string };
  reset?: () => void;
  title?: string;
  description?: string;
  showNavigation?: boolean;
}

export function AdminError({
  error,
  reset,
  title = "정보를 불러오는 중 문제가 발생했어요",
  description = "잠시 후 다시 시도해주세요.",
  showNavigation = true,
}: AdminErrorProps) {
  useEffect(() => {
    createErrorLog(
      "ADMIN_COMPONENT_ERROR",
      error,
      "관리 영역 컴포넌트 에러"
    ).catch((logError) => {
      devLog.error("Failed to log admin component error:", logError);
    });

    devLog.error("Admin component error:", error);
  }, [error]);

  return (
    <div className="flex items-center justify-center min-h-[500px] p-6">
      <div className="text-center max-w-lg mx-auto">
        {/* 세련된 에러 아이콘 */}
        <div className="relative mb-8">
          <div className="w-24 h-24 bg-gradient-to-br from-amber-100 to-orange-100 rounded-2xl flex items-center justify-center mx-auto shadow-lg">
            <AlertCircle className="w-12 h-12 text-amber-600" />
          </div>
          {/* 연결 끊김 표시 */}
          <div className="absolute -top-2 -right-2 w-8 h-8 bg-red-500 rounded-full flex items-center justify-center shadow-md">
            <Wifi className="w-4 h-4 text-white" />
          </div>
        </div>

        {/* 메인 메시지 */}
        <h2 className="text-2xl font-bold text-slate-800 mb-3 tracking-tight">
          {title}
        </h2>

        {/* 설명 */}
        <p className="text-lg text-slate-500 mb-8 leading-relaxed">
          {description}
        </p>

        {/* 세련된 액션 버튼 */}
        {reset && (
          <Button
            onClick={reset}
            className="px-8 py-3 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white font-medium rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            다시 시도하기
          </Button>
        )}

        {/* 로딩 점들 */}
        <div className="mt-12 flex justify-center space-x-1">
          <div className="w-2 h-2 bg-amber-400 rounded-full animate-pulse"></div>
          <div className="w-2 h-2 bg-orange-400 rounded-full animate-pulse delay-75"></div>
          <div className="w-2 h-2 bg-amber-400 rounded-full animate-pulse delay-150"></div>
        </div>

        {/* 개발 모드에서만 에러 상세 정보 */}
        {process.env.NODE_ENV === "development" && (
          <details className="mt-8 text-left bg-slate-50 border border-slate-200 p-4 rounded-xl shadow-sm">
            <summary className="cursor-pointer text-sm font-medium text-slate-700 mb-3 flex items-center">
              <div className="w-2 h-2 bg-amber-500 rounded-full mr-2"></div>
              개발자 정보
            </summary>
            <div className="text-xs text-red-600 font-mono break-all bg-white p-3 rounded-lg border">
              <p className="mb-2">
                <strong className="text-slate-700">Error:</strong>{" "}
                {error.message}
              </p>
              {error.digest && (
                <p>
                  <strong className="text-slate-700">Digest:</strong>{" "}
                  {error.digest}
                </p>
              )}
            </div>
          </details>
        )}
      </div>
    </div>
  );
}
