"use client";

import { useAuth } from "@/components/providers/auth-provider";
import { useAuthActions } from "@/hooks/auth/useAuthActions";
import { useSystemSettingsQuery } from "@/lib/hooks/query/use-system-settings-query";
import { getFarmTypeLabel, getFarmTypeIcon } from "@/lib/constants/farm-types";
import type { Farm } from "@/lib/types/farm";
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
  Activity,
  Loader2,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMemo, useState } from "react";
import { Logo } from "@/components/common";
import { useLogo } from "@/hooks/ui/use-logo";
import { BUTTONS, LABELS } from "@/lib/constants/common";
import { useProfileQuery } from "@/lib/hooks/query/use-profile-query";
import { useFarmsQuery } from "@/lib/hooks/query/use-farms-query";

export function AdminSidebar() {
  const { state } = useAuth();
  const { signOut } = useAuthActions();
  const userId = state.status === "authenticated" ? state.user.id : undefined;
  const { data: profile, isLoading: profileLoading } = useProfileQuery(userId);
  const { farms } = useFarmsQuery(profile?.id);
  const { data: settings } = useSystemSettingsQuery();
  const { isMobile, setOpenMobile } = useSidebar();
  const { siteName } = useLogo(settings || null);
  const [isLoggingOut, setIsLoggingOut] = useState(false); // 로그아웃 로딩 상태 추가

  // 모바일에서 메뉴 클릭 시 사이드바 닫기
  const handleMenuClick = () => {
    if (isMobile) {
      setOpenMobile(false);
    }
  };

  // 로그아웃 핸들러 추가
  const handleLogout = async () => {
    setIsLoggingOut(true); // 즉시 로딩 상태 표시
    try {
      await signOut();
    } catch (error) {
      console.error("로그아웃 실패:", error);
    } finally {
      setIsLoggingOut(false);
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
    const visitorsTitle = isAdmin
      ? LABELS.ADMIN_SIDEBAR_ALL_VISITORS_RECORD
      : LABELS.ADMIN_SIDEBAR_VISITORS_RECORD;
    const visitorsBadge = farms.length === 0 ? LABELS.LAYOUT_FARM_NEEDED : null;

    const baseMenuItems = [
      {
        title: LABELS.ADMIN_SIDEBAR_DASHBOARD,
        url: "/admin/dashboard",
        icon: BarChart3,
        badge: null,
      },
      {
        title: LABELS.ADMIN_SIDEBAR_FARM_MANAGEMENT,
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
        title: LABELS.ADMIN_SIDEBAR_NOTIFICATION_SETTINGS,
        url: "/admin/notifications",
        icon: Bell,
        badge: null,
      },
      {
        title: LABELS.ADMIN_SIDEBAR_ACCOUNT_MANAGEMENT,
        url: "/admin/account",
        icon: User,
        badge: null,
      },
    ];

    // admin만 볼 수 있는 메뉴 아이템
    const adminMenuItems = [
      {
        title: LABELS.ADMIN_SIDEBAR_SYSTEM_MANAGEMENT,
        url: "/admin/management",
        icon: Shield,
        badge: null,
      },
      {
        title: LABELS.ADMIN_SIDEBAR_SYSTEM_SETTINGS,
        url: "/admin/settings",
        icon: Settings,
        badge: null,
      },
      {
        title: LABELS.ADMIN_SIDEBAR_MONITORING,
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
          <Logo size="lg" settings={settings || null} />
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="text-sm font-semibold truncate cursor-help text-center block w-full">
                  {siteName}
                </span>
              </TooltipTrigger>
              <TooltipContent>
                <p>{siteName}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <span className="text-xs text-muted-foreground truncate text-center block w-full">
            {profile?.account_type === "admin"
              ? LABELS.LAYOUT_ADMIN_SIDEBAR
              : farms.length > 0
              ? LABELS.LAYOUT_FARM_MANAGER.replace(
                  "{count}",
                  farms.length.toString()
                )
              : LABELS.LAYOUT_REGISTER_FARM}
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
              {BUTTONS.LAYOUT_GO_TO_DASHBOARD}
            </Button>
          </Link>
        </div>

        {/* 모바일 사용 안내 */}
        {isMobile && (
          <div className="px-2 pb-2 md:hidden">
            <div className="text-xs text-muted-foreground text-center py-2 px-3 bg-muted/30 rounded-lg">
              {LABELS.LAYOUT_MOBILE_GUIDE}
            </div>
          </div>
        )}
      </SidebarHeader>

      <SidebarContent className="bg-background">
        <SidebarGroup>
          <SidebarGroupLabel className="text-xs font-medium text-muted-foreground px-2 py-2">
            {LABELS.LAYOUT_MANAGEMENT_MENU}
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
              {LABELS.LAYOUT_FARM_QUICK_ACCESS}
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {(farms || []).map((farm: Farm) => (
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
            {LABELS.LAYOUT_QUICK_ACTIONS}
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
                  <Building2 className="mr-2 h-4 w-4" />
                  {BUTTONS.LAYOUT_ADD_NEW_FARM}
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
                    ? BUTTONS.LAYOUT_ALL_VISITORS_STATUS
                    : farms.length > 0
                    ? BUTTONS.LAYOUT_VISITORS_STATUS
                    : BUTTONS.LAYOUT_FARM_REGISTRATION_NEEDED}
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
                {LABELS.LAYOUT_CURRENT_LOGIN}
              </div>
              <div className="text-sm font-medium truncate">
                {state.status === "loading" || profileLoading
                  ? BUTTONS.PAGINATION_LOADING
                  : profile?.name || LABELS.LAYOUT_LOGIN_REQUIRED}
              </div>
              <div className="text-xs text-muted-foreground truncate">
                {state.status === "loading" || profileLoading
                  ? BUTTONS.PAGINATION_LOADING
                  : profile?.email || LABELS.LAYOUT_LOGIN_NEEDED}
              </div>
            </div>
          </SidebarMenuItem>

          <SidebarMenuItem>
            <div className="flex items-center justify-between mx-2 mb-2">
              <Button
                variant="ghost"
                className="flex-1 justify-start text-red-600 hover:text-red-700 hover:bg-red-50"
                onClick={handleLogout}
                disabled={isLoggingOut}
              >
                {isLoggingOut ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {BUTTONS.LAYOUT_LOGOUT_LOADING}
                  </>
                ) : (
                  <>
                    <LogOut className="mr-2 h-4 w-4" />
                    {BUTTONS.LAYOUT_LOGOUT}
                  </>
                )}
              </Button>
            </div>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
