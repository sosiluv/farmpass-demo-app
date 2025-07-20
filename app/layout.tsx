import type React from "react";
import { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Script from "next/script";
import { cn } from "@/lib/utils";
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from "@/components/providers/auth-provider";
import { QueryProvider } from "@/components/providers/query-provider";
import { ToastPositionProvider } from "@/components/providers/toast-position-provider";
import { DebugProvider } from "@/components/providers/debug-provider";
import { SystemMonitor } from "@/components/common/system-monitor";
import { PWAUpdater } from "@/components/common/pwa-updater";

import { getMetadataSettings } from "@/lib/server/metadata";
import { ErrorBoundary } from "@/components/error/error-boundary";
import { ERROR_CONFIGS } from "@/lib/constants/error";
import { Analytics } from "@vercel/analytics/react";
import { PWAProvider } from "@/components/providers/pwa-provider";
import { SystemSettingsProvider } from "@/components/providers/system-settings-provider";

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
          <PWAUpdater />
          <QueryProvider>
            <AuthProvider>
              <SystemSettingsProvider>
                <DebugProvider>
                  <PWAProvider>
                    <ToastPositionProvider>
                      {children}
                      <Toaster />
                      <SystemMonitor />
                    </ToastPositionProvider>
                  </PWAProvider>
                </DebugProvider>
              </SystemSettingsProvider>
            </AuthProvider>
          </QueryProvider>
          <Analytics />
        </ErrorBoundary>
      </body>
    </html>
  );
}
