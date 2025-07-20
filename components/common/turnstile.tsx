"use client";

import { useEffect, useRef, useState } from "react";
import { LABELS } from "@/lib/constants/common";

interface TurnstileProps {
  siteKey: string;
  onVerify: (token: string) => void;
  onError?: (error: string) => void;
  onExpire?: () => void;
  theme?: "light" | "dark";
  size?: "normal" | "compact";
  className?: string;
}

declare global {
  interface Window {
    turnstile: {
      render: (
        container: string | HTMLElement,
        options: {
          sitekey: string;
          theme?: "light" | "dark";
          size?: "normal" | "compact";
          callback?: (token: string) => void;
          "expired-callback"?: () => void;
          "error-callback"?: () => void;
        }
      ) => string;
      reset: (widgetId: string) => void;
      remove: (widgetId: string) => void;
    };
  }
}

export function Turnstile({
  siteKey,
  onVerify,
  onError,
  onExpire,
  theme = "light",
  size = "normal",
  className = "",
}: TurnstileProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // 개발 환경에서 디버깅 정보 출력
  const isDev = process.env.NODE_ENV === "development";

  useEffect(() => {
    // 스크립트 로드
    const loadScript = () => {
      return new Promise<void>((resolve, reject) => {
        if (window.turnstile) {
          resolve();
          return;
        }

        const script = document.createElement("script");
        script.src = "https://challenges.cloudflare.com/turnstile/v0/api.js";
        script.async = true;
        script.defer = true;

        script.onload = () => {
          if (isDev) console.log("Turnstile script loaded successfully");
          resolve();
        };
        script.onerror = () => {
          const errorMsg = "Failed to load Turnstile script";
          if (isDev) console.error(errorMsg);
          reject(new Error(errorMsg));
        };

        document.head.appendChild(script);
      });
    };

    // 위젯 렌더링
    const renderWidget = async () => {
      try {
        setIsLoading(true);

        await loadScript();

        if (!containerRef.current || !window.turnstile) {
          throw new Error("Container or Turnstile not available");
        }

        // 기존 위젯이 있으면 제거
        if (widgetIdRef.current) {
          try {
            window.turnstile.remove(widgetIdRef.current);
          } catch (e) {
            if (isDev) console.warn("Failed to remove existing widget:", e);
          }
        }

        // 컨테이너 초기화
        containerRef.current.innerHTML = "";

        if (isDev) {
          console.log("Rendering Turnstile widget with config:", {
            siteKey,
            theme,
            size,
            container: containerRef.current,
          });
        }

        const widgetId = window.turnstile.render(containerRef.current, {
          sitekey: siteKey,
          theme: theme,
          size: size,
          callback: (token: string) => {
            if (isDev) console.log("Turnstile verification successful");
            onVerify(token);
          },
          "expired-callback": () => {
            if (isDev) console.log("Turnstile token expired");
            onExpire?.();
          },
          "error-callback": () => {
            const errorMsg = LABELS.TURNSTILE_ERROR_MESSAGE;
            if (isDev) console.error("Turnstile error callback triggered");

            onError?.(errorMsg);
          },
        });
        widgetIdRef.current = widgetId;
        setIsLoading(false);
      } catch (error) {
        const errorMsg = LABELS.TURNSTILE_LOAD_ERROR;
        if (isDev) console.error("Turnstile render error:", error);
        setIsLoading(false);
        onError?.(errorMsg);
      }
    };

    renderWidget();
  }, [siteKey, theme, size, onVerify, onError, onExpire]);

  return (
    <div className={className}>
      <div ref={containerRef} />
      {isLoading && (
        <div className="flex justify-center items-center py-4">
          <div className="text-sm text-gray-500">
            {LABELS.TURNSTILE_LOADING}
          </div>
        </div>
      )}
    </div>
  );
}
