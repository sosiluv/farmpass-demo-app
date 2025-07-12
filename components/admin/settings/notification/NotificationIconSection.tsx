import React, { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";

import { Bell, BadgeCheck } from "lucide-react";
import type { SystemSettings } from "@/lib/types/settings";
import SettingsCardHeader from "../SettingsCardHeader";

import { ImageUpload } from "@/components/ui/image-upload";
import { useUnifiedImageUpload } from "@/hooks/useUnifiedImageUpload";

interface NotificationIconSectionProps {
  settings: SystemSettings;
  onUpdate: <K extends keyof SystemSettings>(
    key: K,
    value: SystemSettings[K]
  ) => void;
  loading?: boolean;
}

const NotificationIconSection = React.memo(function NotificationIconSection({
  settings,
  onUpdate,
  loading,
}: NotificationIconSectionProps) {
  // 알림 아이콘 업로드 훅
  const notificationIconUpload = useUnifiedImageUpload({
    uploadType: "notificationIcon",
    dbTable: "system_settings",
    dbId: settings.id,
    dbField: "notificationIcon",
    refetchSettings: true, // settings context 즉시 갱신
    onUpdate: (data) => {
      onUpdate("notificationIcon", data.notificationIcon);
      // 프리뷰 업데이트
      if (data.notificationIcon) {
        setIconPreview(`${data.notificationIcon}?t=${Date.now()}`);
      } else {
        setIconPreview(null);
      }
    },
  });

  // 배지 아이콘 업로드 훅
  const notificationBadgeUpload = useUnifiedImageUpload({
    uploadType: "notificationBadge",
    dbTable: "system_settings",
    dbId: settings.id,
    dbField: "notificationBadge",
    refetchSettings: true, // settings context 즉시 갱신
    onUpdate: (data) => {
      onUpdate("notificationBadge", data.notificationBadge);
      // 프리뷰 업데이트
      if (data.notificationBadge) {
        setBadgePreview(`${data.notificationBadge}?t=${Date.now()}`);
      } else {
        setBadgePreview(null);
      }
    },
  });

  // 이미지 프리뷰 상태 관리
  const [iconPreview, setIconPreview] = useState<string | null>(
    settings.notificationIcon
      ? `${settings.notificationIcon}?t=${Date.now()}`
      : null
  );
  const [badgePreview, setBadgePreview] = useState<string | null>(
    settings.notificationBadge
      ? `${settings.notificationBadge}?t=${Date.now()}`
      : null
  );

  // settings가 변경될 때마다 프리뷰 업데이트
  useEffect(() => {
    if (settings.notificationIcon) {
      setIconPreview(`${settings.notificationIcon}?t=${Date.now()}`);
    } else {
      setIconPreview(null);
    }
    if (settings.notificationBadge) {
      setBadgePreview(`${settings.notificationBadge}?t=${Date.now()}`);
    } else {
      setBadgePreview(null);
    }
  }, [settings]);

  return (
    <Card>
      <SettingsCardHeader
        icon={Bell}
        title="알림/배지 아이콘"
        description="푸시 알림에 표시될 아이콘과 배지를 설정합니다. (로고/파비콘과 동일한 방식)"
      />
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
          {/* 알림 아이콘 */}
          <div className="relative">
            <div className="border-2 border-dashed border-blue-200 bg-blue-50/50 rounded-lg p-4 sm:p-6 space-y-3 sm:space-y-4">
              <div className="flex items-center gap-2 text-blue-700">
                <Bell className="h-5 w-5" />
                <Label className="font-medium">알림 아이콘</Label>
              </div>
              <div className="flex flex-col items-center sm:block">
                <ImageUpload
                  onUpload={async (file) => {
                    if (!file) return;
                    await notificationIconUpload.uploadImage(file);
                  }}
                  onDelete={async () => {
                    await notificationIconUpload.deleteImage();
                  }}
                  currentImage={iconPreview}
                  avatarSize="md"
                  label="알림 아이콘"
                  showCamera={false}
                  uploadType="notificationIcon"
                />
              </div>
              <div className="text-sm text-blue-600/80 space-y-1 text-center">
                <p>푸시 알림에 표시됩니다</p>
              </div>
            </div>
          </div>
          {/* 배지 아이콘 */}
          <div className="relative">
            <div className="border-2 border-dashed border-orange-200 bg-orange-50/50 rounded-lg p-4 sm:p-6 space-y-3 sm:space-y-4">
              <div className="flex items-center gap-2 text-orange-700">
                <BadgeCheck className="h-5 w-5" />
                <Label className="font-medium">배지 아이콘</Label>
              </div>
              <div className="flex flex-col items-center sm:block">
                <ImageUpload
                  onUpload={async (file) => {
                    if (!file) return;
                    await notificationBadgeUpload.uploadImage(file);
                  }}
                  onDelete={async () => {
                    await notificationBadgeUpload.deleteImage();
                  }}
                  currentImage={badgePreview}
                  avatarSize="md"
                  label="배지 아이콘"
                  showCamera={false}
                  uploadType="notificationBadge"
                />
              </div>
              <div className="text-sm text-orange-600/80 space-y-1 text-center">
                <p>푸시 알림 배지에 표시됩니다</p>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
});

export default NotificationIconSection;
