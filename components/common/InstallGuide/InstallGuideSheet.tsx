"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetTrigger } from "@/components/ui/sheet";
import {
  CommonSheetHeader,
  CommonSheetContent,
} from "@/components/ui/sheet-common";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Download } from "lucide-react";
import { usePWAInstall } from "@/components/providers/pwa-provider";
import { getCurrentPlatformGuide } from "./data";
import { PlatformGuideCard } from "./PlatformGuideCard";
import { InstallStepsCard } from "./InstallStepsCard";
import { TipsCard } from "./TipsCard";
import { OtherPlatformsCard } from "./OtherPlatformsCard";
import { BUTTONS, LABELS } from "@/lib/constants/common";

export function InstallGuideSheet() {
  const installInfo = usePWAInstall();
  const [isOpen, setIsOpen] = useState(false);

  const currentGuide = getCurrentPlatformGuide(installInfo);

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" className="text-sm sm:text-base">
          <Download className="w-4 h-4" />
          {BUTTONS.INSTALL_GUIDE_BUTTON_TEXT}
        </Button>
      </SheetTrigger>
      <CommonSheetContent
        side="bottom"
        enableDragToResize={true}
        onClose={() => setIsOpen(false)}
        open={isOpen}
      >
        <CommonSheetHeader
          title={LABELS.INSTALL_GUIDE_SHEET_TITLE}
          description={LABELS.INSTALL_GUIDE_SHEET_DESCRIPTION}
        />

        <ScrollArea className="flex-1">
          <div className="space-y-2">
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
        </ScrollArea>
      </CommonSheetContent>
    </Sheet>
  );
}
