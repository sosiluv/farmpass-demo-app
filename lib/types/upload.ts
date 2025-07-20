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
