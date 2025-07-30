"use client";

import { useState, useEffect } from "react";
import { Separator } from "@/components/ui/separator";
import { ImageUpload } from "@/components/ui/image-upload";
import { useAvatarSeedManager } from "@/hooks/account/useAvatarSeedManager";
import { devLog } from "@/lib/utils/logging/dev-logger";
import { LABELS } from "@/lib/constants/account";
import type { Profile } from "@/lib/types/account";

interface ProfileImageSectionProps {
  profile: Profile | null;
  onImageUpload: (
    file: File
  ) => Promise<{ publicUrl: string; fileName: string } | void>;
  onImageDelete: () => Promise<void>;
}

export function ProfileImageSection({
  profile,
  onImageUpload,
  onImageDelete,
}: ProfileImageSectionProps) {
  // 아바타 시드 관리 훅
  const { updateAvatarSeed, generateRandomSeed } = useAvatarSeedManager({
    userId: profile?.id || "",
  });

  const [profileImagePreview, setProfileImagePreview] = useState<string | null>(
    profile?.profile_image_url
      ? `${profile.profile_image_url}?t=${Date.now()}`
      : null
  );

  // profile prop이 변경될 때마다 프리뷰 업데이트
  useEffect(() => {
    if (profile?.profile_image_url) {
      const newPreviewUrl = `${profile.profile_image_url}?t=${Date.now()}`;
      setProfileImagePreview(newPreviewUrl);
    } else {
      setProfileImagePreview(null);
    }
  }, [profile?.profile_image_url]);

  const handleImageDelete = async () => {
    try {
      await onImageDelete();
      setProfileImagePreview(null);
    } catch (error) {
      devLog.error("[PROFILE_IMAGE_SECTION] Failed to delete image:", error);
      throw error;
    }
  };

  return (
    <>
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
              const cacheBustedUrl = `${result.publicUrl}?t=${Date.now()}`;
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
    </>
  );
}
