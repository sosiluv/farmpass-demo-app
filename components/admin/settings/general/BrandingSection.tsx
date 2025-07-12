import React, { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ImageUpload } from "@/components/ui/image-upload";
import { Image, Monitor, Bookmark } from "lucide-react";
import type { SystemSettings } from "@/lib/types/settings";
import SettingsCardHeader from "../SettingsCardHeader";
import { useUnifiedImageUpload } from "@/hooks/useUnifiedImageUpload";
import { UPLOAD_TYPE_CONFIGS } from "@/lib/types/upload";

interface BrandingSectionProps {
  settings: SystemSettings;
  onSettingChange: <K extends keyof SystemSettings>(
    key: K,
    value: SystemSettings[K]
  ) => void;
  loading?: boolean;
}

export function BrandingSection({
  settings,
  onSettingChange,
  loading,
}: BrandingSectionProps) {
  // 로고 업로드 훅
  const logoUpload = useUnifiedImageUpload({
    uploadType: "logo",
    dbTable: "system_settings",
    dbId: settings.id,
    dbField: "logo",
    refetchSettings: true, // settings context 즉시 갱신
    onUpdate: (data) => {
      onSettingChange("logo", data.logo);
      // 프리뷰 업데이트
      if (data.logo) {
        setLogoPreview(`${data.logo}?t=${Date.now()}`);
      } else {
        setLogoPreview(null);
      }
    },
  });

  // 파비콘 업로드 훅
  const faviconUpload = useUnifiedImageUpload({
    uploadType: "favicon",
    dbTable: "system_settings",
    dbId: settings.id,
    dbField: "favicon",
    refetchSettings: true, // settings context 즉시 갱신
    onUpdate: (data) => {
      onSettingChange("favicon", data.favicon);
      // 프리뷰 업데이트 (강력한 캐시 버스터 적용)
      if (data.favicon) {
        setFaviconPreview(
          `${data.favicon}?t=${Date.now()}&v=${Date.now()}&cb=${Math.random()}`
        );
      } else {
        setFaviconPreview(null);
      }
    },
  });

  // 이미지 프리뷰 상태 관리
  const [logoPreview, setLogoPreview] = useState<string | null>(
    settings.logo ? `${settings.logo}?t=${Date.now()}` : null
  );
  const [faviconPreview, setFaviconPreview] = useState<string | null>(
    settings.favicon
      ? `${settings.favicon}?t=${Date.now()}&v=${Date.now()}`
      : null
  );

  // settings가 변경될 때마다 프리뷰 업데이트
  useEffect(() => {
    if (settings.logo) {
      setLogoPreview(`${settings.logo}?t=${Date.now()}`);
    } else {
      setLogoPreview(null);
    }

    if (settings.favicon) {
      setFaviconPreview(`${settings.favicon}?t=${Date.now()}&v=${Date.now()}`);
    } else {
      setFaviconPreview(null);
    }
  }, [settings]);

  return (
    <Card>
      <SettingsCardHeader
        icon={Image}
        title="사이트 브랜딩"
        description="사이트의 로고, 파비콘 및 기본 정보를 설정합니다"
      />
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
          {/* 로고 */}
          <div className="relative">
            <div className="border-2 border-dashed border-blue-200 bg-blue-50/50 rounded-lg p-4 sm:p-6 space-y-3 sm:space-y-4">
              <div className="flex items-center gap-2 text-blue-700">
                <Monitor className="h-5 w-5" />
                <Label className="font-medium">사이트 로고</Label>
              </div>
              <div className="flex flex-col items-center sm:block">
                <ImageUpload
                  onUpload={async (file) => {
                    if (!file) return;
                    await logoUpload.uploadImage(file);
                  }}
                  onDelete={async () => {
                    await logoUpload.deleteImage();
                  }}
                  currentImage={logoPreview}
                  avatarSize="md"
                  label="사이트 로고"
                  showCamera={false}
                  uploadType="logo"
                />
              </div>
              <div className="text-sm text-blue-600/80 space-y-1 text-center">
                <p>헤더 및 대시보드에 표시됩니다</p>
              </div>
            </div>
          </div>

          {/* 파비콘 */}
          <div className="relative">
            <div className="border-2 border-dashed border-orange-200 bg-orange-50/50 rounded-lg p-4 sm:p-6 space-y-3 sm:space-y-4">
              <div className="flex items-center gap-2 text-orange-700">
                <Bookmark className="h-5 w-5" />
                <Label className="font-medium">파비콘</Label>
              </div>
              <div className="flex flex-col items-center sm:block">
                <ImageUpload
                  onUpload={async (file) => {
                    if (!file) return;

                    // 파비콘 파일명 정리 (캐시 문제 방지)
                    const cleanFileName = file.name.replace(
                      /[^a-zA-Z0-9.-]/g,
                      "_"
                    );
                    const renamedFile = new File([file], cleanFileName, {
                      type: file.type,
                    });

                    await faviconUpload.uploadImage(renamedFile);
                  }}
                  onDelete={async () => {
                    await faviconUpload.deleteImage();
                  }}
                  currentImage={faviconPreview}
                  avatarSize="md"
                  label="파비콘"
                  showCamera={false}
                  uploadType="favicon"
                />
              </div>
              <div className="text-sm text-orange-600/80 space-y-1 text-center">
                <p>브라우저 탭에 표시됩니다</p>
              </div>
            </div>
          </div>
        </div>

        {/* 사이트명 */}
        <div className="space-y-2">
          <Label htmlFor="siteName">사이트명</Label>
          <Input
            id="siteName"
            value={settings.siteName}
            onChange={(e) => onSettingChange("siteName", e.target.value)}
            disabled={loading}
            placeholder="농장 출입 관리 시스템(FarmPass)"
          />
          <p className="text-sm text-muted-foreground">
            브라우저 탭과 헤더에 표시되는 사이트 이름입니다
          </p>
        </div>

        {/* 사이트 설명 */}
        <div className="space-y-2">
          <Label htmlFor="siteDescription">사이트 설명</Label>
          <Textarea
            id="siteDescription"
            value={settings.siteDescription}
            onChange={(e) => onSettingChange("siteDescription", e.target.value)}
            disabled={loading}
            placeholder="방역은 출입자 관리부터 시작됩니다. QR기록으로 축산 질병 예방의 첫걸음을 함께하세요."
            rows={3}
          />
          <p className="text-sm text-muted-foreground">
            SEO 및 소셜 미디어 공유 시 사용되는 설명입니다
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
