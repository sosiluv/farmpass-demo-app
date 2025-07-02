import { supabase } from "@/lib/supabase/client";
import { v4 as uuidv4 } from "uuid";
import {
  logExternalServiceError,
  logFileUploadError,
  logSystemWarning,
} from "@/lib/utils/logging/system-log";
import { devLog } from "@/lib/utils/logging/dev-logger";

export interface UploadImageOptions {
  file: File;
  userId?: string;
  maxSizeMB?: number;
  allowedTypes?: string[];
}

export interface UniversalUploadOptions {
  file: File;
  bucket: "profiles" | "visitor-photos";
  path?: string | ((file: File) => string);
  userId?: string;
  farmId?: string;
  visitorName?: string;
  maxSizeMB?: number;
  allowedTypes?: string[];
  cacheControl?: string;
}

export class ImageUploadError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ImageUploadError";
  }
}

/**
 * 통합 이미지 업로드 함수
 * 프로필 이미지와 방문자 이미지 업로드를 Supabase Storage에 저장
 */
export async function uploadImageUniversal({
  file,
  bucket,
  path,
  userId,
  farmId,
  visitorName,
  maxSizeMB = 5,
  allowedTypes = ["image/jpeg", "image/png", "image/webp"],
  cacheControl = "3600",
}: UniversalUploadOptions): Promise<{ publicUrl: string; fileName: string }> {
  try {
    // 파일 크기 검증
    const maxSizeBytes = maxSizeMB * 1024 * 1024;
    if (file.size > maxSizeBytes) {
      throw new ImageUploadError(`파일 크기는 ${maxSizeMB}MB 이하여야 합니다.`);
    }

    // 파일 형식 검증
    if (!allowedTypes.includes(file.type)) {
      throw new ImageUploadError(
        `지원되는 파일 형식: ${allowedTypes.join(", ")}`
      );
    }

    // 파일명 생성
    let fileName: string;

    if (typeof path === "function") {
      fileName = path(file);
    } else if (path) {
      fileName = path;
    } else {
      // 기본 파일명 생성 로직
      fileName = generateFileName({
        file,
        bucket,
        userId,
        farmId,
        visitorName,
      });
    }

    // 기존 파일 삭제 (프로필 이미지인 경우) - 캐시 버스팅을 위해 이전 파일들 정리
    if (bucket === "profiles" && userId) {
      await deleteExistingProfileImage(userId);
    }

    // Supabase Storage에 업로드 (캐시 버스팅을 위해 upsert 제거)
    const { data, error: uploadError } = await supabase.storage
      .from(bucket)
      .upload(fileName, file, {
        cacheControl,
        contentType: file.type,
      });

    if (uploadError) {
      throw new ImageUploadError(
        `이미지 업로드 중 오류가 발생했습니다: ${uploadError.message}`
      );
    }

    // 공개 URL 생성
    const {
      data: { publicUrl },
    } = supabase.storage.from(bucket).getPublicUrl(data.path);

    return {
      publicUrl,
      fileName: data.path,
    };
  } catch (error) {
    // 외부 서비스 에러 로그
    await logExternalServiceError(
      "supabase_storage",
      "file_upload",
      error,
      userId
    );

    // 파일 업로드 에러 로그 (문서에 명시된 로그)
    await logFileUploadError(file.name, file.size, error, userId);

    if (error instanceof ImageUploadError) {
      throw error;
    }
    throw new ImageUploadError(
      "이미지 업로드 중 알 수 없는 오류가 발생했습니다."
    );
  }
}

/**
 * 기본 파일명 생성 함수
 */
function generateFileName({
  file,
  bucket,
  userId,
  farmId,
  visitorName,
}: {
  file: File;
  bucket: string;
  userId?: string;
  farmId?: string;
  visitorName?: string;
}): string {
  const fileExt = file.name.split(".").pop()?.toLowerCase() || "jpg";
  const timestamp = Date.now();

  if (bucket === "profiles" && userId) {
    // 프로필 이미지: userId/profile_timestamp.ext (캐시 버스팅)
    return `${userId}/profile_${timestamp}.${fileExt}`;
  } else if (bucket === "visitor-photos") {
    // 방문자 이미지: farmId_timestamp_random.ext
    const randomStr = Math.random().toString(36).substring(2, 8);
    const dateStr = new Date(timestamp)
      .toISOString()
      .replace(/[-:]/g, "")
      .replace("T", "_")
      .split(".")[0];

    return `${farmId}_${dateStr}_${randomStr}.${fileExt}`;
  }

  // 기본값
  return `${timestamp}_${uuidv4()}.${fileExt}`;
}

/**
 * 기존 프로필 이미지 삭제 (캐시 버스팅 적용)
 */
export async function deleteExistingProfileImage(
  userId: string
): Promise<void> {
  try {
    devLog.log(`[DELETE_PROFILE_IMAGE] Starting deletion for user: ${userId}`);

    // 해당 사용자의 모든 프로필 이미지 파일을 찾아서 삭제
    const { data: files, error: listError } = await supabase.storage
      .from("profiles")
      .list(userId, {
        limit: 100,
        search: "profile_",
      });

    if (listError) {
      devLog.error("Failed to list existing profile images:", listError);

      // 기존 이미지 목록 조회 실패 로그 (문서에 명시된 WARN 레벨)
      await logSystemWarning(
        "existing_images_list_failed",
        `기존 프로필 이미지 목록 조회 실패: ${listError.message}`,
        { userId },
        { error: listError.message }
      );

      // 목록 조회 실패 시에도 에러를 던져서 사용자에게 알림
      throw new ImageUploadError(
        `프로필 이미지 목록 조회에 실패했습니다: ${listError.message}`
      );
    }

    if (files && files.length > 0) {
      const filePaths = files.map((file) => `${userId}/${file.name}`);
      devLog.log(
        `[DELETE_PROFILE_IMAGE] Found ${filePaths.length} files to delete:`,
        filePaths
      );

      const { error: removeError } = await supabase.storage
        .from("profiles")
        .remove(filePaths);

      if (removeError) {
        devLog.error("Failed to remove profile images:", removeError);

        // 기존 이미지 정리 실패 로그 (문서에 명시된 WARN 레벨)
        await logSystemWarning(
          "existing_images_cleanup_failed",
          `기존 프로필 이미지 정리 실패: ${removeError.message}`,
          { userId },
          { filePaths, error: removeError.message }
        );

        // 삭제 실패 시 에러를 던져서 사용자에게 알림
        throw new ImageUploadError(
          `프로필 이미지 삭제에 실패했습니다: ${removeError.message}`
        );
      }

      devLog.log(
        `[DELETE_PROFILE_IMAGE] Successfully deleted ${filePaths.length} existing profile images for user ${userId}`
      );
    } else {
      devLog.log(
        `[DELETE_PROFILE_IMAGE] No existing profile images found for user ${userId}`
      );
    }
  } catch (error) {
    devLog.error("Failed to delete existing profile image:", error);

    // 이미지 삭제 프로세스 에러 로그
    await logFileUploadError("profile_images_cleanup", 0, error, userId);

    // ImageUploadError가 아닌 경우에만 새로운 에러로 래핑
    if (error instanceof ImageUploadError) {
      throw error;
    }

    throw new ImageUploadError(
      `프로필 이미지 삭제 중 알 수 없는 오류가 발생했습니다: ${
        error instanceof Error ? error.message : String(error)
      }`
    );
  }
}

/**
 * 통합 이미지 삭제 함수
 * Supabase Storage에서 이미지를 삭제
 */
export async function deleteImageUniversal({
  bucket,
  fileName,
}: {
  bucket: "profiles" | "visitor-photos";
  fileName: string;
}): Promise<void> {
  try {
    devLog.log(
      `[DELETE_IMAGE] Deleting file: ${fileName} from bucket: ${bucket}`
    );

    const { data, error } = await supabase.storage
      .from(bucket)
      .remove([fileName]);

    if (error) {
      devLog.error(`[DELETE_IMAGE] Supabase error:`, error);

      // 이미지 삭제 에러 로그
      await logFileUploadError(fileName, 0, error, undefined);

      throw new ImageUploadError(
        `이미지 삭제 중 오류가 발생했습니다: ${error.message}`
      );
    }

    devLog.log(`[DELETE_IMAGE] Successfully deleted:`, data);
  } catch (error) {
    devLog.error(`[DELETE_IMAGE] Unexpected error:`, error);

    // 이미지 삭제 프로세스 에러 로그
    await logFileUploadError(fileName, 0, error, undefined);

    if (error instanceof ImageUploadError) {
      throw error;
    }
    throw new ImageUploadError(
      "이미지 삭제 중 알 수 없는 오류가 발생했습니다."
    );
  }
}
