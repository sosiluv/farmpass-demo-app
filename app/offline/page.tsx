"use client";

import { useEffect } from "react";
import { Wifi, WifiOff, RefreshCw, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useRouter } from "next/navigation";
import { useOnlineStatus } from "@/hooks/useOnlineStatus";

export default function OfflinePage() {
  const { isOnline, isChecking, checkConnection } = useOnlineStatus();
  const router = useRouter();

  useEffect(() => {
    // 온라인 상태가 되면 홈으로 리다이렉트
    if (isOnline) {
      const timer = setTimeout(() => {
        router.push("/");
      }, 2000);

      return () => clearTimeout(timer);
    }
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
          <div className="mx-auto mb-4 p-3 bg-red-100 rounded-full w-16 h-16 flex items-center justify-center">
            {isOnline ? (
              <Wifi className="w-8 h-8 text-green-600" />
            ) : (
              <WifiOff className="w-8 h-8 text-red-600" />
            )}
          </div>
          <CardTitle className="text-xl font-semibold text-gray-800">
            {isOnline ? "연결 확인 중..." : "오프라인 상태"}
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-6">
          <div className="text-center space-y-3">
            <p className="text-gray-600 leading-relaxed">
              {isOnline
                ? "인터넷 연결이 복구되었습니다. 잠시 후 홈페이지로 이동합니다."
                : "인터넷 연결을 확인해주세요. 네트워크 상태를 점검한 후 다시 시도해주세요."}
            </p>

            {!isOnline && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-800">
                <h4 className="font-semibold mb-2">확인해보세요:</h4>
                <ul className="space-y-1 text-left">
                  <li>• Wi-Fi 또는 모바일 데이터가 켜져 있는지 확인</li>
                  <li>• 다른 웹사이트가 정상적으로 작동하는지 확인</li>
                  <li>• 네트워크 설정을 다시 확인</li>
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
                  확인 중...
                </>
              ) : (
                <>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  다시 시도
                </>
              )}
            </Button>

            <Button onClick={handleGoHome} variant="outline" className="flex-1">
              <Home className="w-4 h-4 mr-2" />
              홈으로
            </Button>
          </div>

          {!isOnline && (
            <div className="text-center">
              <p className="text-xs text-gray-500">
                오프라인 상태에서는 일부 기능이 제한될 수 있습니다.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
