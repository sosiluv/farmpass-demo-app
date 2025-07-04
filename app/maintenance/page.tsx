import { Metadata } from "next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Wrench, Clock, ArrowLeft, Leaf } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { getSystemSettings } from "@/lib/cache/system-settings-cache";
import { RefreshButton } from "@/components/maintenance";

export const metadata: Metadata = {
  title: "시스템 유지보수 중",
  description: "현재 시스템 유지보수가 진행 중입니다.",
};

function formatEstimatedTime(minutes: number): string {
  if (minutes < 60) {
    return `약 ${minutes}분`;
  } else if (minutes < 1440) {
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    if (remainingMinutes === 0) {
      return `약 ${hours}시간`;
    } else {
      return `약 ${hours}시간 ${remainingMinutes}분`;
    }
  } else {
    const days = Math.floor(minutes / 1440);
    const remainingHours = Math.floor((minutes % 1440) / 60);
    if (remainingHours === 0) {
      return `약 ${days}일`;
    } else {
      return `약 ${days}일 ${remainingHours}시간`;
    }
  }
}

function getMaintenanceDuration(startTime: Date | null): string {
  if (!startTime) return "";

  const now = new Date();
  const diffMs = now.getTime() - new Date(startTime).getTime();
  const diffMinutes = Math.floor(diffMs / (1000 * 60));

  if (diffMinutes < 60) {
    return `${diffMinutes}분 경과`;
  } else if (diffMinutes < 1440) {
    const hours = Math.floor(diffMinutes / 60);
    const minutes = diffMinutes % 60;
    return `${hours}시간 ${minutes}분 경과`;
  } else {
    const days = Math.floor(diffMinutes / 1440);
    const hours = Math.floor((diffMinutes % 1440) / 60);
    return `${days}일 ${hours}시간 경과`;
  }
}

export default async function MaintenancePage() {
  const settings = await getSystemSettings();

  // 로고 표시 컴포넌트 (서버 컴포넌트용)
  const LogoDisplay = () => {
    if (settings.logo) {
      return (
        <div className="relative h-12 w-12 overflow-hidden rounded-lg">
          <Image
            src={`/uploads/${settings.logo}?t=${Date.now()}`}
            alt={settings.siteName}
            fill
            className="object-contain"
            sizes="48px"
          />
        </div>
      );
    }

    return (
      <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary">
        <Leaf className="h-6 w-6 text-primary-foreground" />
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex flex-col items-center gap-3">
            <LogoDisplay />
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-orange-100">
              <Wrench className="h-8 w-8 text-orange-600" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold text-gray-900">
            시스템 유지보수 중
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-center">
          <div className="space-y-2">
            <p className="text-gray-600">{settings.maintenanceMessage}</p>
            <p className="text-sm text-gray-500">잠시 후 다시 시도해 주세요.</p>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-center space-x-2 text-sm text-gray-500">
              <Clock className="h-4 w-4" />
              <span>
                예상 완료 시간:{" "}
                {formatEstimatedTime(settings.maintenanceEstimatedTime)}
              </span>
            </div>

            {settings.maintenanceStartTime && (
              <div className="text-xs text-gray-400">
                {getMaintenanceDuration(settings.maintenanceStartTime)}
              </div>
            )}
          </div>

          <div className="pt-4 border-t">
            <p className="text-xs text-gray-400 mb-3">관리자이신가요?</p>
            <div className="space-y-2">
              <Link href="/login">
                <Button variant="outline" size="sm" className="w-full">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  로그인 페이지로 이동
                </Button>
              </Link>
              <RefreshButton />
            </div>
          </div>

          <div className="text-xs text-gray-400">
            {settings.maintenanceContactInfo}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
