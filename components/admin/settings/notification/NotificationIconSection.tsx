import React, { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Upload, Bell, BadgeCheck } from "lucide-react";
import type { SystemSettings } from "@/lib/types/settings";
import SettingsCardHeader from "../SettingsCardHeader";
import { devLog } from "@/lib/utils/logging/dev-logger";
import { ImageUpload } from "@/components/ui/image-upload";
import { useCommonToast } from "@/lib/utils/notification/toast-messages";

interface NotificationIconSectionProps {
  settings: SystemSettings;
  onUpdate: <K extends keyof SystemSettings>(
    key: K,
    value: SystemSettings[K]
  ) => void;
  imageUrls: {
    icon: string;
    badge: string;
  };
  uploadStates: {
    icon: boolean;
    badge: boolean;
  };
  onFileSelect: (type: "icon" | "badge") => void;
  onUpdateTimestamp: (type: "icon" | "badge") => void;
  handleImageDelete: (
    type: "notificationIcon" | "notificationBadge"
  ) => Promise<void>;
  onImageUpload: (
    file: File | null,
    type: "notificationIcon" | "notificationBadge"
  ) => Promise<{ url: string; path: string } | undefined>;
  onImageDelete: (
    type: "notificationIcon" | "notificationBadge"
  ) => Promise<void>;
  loading?: boolean;
}

const NotificationIconSection = React.memo(function NotificationIconSection({
  settings,
  onUpdate,
  imageUrls,
  uploadStates,
  onFileSelect,
  onUpdateTimestamp,
  handleImageDelete,
  onImageUpload,
  onImageDelete: onImageDeleteFromProps,
  loading,
}: NotificationIconSectionProps) {
  const { showCustomError } = useCommonToast();
  // 프리뷰 상태 관리
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
                    // 허용 타입 검사 (알림 아이콘)
                    const allowedTypes = [
                      "image/png",
                      "image/svg+xml",
                      "image/jpeg",
                    ];
                    if (!allowedTypes.includes(file.type)) {
                      showCustomError(
                        "이미지 업로드 실패",
                        "허용되지 않은 파일 형식입니다. PNG, JPG, SVG만 업로드 가능합니다."
                      );
                      return;
                    }
                    setIconPreview(URL.createObjectURL(file));
                    const result = await onImageUpload(
                      file,
                      "notificationIcon"
                    );
                    if (result?.url) {
                      setIconPreview(`${result.url}?t=${Date.now()}`);
                    }
                  }}
                  onDelete={async () => {
                    await onImageDeleteFromProps("notificationIcon");
                    setIconPreview(null);
                  }}
                  currentImage={iconPreview}
                  avatarSize="md"
                  label="알림 아이콘"
                  showCamera={false}
                  uploadType="image"
                />
              </div>
              <div className="text-sm text-blue-600/80 space-y-1">
                <p className="font-medium">권장 크기: 192x192px</p>
                <p>PNG, SVG, JPG 형식</p>
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
                    // 허용 타입 검사 (배지 아이콘)
                    const allowedTypes = [
                      "image/png",
                      "image/svg+xml",
                      "image/jpeg",
                    ];
                    if (!allowedTypes.includes(file.type)) {
                      showCustomError(
                        "이미지 업로드 실패",
                        "허용되지 않은 파일 형식입니다. PNG, JPG, SVG만 업로드 가능합니다."
                      );
                      return;
                    }
                    setBadgePreview(URL.createObjectURL(file));
                    const result = await onImageUpload(
                      file,
                      "notificationBadge"
                    );
                    if (result?.url) {
                      setBadgePreview(`${result.url}?t=${Date.now()}`);
                    }
                  }}
                  onDelete={async () => {
                    await onImageDeleteFromProps("notificationBadge");
                    setBadgePreview(null);
                  }}
                  currentImage={badgePreview}
                  avatarSize="md"
                  label="배지 아이콘"
                  showCamera={false}
                  uploadType="image"
                />
              </div>
              <div className="text-sm text-orange-600/80 space-y-1">
                <p className="font-medium">권장 크기: 72x72px</p>
                <p>PNG, SVG, JPG 형식</p>
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
