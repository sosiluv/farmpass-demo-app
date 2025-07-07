import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PlatformGuide } from "./data";

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
        <div className="flex items-center gap-3">
          <div className="bg-blue-100 p-2 rounded-lg">{currentGuide.icon}</div>
          <div>
            <h3 className="font-semibold">{currentGuide.platform}</h3>
            <p className="text-sm text-gray-600">{installInfo.reason}</p>
          </div>
          <Badge variant="secondary" className="ml-auto">
            {installInfo.method === "banner" ? "자동 배너" : "수동 설치"}
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
}
