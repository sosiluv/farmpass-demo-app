"use client";

import { useState, useEffect, useRef } from "react";
import { Menu, X, ChevronLeft } from "lucide-react";
import { SidebarTrigger, useSidebar } from "@/components/ui/sidebar";
import {
  useIsMobile,
  useIsMobileOrTablet,
  useIsTablet,
} from "@/hooks/ui/use-mobile";
import { cn } from "@/lib/utils";
import { BUTTONS } from "@/lib/constants/common";

interface MobileMenuButtonProps {
  className?: string;
}

export function MobileMenuButton({ className }: MobileMenuButtonProps) {
  const [hasShownIntro, setHasShownIntro] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [scrollTimeout, setScrollTimeout] = useState<NodeJS.Timeout | null>(
    null
  );
  const { openMobile } = useSidebar();
  const isMobile = useIsMobile();
  const isTablet = useIsTablet();
  const isMobileOrTablet = useIsMobileOrTablet();
  const introTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // 첫 방문 여부 확인
    const hasVisitedBefore = localStorage.getItem("hasVisitedDashboard");

    if (!hasVisitedBefore) {
      setHasShownIntro(true);

      // 기존 타이머가 있다면 클리어
      if (introTimerRef.current) {
        clearTimeout(introTimerRef.current);
      }

      // 5초 후에 인트로 효과 제거
      introTimerRef.current = setTimeout(() => {
        setHasShownIntro(false);
        localStorage.setItem("hasVisitedDashboard", "true");
      }, 5000);
    }

    // 컴포넌트 언마운트 시 타이머 클리어
    return () => {
      if (introTimerRef.current) {
        clearTimeout(introTimerRef.current);
      }
    };
  }, []);

  // 스크롤 반응형 동작
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;

      // 스크롤 다운 시 숨김
      if (currentScrollY > lastScrollY && currentScrollY > 100) {
        setIsVisible(false);
      } else {
        setIsVisible(true);
      }

      setLastScrollY(currentScrollY);

      // 이전 타이머가 있다면 클리어
      if (scrollTimeout) {
        clearTimeout(scrollTimeout);
      }

      // 새로운 타이머 설정 (스크롤이 멈추고 1초 후에 버튼 표시)
      const newTimeout = setTimeout(() => {
        setIsVisible(true);
      }, 1000);

      setScrollTimeout(newTimeout);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", handleScroll);
      // 컴포넌트 언마운트 시 타이머 클리어
      if (scrollTimeout) {
        clearTimeout(scrollTimeout);
      }
    };
  }, [lastScrollY, scrollTimeout]);

  // 상태별 아이콘 선택 (태블릿에서는 조금 더 크게)
  const getIcon = () => {
    const iconSize = isTablet ? "h-7 w-7" : "h-6 w-6";

    if (openMobile) {
      return <ChevronLeft className={iconSize} />;
    }
    return <Menu className={iconSize} />;
  };

  // 터치 피드백 (햅틱 반응)
  const handleClick = () => {
    if (typeof window !== "undefined") {
      localStorage.setItem("hasVisitedDashboard", "true");
    }
    // 햅틱 피드백 (지원하는 기기에서만)
    if ("vibrate" in navigator) {
      navigator.vibrate(50);
    }
  };

  // 모바일 또는 태블릿에서만 표시
  if (!isMobileOrTablet) {
    return null;
  }

  return (
    <div
      className={cn(
        "fixed bottom-6 right-6 z-50 transition-all duration-300",
        "safe-area-inset-bottom safe-area-inset-right",
        !isVisible && "translate-y-20 opacity-0",
        className
      )}
      style={{
        bottom: "max(1.5rem, env(safe-area-inset-bottom, 1.5rem))",
        right: "max(1.5rem, env(safe-area-inset-right, 1.5rem))",
      }}
    >
      <SidebarTrigger
        className={cn(
          "flex items-center justify-center rounded-full shadow-lg",
          "transition-all duration-300 hover:shadow-xl hover:scale-110 active:scale-95",
          "border-2 backdrop-blur-sm relative overflow-hidden",
          // 크기: 모바일은 작게, 태블릿은 조금 더 크게
          isMobile ? "w-14 h-14" : isTablet ? "w-16 h-16" : "w-14 h-14",
          // 색상 및 상태
          openMobile
            ? "bg-secondary text-secondary-foreground border-secondary/20"
            : "bg-primary text-primary-foreground border-white/20",
          hasShownIntro && "animate-bounce"
        )}
        aria-label={
          openMobile ? BUTTONS.MOBILE_MENU_CLOSE : BUTTONS.MOBILE_MENU_OPEN
        }
        onClick={handleClick}
      >
        {getIcon()}
        {openMobile && (
          <div
            className={cn(
              "absolute -top-1 -right-1 bg-green-500 rounded-full animate-pulse border-2 border-white",
              // 태블릿에서는 인디케이터도 조금 더 크게
              isTablet ? "h-4 w-4" : "h-3 w-3"
            )}
          />
        )}
      </SidebarTrigger>
    </div>
  );
}
