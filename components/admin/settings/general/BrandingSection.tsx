import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ImageUpload } from "@/components/ui/image-upload";
import { Image, Monitor, Bookmark } from "lucide-react";
import type { SystemSettings } from "@/lib/types/settings";
import { useState, useEffect, useMemo } from "react";
import SettingsCardHeader from "../SettingsCardHeader";
import { devLog } from "@/lib/utils/logging/dev-logger";
import { useCommonToast } from "@/lib/utils/notification/toast-messages";
import {
  ALLOWED_LOGO_TYPES,
  ALLOWED_LOGO_EXTENSIONS,
  ALLOWED_FAVICON_TYPES,
  ALLOWED_FAVICON_EXTENSIONS,
} from "@/lib/constants/upload";

interface BrandingSectionProps {
  settings: SystemSettings;
  onSettingChange: (key: keyof SystemSettings, value: any) => void;
  onImageUpload: (
    file: File | null,
    type: "favicon" | "logo"
  ) => Promise<{ url: string; path: string } | undefined>;
  loading?: boolean;
}

export function BrandingSection({
  settings,
  onSettingChange,
  onImageUpload,
  loading,
}: BrandingSectionProps) {
  const { showCustomError } = useCommonToast();

  // 이미지 프리뷰 상태 관리
  const [logoPreview, setLogoPreview] = useState<string | null>(
    settings.logo ? `${settings.logo}?t=${Date.now()}` : null
  );
  const [faviconPreview, setFaviconPreview] = useState<string | null>(
    settings.favicon ? `${settings.favicon}?t=${Date.now()}` : null
  );

  // settings가 변경될 때마다 프리뷰 업데이트
  useEffect(() => {
    if (settings.logo) {
      setLogoPreview(`${settings.logo}?t=${Date.now()}`);
    } else {
      setLogoPreview(null);
    }

    if (settings.favicon) {
      setFaviconPreview(`${settings.favicon}?t=${Date.now()}`);
    } else {
      setFaviconPreview(null);
    }
  }, [settings]);

  // 이미지 삭제 핸들러
  const handleImageDelete = async (type: "logo" | "favicon") => {
    // 공통 훅만 사용해서 삭제
    await onImageUpload(null, type);
    if (type === "logo") {
      setLogoPreview(null);
      onSettingChange("logo", null);
    } else {
      setFaviconPreview(null);
      onSettingChange("favicon", null);
    }
  };

  return (
    <Card>
      <SettingsCardHeader
        icon={Image}
        title="사이트 브랜딩"
        description="사이트의 로고, 파비콘 및 기본 정보를 설정합니다"
      />
      <CardContent className="space-y-6">
        {/* 이미지 설정 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
          {/* 사이트 로고 */}
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
                    // 허용 타입 검사 (로고)
                    if (
                      !(ALLOWED_LOGO_TYPES as readonly string[]).includes(
                        file.type
                      )
                    ) {
                      showCustomError(
                        "이미지 업로드 실패",
                        `허용되지 않은 파일 형식입니다. ${ALLOWED_LOGO_EXTENSIONS.join(
                          ", "
                        )} 만 업로드 가능합니다.`
                      );
                      return;
                    }
                    setLogoPreview(URL.createObjectURL(file));
                    const result = await onImageUpload(file, "logo");
                    if (result?.url) {
                      setLogoPreview(`${result.url}?t=${Date.now()}`);
                      onSettingChange("logo", result.url);
                    }
                  }}
                  onDelete={async () => handleImageDelete("logo")}
                  currentImage={logoPreview}
                  avatarSize="md"
                  label="사이트 로고"
                  showCamera={false}
                  uploadType="image"
                />
              </div>
              <div className="text-sm text-blue-600/80 space-y-1">
                <p className="font-medium">권장 크기: 200x60px</p>
                <p>{ALLOWED_LOGO_EXTENSIONS.join(", ").toUpperCase()} 형식</p>
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
                    // 허용 타입 검사 (파비콘)
                    if (
                      !(ALLOWED_FAVICON_TYPES as readonly string[]).includes(
                        file.type
                      )
                    ) {
                      showCustomError(
                        "이미지 업로드 실패",
                        `허용되지 않은 파일 형식입니다. ${ALLOWED_FAVICON_EXTENSIONS.join(
                          ", "
                        )} 만 업로드 가능합니다.`
                      );
                      return;
                    }
                    setFaviconPreview(URL.createObjectURL(file));
                    const result = await onImageUpload(file, "favicon");
                    if (result?.url) {
                      setFaviconPreview(`${result.url}?t=${Date.now()}`);
                      onSettingChange("favicon", result.url);
                    }
                  }}
                  onDelete={async () => handleImageDelete("favicon")}
                  currentImage={faviconPreview}
                  avatarSize="md"
                  label="파비콘"
                  showCamera={false}
                  uploadType="image"
                />
              </div>
              <div className="text-sm text-orange-600/80 space-y-1">
                <p className="font-medium">권장 크기: 32x32px</p>
                <p>
                  {ALLOWED_FAVICON_EXTENSIONS.join(", ").toUpperCase()} 형식
                </p>
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
