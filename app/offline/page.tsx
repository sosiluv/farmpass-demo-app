"use client";

import { useEffect } from "react";
import { Wifi, WifiOff, RefreshCw, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useRouter } from "next/navigation";
import { useOnlineStatus } from "@/hooks/system/useOnlineStatus";
import { OFFLINE_LABELS } from "@/lib/constants/offline";

export default function OfflinePage() {
  const { isOnline, isChecking, checkConnection } = useOnlineStatus();
  const router = useRouter();

  useEffect(() => {
    // 온라인 상태가 되면 홈으로 리다이렉트
    // if (isOnline) {
    //   const timer = setTimeout(() => {
    //     router.push("/");
    //   }, 2000);
    //   return () => clearTimeout(timer);
    // }
  }, [isOnline, router]);

  const handleRetry = async () => {
    const isConnected = await checkConnection();
    if (isConnected) {
      router.push("/");
    }
  };

  const handleGoHome = () => {
    router.push("/");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="text-center pb-4">
          <div className="mx-auto mb-4 flex justify-center">
            {isOnline ? (
              <div className="p-3 bg-green-100 rounded-full w-16 h-16 flex items-center justify-center">
                <Wifi className="w-8 h-8 text-green-600" />
              </div>
            ) : (
              <div className="p-3 bg-red-100 rounded-full w-16 h-16 flex items-center justify-center">
                <WifiOff className="w-8 h-8 text-red-600" />
              </div>
            )}
          </div>
          <CardTitle className="text-xl font-semibold text-gray-800">
            {isOnline
              ? OFFLINE_LABELS.PAGE_TITLE_ONLINE
              : OFFLINE_LABELS.PAGE_TITLE_OFFLINE}
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-6">
          <div className="text-center space-y-3">
            <p className="text-gray-600 leading-relaxed">
              {isOnline
                ? OFFLINE_LABELS.DESCRIPTION_ONLINE
                : OFFLINE_LABELS.DESCRIPTION_OFFLINE}
            </p>

            {!isOnline && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-800">
                <h4 className="font-semibold mb-2">
                  {OFFLINE_LABELS.CHECKLIST_TITLE}
                </h4>
                <ul className="space-y-1 text-left">
                  <li>{OFFLINE_LABELS.CHECKLIST_ITEMS.WIFI}</li>
                  <li>{OFFLINE_LABELS.CHECKLIST_ITEMS.WEBSITE}</li>
                  <li>{OFFLINE_LABELS.CHECKLIST_ITEMS.SETTINGS}</li>
                </ul>
              </div>
            )}
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              onClick={handleRetry}
              disabled={isChecking}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
            >
              {isChecking ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  {OFFLINE_LABELS.BUTTONS.RETRY_CHECKING}
                </>
              ) : (
                <>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  {OFFLINE_LABELS.BUTTONS.RETRY}
                </>
              )}
            </Button>

            <Button onClick={handleGoHome} variant="outline" className="flex-1">
              <Home className="w-4 h-4 mr-2" />
              {OFFLINE_LABELS.BUTTONS.GO_HOME}
            </Button>
          </div>

          {!isOnline && (
            <div className="text-center">
              <p className="text-xs text-gray-500">
                {OFFLINE_LABELS.FOOTER_NOTE}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
