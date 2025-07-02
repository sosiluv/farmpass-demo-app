import { useState } from "react";
import {
  uploadImageUniversal,
  deleteImageUniversal,
} from "@/lib/utils/media/image-upload";
import { supabase } from "@/lib/supabase/client";

interface UseUniversalImageManagerOptions {
  dbTable: string; // 예: "profiles", "system_settings"
  dbId: string; // row id
  dbField: string; // 예: "profile_image_url", "logo", "favicon"
  storageBucket: "profiles" | "visitor-photos";
  storagePath: (file: File, type?: string) => string; // 업로드 경로 생성 함수
  allowedTypes: string[];
  cacheBusterField?: string; // 상태에 캐시버스터 필드명
  onUpdate: (updated: any) => void;
  preUploadCleanup?: () => Promise<void>; // 업로드 전 정리 콜백
}

export function useUniversalImageManager(
  options: UseUniversalImageManagerOptions
) {
  const [loading, setLoading] = useState(false);

  // 업로드
  const handleImageUpload = async (file: File | null, type?: string) => {
    if (!file) {
      await handleImageDelete(type);
      return;
    }
    try {
      setLoading(true);

      // 0. 업로드 전 정리(옵션)
      if (options.preUploadCleanup) {
        await options.preUploadCleanup();
      }

      // 1. 기존 이미지 삭제 (계정관리와 동일하게)
      const { data: currentData } = await supabase
        .from(options.dbTable)
        .select(options.dbField)
        .eq("id", options.dbId)
        .maybeSingle();
      const typedCurrentData = currentData as Record<string, any>;
      const currentUrl = typedCurrentData?.[options.dbField];
      if (currentUrl) {
        const match = currentUrl.match(/(systems|[\w-]+)\/[\w\-.]+/);
        if (match) {
          await deleteImageUniversal({
            bucket: options.storageBucket,
            fileName: match[0],
          });
        }
      }

      // 2. 새 이미지 업로드
      const fileName = options.storagePath(file, type);
      const { publicUrl } = await uploadImageUniversal({
        file,
        bucket: options.storageBucket,
        path: fileName,
        allowedTypes: options.allowedTypes,
        maxSizeMB: 5,
      });
      // 3. DB 업데이트
      const { error, data } = await supabase
        .from(options.dbTable)
        .update({ [options.dbField]: publicUrl })
        .eq("id", options.dbId)
        .select()
        .maybeSingle();
      if (error) throw error;
      const typedData = data as Record<string, any>;
      const timestamp = Date.now();
      options.onUpdate({
        ...typedData,
        ...(options.cacheBusterField
          ? { [options.cacheBusterField]: timestamp }
          : {}),
      });
      return { publicUrl: `${publicUrl}?t=${timestamp}` };
    } finally {
      setLoading(false);
    }
  };

  // 삭제
  const handleImageDelete = async (type?: string) => {
    try {
      setLoading(true);
      // 현재 이미지 URL 조회
      const { data, error } = await supabase
        .from(options.dbTable)
        .select(options.dbField)
        .eq("id", options.dbId)
        .maybeSingle();
      if (error) throw error;
      const typedData = data as Record<string, any>;
      const currentUrl = typedData?.[options.dbField];
      if (currentUrl) {
        // 파일명 추출 (systems/..., userId/...)만 추출
        const match = currentUrl.match(/(systems|[\w-]+)\/[\w\-.]+/);
        if (match) {
          await deleteImageUniversal({
            bucket: options.storageBucket,
            fileName: match[0],
          });
        }
      }
      // DB에서 해당 필드 null로 업데이트
      const { error: updateError, data: updated } = await supabase
        .from(options.dbTable)
        .update({ [options.dbField]: null })
        .eq("id", options.dbId)
        .select()
        .maybeSingle();
      if (updateError) throw updateError;
      const typedUpdated = updated as Record<string, any>;
      const timestamp = Date.now();
      options.onUpdate({
        ...typedUpdated,
        ...(options.cacheBusterField
          ? { [options.cacheBusterField]: timestamp }
          : {}),
      });
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    handleImageUpload,
    handleImageDelete,
  };
}
