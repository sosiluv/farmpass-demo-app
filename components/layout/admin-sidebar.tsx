"use client";

import { useAuth } from "@/components/providers/auth-provider";
import { useFarms } from "@/lib/hooks/use-farms";
import { useSystemSettings } from "@/lib/hooks/use-system-settings";
import { getFarmTypeLabel, getFarmTypeIcon } from "@/lib/constants/farm-types";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  BarChart3,
  Building2,
  Users,
  Bell,
  Settings,
  User,
  LogOut,
  Home,
  Shield,
  TestTube,
  Activity,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMemo } from "react";
import { Logo } from "@/components/common";
import { DEFAULT_SYSTEM_SETTINGS } from "@/lib/types/settings";

export function AdminSidebar() {
  const { state, signOut } = useAuth();
  const { farms } = useFarms();
  const { settings } = useSystemSettings();
  const { isMobile, setOpenMobile } = useSidebar();

  const profile = state.status === "authenticated" ? state.profile : null;

  // 모바일에서 메뉴 클릭 시 사이드바 닫기
  const handleMenuClick = () => {
    if (isMobile) {
      setOpenMobile(false);
    }
  };

  // 터치 제스처 핸들러
  const handleTouchStart = (e: React.TouchEvent) => {
    if (!isMobile) return;
    const touch = e.touches[0];
    const startX = touch.clientX;

    const handleTouchMove = (moveEvent: TouchEvent) => {
      const currentTouch = moveEvent.touches[0];
      const deltaX = currentTouch.clientX - startX;

      // 왼쪽으로 50px 이상 스와이프하면 닫기
      if (deltaX < -50) {
        setOpenMobile(false);
        document.removeEventListener("touchmove", handleTouchMove);
        document.removeEventListener("touchend", handleTouchEnd);
      }
    };

    const handleTouchEnd = () => {
      document.removeEventListener("touchmove", handleTouchMove);
      document.removeEventListener("touchend", handleTouchEnd);
    };

    document.addEventListener("touchmove", handleTouchMove);
    document.addEventListener("touchend", handleTouchEnd);
  };

  // 더블 탭으로 닫기
  const handleDoubleClick = () => {
    if (isMobile) {
      setOpenMobile(false);
    }
  };
  const pathname = usePathname();

  // 동적 메뉴 아이템 생성
  const menuItems = useMemo(() => {
    const isAdmin = profile?.account_type === "admin";

    // 모든 사용자가 동일한 visitors 페이지 사용
    const visitorsUrl = "/admin/visitors";
    const visitorsTitle = isAdmin ? "전체 방문자 기록" : "방문자 기록";
    const visitorsBadge = farms.length === 0 ? "농장 필요" : null;

    const baseMenuItems = [
      {
        title: "대시보드",
        url: "/admin/dashboard",
        icon: BarChart3,
        badge: null,
      },
      {
        title: "농장 관리",
        url: "/admin/farms",
        icon: Building2,
        badge: null,
      },
      {
        title: visitorsTitle,
        url: visitorsUrl,
        icon: Users,
        badge: visitorsBadge,
      },
      {
        title: "알림 설정",
        url: "/admin/notifications",
        icon: Bell,
        badge: null,
      },
      {
        title: "계정 관리",
        url: "/admin/account",
        icon: User,
        badge: null,
      },
      // {
      //   title: "푸시 알림 테스트",
      //   url: "/admin/test-push",
      //   icon: TestTube,
      //   badge: null,
      // },
    ];

    // admin만 볼 수 있는 메뉴 아이템
    const adminMenuItems = [
      {
        title: "시스템 관리",
        url: "/admin/management",
        icon: Shield,
        badge: null,
      },
      {
        title: "시스템 설정",
        url: "/admin/settings",
        icon: Settings,
        badge: null,
      },
      {
        title: "모니터링",
        url: "/admin/monitoring",
        icon: Activity,
        badge: null,
      },
    ];

    // admin인 경우 admin 메뉴 아이템도 포함
    return isAdmin ? [...baseMenuItems, ...adminMenuItems] : baseMenuItems;
  }, [farms, profile?.account_type]);

  return (
    <Sidebar
      className="bg-background border-r"
      onTouchStart={handleTouchStart}
      onDoubleClick={handleDoubleClick}
    >
      <SidebarHeader className="bg-background border-b">
        <div className="flex flex-col items-center gap-2 px-2 py-4">
          <Logo size="lg" />
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="text-sm font-semibold truncate cursor-help text-center block w-full">
                  {settings.siteName || DEFAULT_SYSTEM_SETTINGS.siteName}
                </span>
              </TooltipTrigger>
              <TooltipContent>
                <p>{settings.siteName || DEFAULT_SYSTEM_SETTINGS.siteName}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <span className="text-xs text-muted-foreground truncate text-center block w-full">
            {profile?.account_type === "admin"
              ? "시스템 관리자"
              : farms.length > 0
              ? `${farms.length}개 농장 관리`
              : "농장을 등록해주세요"}
          </span>
        </div>

        {/* 대시보드로 돌아가기 버튼 - 모바일에서만 표시 */}
        <div className="px-2 pb-2 md:hidden">
          <Link href="/admin/dashboard" legacyBehavior>
            <Button
              variant="outline"
              size="sm"
              className="w-full justify-start"
              onClick={handleMenuClick}
            >
              <Home className="mr-2 h-4 w-4" />
              대시보드로 이동
            </Button>
          </Link>
        </div>

        {/* 모바일 사용 안내 */}
        {isMobile && (
          <div className="px-2 pb-2 md:hidden">
            <div className="text-xs text-muted-foreground text-center py-2 px-3 bg-muted/30 rounded-lg">
              💡 닫기: 외부 터치 · 왼쪽 스와이프 · 우하단 버튼
            </div>
          </div>
        )}
      </SidebarHeader>

      <SidebarContent className="bg-background">
        <SidebarGroup>
          <SidebarGroupLabel className="text-xs font-medium text-muted-foreground px-2 py-2">
            관리 메뉴
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <Link href={item.url} passHref legacyBehavior>
                    <Button
                      variant={pathname === item.url ? "secondary" : "ghost"}
                      className="w-full justify-start h-auto py-2.5 px-3"
                      onClick={handleMenuClick}
                    >
                      <div className="flex items-center justify-between w-full">
                        <div className="flex items-center gap-3">
                          <item.icon className="h-5 w-5" />
                          <span className="font-medium">{item.title}</span>
                        </div>
                        {item.badge && (
                          <Badge
                            variant="secondary"
                            className="text-xs px-2 py-0.5"
                          >
                            {item.badge}
                          </Badge>
                        )}
                      </div>
                    </Button>
                  </Link>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* 농장별 바로가기 (모든 사용자, 농장이 2개 이상일 때) */}
        {farms.length > 1 && (
          <SidebarGroup>
            <SidebarGroupLabel className="text-xs font-medium text-muted-foreground px-2 py-2">
              농장별 바로가기
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {farms.map((farm) => (
                  <SidebarMenuItem key={farm.id}>
                    <Link
                      href={`/admin/farms/${farm.id}/visitors`}
                      passHref
                      legacyBehavior
                    >
                      <Button
                        variant={
                          pathname === `/admin/farms/${farm.id}/visitors`
                            ? "secondary"
                            : "ghost"
                        }
                        className="w-full justify-start h-auto py-2.5 px-3"
                        onClick={handleMenuClick}
                      >
                        <div className="flex items-center gap-3 w-full">
                          {(() => {
                            const farmType = farm.farm_type ?? "default";
                            const Icon = getFarmTypeIcon(farmType);
                            return (
                              <Icon className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
                            );
                          })()}
                          <div className="flex-1 min-w-0 text-left">
                            <div className="truncate font-medium text-sm">
                              {farm.farm_name}
                            </div>
                            <div className="text-xs text-muted-foreground truncate">
                              {getFarmTypeLabel(farm.farm_type ?? "default")}
                            </div>
                          </div>
                        </div>
                      </Button>
                    </Link>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {/* 빠른 액션 - 모바일에서만 표시 */}
        <SidebarGroup className="md:hidden">
          <SidebarGroupLabel className="text-xs font-medium text-muted-foreground px-2 py-2">
            빠른 액션
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <div className="px-2 space-y-2">
              <Link href="/admin/farms" legacyBehavior>
                <Button
                  variant="default"
                  size="sm"
                  className="w-full justify-start"
                  onClick={handleMenuClick}
                >
                  <Building2 className="mr-2 h-4 w-4" />새 농장 추가
                </Button>
              </Link>
              <Link
                href={
                  profile?.account_type === "admin"
                    ? "/admin/all-visitors"
                    : farms.length > 0
                    ? "/admin/visitors"
                    : "/admin/farms"
                }
                legacyBehavior
              >
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full justify-start"
                  disabled={
                    profile?.account_type !== "admin" && farms.length === 0
                  }
                  onClick={handleMenuClick}
                >
                  <Users className="mr-2 h-4 w-4" />
                  {profile?.account_type === "admin"
                    ? "전체 방문자 현황"
                    : farms.length > 0
                    ? "방문자 현황"
                    : "농장 등록 필요"}
                </Button>
              </Link>
            </div>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="bg-background border-t">
        <SidebarMenu>
          <SidebarMenuItem>
            <div className="px-3 py-2 bg-muted/50 rounded-lg mx-2 mb-2">
              <div className="text-xs text-muted-foreground mb-1">
                현재 로그인
              </div>
              <div className="text-sm font-medium truncate">
                {profile?.name || "로그인 필요"}
              </div>
              <div className="text-xs text-muted-foreground truncate">
                {profile?.email || "로그인이 필요합니다"}
              </div>
            </div>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <Button
              variant="ghost"
              className="w-full justify-start mx-2 mb-2 text-red-600 hover:text-red-700 hover:bg-red-50"
              onClick={async () => {
                // Auth Provider에서 모든 로그아웃 로직 처리
                const result = await signOut();

                // 성공적으로 로그아웃되면 로그인 페이지로 리다이렉트
                if (result.success) {
                  window.location.href = "/login";
                }
              }}
            >
              <LogOut className="mr-2 h-4 w-4" />
              로그아웃
            </Button>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
