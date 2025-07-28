import type React from "react";
import { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Script from "next/script";
import { cn } from "@/lib/utils";
import { Toaster } from "@/components/ui/toaster";
import { QueryProvider } from "@/components/providers/query-provider";
import { ToastPositionProvider } from "@/components/providers/toast-position-provider";
import { DebugProvider } from "@/components/providers/debug-provider";
import { SystemMonitor } from "@/components/common/system-monitor";
import { getMetadataSettings } from "@/lib/server/metadata";
import { ErrorBoundary } from "@/components/error/error-boundary";
import { ERROR_CONFIGS } from "@/lib/constants/error";
import { Analytics } from "@vercel/analytics/react";
import { PWAProvider } from "@/components/providers/pwa-provider";

import { Logo } from "@/components/common";
import { Badge } from "@/components/ui/badge";

const inter = Inter({ subsets: ["latin"] });

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getMetadataSettings();

  // 파일 확장자에 따라 MIME 타입 결정 (파비콘은 ICO, PNG만 지원)
  const getMimeType = (url: string): string => {
    const extension = url.split(".").pop()?.toLowerCase();
    switch (extension) {
      case "ico":
        return "image/x-icon";
      case "png":
        return "image/png";
      default:
        return "image/png"; // 기본값
    }
  };

  const mimeType = getMimeType(settings.favicon);

  return {
    title: settings.siteName,
    description: settings.siteDescription,
    icons: {
      icon: [
        { url: settings.favicon, sizes: "32x32", type: mimeType },
        { url: settings.favicon, sizes: "16x16", type: mimeType },
      ],
      shortcut: settings.favicon,
      apple: settings.favicon,
    },
    other: {
      "mobile-web-app-capable": "yes",
      "apple-mobile-web-app-capable": "yes",
      "apple-mobile-web-app-status-bar-style": "default",
      "apple-mobile-web-app-title": settings.siteName,
      "application-name": settings.siteName,
      "msapplication-TileColor": "#10b981",
      "msapplication-config": "none",
    },
  };
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  themeColor: "#10b981",
};

function Footer() {
  return (
    <footer className="border-t bg-background/80 backdrop-blur-md py-10">
      <div className="container mx-auto px-4 flex flex-col lg:flex-row items-center justify-between gap-6 text-xs text-muted-foreground">
        {/* 왼쪽: 로고 */}
        <div className="flex items-center gap-2">
          <Logo size="lg" />
        </div>
        {/* 가운데: 뱃지 */}
        <div className="flex gap-2 mt-2 lg:mt-0 lg:items-center">
          <Badge
            variant="outline"
            className="flex items-center gap-1 px-2 py-1"
          >
            <span className="inline-block w-2.5 h-2.5 bg-green-400 rounded-full" />
            모바일 최적화
          </Badge>
          <Badge
            variant="outline"
            className="flex items-center gap-1 px-2 py-1"
          >
            <span className="inline-block w-2.5 h-2.5 bg-blue-400 rounded-full" />
            QR 코드 지원
          </Badge>
          <Badge
            variant="outline"
            className="flex items-center gap-1 px-2 py-1"
          >
            <span className="inline-block w-2.5 h-2.5 bg-yellow-400 rounded-full" />
            실시간 알림
          </Badge>
        </div>
        {/* 오른쪽: 회사명/링크 */}
        <div className="flex flex-row flex-wrap items-center justify-center gap-2 mt-2 lg:mt-0 lg:items-center whitespace-nowrap">
          <a
            href="http://www.swkukorea.com/theme/sample60/html/a1.php"
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:text-primary transition-colors"
          >
            회사소개
          </a>
          <span className="text-gray-300">|</span>
          <a
            href="http://www.swkukorea.com/theme/sample60/html/a5.php"
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:text-primary transition-colors"
          >
            오시는길
          </a>
          <span className="text-gray-300">|</span>
          <a
            href="/terms"
            className="underline hover:text-primary transition-colors"
          >
            이용약관
          </a>
          <span className="text-gray-300">|</span>
          <a
            href="/privacy"
            className="underline hover:text-primary transition-colors"
          >
            개인정보처리방침
          </a>
        </div>
        {/* 사업자 정보 */}
        <div className="mt-4 text-[11px] text-muted-foreground text-center lg:text-right leading-relaxed lg:mt-0">
          <div className="mt-1">
            대표전화 : 054-843-1141 &nbsp;&nbsp; 팩스 : 054-855-9398
            <br />
            주소 : 경상북도 안동시 풍산읍 괴정2길 106-23 주101~104동
          </div>
          <div className="mt-2 font-semibold">
            Copyright. © {new Date().getFullYear()}{" "}
            {process.env.ENV_COMPANY_NAME || "SWKorea"} All rights reserved.
          </div>
        </div>
      </div>
    </footer>
  );
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko" suppressHydrationWarning>
      <head>
        <link rel="manifest" href="/manifest.json" />
        <link rel="apple-touch-icon" href="/icon-180x180.png" sizes="180x180" />
        <link rel="apple-touch-icon" href="/icon-167x167.png" sizes="167x167" />
        <link rel="apple-touch-icon" href="/icon-152x152.png" sizes="152x152" />
        <link rel="apple-touch-icon" href="/icon-120x120.png" sizes="120x120" />
        {/* Google Analytics */}
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-MQ40J6BMTC"
          strategy="afterInteractive"
        />
        <Script id="gtag-init" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-MQ40J6BMTC');
          `}
        </Script>
      </head>
      <body className={cn(inter.className, "min-h-screen bg-background")}>
        <ErrorBoundary
          title={ERROR_CONFIGS.GENERAL.title}
          description={ERROR_CONFIGS.GENERAL.description}
        >
          <QueryProvider>
            <PWAProvider>
              <DebugProvider>
                <ToastPositionProvider>
                  {/* === 상단 실시간 알림 Bell === */}
                  {children}
                  <Footer />
                  {/* === 공통 푸터 끝 === */}
                  <Toaster />
                  <SystemMonitor />
                </ToastPositionProvider>
              </DebugProvider>
            </PWAProvider>
          </QueryProvider>
          <Analytics />
        </ErrorBoundary>
      </body>
    </html>
  );
}
