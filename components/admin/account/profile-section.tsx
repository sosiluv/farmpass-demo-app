"use client";

import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { User, Save, Loader2 } from "lucide-react";
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
import { useAccountForm } from "@/hooks/useAccountForm";
import type { ProfileSectionProps, ProfileFormData } from "@/lib/types/account";
import AccountCardHeader from "./AccountCardHeader";
import { devLog } from "@/lib/utils/logging/dev-logger";

export function ProfileSection({
  profile,
  loading,
  onSave,
  onImageUpload,
  onImageDelete,
}: ProfileSectionProps) {
  const [profileImagePreview, setProfileImagePreview] = useState<string | null>(
    profile?.profile_image_url
      ? `${profile.profile_image_url}?t=${Date.now()}`
      : null
  );

  // 폼 데이터 관리 - 안정화된 initialData
  const initialData = useMemo<ProfileFormData>(
    () => ({
      name: profile?.name || "",
      email: profile?.email || "",
      phoneNumber: profile?.phone || "",
      position: profile?.position || "",
      department: profile?.department || "",
      bio: profile?.bio || "",
    }),
    [
      profile?.name,
      profile?.email,
      profile?.phone,
      profile?.position,
      profile?.department,
      profile?.bio,
    ]
  );

  const { formData, hasChanges, handleChange, resetChanges } = useAccountForm({
    initialData,
  });

  // profile prop이 변경될 때마다 프리뷰 업데이트
  useEffect(() => {
    if (profile?.profile_image_url) {
      const newPreviewUrl = `${profile.profile_image_url}?t=${Date.now()}`;
      setProfileImagePreview(newPreviewUrl);
    } else {
      setProfileImagePreview(null);
    }
  }, [profile?.profile_image_url]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    const processedValue = name === "phoneNumber" ? formatPhone(value) : value;
    handleChange(name as keyof ProfileFormData, processedValue);
  };

  const handleImageDelete = async () => {
    try {
      await onImageDelete();
      setProfileImagePreview(null);
    } catch (error) {
      devLog.error("[PROFILE_SECTION] Failed to delete image:", error);
      throw error;
    }
  };

  const handleSave = async () => {
    if (!hasChanges || loading) return;

    try {
      await onSave(formData);
      resetChanges();
    } catch (error) {
      devLog.error("[PROFILE_SECTION] Failed to save profile:", error);
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
                uploadType="profile"
                onUpload={async (file) => {
                  if (!file) return;
                  setProfileImagePreview(URL.createObjectURL(file));
                  const result = await onImageUpload(file);
                  if (result?.publicUrl) {
                    const cacheBustedUrl = `${
                      result.publicUrl
                    }?t=${Date.now()}`;
                    setProfileImagePreview(cacheBustedUrl);
                    if (profile) {
                      profile.profile_image_url = result.publicUrl;
                    }
                  }
                }}
                onDelete={handleImageDelete}
                currentImage={profileImagePreview}
                avatarSize="xl"
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
                  value={formData.name}
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
                  value={formData.email}
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
                  value={formData.phoneNumber}
                  onChange={handleInputChange}
                  disabled={loading}
                  maxLength={13}
                  placeholder="숫자만 입력 가능합니다"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="position">직책</Label>
                <Select
                  value={formData.position}
                  onValueChange={(value) => handleChange("position", value)}
                  disabled={loading}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="직책을 선택하세요" />
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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="department">부서</Label>
                <Input
                  id="department"
                  name="department"
                  type="text"
                  value={formData.department}
                  onChange={handleInputChange}
                  disabled={loading}
                  placeholder="부서명을 입력하세요"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="bio">자기소개</Label>
              <Textarea
                id="bio"
                name="bio"
                value={formData.bio}
                onChange={handleInputChange}
                disabled={loading}
                placeholder="자기소개를 입력하세요"
                rows={4}
              />
            </div>

            <div className="flex justify-end">
              <Button
                onClick={handleSave}
                disabled={loading || !hasChanges}
                className="flex items-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    저장 중...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    프로필 정보 저장
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </ErrorBoundary>
  );
}
