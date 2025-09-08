export interface UploadResult {
  publicUrl: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
}

export interface UploadError {
  code: string;
  message: string;
  details?: any;
}

export interface UploadState {
  loading: boolean;
  progress: number;
  error: UploadError | null;
  result: UploadResult | null;
}
