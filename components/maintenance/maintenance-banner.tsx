"use client";

import { useState, useEffect } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Wrench, X, Settings } from "lucide-react";
import Link from "next/link";
import { useSystemMode } from "@/components/providers/debug-provider";

interface MaintenanceBannerProps {
  isAdmin?: boolean;
}

export function MaintenanceBanner({ isAdmin = false }: MaintenanceBannerProps) {
  const { maintenanceMode } = useSystemMode();
  const [isVisible, setIsVisible] = useState(true);

  // 유지보수 모드가 활성화되면 배너를 다시 표시
  useEffect(() => {
    if (maintenanceMode) {
      setIsVisible(true);
    }
  }, [maintenanceMode]);

  if (!maintenanceMode || !isVisible) {
    return null;
  }

  return (
    <Alert className="border-orange-200 bg-orange-50 text-orange-800 mx-4 mt-4">
      <Wrench className="h-4 w-4" />
      <AlertDescription className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Badge
              variant="outline"
              className="border-orange-300 text-orange-700"
            >
              유지보수 모드
            </Badge>
            <span className="text-sm">
              현재 시스템이 유지보수 모드입니다. 일반 사용자는 접근할 수
              없습니다.
            </span>
          </div>
          {isAdmin && (
            <Link href="/admin/settings">
              <Button
                variant="outline"
                size="sm"
                className="border-orange-300 text-orange-700 hover:bg-orange-100"
              >
                <Settings className="h-3 w-3 mr-1" />
                설정
              </Button>
            </Link>
          )}
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsVisible(false)}
          className="text-orange-600 hover:text-orange-800 hover:bg-orange-100"
        >
          <X className="h-4 w-4" />
        </Button>
      </AlertDescription>
    </Alert>
  );
}
