"use client";

import { useAuth } from "@/components/providers/auth-provider";
import { useFarmsContext } from "@/components/providers/farms-provider";
import { Logo } from "@/components/common";
import { usePathname } from "next/navigation";
import { LABELS } from "@/lib/constants/common";

export function MobileHeader() {
  const { state } = useAuth();
  const profile = state.status === "authenticated" ? state.profile : null;
  const { farms } = useFarmsContext();
  const pathname = usePathname();

  // 현재 경로에 따른 페이지 제목
  const getPageTitle = () => {
    if (pathname.includes("/admin/dashboard"))
      return LABELS.MOBILE_HEADER_DASHBOARD;
    if (pathname.includes("/admin/farms"))
      return LABELS.MOBILE_HEADER_FARM_MANAGEMENT;
    if (pathname.includes("/admin/visitors"))
      return LABELS.MOBILE_HEADER_VISITOR_MANAGEMENT;
    if (pathname.includes("/admin/management"))
      return LABELS.MOBILE_HEADER_SYSTEM_MANAGEMENT;
    if (pathname.includes("/admin/monitoring"))
      return LABELS.MOBILE_HEADER_MONITORING;
    if (pathname.includes("/admin/notifications"))
      return LABELS.MOBILE_HEADER_NOTIFICATION_SETTINGS;
    if (pathname.includes("/admin/settings"))
      return LABELS.MOBILE_HEADER_SETTINGS;
    if (pathname.includes("/admin/account"))
      return LABELS.MOBILE_HEADER_ACCOUNT_MANAGEMENT;
    return LABELS.MOBILE_HEADER_ADMIN;
  };

  return (
    <header className="flex h-16 items-center justify-between border-b bg-background px-4 md:hidden">
      <div className="flex items-center gap-2">
        <Logo size="xl" />
        <div className="flex flex-col">
          <span className="text-sm font-semibold">{getPageTitle()}</span>
          <span className="text-xs text-muted-foreground">
            {profile?.account_type === "admin"
              ? LABELS.MOBILE_HEADER_SYSTEM_ADMIN
              : farms.length > 0
              ? LABELS.MOBILE_HEADER_FARM_COUNT.replace(
                  "{count}",
                  farms.length.toString()
                )
              : LABELS.MOBILE_HEADER_FARM_REGISTRATION_NEEDED}
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
