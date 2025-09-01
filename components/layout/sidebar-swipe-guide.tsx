"use client";

import { useState, useEffect } from "react";
import { ChevronLeft } from "lucide-react";
import { useSidebar } from "@/components/ui/sidebar";
import { useIsMobile } from "@/hooks/ui/use-mobile";
import { useSwipeToClose } from "@/hooks/ui/use-gesture";
import { LABELS } from "@/lib/constants/common";

export function SidebarSwipeGuide() {
  const { openMobile, setOpenMobile } = useSidebar();
  const isMobile = useIsMobile();
  const [showSwipeGuide, setShowSwipeGuide] = useState(false);

  // 오버레이 영역에서 스와이프로 사이드바 닫기
  const bind = useSwipeToClose({
    direction: "left",
    threshold: 50,
    onClose: () => {
      setOpenMobile(false);
    },
    enabled: isMobile && openMobile,
  });

  // 사이드바가 열릴 때마다 가이드 표시
  useEffect(() => {
    // 모바일이고 사이드바가 열려있을 때만 실행
    if (!isMobile || !openMobile) {
      setShowSwipeGuide(false);
      return;
    }

    // 사이드바가 열린 후 1.5초 뒤에 가이드 효과 시작
    const timer = setTimeout(() => {
      setShowSwipeGuide(true);
      // 6초 후 가이드 자동 숨김
      setTimeout(() => setShowSwipeGuide(false), 8000);
    }, 1000);

    return () => clearTimeout(timer);
  }, [isMobile, openMobile]);

  // 클릭 시 가이드 숨기기
  const handleClick = () => {
    setShowSwipeGuide(false);
  };

  // 모바일이 아니거나 사이드바가 닫혀있으면 표시하지 않음
  if (!isMobile || !openMobile) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-[60] pointer-events-none bg-transparent"
      onClick={handleClick}
    >
      {/* 오버레이 영역 (사이드바 제외) - 스와이프 가능 */}
      <div
        className="ml-60 h-full flex items-center justify-center pointer-events-auto bg-transparent touch-none"
        {...bind()}
      >
        {/* 가이드가 표시될 때만 렌더링 */}
        {showSwipeGuide && (
          <div className="relative">
            {/* 메인 안내 영역 */}
            <div className="flex flex-col items-center gap-6">
              {/* Instagram/TikTok 스타일 연속 화살표 애니메이션 */}
              <div className="flex items-center">
                {/* 연속된 화살표들이 순차적으로 나타나는 효과 */}
                <div
                  className="animate-pulse opacity-40"
                  style={{
                    animationDelay: "0ms",
                    animationDuration: "1.5s",
                  }}
                >
                  <ChevronLeft className="w-10 h-10 text-blue-500" />
                </div>
                <div
                  className="animate-pulse opacity-60 -ml-2"
                  style={{
                    animationDelay: "200ms",
                    animationDuration: "1.5s",
                  }}
                >
                  <ChevronLeft className="w-10 h-10 text-blue-500" />
                </div>
                <div
                  className="animate-pulse opacity-80 -ml-2"
                  style={{
                    animationDelay: "400ms",
                    animationDuration: "1.5s",
                  }}
                >
                  <ChevronLeft className="w-10 h-10 text-blue-500" />
                </div>
                <div
                  className="animate-pulse opacity-100 -ml-2"
                  style={{
                    animationDelay: "600ms",
                    animationDuration: "1.5s",
                  }}
                >
                  <ChevronLeft className="w-10 h-10 text-blue-500" />
                </div>
              </div>

              {/* 안내 텍스트 */}
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 backdrop-blur-sm px-3 sm:px-8 py-3 sm:py-4 rounded-2xl text-center border border-blue-200/50 shadow-2xl max-w-xs sm:max-w-none">
                <div className="text-blue-900 font-bold text-sm sm:text-base">
                  {LABELS.SIDEBAR_SWIPE_GUIDE_TITLE}
                </div>
                <div className="text-blue-700 text-xs sm:text-sm mt-1 sm:mt-2 font-medium">
                  <span className="sm:hidden">
                    {LABELS.SIDEBAR_SWIPE_GUIDE_DESCRIPTION_MOBILE}
                  </span>
                  <span className="hidden sm:inline">
                    {LABELS.SIDEBAR_SWIPE_GUIDE_DESCRIPTION}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
