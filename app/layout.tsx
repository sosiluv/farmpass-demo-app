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

  return {
    title: settings.siteName,
    description: settings.siteDescription,
    icons: {
      icon: settings.favicon,
    },
    other: {
      "mobile-web-app-capable": "yes",
      "apple-mobile-web-app-capable": "yes",
      "apple-mobile-web-app-status-bar-style": "default",
      "apple-mobile-web-app-title": "FarmPass",
      "application-name": "FarmPass",
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

export default function RootLayout({
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
