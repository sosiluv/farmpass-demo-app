"use client";

import { Button } from "@/components/ui/button";
import { Key } from "lucide-react";
import Link from "next/link";
import { ERROR_LABELS } from "@/lib/constants/error";
import { LottieLoading } from "@/components/ui/lottie-loading";

interface AccessDeniedProps {
  title?: string;
  description?: string;
  requiredRole?: string;
  currentRole?: string;
}

export function AccessDenied({
  title = ERROR_LABELS.PERMISSION_ERROR_TITLE,
  description = ERROR_LABELS.PERMISSION_ERROR_DESCRIPTION,
  requiredRole,
  currentRole,
}: AccessDeniedProps) {
  return (
    <div className="flex items-center justify-center flex-1 p-6">
      <div className="text-center max-w-lg mx-auto">
        {/* Error Lottie 애니메이션 */}
        <div className="mb-8 flex justify-center">
          <div className="w-48 h-48">
            <LottieLoading
              animationPath="/lottie/error.json"
              size="lg"
              showText={false}
              fullScreen={false}
            />
          </div>
        </div>

        {/* 메인 메시지 */}
        <h2 className="text-2xl font-bold text-slate-800 mb-3 tracking-tight">
          {title}
        </h2>

        {/* 설명 */}
        <p className="text-lg text-slate-500 mb-6 leading-relaxed">
          {description}
        </p>

        {/* 권한 정보 카드 */}
        {requiredRole && currentRole && (
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-4 mb-8">
            <div className="flex items-center justify-center mb-2">
              <Key className="w-4 h-4 text-blue-600 mr-2" />
              <span className="text-sm font-medium text-blue-800">
                {ERROR_LABELS.ACCESS_DENIED_PERMISSION_INFO}
              </span>
            </div>
            <div className="text-sm text-slate-600 space-y-1">
              <div>
                {ERROR_LABELS.ACCESS_DENIED_REQUIRED_ROLE}{" "}
                <span className="font-semibold text-blue-700">
                  {requiredRole}
                </span>
              </div>
              <div>
                {ERROR_LABELS.ACCESS_DENIED_CURRENT_ROLE}{" "}
                <span className="font-semibold text-slate-700">
                  {currentRole}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* 세련된 액션 버튼 */}
        <Link href="/admin/dashboard">
          <Button className="px-8 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-medium rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5">
            {ERROR_LABELS.ACCESS_DENIED_GO_DASHBOARD}
          </Button>
        </Link>

        {/* 로딩 점들 */}
        <div className="mt-12 flex justify-center space-x-1">
          <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
          <div className="w-2 h-2 bg-indigo-400 rounded-full animate-pulse delay-75"></div>
          <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse delay-150"></div>
        </div>
      </div>
    </div>
  );
}
