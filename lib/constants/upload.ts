// 이미지 업로드 설정
export const IMAGE_UPLOAD_CONFIG = {
  maxSize: 5 * 1024 * 1024, // 5MB
  maxWidth: 1000,
  maxHeight: 1000,
  quality: 0.8,
  targetFormat: "jpeg" as const,
  allowedTypes: ["image/jpeg", "image/png"] as const,
  allowedExtensions: [".jpg", ".jpeg", ".png"] as const,
} as const;

// 에러 메시지
export const IMAGE_ERROR_MESSAGES = {
  SIZE_EXCEEDED: "파일 크기는 5MB를 초과할 수 없습니다.",
  PROCESSING_ERROR: "이미지 처리 중 오류가 발생했습니다.",
} as const;
