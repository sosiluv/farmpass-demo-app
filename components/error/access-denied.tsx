"use client";

import { Button } from "@/components/ui/button";
import { Shield, Lock, Key } from "lucide-react";
import Link from "next/link";

interface AccessDeniedProps {
  title?: string;
  description?: string;
  requiredRole?: string;
  currentRole?: string;
  showNavigation?: boolean;
}

export function AccessDenied({
  title = "접근할 수 있는 권한이 없어요",
  description = "이 기능을 사용하려면 추가 권한이 필요합니다.",
  requiredRole,
  currentRole,
  showNavigation = true,
}: AccessDeniedProps) {
  return (
    <div className="flex items-center justify-center min-h-[500px] p-6">
      <div className="text-center max-w-lg mx-auto">
        {/* 세련된 권한 아이콘 */}
        <div className="relative mb-8">
          <div className="w-24 h-24 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-2xl flex items-center justify-center mx-auto shadow-lg">
            <Shield className="w-12 h-12 text-blue-600" />
          </div>
          {/* 잠금 표시 */}
          <div className="absolute -top-2 -right-2 w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center shadow-md">
            <Lock className="w-4 h-4 text-white" />
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
                권한 정보
              </span>
            </div>
            <div className="text-sm text-slate-600 space-y-1">
              <div>
                필요 권한:{" "}
                <span className="font-semibold text-blue-700">
                  {requiredRole}
                </span>
              </div>
              <div>
                현재 권한:{" "}
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
            대시보드로 이동
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
