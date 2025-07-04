"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { RefreshCw, AlertCircle, Wifi } from "lucide-react";
import { devLog } from "@/lib/utils/logging/dev-logger";

interface AdminErrorProps {
  error: Error & { digest?: string };
  reset?: () => void;
  retry?: () => void;
  title?: string;
  description?: string;
  showNavigation?: boolean;
}

export function AdminError({
  error,
  reset,
  retry,
  title = "정보를 불러오는 중 문제가 발생했어요",
  description = "잠시 후 다시 시도해주세요.",
  showNavigation = true,
}: AdminErrorProps) {
  useEffect(() => {
    devLog.error("Admin component error:", error);
  }, [error]);

  const handleRetry = () => {
    reset?.();

    retry?.();

    if (!retry) {
      window.location.reload();
    }
  };

  return (
    <div className="flex items-center justify-center min-h-[500px] p-6">
      <div className="text-center max-w-lg mx-auto">
        <div className="relative mb-8">
          <div className="w-24 h-24 bg-gradient-to-br from-amber-100 to-orange-100 rounded-2xl flex items-center justify-center mx-auto shadow-lg">
            <AlertCircle className="w-12 h-12 text-amber-600" />
          </div>
          <div className="absolute -top-2 -right-2 w-8 h-8 bg-red-500 rounded-full flex items-center justify-center shadow-md">
            <Wifi className="w-4 h-4 text-white" />
          </div>
        </div>

        <h2 className="text-2xl font-bold text-slate-800 mb-3 tracking-tight">
          {title}
        </h2>

        <p className="text-lg text-slate-500 mb-8 leading-relaxed">
          {description}
        </p>

        <Button
          onClick={handleRetry}
          className="px-8 py-3 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white font-medium rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          다시 시도하기
        </Button>

        <div className="mt-12 flex justify-center space-x-1">
          <div className="w-2 h-2 bg-amber-400 rounded-full animate-pulse"></div>
          <div className="w-2 h-2 bg-orange-400 rounded-full animate-pulse delay-75"></div>
          <div className="w-2 h-2 bg-amber-400 rounded-full animate-pulse delay-150"></div>
        </div>

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
