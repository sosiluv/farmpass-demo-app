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

// 허용되는 파일 형식
export const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png"] as const;
export const ALLOWED_IMAGE_EXTENSIONS = [".jpg", ".jpeg", ".png"] as const;

// 알림 아이콘용 허용 파일 형식
export const ALLOWED_NOTIFICATION_ICON_TYPES = [
  "image/png",
  "image/svg+xml",
  "image/jpeg",
] as const;
export const ALLOWED_NOTIFICATION_ICON_EXTENSIONS = [
  ".png",
  ".svg",
  ".jpg",
  ".jpeg",
] as const;

// 배지 아이콘용 허용 파일 형식
export const ALLOWED_NOTIFICATION_BADGE_TYPES = [
  "image/png",
  "image/svg+xml",
  "image/jpeg",
] as const;
export const ALLOWED_NOTIFICATION_BADGE_EXTENSIONS = [
  ".png",
  ".svg",
  ".jpg",
  ".jpeg",
] as const;

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

// 알림 아이콘 업로드 설정
export const NOTIFICATION_ICON_UPLOAD_CONFIG = {
  maxSize: MAX_UPLOAD_SIZE,
  allowedTypes: ALLOWED_NOTIFICATION_ICON_TYPES,
  allowedExtensions: ALLOWED_NOTIFICATION_ICON_EXTENSIONS,
} as const;

// 배지 아이콘 업로드 설정
export const NOTIFICATION_BADGE_UPLOAD_CONFIG = {
  maxSize: MAX_UPLOAD_SIZE,
  allowedTypes: ALLOWED_NOTIFICATION_BADGE_TYPES,
  allowedExtensions: ALLOWED_NOTIFICATION_BADGE_EXTENSIONS,
} as const;

// 에러 메시지
export const IMAGE_ERROR_MESSAGES = {
  SIZE_EXCEEDED: `파일 크기는 ${MAX_UPLOAD_SIZE_MB}MB를 초과할 수 없습니다.`,
  INVALID_TYPE:
    "지원하지 않는 파일 형식입니다. JPG, PNG 파일만 업로드 가능합니다.",
  INVALID_NOTIFICATION_ICON_TYPE:
    "지원하지 않는 파일 형식입니다. PNG, SVG, JPG 파일만 업로드 가능합니다.",
  INVALID_NOTIFICATION_BADGE_TYPE:
    "지원하지 않는 파일 형식입니다. PNG, SVG, JPG 파일만 업로드 가능합니다.",
  PROCESSING_ERROR: "이미지 처리 중 오류가 발생했습니다.",
} as const;
