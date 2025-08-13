"use client";

import { useState, useEffect } from "react";
import { useEdgeSwipe } from "@/hooks/ui/use-gesture";
import { useSidebar } from "@/components/ui/sidebar";
import { useIsMobile } from "@/hooks/ui/use-mobile";
import { ChevronRight } from "lucide-react";

/**
 * 화면 가장자리에서 스와이프로 사이드바 열기 컴포넌트
 * 모바일에서만 활성화되며, 사이드바가 닫혀있을 때만 동작
 */
export function EdgeSwipeArea() {
  const { openMobile, setOpenMobile } = useSidebar();
  const isMobile = useIsMobile();
  const [showHint, setShowHint] = useState(false);

  const bind = useEdgeSwipe({
    direction: "right",
    edgeSize: 30, // 화면 왼쪽 끝 30px
    threshold: 60, // 60px 이상 오른쪽으로 스와이프
    onOpen: () => setOpenMobile(true),
    enabled: isMobile && !openMobile, // 모바일이고 사이드바가 닫혀있을 때만
  });

  // 페이지 로드 시 힌트 표시
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowHint(true);
      // 4초 후 힌트 자동 숨김
      setTimeout(() => setShowHint(false), 4000);
    }, 800);

    return () => clearTimeout(timer);
  }, []);

  // 데스크톱이거나 사이드바가 열려있으면 렌더링하지 않음
  if (!isMobile || openMobile) {
    return null;
  }

  return (
    <div
      {...bind()}
      className="fixed left-0 top-0 w-6 h-full z-[1000] bg-transparent touch-none"
      aria-label="사이드바 열기"
      data-testid="edge-swipe-area"
    >
      {/* 항상 보이는 가장자리 표시 */}
      <div className="absolute top-1/2 left-1 -translate-y-1/2">
        <div className="w-1 h-8 bg-gray-400/50 rounded-full" />
      </div>

      {/* 스와이프 힌트 (Instagram/TikTok 스타일) */}
      {showHint && (
        <>
          {/* 움직이는 화살표 애니메이션 (Instagram/TikTok 스타일) */}
          <div className="absolute top-1/2 left-2 -translate-y-1/2">
            <div className="flex items-center">
              {/* 연속된 화살표들이 순차적으로 나타나는 효과 */}
              <div
                className="animate-pulse opacity-40"
                style={{
                  animationDelay: "0ms",
                  animationDuration: "1.5s",
                }}
              >
                <ChevronRight className="w-3 h-3 text-blue-500" />
              </div>
              <div
                className="animate-pulse opacity-70 -ml-1"
                style={{
                  animationDelay: "200ms",
                  animationDuration: "1.5s",
                }}
              >
                <ChevronRight className="w-3 h-3 text-blue-500" />
              </div>
              <div
                className="animate-pulse opacity-100 -ml-1"
                style={{
                  animationDelay: "400ms",
                  animationDuration: "1.5s",
                }}
              >
                <ChevronRight className="w-4 h-4 text-blue-500" />
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
