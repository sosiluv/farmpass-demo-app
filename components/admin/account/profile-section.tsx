"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import { User, Save, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ErrorBoundary } from "@/components/error/error-boundary";
import { ERROR_CONFIGS } from "@/lib/constants/error";
import { formatPhone } from "@/lib/utils/validation/validation";
import { useAccountForm } from "@/hooks/account/useAccountForm";
import { devLog } from "@/lib/utils/logging/dev-logger";
import AccountCardHeader from "./AccountCardHeader";
import {
  BUTTONS,
  LABELS,
  PLACEHOLDERS,
  PAGE_HEADER,
} from "@/lib/constants/account";
import { POSITION_OPTIONS } from "@/lib/constants/account";
import { profileSchema } from "@/lib/utils/validation/profile-validation";
import { useCommonToast } from "@/lib/utils/notification/toast-messages";
import { SocialLinkingSection } from "./social-linking-section";
import { ProfileImageSection } from "./profile-image-section";
import type { ProfileFormData } from "@/lib/utils/validation/profile-validation";
import type { Profile } from "@/lib/types/common";

interface ProfileSectionProps {
  profile: Profile;
  loading: boolean;
  onSave: (data: ProfileFormData) => Promise<void>;
  onImageUpload: (
    file: File | null
  ) => Promise<{ publicUrl: string; fileName: string } | void>;
  onImageDelete: () => Promise<void>;
}

export function ProfileSection({
  profile,
  loading,
  onSave,
  onImageUpload,
  onImageDelete,
}: ProfileSectionProps) {
  const { showError } = useCommonToast();

  // 폼 데이터 관리 - 안정화된 initialData
  const initialData = useMemo<ProfileFormData>(
    () => ({
      name: profile?.name || "",
      email: profile?.email || "",
      phone: profile?.phone || "",
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

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    const processedValue = name === "phone" ? formatPhone(value) : value;
    handleChange(name as keyof ProfileFormData, processedValue);
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
            {/* 프로필 이미지 섹션 */}
            <ProfileImageSection
              profile={profile}
              onImageUpload={onImageUpload}
              onImageDelete={onImageDelete}
            />

            {/* 기본 정보 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label
                  htmlFor="name"
                  className="text-sm sm:text-base font-medium"
                >
                  {LABELS.NAME}
                </Label>
                <Input
                  id="name"
                  name="name"
                  type="text"
                  value={formData.name}
                  onChange={handleInputChange}
                  disabled={loading}
                  autoComplete="name"
                  placeholder={PLACEHOLDERS.NAME}
                  className="text-sm sm:text-base"
                />
              </div>
              <div className="space-y-2">
                <Label
                  htmlFor="email"
                  className="text-sm sm:text-base font-medium"
                >
                  {LABELS.EMAIL}
                </Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  disabled={true}
                  autoComplete="email"
                  placeholder={PLACEHOLDERS.EMAIL}
                  className="text-sm sm:text-base bg-gray-50"
                />
                <p className="text-xs text-muted-foreground">
                  {LABELS.EMAIL_CHANGE_DISABLED}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label
                  htmlFor="phone"
                  className="text-sm sm:text-base font-medium"
                >
                  {LABELS.PHONE_NUMBER}
                </Label>
                <Input
                  id="phone"
                  name="phone"
                  type="tel"
                  value={formData.phone || ""}
                  onChange={handleInputChange}
                  disabled={loading}
                  maxLength={13}
                  placeholder={PLACEHOLDERS.PHONE_NUMBER}
                  className="text-sm sm:text-base"
                />
              </div>
              <div className="space-y-2">
                <Label
                  htmlFor="position"
                  className="text-sm sm:text-base font-medium"
                >
                  {LABELS.POSITION}
                </Label>
                <Select
                  value={formData.position || ""}
                  onValueChange={(value) => handleChange("position", value)}
                  disabled={loading}
                >
                  <SelectTrigger id="position" className="text-sm sm:text-base">
                    <SelectValue placeholder={PLACEHOLDERS.POSITION} />
                  </SelectTrigger>
                  <SelectContent>
                    {POSITION_OPTIONS.map((option) => (
                      <SelectItem
                        key={option.value}
                        value={option.value}
                        className="text-sm sm:text-base"
                      >
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label
                  htmlFor="department"
                  className="text-sm sm:text-base font-medium"
                >
                  {LABELS.DEPARTMENT}
                </Label>
                <Input
                  id="department"
                  name="department"
                  type="text"
                  value={formData.department || ""}
                  onChange={handleInputChange}
                  disabled={loading}
                  placeholder={PLACEHOLDERS.DEPARTMENT}
                  className="text-sm sm:text-base"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="bio" className="text-sm sm:text-base font-medium">
                {LABELS.BIO}
              </Label>
              <Textarea
                id="bio"
                name="bio"
                value={formData.bio || ""}
                onChange={handleInputChange}
                disabled={loading}
                placeholder={PLACEHOLDERS.BIO}
                rows={4}
                className="text-sm sm:text-base"
              />
            </div>

            <div className="flex justify-end">
              <Button
                onClick={handleSave}
                disabled={loading || !hasChanges}
                className="text-sm sm:text-base"
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

        {/* 소셜 계정 연동 섹션 */}
        <div className="mt-6">
          <SocialLinkingSection userId={profile?.id || ""} />
        </div>
      </motion.div>
    </ErrorBoundary>
  );
}
