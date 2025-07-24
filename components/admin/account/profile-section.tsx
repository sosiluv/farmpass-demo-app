"use client";

import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { User, Save, Loader2, RefreshCw } from "lucide-react";
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
import { ERROR_CONFIGS } from "@/lib/constants/error";
import { formatPhone } from "@/lib/utils/validation/validation";
import { useAccountForm } from "@/hooks/useAccountForm";
import { useAvatarSeedManager } from "@/hooks/useAvatarSeedManager";
import type { ProfileSectionProps, ProfileFormData } from "@/lib/types/account";
import AccountCardHeader from "./AccountCardHeader";
import { devLog } from "@/lib/utils/logging/dev-logger";
import {
  BUTTONS,
  LABELS,
  PLACEHOLDERS,
  PAGE_HEADER,
} from "@/lib/constants/account";
import { POSITION_OPTIONS } from "@/lib/constants/account";
import { profileSchema } from "@/lib/utils/validation/profile-validation";
import { useCommonToast } from "@/lib/utils/notification/toast-messages";

export function ProfileSection({
  profile,
  loading,
  onSave,
  onImageUpload,
  onImageDelete,
}: ProfileSectionProps) {
  const { showError } = useCommonToast();
  // 아바타 시드 관리 훅
  const {
    updateAvatarSeed,
    generateRandomSeed,
    loading: avatarLoading,
  } = useAvatarSeedManager({
    userId: profile?.id || "",
  });
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

    // profile-validation 스키마로 검증
    const result = profileSchema.safeParse(formData);
    if (!result.success) {
      const firstError =
        result.error.errors[0]?.message || "입력값을 확인하세요.";
      showError("프로필 저장 실패", firstError);
      return;
    }

    try {
      await onSave(formData);
      resetChanges();
    } catch (error) {
      devLog.error("[PROFILE_SECTION] Failed to save profile:", error);
    }
  };

  return (
    <ErrorBoundary
      title={ERROR_CONFIGS.LOADING.title}
      description={ERROR_CONFIGS.LOADING.description}
    >
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Card>
          <AccountCardHeader
            icon={User}
            title={PAGE_HEADER.PROFILE_INFO_TITLE}
            description={PAGE_HEADER.PROFILE_INFO_DESCRIPTION}
          />
          <CardContent className="space-y-6">
            {/* 프로필 사진 */}
            <div className="space-y-4">
              <ImageUpload
                id="profile-image-upload"
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
                onAvatarChange={async () => {
                  const newSeed = generateRandomSeed();
                  await updateAvatarSeed(newSeed);
                }}
                currentImage={profileImagePreview}
                avatarSize="lg"
                label={LABELS.PROFILE_PHOTO}
                profile={profile}
              />
            </div>

            <Separator />

            {/* 기본 정보 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="name">{LABELS.NAME}</Label>
                <Input
                  id="name"
                  name="name"
                  type="text"
                  value={formData.name}
                  onChange={handleInputChange}
                  disabled={loading}
                  autoComplete="name"
                  placeholder={PLACEHOLDERS.NAME}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">{LABELS.EMAIL}</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  disabled={loading}
                  autoComplete="email"
                  placeholder={PLACEHOLDERS.EMAIL}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="phoneNumber">{LABELS.PHONE_NUMBER}</Label>
                <Input
                  id="phoneNumber"
                  name="phoneNumber"
                  type="tel"
                  value={formData.phoneNumber || ""}
                  onChange={handleInputChange}
                  disabled={loading}
                  maxLength={13}
                  placeholder={PLACEHOLDERS.PHONE_NUMBER}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="position">{LABELS.POSITION}</Label>
                <Select
                  value={formData.position || ""}
                  onValueChange={(value) => handleChange("position", value)}
                  disabled={loading}
                >
                  <SelectTrigger id="position">
                    <SelectValue placeholder={PLACEHOLDERS.POSITION} />
                  </SelectTrigger>
                  <SelectContent>
                    {POSITION_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="department">{LABELS.DEPARTMENT}</Label>
                <Input
                  id="department"
                  name="department"
                  type="text"
                  value={formData.department || ""}
                  onChange={handleInputChange}
                  disabled={loading}
                  placeholder={PLACEHOLDERS.DEPARTMENT}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="bio">{LABELS.BIO}</Label>
              <Textarea
                id="bio"
                name="bio"
                value={formData.bio || ""}
                onChange={handleInputChange}
                disabled={loading}
                placeholder={PLACEHOLDERS.BIO}
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
                    {BUTTONS.SAVING}
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    {BUTTONS.SAVE_PROFILE_INFO}
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
