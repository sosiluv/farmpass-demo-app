/**
 * 이미지 업로드 관련 타입 정의
 * 설정 기반 관리와 타입 안전성을 보장합니다.
 */

// 기본 업로드 설정 타입
export interface UploadConfig {
  maxSize: number;
  maxWidth: number;
  maxHeight: number;
  quality: number;
  targetFormat: string;
  allowedTypes: readonly string[];
  allowedExtensions: readonly string[];
  cacheControl: string;
}

// 업로드 타입별 설정
export interface UploadTypeConfig extends UploadConfig {
  bucket: "profiles" | "visitor-photos";
  pathGenerator: (file: File, contextId?: string) => string;
  dbTable?: string;
  dbField?: string;
  cacheBusterField?: string;
  preUploadCleanup?: () => Promise<void>;
}

// 업로드 결과 타입
export interface UploadResult {
  publicUrl: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
}

// 업로드 에러 타입
export interface UploadError {
  code: string;
  message: string;
  details?: any;
}

// 업로드 상태 타입
export interface UploadState {
  loading: boolean;
  progress: number;
  error: UploadError | null;
  result: UploadResult | null;
}

// 훅 반환 타입
export interface UseImageUploadReturn {
  state: UploadState;
  loading: boolean;
  progress: number;
  error: UploadError | null;
  result: UploadResult | null;
  uploadImage: (file: File) => Promise<UploadResult | void>;
  deleteImage: () => Promise<void>;
  reset: () => void;
}

// 업로드 타입 정의
export type UploadType =
  | "profile"
  | "logo"
  | "favicon"
  | "visitorPhoto"
  | "notificationIcon"
  | "notificationBadge";

// 업로드 타입별 설정 매핑
export const UPLOAD_TYPE_CONFIGS: Record<UploadType, UploadTypeConfig> = {
  profile: {
    bucket: "profiles" as const,
    maxSize: 5 * 1024 * 1024,
    maxWidth: 1024,
    maxHeight: 1024,
    quality: 0.8,
    targetFormat: "jpeg",
    allowedTypes: ["image/jpeg", "image/png"] as const,
    allowedExtensions: [".jpg", ".jpeg", ".png"] as const,
    cacheControl: "public, max-age=31536000",
    pathGenerator: (file: File, contextId?: string) => {
      const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
      return `${contextId}/profile_${Date.now()}.${ext}`;
    },
    dbTable: "profiles",
    dbField: "profile_image_url",
    cacheBusterField: "profileImageCacheBuster",
    preUploadCleanup: undefined,
  },

  logo: {
    bucket: "profiles" as const,
    maxSize: 5 * 1024 * 1024,
    maxWidth: 512,
    maxHeight: 512,
    quality: 0.9,
    targetFormat: "png",
    allowedTypes: ["image/png", "image/jpeg", "image/svg+xml"] as const,
    allowedExtensions: [".png", ".jpg", ".jpeg", ".svg"] as const,
    cacheControl: "public, max-age=31536000",
    pathGenerator: (file: File) => {
      const ext = file.name.split(".").pop()?.toLowerCase() || "png";
      return `systems/logo_${Date.now()}.${ext}`;
    },
    dbTable: "system_settings",
    dbField: "logo",
    cacheBusterField: "logoCacheBuster",
    preUploadCleanup: async () => {
      // 로고 파일 정리 로직
    },
  },

  favicon: {
    bucket: "profiles" as const,
    maxSize: 5 * 1024 * 1024,
    maxWidth: 64,
    maxHeight: 64,
    quality: 1.0,
    targetFormat: "ico",
    allowedTypes: ["image/x-icon", "image/png"] as const,
    allowedExtensions: [".ico", ".png"] as const,
    cacheControl: "public, max-age=31536000",
    pathGenerator: (file: File) => {
      const ext = file.name.split(".").pop()?.toLowerCase() || "png";
      // 공개 접근 가능한 경로로 저장
      return `favicon.${ext}`;
    },
    dbTable: "system_settings",
    dbField: "favicon",
    cacheBusterField: "faviconCacheBuster",
    preUploadCleanup: undefined,
  },

  visitorPhoto: {
    bucket: "visitor-photos" as const,
    maxSize: 5 * 1024 * 1024, // 5MB
    maxWidth: 1024,
    maxHeight: 1024,
    quality: 0.8,
    targetFormat: "jpeg",
    allowedTypes: ["image/jpeg", "image/png"] as const,
    allowedExtensions: [".jpg", ".jpeg", ".png"] as const,
    cacheControl: "public, max-age=31536000",
    pathGenerator: (file: File, contextId?: string) => {
      const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
      return `${contextId}/${Date.now()}_${Math.random()
        .toString(36)
        .substr(2, 9)}.${ext}`;
    },
    preUploadCleanup: undefined,
  },

  notificationIcon: {
    bucket: "profiles" as const,
    maxSize: 5 * 1024 * 1024,
    maxWidth: 128,
    maxHeight: 128,
    quality: 0.9,
    targetFormat: "png",
    allowedTypes: ["image/png", "image/jpeg"] as const,
    allowedExtensions: [".png", ".jpg", ".jpeg"] as const,
    cacheControl: "public, max-age=31536000",
    pathGenerator: (file: File) => {
      const ext = file.name.split(".").pop()?.toLowerCase() || "png";
      return `systems/notification_icon_${Date.now()}.${ext}`;
    },
    dbTable: "system_settings",
    dbField: "notification_icon",
    cacheBusterField: "notificationIconCacheBuster",
    preUploadCleanup: undefined,
  },

  notificationBadge: {
    bucket: "profiles" as const,
    maxSize: 5 * 1024 * 1024,
    maxWidth: 128,
    maxHeight: 128,
    quality: 0.9,
    targetFormat: "png",
    allowedTypes: ["image/png", "image/jpeg"] as const,
    allowedExtensions: [".png", ".jpg", ".jpeg"] as const,
    cacheControl: "public, max-age=31536000",
    pathGenerator: (file: File) => {
      const ext = file.name.split(".").pop()?.toLowerCase() || "png";
      return `systems/notification_badge_${Date.now()}.${ext}`;
    },
    dbTable: "system_settings",
    dbField: "notification_badge",
    cacheBusterField: "notificationBadgeCacheBuster",
    preUploadCleanup: undefined,
  },
} as const;

// 타입 안전성을 위한 헬퍼 타입
export type BucketType = "profiles" | "visitor-photos";
export type AllowedImageType =
  (typeof UPLOAD_TYPE_CONFIGS)[UploadType]["allowedTypes"][number];
