import { supabase } from "@/lib/supabase/client";
import { devLog } from "@/lib/utils/logging/dev-logger";
import {
  MAX_UPLOAD_SIZE_MB,
  DEFAULT_IMAGE_CACHE_CONTROL,
} from "@/lib/constants/upload";

export interface UploadImageOptions {
  file: File;
  userId?: string;
  maxSizeMB?: number;
  allowedTypes?: string[];
}

export interface UniversalUploadOptions {
  file: File;
  bucket: "profiles" | "visitor-photos";
  allowedTypes: string[];
  path?: string | ((file: File) => string);
  prevFileName?: string;
  maxSizeMB?: number;
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
  allowedTypes,
  path,
  prevFileName,
  maxSizeMB = MAX_UPLOAD_SIZE_MB,
  cacheControl = DEFAULT_IMAGE_CACHE_CONTROL,
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
        `지원되지 않는 파일 형식입니다. ${allowedTypes.join(
          ", "
        )} 만 업로드 가능합니다.`
      );
    }

    // profiles/visitor-photos 모두 prevFileName이 있으면 기존 파일 삭제 (단일 파일 삭제로 통일)
    if (prevFileName) {
      await deleteImageUniversal({
        bucket,
        fileName: prevFileName,
      });
    }

    // 파일명 생성
    let fileName: string;
    if (typeof path === "function") {
      fileName = path(file);
    } else if (path) {
      fileName = path;
    } else {
      throw new ImageUploadError("path 파라미터는 반드시 지정해야 합니다.");
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
    if (error instanceof ImageUploadError) {
      throw error;
    }
    throw new ImageUploadError(
      "이미지 업로드 중 알 수 없는 오류가 발생했습니다."
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

    // 파일 존재 여부 확인
    const { data: fileExists, error: checkError } = await supabase.storage
      .from(bucket)
      .list(fileName.split("/").slice(0, -1).join("/"), {
        search: fileName.split("/").pop(),
      });

    if (checkError) {
      devLog.warn(`[DELETE_IMAGE] Error checking file existence:`, checkError);
    } else {
      devLog.log(`[DELETE_IMAGE] File existence check result:`, fileExists);
    }

    const { data, error } = await supabase.storage
      .from(bucket)
      .remove([fileName]);

    if (error) {
      devLog.error(`[DELETE_IMAGE] Supabase error:`, error);

      throw new ImageUploadError(
        `이미지 삭제 중 오류가 발생했습니다: ${error.message}`
      );
    }

    devLog.log(`[DELETE_IMAGE] Successfully deleted:`, data);
  } catch (error) {
    if (error instanceof ImageUploadError) {
      throw error;
    }
    throw new ImageUploadError(
      "이미지 삭제 중 알 수 없는 오류가 발생했습니다."
    );
  }
}

/**
 * Supabase publicUrl에서 Storage 내 파일 경로만 추출 (공통 유틸)
 * 예: https://.../object/public/visitor-photos/abcd/20240607_153012_abc123.jpg
 *   → extractStorageFileName(url, 'visitor-photos')
 *   → abcd/20240607_153012_abc123.jpg
 */
export function extractStorageFileName(
  url: string,
  bucket: string
): string | undefined {
  if (!url) return undefined;
  // 정규식: /{bucket}/(이후 전체)
  const match = url.match(new RegExp(`${bucket}/(.+)$`));
  if (match && match[1]) return match[1];
  return undefined;
}
