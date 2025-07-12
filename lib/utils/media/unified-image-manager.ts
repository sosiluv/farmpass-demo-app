/**
 * 통합 이미지 업로드 매니저
 * 단일 책임 원칙: 업로드 로직만 담당
 * 설정 기반 관리와 타입 안전성 보장
 */

import { supabase } from "@/lib/supabase/client";
import { devLog } from "@/lib/utils/logging/dev-logger";
import {
  UPLOAD_TYPE_CONFIGS,
  UploadType,
  UploadOptions,
  UploadResult,
  UploadError,
  UploadState,
} from "@/lib/types/upload";

export class UnifiedImageManager {
  private state: UploadState = {
    loading: false,
    progress: 0,
    error: null,
    result: null,
  };

  private uploadType: UploadType;
  private userId?: string;

  constructor(uploadType: UploadType, userId?: string) {
    this.uploadType = uploadType;
    this.userId = userId;
  }

  /**
   * 현재 업로드 설정 반환
   */
  private getUploadConfig() {
    return UPLOAD_TYPE_CONFIGS[this.uploadType];
  }

  /**
   * 파일 검증
   */
  private validateFile(file: File): UploadError | null {
    const config = this.getUploadConfig();

    // 파일 크기 검증
    if (file.size > config.maxSize) {
      return {
        code: "SIZE_EXCEEDED",
        message: `파일 크기는 ${
          config.maxSize / (1024 * 1024)
        }MB 이하여야 합니다.`,
        details: { maxSize: config.maxSize, actualSize: file.size },
      };
    }

    // 파일 형식 검증
    if (!config.allowedTypes.includes(file.type as any)) {
      return {
        code: "INVALID_TYPE",
        message: `지원되지 않는 파일 형식입니다. ${config.allowedExtensions.join(
          ", "
        )} 만 업로드 가능합니다.`,
        details: { allowedTypes: config.allowedTypes, actualType: file.type },
      };
    }

    return null;
  }

  /**
   * 파일명에서 Storage 경로 추출
   */
  private extractStoragePath(url: string): string | null {
    const bucket = this.getUploadConfig().bucket;

    // Supabase Storage URL에서 경로 추출
    const match = url.match(
      new RegExp(`/storage/v1/object/public/${bucket}/(.+)`)
    );
    if (match) {
      return match[1];
    }

    // 기존 패턴 매칭 (하위 호환성)
    const legacyMatch = url.match(/(systems|[\w-]+)\/[\w\-.]+/);
    if (legacyMatch) {
      return legacyMatch[0];
    }

    return null;
  }

  /**
   * 기존 파일 삭제
   */
  private async deleteExistingFile(currentUrl: string): Promise<void> {
    const config = this.getUploadConfig();
    const fileName = this.extractStoragePath(currentUrl);

    if (fileName) {
      try {
        const { error } = await supabase.storage
          .from(config.bucket)
          .remove([fileName]);

        if (error) {
          devLog.warn("기존 파일 삭제 실패:", error);
        }
      } catch (error) {
        devLog.warn("기존 파일 삭제 중 오류:", error);
      }
    }
  }

  /**
   * 업로드 전 정리 작업
   */
  private async performPreUploadCleanup(): Promise<void> {
    const config = this.getUploadConfig();

    if (config.preUploadCleanup) {
      try {
        await config.preUploadCleanup();
      } catch (error) {
        devLog.warn("업로드 전 정리 작업 실패:", error);
      }
    }
  }

  /**
   * 이미지 업로드 실행
   */
  async uploadImage(options: UploadOptions): Promise<UploadResult> {
    const { file, prevFileName, onProgress } = options;
    const config = this.getUploadConfig();

    try {
      // 상태 초기화
      this.state = {
        loading: true,
        progress: 0,
        error: null,
        result: null,
      };

      // 파일 검증
      const validationError = this.validateFile(file);
      if (validationError) {
        this.state.error = validationError;
        throw new Error(validationError.message);
      }

      // 진행률 업데이트
      onProgress?.(10);
      this.state.progress = 10;

      // 업로드 전 정리
      await this.performPreUploadCleanup();
      onProgress?.(20);
      this.state.progress = 20;

      // 기존 파일 삭제
      if (prevFileName) {
        await this.deleteExistingFile(prevFileName);
        onProgress?.(30);
        this.state.progress = 30;
      }

      // 파일명 생성
      const fileName = config.pathGenerator(file, this.userId);
      onProgress?.(40);
      this.state.progress = 40;

      // Supabase Storage에 업로드
      const { data, error: uploadError } = await supabase.storage
        .from(config.bucket)
        .upload(fileName, file, {
          cacheControl: config.cacheControl,
          contentType: file.type,
        });

      if (uploadError) {
        const error: UploadError = {
          code: "UPLOAD_FAILED",
          message: `이미지 업로드 중 오류가 발생했습니다: ${uploadError.message}`,
          details: uploadError,
        };
        this.state.error = error;
        throw new Error(error.message);
      }

      onProgress?.(80);
      this.state.progress = 80;

      // 공개 URL 생성
      const {
        data: { publicUrl },
      } = supabase.storage.from(config.bucket).getPublicUrl(data.path);

      // 파비콘인 경우 CORS 헤더 확인
      if (this.uploadType === "favicon") {
        devLog.log("파비콘 업로드 완료:", {
          fileName: data.path,
          publicUrl,
          bucket: config.bucket,
        });
      }

      const result: UploadResult = {
        publicUrl,
        fileName: data.path,
        fileSize: file.size,
        mimeType: file.type,
      };

      onProgress?.(100);
      this.state.progress = 100;
      this.state.result = result;

      return result;
    } catch (error) {
      const uploadError: UploadError = {
        code: "UNKNOWN_ERROR",
        message:
          error instanceof Error
            ? error.message
            : "알 수 없는 오류가 발생했습니다.",
        details: error,
      };
      this.state.error = uploadError;
      throw error;
    } finally {
      this.state.loading = false;
    }
  }

  /**
   * 이미지 삭제
   */
  async deleteImage(currentUrl: string): Promise<void> {
    const config = this.getUploadConfig();

    try {
      this.state.loading = true;
      this.state.error = null;

      const fileName = this.extractStoragePath(currentUrl);

      if (fileName) {
        const { error } = await supabase.storage
          .from(config.bucket)
          .remove([fileName]);

        if (error) {
          const uploadError: UploadError = {
            code: "DELETE_FAILED",
            message: `이미지 삭제 중 오류가 발생했습니다: ${error.message}`,
            details: error,
          };
          this.state.error = uploadError;
          throw new Error(uploadError.message);
        }
      }
    } catch (error) {
      const uploadError: UploadError = {
        code: "DELETE_FAILED",
        message:
          error instanceof Error
            ? error.message
            : "이미지 삭제 중 알 수 없는 오류가 발생했습니다.",
        details: error,
      };
      this.state.error = uploadError;
      throw error;
    } finally {
      this.state.loading = false;
    }
  }

  /**
   * 현재 상태 반환
   */
  getState(): UploadState {
    return { ...this.state };
  }

  /**
   * 상태 초기화
   */
  resetState(): void {
    this.state = {
      loading: false,
      progress: 0,
      error: null,
      result: null,
    };
  }
}

/**
 * UnifiedImageManager 팩토리 함수
 */
export function createImageManager(
  uploadType: UploadType,
  userId?: string
): UnifiedImageManager {
  return new UnifiedImageManager(uploadType, userId);
}
