/**
 * 이미지 업로드 관련 상수
 */

// 파일 크기 제한
export const MAX_UPLOAD_SIZE = 5 * 1024 * 1024; // 5MB
export const MAX_UPLOAD_SIZE_MB = 5;

// 이미지 크기 제한
export const MAX_IMAGE_WIDTH = 1000;
export const MAX_IMAGE_HEIGHT = 1000;

// 이미지 품질 설정
export const IMAGE_QUALITY = 0.8;
export const TARGET_FORMAT = "jpeg" as const;

export const DEFAULT_IMAGE_CACHE_CONTROL = "3600";
export const DEFAULT_IMAGE_QUALITY = 0.8;
export const DEFAULT_IMAGE_WIDTH = 1000;
export const DEFAULT_IMAGE_HEIGHT = 1000;
export const DEFAULT_IMAGE_FORMAT = "jpeg" as const;

// 허용되는 파일 형식
export const ALLOWED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/svg+xml",
  "image/x-icon",
  "image/heic",
  "image/webp",
] as const;
export const ALLOWED_IMAGE_EXTENSIONS = [
  ".jpg",
  ".jpeg",
  ".png",
  ".svg",
  ".ico",
] as const;

// 알림 아이콘용 허용 파일 형식 (PNG, SVG만 권장)
export const ALLOWED_NOTIFICATION_ICON_TYPES = [
  "image/png",
  "image/svg+xml",
] as const;
export const ALLOWED_NOTIFICATION_ICON_EXTENSIONS = [".png", ".svg"] as const;

// 배지 아이콘용 허용 파일 형식 (PNG만 권장)
export const ALLOWED_NOTIFICATION_BADGE_TYPES = ["image/png"] as const;
export const ALLOWED_NOTIFICATION_BADGE_EXTENSIONS = [".png"] as const;

// 사이트 로고 허용 파일 형식 (PNG, JPG, SVG)
export const ALLOWED_LOGO_TYPES = [
  "image/png",
  "image/jpeg",
  "image/svg+xml",
] as const;
export const ALLOWED_LOGO_EXTENSIONS = [
  ".png",
  ".jpg",
  ".jpeg",
  ".svg",
] as const;

// 파비콘 허용 파일 형식 (PNG, ICO)
export const ALLOWED_FAVICON_TYPES = ["image/png", "image/x-icon"] as const;
export const ALLOWED_FAVICON_EXTENSIONS = [".png", ".ico"] as const;

// 이미지 업로드 설정
export const IMAGE_UPLOAD_CONFIG = {
  maxSize: MAX_UPLOAD_SIZE,
  maxWidth: MAX_IMAGE_WIDTH,
  maxHeight: MAX_IMAGE_HEIGHT,
  quality: IMAGE_QUALITY,
  targetFormat: TARGET_FORMAT,
  allowedTypes: ALLOWED_IMAGE_TYPES,
  allowedExtensions: ALLOWED_IMAGE_EXTENSIONS,
} as const;

// 에러 메시지
export const IMAGE_ERROR_MESSAGES = {
  SIZE_EXCEEDED: `파일 크기는 ${MAX_UPLOAD_SIZE_MB}MB를 초과할 수 없습니다.`,
  PROCESSING_ERROR: "이미지 처리 중 오류가 발생했습니다.",
} as const;
