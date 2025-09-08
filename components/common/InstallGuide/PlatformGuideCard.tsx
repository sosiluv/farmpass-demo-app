import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PlatformGuide } from "./data";
import { LABELS } from "@/lib/constants/common";

interface PlatformGuideCardProps {
  currentGuide: PlatformGuide;
  installInfo: any;
}

export function PlatformGuideCard({
  currentGuide,
  installInfo,
}: PlatformGuideCardProps) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="bg-blue-100 p-1.5 sm:p-2 rounded-lg">
            {currentGuide.icon}
          </div>
          <div className="space-y-1">
            <h3 className="text-sm sm:text-base font-semibold">
              {currentGuide.platform}
            </h3>
            <p className="text-xs sm:text-sm text-gray-600 leading-tight">
              {installInfo.reason}
            </p>
          </div>
          <Badge variant="secondary" className="ml-auto">
            {installInfo.method === "banner"
              ? LABELS.INSTALL_GUIDE_AUTO_BANNER
              : LABELS.INSTALL_GUIDE_MANUAL_INSTALL}
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
}
