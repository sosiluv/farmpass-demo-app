"use client";
import { useEffect, useRef } from "react";

/**
 * 안전하고 빠른 파비콘 업데이트 훅
 * 기존 파비콘 링크의 href만 변경하여 DOM 조작 최소화
 */
export function useDynamicFavicon(faviconUrl: string) {
  const lastFaviconUrl = useRef<string>("");

  useEffect(() => {
    // faviconUrl이 없거나 빈 문자열이면 기본 파비콘 사용
    const finalFaviconUrl =
      faviconUrl && faviconUrl.trim() !== "" ? faviconUrl : "/favicon.ico";

    // 같은 URL이면 업데이트하지 않음 (중복 호출 방지)
    if (finalFaviconUrl === lastFaviconUrl.current) return;

    lastFaviconUrl.current = finalFaviconUrl;

    // 캐시 무효화를 위한 타임스탬프 추가
    const timestamp = Date.now();
    let faviconUrlWithCacheBuster: string;

    if (finalFaviconUrl === "/favicon.ico") {
      // 기본 파비콘은 캐시 버스터 없이
      faviconUrlWithCacheBuster = finalFaviconUrl;
    } else if (finalFaviconUrl.includes("?t=")) {
      // 이미 타임스탬프가 있으면 그대로 사용
      faviconUrlWithCacheBuster = finalFaviconUrl;
    } else if (finalFaviconUrl.includes("?")) {
      // 다른 쿼리 파라미터가 있으면 타임스탬프 추가
      faviconUrlWithCacheBuster = `${finalFaviconUrl}&t=${timestamp}`;
    } else {
      // 쿼리 파라미터가 없으면 타임스탬프 추가
      faviconUrlWithCacheBuster = `${finalFaviconUrl}?t=${timestamp}`;
    }

    // 기존 파비콘 링크 찾기
    const existingLink = document.querySelector(
      'link[rel="icon"]'
    ) as HTMLLinkElement;

    if (existingLink) {
      // 기존 링크가 있으면 href만 업데이트 (안전함)
      existingLink.href = faviconUrlWithCacheBuster;

      // 브라우저 캐시 문제로 즉시 반영되지 않을 수 있으므로 강제 업데이트
      setTimeout(() => {
        if (existingLink.href !== faviconUrlWithCacheBuster) {
          existingLink.href = faviconUrlWithCacheBuster;
        }
      }, 50);
    } else {
      // 기존 링크가 없으면 새로 생성 (드문 경우)
      try {
        const link = document.createElement("link");
        link.rel = "icon";
        link.href = faviconUrlWithCacheBuster;
        document.head.appendChild(link);
      } catch (error) {
        console.warn("Failed to create favicon link:", error);
      }
    }
  }, [faviconUrl]);
}
