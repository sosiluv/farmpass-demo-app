"use client";

import { useCallback, useState } from "react";
import { Button } from "./button";
import { Camera, ImageIcon, Trash2, User } from "lucide-react";
import { Loading } from "./loading";
import {
  IMAGE_UPLOAD_CONFIG,
  IMAGE_ERROR_MESSAGES,
} from "@/lib/constants/upload";
import { UPLOAD_TYPE_CONFIGS, UploadType } from "@/lib/types/upload";
import { cn } from "@/lib/utils";

export interface ImageUploadProps {
  onUpload: (file: File) => void;
  onDelete?: () => Promise<void>;
  currentImage?: string | null;
  required?: boolean;
  className?: string;
  showCamera?: boolean;
  avatarSize?: "sm" | "md" | "lg" | "xl";
  label?: string;
  uploadType?: UploadType | "image";
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
  const [isSpinning, setIsSpinning] = useState(false);

  // 아바타 크기 매핑
  const avatarSizeMap = {
    sm: "w-20 h-20",
    md: "w-24 h-24",
    lg: "w-32 h-32",
    xl: "w-40 h-40",
  };

  // 중앙 원 크기 매핑
  const centerCircleSizeMap = {
    sm: "w-16 h-16",
    md: "w-20 h-20",
    lg: "w-24 h-24",
    xl: "w-32 h-32",
  };

  // 휠 전체 크기 매핑
  const wheelSizeMap = {
    sm: "w-32 h-32",
    md: "w-40 h-40",
    lg: "w-48 h-48",
    xl: "w-56 h-56",
  };

  // 설정 기반 업로드 설정 사용
  const getUploadConfig = () => {
    // uploadType이 설정 기반 타입인 경우 해당 설정 사용
    if (
      uploadType &&
      uploadType !== "image" &&
      UPLOAD_TYPE_CONFIGS[uploadType as UploadType]
    ) {
      const config = UPLOAD_TYPE_CONFIGS[uploadType as UploadType];
      return {
        config: {
          maxSize: config.maxSize,
          maxWidth: config.maxWidth,
          maxHeight: config.maxHeight,
          quality: config.quality,
          targetFormat: config.targetFormat,
          allowedTypes: config.allowedTypes,
          allowedExtensions: config.allowedExtensions,
        },
        errorMessage: `지원하지 않는 파일 형식입니다. ${config.allowedExtensions.join(
          ", "
        )} 만 업로드 가능합니다.`,
        guideline: `권장 크기: ${config.maxWidth}x${config.maxHeight} 픽셀`,
      };
    }

    // 기본 설정 사용
    return {
      config: IMAGE_UPLOAD_CONFIG,
      errorMessage: `지원하지 않는 파일 형식입니다. ${IMAGE_UPLOAD_CONFIG.allowedExtensions.join(
        ", "
      )} 만 업로드 가능합니다.`,
      guideline: `권장 크기: ${IMAGE_UPLOAD_CONFIG.maxWidth}x${IMAGE_UPLOAD_CONFIG.maxHeight} 픽셀`,
    };
  };

  // 파일 처리 함수 - 검증 제거하고 바로 onUpload 호출
  const handleFile = useCallback(
    async (file: File) => {
      try {
        setLoading(true);
        setError(null);

        onUpload(file);
      } catch (err) {
        setError(IMAGE_ERROR_MESSAGES.PROCESSING_ERROR);
      } finally {
        setLoading(false);
      }
    },
    [onUpload]
  );

  // 삭제 핸들러
  const handleDelete = useCallback(async () => {
    if (!onDelete) return;

    try {
      setLoading(true);
      setError(null);

      await onDelete();
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "이미지 삭제에 실패했습니다.";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [onDelete]);

  // 파일 선택 핸들러 (카메라/갤러리)
  const handleFileSelectWithCamera = useCallback(
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
          setIsSpinning(true);
          setTimeout(async () => {
            await handleFile(file);
            setIsSpinning(false);
          }, 1000);
        }
      };
      input.click();
    },
    [handleFile, uploadType]
  );

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="flex flex-col items-center gap-4">
        {/* 휠형 업로드 - Apple 스타일 */}
        <div className={`relative ${wheelSizeMap[avatarSize]}`}>
          {/* 휠 중앙 */}
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
            <div
              className={cn(
                `${avatarSizeMap[avatarSize]} rounded-full border-4 border-gray-200 flex items-center justify-center transition-all duration-500`,
                isSpinning ? "animate-spin" : ""
              )}
            >
              <div
                className={`${centerCircleSizeMap[avatarSize]} rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center`}
              >
                {currentImage ? (
                  <img
                    src={currentImage}
                    alt={label}
                    className="w-full h-full rounded-full object-cover"
                  />
                ) : loading ? (
                  <Loading spinnerSize={32} showText={false} minHeight="auto" />
                ) : (
                  <User className="h-8 w-8 text-white" />
                )}
              </div>
            </div>
          </div>

          {/* 카메라 버튼 - 12시 방향 */}
          {showCamera && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleFileSelectWithCamera(true)}
              disabled={loading}
              className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white shadow-lg border-2 border-blue-200 hover:border-blue-300 rounded-full w-10 h-10 p-0"
            >
              <Camera className="h-4 w-4 text-blue-600" />
            </Button>
          )}

          {/* 갤러리 버튼 - 3시 방향 */}
          <Button
            size="sm"
            variant="outline"
            onClick={() => handleFileSelectWithCamera(false)}
            disabled={loading}
            className="absolute top-1/2 right-0 transform translate-x-1/2 -translate-y-1/2 bg-white shadow-lg border-2 border-purple-200 hover:border-purple-300 rounded-full w-10 h-10 p-0"
          >
            <ImageIcon className="h-4 w-4 text-purple-600" />
          </Button>

          {/* 삭제 버튼 - 6시 방향 */}
          {currentImage && onDelete && (
            <Button
              size="sm"
              variant="outline"
              onClick={handleDelete}
              disabled={loading}
              className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-1/2 bg-white shadow-lg border-2 border-red-200 hover:border-red-300 rounded-full w-10 h-10 p-0"
            >
              <Trash2 className="h-4 w-4 text-red-600" />
            </Button>
          )}

          {/* 휠 포인터 - 9시 방향 */}
          <div className="absolute top-1/2 left-0 transform -translate-x-1/2 -translate-y-1/2">
            <div className="w-4 h-4 bg-blue-500 rounded-full shadow-lg" />
          </div>
        </div>

        {/* 에러 메시지 */}
        {error && <p className="text-sm text-red-500">{error}</p>}

        {/* 필수 항목 표시 */}
        {required && !currentImage && (
          <p className="text-xs text-muted-foreground">
            {label}는 필수 항목입니다
          </p>
        )}

        {/* 안내 텍스트 */}
        <div className="text-xs text-muted-foreground text-center mt-4 space-y-1">
          <div className="flex items-center justify-center gap-2">
            <div className="w-1 h-1 bg-blue-400 rounded-full"></div>
            <p>최대 {getUploadConfig().config.maxSize / (1024 * 1024)}MB</p>
          </div>
          <div className="flex items-center justify-center gap-2">
            <div className="w-1 h-1 bg-green-400 rounded-full"></div>
            <p>{getUploadConfig().guideline}</p>
          </div>
          <div className="flex items-center justify-center gap-2">
            <div className="w-1 h-1 bg-purple-400 rounded-full"></div>
            <p className="font-medium">
              {getUploadConfig()
                .config.allowedExtensions.map((ext) => ext.toUpperCase())
                .join(", ")}{" "}
              형식 지원
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
