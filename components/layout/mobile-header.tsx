"use client";

import { useAuth } from "@/components/providers/auth-provider";
import { useFarms } from "@/lib/hooks/use-farms";
import { Logo } from "@/components/common";

export function MobileHeader() {
  const { state } = useAuth();
  const profile = state.status === "authenticated" ? state.profile : null;
  const { farms } = useFarms();

  return (
    <header className="flex h-16 items-center justify-between border-b bg-background px-4 md:hidden">
      <div className="flex items-center gap-2">
        <Logo size="sm" />
        <div className="flex flex-col">
          <span className="text-sm font-semibold">농장 관리</span>
          <span className="text-xs text-muted-foreground">
            {profile?.account_type === "admin"
              ? "시스템 관리자"
              : farms.length > 0
              ? `${farms.length}개 농장`
              : "농장 등록 필요"}
          </span>
        </div>
      </div>

      {/* 오른쪽 공간 (필요시 추가 요소 배치 가능) */}
      <div className="flex items-center">
        {/* 향후 알림, 사용자 메뉴 등 추가 가능 */}
      </div>
    </header>
  );
}
