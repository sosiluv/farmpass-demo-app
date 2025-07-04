import type React from "react";
import { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import { Toaster } from "@/components/ui/toaster";
import { ThemeProvider } from "@/components/common/theme-provider";
import { AuthProvider } from "@/components/providers/auth-provider";
import { ToastPositionProvider } from "@/components/providers/toast-position-provider";
import { DebugProvider } from "@/components/providers/debug-provider";
import { SystemMonitor } from "@/components/common/system-monitor";
import { PWAUpdater } from "@/components/common/pwa-updater";
import { getMetadataSettings } from "@/lib/server/metadata";
import { ErrorBoundary } from "@/components/error/error-boundary";
import { Analytics } from "@vercel/analytics/react";
import Script from "next/script";
import { FarmsProvider } from "@/components/providers/farms-provider";

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

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko" suppressHydrationWarning>
      <head>
        <link rel="/manifest" href="/manifest.json" />
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
          title="시스템 오류"
          description="예상치 못한 오류가 발생했습니다. 페이지를 새로고침하거나 잠시 후 다시 시도해주세요."
        >
          <PWAUpdater />
          <AuthProvider>
            <ToastPositionProvider>
              <DebugProvider>
                <ThemeProvider
                  attribute="class"
                  defaultTheme="system"
                  enableSystem
                  disableTransitionOnChange
                >
                  <FarmsProvider>
                    {children}
                    <Toaster />
                    <SystemMonitor />
                  </FarmsProvider>
                </ThemeProvider>
              </DebugProvider>
            </ToastPositionProvider>
          </AuthProvider>
          <Analytics />
        </ErrorBoundary>
      </body>
    </html>
  );
}
