/**
 * 통합 이미지 업로드 훅
 * React 통합만 담당
 * 설정 기반 관리와 타입 안전성 보장
 */

import { useState, useCallback, useRef } from "react";
import { supabase } from "@/lib/supabase/client";
import { devLog } from "@/lib/utils/logging/dev-logger";
import { useCommonToast } from "@/lib/utils/notification/toast-messages";
import {
  createImageManager,
  UnifiedImageManager,
} from "@/lib/utils/media/unified-image-manager";
import {
  UploadType,
  UploadResult,
  UploadError,
  UploadState,
  UseImageUploadReturn,
} from "@/lib/types/upload";
import { useSystemSettingsContext } from "@/components/providers/system-settings-provider";
import { getAuthErrorMessage } from "@/lib/utils/validation/validation";

export interface UseUnifiedImageUploadOptions {
  uploadType: UploadType;
  userId?: string;
  dbTable?: string;
  dbId?: string;
  dbField?: string;
  cacheBusterField?: string;
  onUpdate?: (data: any) => void;
  onError?: (error: UploadError) => void;
  onProgress?: (progress: number) => void;
  onSuccess?: (result: UploadResult) => void;
  // settings context refetch 옵션 추가
  refetchSettings?: boolean;
}

export function useUnifiedImageUpload(
  options: UseUnifiedImageUploadOptions
): UseImageUploadReturn {
  const {
    uploadType,
    userId,
    dbTable,
    dbId,
    dbField,
    cacheBusterField,
    onUpdate,
    onError,
    onProgress,
    onSuccess,
    refetchSettings = true, // 기본값으로 true 설정
  } = options;

  const { showInfo, showSuccess, showError } = useCommonToast();

  // settings context에서 refetch 함수 가져오기
  const { refetch: refetchSettingsContext } = useSystemSettingsContext();

  // 상태 관리
  const [state, setState] = useState<UploadState>({
    loading: false,
    progress: 0,
    error: null,
    result: null,
  });

  // 매니저 인스턴스 참조
  const managerRef = useRef<UnifiedImageManager | null>(null);

  // 매니저 인스턴스 생성
  const getManager = useCallback(() => {
    if (!managerRef.current) {
      managerRef.current = createImageManager(uploadType, userId);
    }
    return managerRef.current;
  }, [uploadType, userId]);

  // 상태 업데이트 함수
  const updateState = useCallback((updates: Partial<UploadState>) => {
    setState((prev) => ({ ...prev, ...updates }));
  }, []);

  // 에러 처리 함수
  const handleError = useCallback(
    (error: UploadError) => {
      updateState({ error, loading: false });
      const authError = getAuthErrorMessage(error);
      showError("이미지 업로드 실패", authError.message);
      onError?.(error);
      devLog.error("이미지 업로드 에러:", error);
    },
    [updateState, onError, showError]
  );

  // 성공 처리 함수
  const handleSuccess = useCallback(
    async (result: UploadResult) => {
      updateState({ result, loading: false, progress: 100 });
      showSuccess(
        "이미지 업로드 완료",
        "이미지가 성공적으로 업로드되었습니다."
      );
      onSuccess?.(result);
      devLog.log("이미지 업로드 성공:", result);

      // settings context refetch (업로드 성공 후)
      if (refetchSettings) {
        try {
          await refetchSettingsContext();
          devLog.log("Settings context refetch 완료");
        } catch (error) {
          devLog.error("Settings context refetch 실패:", error);
        }
      }
    },
    [
      updateState,
      onSuccess,
      showSuccess,
      refetchSettings,
      refetchSettingsContext,
      uploadType,
    ]
  );

  // 진행률 처리 함수
  const handleProgress = useCallback(
    (progress: number) => {
      updateState({ progress });
      onProgress?.(progress);
    },
    [updateState, onProgress]
  );

  // DB 업데이트 함수
  const updateDatabase = useCallback(
    async (publicUrl: string) => {
      if (!dbTable || !dbId || !dbField) {
        return null;
      }

      try {
        const timestamp = Date.now();
        const updateData: any = {
          [dbField]: publicUrl,
          updated_at: new Date().toISOString(),
        };

        // 캐시 버스터 필드가 있으면 추가
        if (cacheBusterField) {
          updateData[cacheBusterField] = timestamp;
        }

        const { data, error } = await supabase
          .from(dbTable)
          .update(updateData)
          .eq("id", dbId)
          .select()
          .maybeSingle();

        if (error) {
          throw error;
        }

        // 캐시 버스터가 적용된 URL 반환
        const cacheBustedUrl = cacheBusterField
          ? `${publicUrl}?t=${timestamp}`
          : publicUrl;

        return { data, cacheBustedUrl };
      } catch (error) {
        devLog.error("DB 업데이트 실패:", error);
        throw error;
      }
    },
    [dbTable, dbId, dbField, cacheBusterField]
  );

  // 기존 파일 URL 조회 함수
  const getCurrentFileUrl = useCallback(async (): Promise<string | null> => {
    if (!dbTable || !dbId || !dbField) {
      return null;
    }

    try {
      const { data, error } = await supabase
        .from(dbTable)
        .select(dbField)
        .eq("id", dbId)
        .maybeSingle();

      if (error) {
        throw error;
      }

      return (data as any)?.[dbField] || null;
    } catch (error) {
      devLog.error("현재 파일 URL 조회 실패:", error);
      return null;
    }
  }, [dbTable, dbId, dbField]);

  // 이미지 업로드 함수
  const uploadImage = useCallback(
    async (file: File): Promise<UploadResult | void> => {
      if (!file) {
        return;
      }

      try {
        updateState({ loading: true, error: null, progress: 0 });
        showInfo("이미지 업로드 시작", "이미지를 업로드하는 중입니다...");

        const manager = getManager();

        // 현재 파일 URL 조회 (DB 업데이트용)
        const currentUrl = await getCurrentFileUrl();

        // 업로드 실행
        const result = await manager.uploadImage({
          file,
          prevFileName: currentUrl || undefined,
          onProgress: handleProgress,
        });

        // DB 업데이트
        if (dbTable && dbId && dbField) {
          const dbResult = await updateDatabase(result.publicUrl);

          // 콜백 호출
          if (onUpdate && dbResult?.data) {
            onUpdate(dbResult.data);
          }

          // 캐시 버스터가 적용된 URL로 결과 업데이트
          if (dbResult?.cacheBustedUrl) {
            result.publicUrl = dbResult.cacheBustedUrl;
          }
        }

        await handleSuccess(result);
        return result;
      } catch (error) {
        const uploadError: UploadError = {
          code: "UPLOAD_FAILED",
          message:
            error instanceof Error
              ? error.message
              : "알 수 없는 오류가 발생했습니다.",
          details: error,
        };
        handleError(uploadError);
        throw error;
      }
    },
    [
      updateState,
      getManager,
      getCurrentFileUrl,
      handleProgress,
      handleSuccess,
      handleError,
      dbTable,
      dbId,
      dbField,
      onUpdate,
      updateDatabase,
      showInfo,
    ]
  );

  // 이미지 삭제 함수
  const deleteImage = useCallback(async (): Promise<void> => {
    try {
      updateState({ loading: true, error: null });
      showInfo("이미지 삭제 시작", "이미지를 삭제하는 중입니다...");

      const manager = getManager();
      const currentUrl = await getCurrentFileUrl();

      if (currentUrl) {
        // Storage에서 파일 삭제
        await manager.deleteImage(currentUrl);

        // DB에서 필드 null로 업데이트
        if (dbTable && dbId && dbField) {
          const timestamp = Date.now();
          const updateData: any = {
            [dbField]: null,
            updated_at: new Date().toISOString(),
          };

          if (cacheBusterField) {
            updateData[cacheBusterField] = timestamp;
          }

          const { data, error } = await supabase
            .from(dbTable)
            .update(updateData)
            .eq("id", dbId)
            .select()
            .maybeSingle();

          if (error) {
            throw error;
          }

          // 콜백 호출
          if (onUpdate && data) {
            onUpdate(data);
          }
        }
      }

      updateState({ loading: false, result: null });
      showSuccess("이미지 삭제 완료", "이미지가 성공적으로 삭제되었습니다.");
      devLog.log("이미지 삭제 완료");

      // settings context refetch (삭제 성공 후)
      if (refetchSettings) {
        try {
          await refetchSettingsContext();
          devLog.log("Settings context refetch 완료 (삭제 후)");
        } catch (error) {
          devLog.error("Settings context refetch 실패 (삭제 후):", error);
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
      handleError(uploadError);
      throw error;
    }
  }, [
    updateState,
    getManager,
    getCurrentFileUrl,
    handleError,
    dbTable,
    dbId,
    dbField,
    cacheBusterField,
    onUpdate,
    showInfo,
    showSuccess,
    refetchSettings,
    refetchSettingsContext,
    uploadType,
  ]);

  return {
    state,
    loading: state.loading,
    progress: state.progress,
    error: state.error,
    result: state.result,
    uploadImage,
    deleteImage,
    reset: () =>
      updateState({ loading: false, error: null, result: null, progress: 0 }),
  };
}
