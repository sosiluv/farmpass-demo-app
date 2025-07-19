"use client";

import { useAuth } from "@/components/providers/auth-provider";
import { useFarmsContext } from "@/components/providers/farms-provider";
import { Logo } from "@/components/common";
import { usePathname } from "next/navigation";

export function MobileHeader() {
  const { state } = useAuth();
  const profile = state.status === "authenticated" ? state.profile : null;
  const { farms } = useFarmsContext();
  const pathname = usePathname();

  // 현재 경로에 따른 페이지 제목
  const getPageTitle = () => {
    if (pathname.includes("/admin/dashboard")) return "대시보드";
    if (pathname.includes("/admin/farms")) return "농장 관리";
    if (pathname.includes("/admin/visitors")) return "방문자 관리";
    if (pathname.includes("/admin/management")) return "시스템 관리";
    if (pathname.includes("/admin/monitoring")) return "모니터링";
    if (pathname.includes("/admin/notifications")) return "알림 설정";
    if (pathname.includes("/admin/settings")) return "설정";
    if (pathname.includes("/admin/account")) return "계정 관리";
    return "관리자";
  };

  return (
    <header className="flex h-16 items-center justify-between border-b bg-background px-4 md:hidden">
      <div className="flex items-center gap-2">
        <Logo size="xl" />
        <div className="flex flex-col">
          <span className="text-sm font-semibold">{getPageTitle()}</span>
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
