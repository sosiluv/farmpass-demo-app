"use client";

import { useCallback, useState } from "react";
import { Button } from "./button";
import { Avatar, AvatarImage, AvatarFallback } from "./avatar";
import { Camera, ImageIcon, Trash2, User } from "lucide-react";
import {
  IMAGE_UPLOAD_CONFIG,
  IMAGE_ERROR_MESSAGES,
} from "@/lib/constants/upload";
import { Loading } from "@/components/ui/loading";
import { devLog } from "@/lib/utils/logging/dev-logger";

export interface ImageUploadProps {
  onUpload: (file: File) => void;
  onDelete?: () => Promise<void>;
  currentImage?: string | null;
  required?: boolean;
  className?: string;
  showCamera?: boolean;
  avatarSize?: "sm" | "md" | "lg" | "xl";
  label?: string;
  uploadType?: "image";
}

export function ImageUpload({
  onUpload,
  onDelete,
  currentImage,
  required = false,
  className = "",
  showCamera = true,
  avatarSize = "lg",
  label = "이미지",
  uploadType = "image",
}: ImageUploadProps) {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // 아바타 크기 매핑
  const avatarSizeMap = {
    sm: "h-16 w-16",
    md: "h-24 w-24",
    lg: "h-32 w-32",
    xl: "h-40 w-40",
  };

  // 공통 이미지 업로드 설정만 사용
  const getUploadConfig = () => ({
    config: IMAGE_UPLOAD_CONFIG,
    errorMessage: `지원하지 않는 파일 형식입니다. ${IMAGE_UPLOAD_CONFIG.allowedExtensions.join(
      ", "
    )} 만 업로드 가능합니다.`,
    guideline: `권장 크기: ${IMAGE_UPLOAD_CONFIG.maxWidth}x${IMAGE_UPLOAD_CONFIG.maxHeight} 픽셀`,
  });

  // 파일 처리 함수
  const handleFile = useCallback(
    async (file: File) => {
      try {
        setLoading(true);
        setError(null);

        const { config, errorMessage } = getUploadConfig();

        // 파일 크기 검증
        if (file.size > config.maxSize) {
          setError(IMAGE_ERROR_MESSAGES.SIZE_EXCEEDED);
          return;
        }

        // 파일 형식 검증
        if (!config.allowedTypes.includes(file.type as any)) {
          setError(errorMessage);
          return;
        }

        // 이미지 최적화 건너뛰고 원본 파일 직접 전달
        onUpload(file);
      } catch (err) {
        devLog.error("Image processing error:", err);
        setError(IMAGE_ERROR_MESSAGES.PROCESSING_ERROR);
      } finally {
        setLoading(false);
      }
    },
    [onUpload, uploadType]
  );

  // 삭제 핸들러
  const handleDelete = useCallback(async () => {
    if (!onDelete) return;

    try {
      setLoading(true);
      setError(null);
      devLog.log("[IMAGE_UPLOAD] Starting image deletion...");

      await onDelete();

      devLog.log("[IMAGE_UPLOAD] Image deletion completed successfully");
    } catch (err) {
      devLog.error("[IMAGE_UPLOAD] Failed to delete image:", err);
      const errorMessage =
        err instanceof Error ? err.message : "이미지 삭제에 실패했습니다.";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [onDelete]);

  // 파일 선택 핸들러
  const handleFileSelect = useCallback(
    (useCamera: boolean = false) => {
      const input = document.createElement("input");
      input.type = "file";

      const { config } = getUploadConfig();
      input.accept = config.allowedTypes.join(",");

      if (useCamera) {
        input.capture = "user";
      }
      input.onchange = async (e) => {
        const file = (e.target as HTMLInputElement).files?.[0];
        if (file) {
          await handleFile(file);
        }
      };
      input.click();
    },
    [handleFile, uploadType]
  );

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="flex flex-col items-center gap-4">
        {/* 이미지 미리보기 */}
        <Avatar
          className={`${avatarSizeMap[avatarSize]} cursor-pointer hover:opacity-90 transition-opacity`}
        >
          <AvatarImage src={currentImage || ""} alt={label} />
          <AvatarFallback>
            {loading ? (
              <Loading spinnerSize={32} showText={false} minHeight="auto" />
            ) : (
              <User className="h-8 w-8 text-muted-foreground" />
            )}
          </AvatarFallback>
        </Avatar>

        {/* 버튼 그룹 */}
        <div className="flex gap-2">
          {showCamera && (
            <Button
              type="button"
              variant="outline"
              onClick={() => handleFileSelect(true)}
              disabled={loading}
              className="flex items-center gap-2"
            >
              <Camera className="h-4 w-4" />
              사진 촬영
            </Button>
          )}
          <Button
            type="button"
            variant="outline"
            onClick={() => handleFileSelect(false)}
            disabled={loading}
            className="flex items-center gap-2"
          >
            <ImageIcon className="h-4 w-4" />
            갤러리에서 선택
          </Button>
          {currentImage && onDelete && (
            <Button
              type="button"
              variant="destructive"
              onClick={handleDelete}
              disabled={loading}
              className="flex items-center gap-2"
            >
              <Trash2 className="h-4 w-4" />
              삭제
            </Button>
          )}
        </div>

        {/* 에러 메시지 */}
        {error && <p className="text-sm text-red-500">{error}</p>}

        {/* 필수 항목 표시 */}
        {required && !currentImage && (
          <p className="text-xs text-muted-foreground">
            {label}는 필수 항목입니다
          </p>
        )}

        {/* 이미지 가이드라인 */}
        <div className="text-xs text-muted-foreground text-center">
          <p>최대 {getUploadConfig().config.maxSize / (1024 * 1024)}MB</p>
          <p>{getUploadConfig().guideline}</p>
        </div>
      </div>
    </div>
  );
}
