"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Smartphone,
  Monitor,
  Tablet,
  Download,
  Share2,
  Menu,
  Chrome,
  Info,
  Settings,
} from "lucide-react";
import { usePWAInstall } from "@/components/providers/pwa-provider";
import { InstallPrompt } from "@/components/common/InstallPrompt";
import { InstallGuide } from "@/components/common/InstallGuide";
import { useState } from "react";

export default function TestPWAInstallPage() {
  const installInfo = usePWAInstall();
  const [showPrompt, setShowPrompt] = useState(false);

  const getPlatformIcon = () => {
    switch (installInfo.platform) {
      case "iOS":
        return <Smartphone className="w-5 h-5" />;
      case "Android":
        return <Smartphone className="w-5 h-5" />;
      case "Desktop":
        return <Monitor className="w-5 h-5" />;
      default:
        return <Tablet className="w-5 h-5" />;
    }
  };

  const getMethodIcon = () => {
    switch (installInfo.method) {
      case "banner":
        return <Download className="w-5 h-5" />;
      case "manual":
        return <Share2 className="w-5 h-5" />;
      default:
        return <Settings className="w-5 h-5" />;
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">PWA 설치 테스트</h1>
        <Badge variant={installInfo.canInstall ? "default" : "secondary"}>
          {installInfo.canInstall ? "설치 가능" : "설치 불가"}
        </Badge>
      </div>

      {/* 설치 정보 카드 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Info className="w-5 h-5" />
            현재 환경 정보
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Smartphone className="w-4 h-4 text-gray-500" />
                <span className="text-sm font-medium">플랫폼:</span>
                <Badge variant="outline" className="flex items-center gap-1">
                  {getPlatformIcon()}
                  {installInfo.platform}
                </Badge>
              </div>

              <div className="flex items-center gap-2">
                <Download className="w-4 h-4 text-gray-500" />
                <span className="text-sm font-medium">설치 방법:</span>
                <Badge variant="outline" className="flex items-center gap-1">
                  {getMethodIcon()}
                  {installInfo.method}
                </Badge>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Settings className="w-4 h-4 text-gray-500" />
                <span className="text-sm font-medium">PWA 모드:</span>
                <Badge
                  variant={installInfo.isStandalone ? "default" : "secondary"}
                >
                  {installInfo.isStandalone ? "PWA 실행 중" : "브라우저 실행"}
                </Badge>
              </div>

              <div className="flex items-center gap-2">
                <Info className="w-4 h-4 text-gray-500" />
                <span className="text-sm font-medium">설치 가능:</span>
                <Badge
                  variant={installInfo.canInstall ? "default" : "destructive"}
                >
                  {installInfo.canInstall ? "예" : "아니오"}
                </Badge>
              </div>
            </div>
          </div>

          {installInfo.reason && (
            <div className="p-3 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>설명:</strong> {installInfo.reason}
              </p>
            </div>
          )}

          <div className="p-3 bg-gray-50 rounded-lg">
            <p className="text-xs text-gray-600 font-mono break-all">
              <strong>User Agent:</strong> {installInfo.userAgent}
            </p>
          </div>
        </CardContent>
      </Card>

      <Separator />

      {/* 테스트 컨트롤 */}
      <Card>
        <CardHeader>
          <CardTitle>테스트 컨트롤</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-3">
            <Button
              onClick={() => setShowPrompt(true)}
              disabled={!installInfo.canInstall}
              className="gap-2"
            >
              <Download className="w-4 h-4" />
              설치 프롬프트 표시
            </Button>

            <InstallGuide />

            <Button
              variant="outline"
              onClick={() => {
                localStorage.removeItem("pwa_install_dismissed");
                window.location.reload();
              }}
            >
              설치 거부 기록 초기화
            </Button>

            <Button
              variant="outline"
              onClick={() => {
                console.log("PWA Install Info:", installInfo);
              }}
            >
              콘솔에 정보 출력
            </Button>
          </div>

          <div className="text-sm text-gray-600">
            <p>• 설치 프롬프트는 10초 후 자동으로 표시됩니다</p>
            <p>• 거부하면 24시간 동안 다시 표시되지 않습니다</p>
            <p>• PWA 모드로 실행 중이면 설치 프롬프트가 표시되지 않습니다</p>
          </div>
        </CardContent>
      </Card>

      <Separator />

      {/* 플랫폼별 지원 정보 */}
      <Card>
        <CardHeader>
          <CardTitle>플랫폼별 PWA 지원 현황</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="p-4 border rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Smartphone className="w-5 h-5 text-blue-500" />
                <h3 className="font-semibold">iOS Safari</h3>
              </div>
              <ul className="text-sm space-y-1 text-gray-600">
                <li>• iOS 11.3+ 지원</li>
                <li>• 수동 설치 (공유 버튼)</li>
                <li>• iOS 16.4+ 알림 지원</li>
                <li>• 오프라인 지원</li>
              </ul>
            </div>

            <div className="p-4 border rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Chrome className="w-5 h-5 text-green-500" />
                <h3 className="font-semibold">Android Chrome</h3>
              </div>
              <ul className="text-sm space-y-1 text-gray-600">
                <li>• Chrome 67+ 지원</li>
                <li>• 자동 설치 배너</li>
                <li>• 푸시 알림 지원</li>
                <li>• 백그라운드 동기화</li>
              </ul>
            </div>

            <div className="p-4 border rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Monitor className="w-5 h-5 text-purple-500" />
                <h3 className="font-semibold">Desktop Chrome</h3>
              </div>
              <ul className="text-sm space-y-1 text-gray-600">
                <li>• Chrome 67+ 지원</li>
                <li>• 주소창 설치 아이콘</li>
                <li>• 독립 창 실행</li>
                <li>• 시스템 알림</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 설치 프롬프트 테스트 */}
      {showPrompt && (
        <InstallPrompt
          delay={0}
          onDismiss={() => setShowPrompt(false)}
          onInstall={() => {
            setShowPrompt(false);
            console.log("설치 버튼 클릭됨");
          }}
        />
      )}
    </div>
  );
}
