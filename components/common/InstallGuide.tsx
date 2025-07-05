"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Download } from "lucide-react";
import { usePWAInstall } from "@/components/providers/pwa-provider";
import { getCurrentPlatformGuide } from "./InstallGuide/data";
import { PlatformGuideCard } from "./InstallGuide/PlatformGuideCard";
import { InstallStepsCard } from "./InstallGuide/InstallStepsCard";
import { TipsCard } from "./InstallGuide/TipsCard";
import { OtherPlatformsCard } from "./InstallGuide/OtherPlatformsCard";

export function InstallGuide() {
  const installInfo = usePWAInstall();
  const [isOpen, setIsOpen] = useState(false);

  const currentGuide = getCurrentPlatformGuide(installInfo);

  if (!installInfo.canInstall) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Download className="w-4 h-4" />앱 설치 가이드
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Download className="w-5 h-5" />
            PWA 설치 가이드
          </DialogTitle>
          <DialogDescription>
            현재 플랫폼에 맞는 PWA 설치 방법을 안내합니다.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* 현재 플랫폼 정보 */}
          <PlatformGuideCard
            currentGuide={currentGuide}
            installInfo={installInfo}
          />

          {/* 설치 단계 */}
          <InstallStepsCard currentGuide={currentGuide} />

          {/* 팁 */}
          <TipsCard currentGuide={currentGuide} />

          {/* 다른 플랫폼 가이드 */}
          <OtherPlatformsCard />
        </div>
      </DialogContent>
    </Dialog>
  );
}
