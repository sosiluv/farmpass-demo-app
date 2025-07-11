"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { User, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ImageUpload } from "@/components/ui/image-upload";
import { ErrorBoundary } from "@/components/error/error-boundary";
import { formatPhone } from "@/lib/utils/validation/validation";
import type { ProfileSectionProps, ProfileFormData } from "@/lib/types/account";
import AccountCardHeader from "./AccountCardHeader";
import { devLog } from "@/lib/utils/logging/dev-logger";
import { useCommonToast } from "@/lib/utils/notification/toast-messages";
import {
  ALLOWED_IMAGE_TYPES,
  ALLOWED_IMAGE_EXTENSIONS,
} from "@/lib/constants/upload";

export function ProfileSection({
  profile,
  loading,
  onSave,
  onImageUpload,
  onImageDelete,
}: ProfileSectionProps) {
  const [profileData, setProfileData] = useState<ProfileFormData>({
    name: profile?.name || "",
    email: profile?.email || "",
    phoneNumber: profile?.phone || "",
    position: profile?.position || "",
    department: profile?.department || "",
    bio: profile?.bio || "",
  });

  const [profileImagePreview, setProfileImagePreview] = useState<string | null>(
    profile?.profile_image_url
      ? `${profile.profile_image_url}?t=${Date.now()}`
      : null
  );

  const { showInfo, showError } = useCommonToast();

  // profile prop이 변경될 때마다 프리뷰 업데이트
  useEffect(() => {
    if (profile?.profile_image_url) {
      const newPreviewUrl = `${profile.profile_image_url}?t=${Date.now()}`;
      setProfileImagePreview(newPreviewUrl);
    } else {
      setProfileImagePreview(null);
    }
  }, [profile]); // profile 객체 전체를 의존성으로 변경

  // profile prop이 변경될 때마다 폼 데이터 업데이트
  useEffect(() => {
    setProfileData({
      name: profile?.name || "",
      email: profile?.email || "",
      phoneNumber: profile?.phone || "",
      position: profile?.position || "",
      department: profile?.department || "",
      bio: profile?.bio || "",
    });
  }, [profile]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;

    // 휴대폰 번호 필드에 대해 자동 포맷팅 적용
    const processedValue = name === "phoneNumber" ? formatPhone(value) : value;

    setProfileData((prev) => ({ ...prev, [name]: processedValue }));
  };

  const handleImageDelete = async () => {
    showInfo("이미지 삭제 시작", "프로필 이미지를 삭제하는 중입니다...");
    try {
      await onImageDelete();
      // 삭제 성공 시에만 UI 상태 업데이트
      setProfileImagePreview(null);
    } catch (error) {
      devLog.error("[PROFILE_SECTION] Failed to delete image:", error);
      // 에러 발생 시 UI 상태를 원래대로 유지
      // setProfileImagePreview는 변경하지 않음
      // 사용자에게 에러 메시지를 표시하기 위해 에러를 다시 던짐
      throw error;
    }
  };

  return (
    <ErrorBoundary
      title="프로필 섹션 오류"
      description="프로필 정보를 불러오는 중 문제가 발생했습니다. 페이지를 새로고침하거나 잠시 후 다시 시도해주세요."
    >
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Card>
          <AccountCardHeader
            icon={User}
            title="개인 정보"
            description="개인 프로필 정보를 관리합니다"
          />
          <CardContent className="space-y-6">
            {/* 프로필 사진 */}
            <div className="space-y-4">
              <Label>프로필 사진</Label>
              <ImageUpload
                onUpload={async (file) => {
                  if (!file) return;
                  showInfo(
                    "이미지 업로드 시작",
                    "프로필 이미지를 업로드하는 중입니다..."
                  );
                  // 허용 타입 검사 (프로필 사진)
                  if (
                    !(ALLOWED_IMAGE_TYPES as readonly string[]).includes(
                      file.type
                    )
                  ) {
                    showError(
                      "파일 형식 오류",
                      `허용되지 않은 파일 형식입니다. ${ALLOWED_IMAGE_EXTENSIONS.join(
                        ", "
                      )} 만 업로드 가능합니다.`
                    );
                    return;
                  }
                  setProfileImagePreview(URL.createObjectURL(file));
                  const result = await onImageUpload(file);
                  // 업로드 성공 후 새로운 URL로 캐시 버스팅 적용
                  if (result?.publicUrl) {
                    setProfileImagePreview(
                      `${result.publicUrl}?t=${Date.now()}`
                    );
                  }
                }}
                onDelete={handleImageDelete}
                currentImage={profileImagePreview}
                avatarSize="lg"
                label="프로필 사진"
                showCamera={false}
              />
            </div>

            <Separator />

            {/* 기본 정보 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="name">이름</Label>
                <Input
                  id="name"
                  name="name"
                  type="text"
                  value={profileData.name}
                  onChange={handleInputChange}
                  disabled={loading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">이메일</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={profileData.email}
                  onChange={handleInputChange}
                  disabled={loading}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="phoneNumber">전화번호</Label>
                <Input
                  id="phoneNumber"
                  name="phoneNumber"
                  type="tel"
                  value={profileData.phoneNumber}
                  onChange={handleInputChange}
                  disabled={loading}
                  maxLength={13}
                  placeholder="숫자만 입력 가능합니다"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="position">직책</Label>
                <Select
                  value={profileData.position}
                  onValueChange={(value) =>
                    setProfileData((prev) => ({ ...prev, position: value }))
                  }
                  disabled={loading}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="직책 선택" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="대표">대표</SelectItem>
                    <SelectItem value="관리자">관리자</SelectItem>
                    <SelectItem value="직원">직원</SelectItem>
                    <SelectItem value="방역담당자">방역담당자</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="bio">자기소개</Label>
              <Textarea
                id="bio"
                name="bio"
                value={profileData.bio}
                onChange={handleInputChange}
                placeholder="간단한 자기소개를 입력하세요"
                disabled={loading}
              />
            </div>

            <div className="flex justify-end">
              <Button onClick={() => onSave(profileData)} disabled={loading}>
                <Save className="mr-2 h-4 w-4" />
                {loading ? "저장 중..." : "프로필 저장"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </ErrorBoundary>
  );
}
