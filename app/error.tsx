"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";
import { devLog } from "@/lib/utils/logging/dev-logger";
import { GLOBAL_ERROR_LABELS } from "@/lib/constants/error";
import { LottieLoading } from "@/components/ui/lottie-loading";

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function Error({ error, reset }: ErrorProps) {
  useEffect(() => {
    devLog.error("Global error occurred:", error);
  }, [error]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-orange-50 flex items-center justify-center p-4">
      <div className="text-center max-w-md w-full mx-auto">
        {/* 에러 Lottie 애니메이션 */}
        <div className="mb-8 flex justify-center">
          <div className="w-64 h-64">
            <LottieLoading
              animationPath="/lottie/admin_error.json"
              size="xl"
              showText={false}
              fullScreen={false}
            />
          </div>
        </div>

        {/* 메인 메시지 */}
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-800 mb-4 tracking-tight">
          {GLOBAL_ERROR_LABELS.PAGE_TITLE}
        </h1>

        {/* 설명 */}
        <p className="text-base sm:text-lg text-slate-500 mb-10 leading-relaxed">
          {GLOBAL_ERROR_LABELS.DESCRIPTION.split("\n").map((line, index) => (
            <span key={index}>
              {line}
              {index <
                GLOBAL_ERROR_LABELS.DESCRIPTION.split("\n").length - 1 && (
                <br />
              )}
            </span>
          ))}
        </p>

        {/* 세련된 액션 버튼 */}
        <Button
          size="lg"
          className="px-8 py-3 bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700 text-white font-medium rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 w-full sm:w-auto"
          onClick={reset}
        >
          <RefreshCw className="w-6 h-6 mr-3" />
          {GLOBAL_ERROR_LABELS.BUTTONS.RETRY}
        </Button>

        {/* 로딩 애니메이션(404와 동일하게) */}
        <div className="mt-16 flex justify-center space-x-2">
          <div className="w-2 h-2 bg-slate-300 rounded-full animate-pulse"></div>
          <div className="w-2 h-2 bg-slate-300 rounded-full animate-pulse delay-75"></div>
          <div className="w-2 h-2 bg-slate-300 rounded-full animate-pulse delay-150"></div>
        </div>

        {/* 개발 모드에서만 에러 상세 정보 */}
        {process.env.NODE_ENV === "development" && (
          <details className="mt-16 text-left bg-slate-50 border border-slate-200 p-4 rounded-xl shadow-sm">
            <summary className="cursor-pointer text-lg font-medium text-slate-700 mb-3 flex items-center">
              <div className="w-3 h-3 bg-red-500 rounded-full mr-2"></div>
              {GLOBAL_ERROR_LABELS.DEVELOPER_INFO.TITLE}
            </summary>
            <div className="text-base text-red-600 font-mono break-all bg-white p-3 rounded-lg border">
              <p className="mb-2">
                <strong className="text-slate-700">
                  {GLOBAL_ERROR_LABELS.DEVELOPER_INFO.ERROR_LABEL}
                </strong>{" "}
                {error.message}
              </p>
              {error.digest && (
                <p>
                  <strong className="text-slate-700">
                    {GLOBAL_ERROR_LABELS.DEVELOPER_INFO.DIGEST_LABEL}
                  </strong>{" "}
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
