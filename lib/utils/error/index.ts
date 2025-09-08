/**
 * 에러맵 통합 export 파일
 */
import { ERROR_MAP } from "./errorMap";
import { SUPABASE_ERROR_MAP } from "./supabaseErrorMap";
import { PRISMA_ERROR_MAP } from "./prismaErrorMap";

// 모든 에러맵을 통합
export const COMBINED_ERROR_MAP = {
  ...ERROR_MAP,
  ...SUPABASE_ERROR_MAP,
  ...PRISMA_ERROR_MAP,
};

// 타입 정의
export type ErrorCode = keyof typeof COMBINED_ERROR_MAP;

// 개별 export
export { ERROR_MAP } from "./errorMap";
export { SUPABASE_ERROR_MAP } from "./supabaseErrorMap";
export { PRISMA_ERROR_MAP } from "./prismaErrorMap";
export { handleError } from "./handleError";

// errorUtil.ts에서 필요한 함수들 export
export {
  mapRawErrorToCode,
  getErrorInfo,
  makeErrorResponse,
  makeErrorResponseFromResult,
  getErrorResultFromRawError,
  getErrorMessage,
  throwBusinessError,
} from "./errorUtil";

// 타입 export
export type { ErrorInfo } from "./errorMap";
export type { SupabaseErrorInfo } from "./supabaseErrorMap";
export type { PrismaErrorInfo } from "./prismaErrorMap";
