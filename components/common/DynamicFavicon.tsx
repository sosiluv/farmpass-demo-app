"use client";
import { useEffect } from "react";

interface DynamicFaviconProps {
  faviconUrl: string;
}

export function DynamicFavicon({ faviconUrl }: DynamicFaviconProps) {
  useEffect(() => {
    if (!faviconUrl) return;
    // 이미 같은 href의 favicon이 있으면 추가하지 않음
    const existing = Array.from(
      document.querySelectorAll('link[rel="icon"]')
    ).find((l) => l.getAttribute("href") === faviconUrl);
    if (existing) return;

    // 동적으로 파비콘 추가
    const link = document.createElement("link");
    link.rel = "icon";
    link.href = faviconUrl;
    link.type = faviconUrl.endsWith(".ico") ? "image/x-icon" : "image/png";
    document.head.appendChild(link);

    // cleanup: 이 컴포넌트가 언마운트되거나 faviconUrl이 바뀔 때만 이 link만 제거
    return () => {
      if (link.parentNode) link.parentNode.removeChild(link);
    };
  }, [faviconUrl]);

  return null;
}
