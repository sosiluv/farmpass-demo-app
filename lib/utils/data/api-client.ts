/**
 * API 클라이언트 - HTTP 요청 처리 및 에러 관리
 *
 * 주요 기능:
 * - 자동 토큰 갱신
 * - 표준화된 에러 처리
 * - 동적 메시지 생성
 * - 타임아웃 처리
 *
 * 최적화된 구조:
 * - createAndHandleError: 에러 생성 및 처리 공통 함수
 * - handleHttpError: HTTP 에러 처리 공통 함수
 * - parseErrorResponse: 서버 응답 파싱 및 동적 메시지 처리
 */
import { refreshToken, handleSessionExpired } from "@/lib/utils/auth";
import { handleError, getErrorMessage } from "@/lib/utils/error/";

// 에러 메시지 상수
const ERROR_MESSAGES = {
  UNAUTHORIZED: "인증 실패: 세션이 만료되었습니다.",
  FORBIDDEN: "권한 부족: 이 작업을 수행할 권한이 없습니다.",
  API_ERROR: "API 요청 실패",
} as const;

interface ApiClientOptions extends RequestInit {
  onError?: (error: Error, context?: string) => void;
  context?: string;
  skipAuthRefresh?: boolean;
  skipDefaultErrorHandling?: boolean; // 기본 에러 처리 건너뛰기 옵션
}

/**
 * 에러 생성 및 처리 공통 함수
 * 모든 에러 처리에서 사용되는 표준화된 에러 생성 로직
 */
function createAndHandleError(
  message: string,
  status: number,
  errorCode?: string,
  additionalData?: Record<string, any>,
  detail?: string,
  context?: string,
  skipDefaultErrorHandling?: boolean,
  onError?: (error: Error, context?: string) => void
): never {
  const error = new Error(message);
  (error as any).status = status;
  (error as any).errorCode = errorCode;
  (error as any).additionalData = additionalData;
  (error as any).detail = detail;

  // 기본 에러 처리
  if (!skipDefaultErrorHandling) {
    handleError(error, { context });
  }

  if (onError) onError(error, context);
  throw error;
}

/**
 * HTTP 에러 처리 공통 함수
 * 401, 403, 기타 HTTP 오류를 통합적으로 처리
 */
async function handleHttpError(
  response: Response,
  context?: string,
  skipDefaultErrorHandling?: boolean,
  onError?: (error: Error, context?: string) => void
): Promise<never> {
  const errorData = await response.json().catch(() => ({}));
  const {
    message: errorMessage,
    errorCode,
    additionalData,
    detail,
  } = parseErrorResponse(errorData);

  let finalMessage: string;
  let status: number;

  switch (response.status) {
    case 401:
      finalMessage = errorMessage || ERROR_MESSAGES.UNAUTHORIZED;
      status = 401;
      break;
    case 403:
      finalMessage = errorMessage || ERROR_MESSAGES.FORBIDDEN;
      status = 403;
      break;
    default:
      finalMessage =
        errorMessage || `${ERROR_MESSAGES.API_ERROR} (${response.status})`;
      status = response.status;
  }

  return createAndHandleError(
    finalMessage,
    status,
    errorCode,
    additionalData,
    detail,
    context,
    skipDefaultErrorHandling,
    onError
  );
}

// 표준 에러 응답 파싱 함수
function parseErrorResponse(errorData: any): {
  message: string;
  errorCode?: string;
  success: boolean;
  additionalData?: Record<string, any>;
  detail?: string;
} {
  // 기본 구조
  const result = {
    message: "알 수 없는 오류가 발생했습니다.",
    errorCode: undefined,
    success: false,
    additionalData: {},
    detail: undefined,
  };

  // 서버에서 makeErrorResponse()로 생성된 표준 구조 처리
  if (errorData.success === false && errorData.error && errorData.message) {
    result.message = errorData.message;
    result.errorCode = errorData.error;
    result.success = false;

    // detail 필드 처리 (서버에서 보내는 상세 오류 정보)
    if (errorData.detail) {
      result.detail = errorData.detail;
    }

    // 추가 필드들을 additionalData에 저장 (detail 제외)
    const { success, error, message, detail, ...additionalFields } = errorData;
    if (Object.keys(additionalFields).length > 0) {
      result.additionalData = additionalFields;
    }

    // 동적 메시지 처리가 필요한 경우 (ERROR_MAP의 함수형 message 처리)
    if (
      result.errorCode &&
      result.additionalData &&
      Object.keys(result.additionalData).length > 0
    ) {
      try {
        const dynamicMessage = getErrorMessage(
          result.errorCode as any,
          result.additionalData
        );
        // 동적 메시지가 원본과 다르면 업데이트
        if (dynamicMessage !== result.message) {
          result.message = dynamicMessage;
        }
      } catch {
        // 동적 메시지 처리 실패 시 원본 메시지 유지
      }
    }

    return result;
  }

  // 기존 호환성을 위한 fallback 처리
  if (errorData.message) {
    result.message = errorData.message;
  } else if (errorData.error) {
    result.message = errorData.error;
  }

  // detail 필드 처리 (fallback)
  if (errorData.detail) {
    result.detail = errorData.detail;
  }

  // success 필드가 있으면 사용
  if (typeof errorData.success === "boolean") {
    result.success = errorData.success;
  }

  // 추가 필드들을 additionalData에 저장 (detail 제외)
  const { success, error, message, detail, ...additionalFields } = errorData;
  if (Object.keys(additionalFields).length > 0) {
    result.additionalData = additionalFields;
  }

  return result;
}

export async function apiClient(input: RequestInfo, init?: ApiClientOptions) {
  const {
    onError,
    context,
    skipAuthRefresh = false,
    skipDefaultErrorHandling = false,
    ...fetchOptions
  } = init || {};

  // fetch 타임아웃(ms)
  const FETCH_TIMEOUT = 15000; // 10초

  try {
    // AbortController로 fetch 타임아웃 구현
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT);
    let response;
    try {
      response = await fetch(input, {
        credentials: "include",
        signal: controller.signal,
        ...fetchOptions,
      });
    } finally {
      clearTimeout(timeoutId);
    }

    // 401: 인증 실패 (토큰 갱신 시도)
    if (response.status === 401) {
      // 로그인 API는 세션 만료 처리를 하지 않음
      const isLoginApi =
        typeof input === "string" && input.includes("/api/auth/login");

      if (!isLoginApi && !skipAuthRefresh) {
        const refreshSuccess = await refreshToken();
        if (refreshSuccess) {
          return apiClient(input, { ...init, skipAuthRefresh: true });
        }
      }

      // 서버 응답 메시지를 먼저 읽기 (한 번만 호출)
      const errorData = await response.json().catch(() => ({}));
      const {
        message: serverErrorMessage,
        errorCode,
        additionalData,
        detail,
      } = parseErrorResponse(errorData);

      // 로그인 API의 경우 서버 응답 메시지를 그대로 사용
      if (isLoginApi) {
        const errorMessage = serverErrorMessage || ERROR_MESSAGES.UNAUTHORIZED;
        return createAndHandleError(
          errorMessage,
          401,
          errorCode,
          additionalData,
          detail,
          context,
          skipDefaultErrorHandling,
          onError
        );
      }

      // 로그인 API가 아닌 경우에만 세션 만료 처리
      const sessionResult = await handleSessionExpired();
      const errorMessage =
        serverErrorMessage ||
        sessionResult.message ||
        ERROR_MESSAGES.UNAUTHORIZED;

      return createAndHandleError(
        errorMessage,
        401,
        errorCode,
        additionalData,
        detail,
        context,
        skipDefaultErrorHandling,
        onError
      );
    }

    // 403: 권한 부족
    if (response.status === 403) {
      return handleHttpError(
        response,
        context,
        skipDefaultErrorHandling,
        onError
      );
    }

    // 기타 HTTP 오류
    if (!response.ok) {
      return handleHttpError(
        response,
        context,
        skipDefaultErrorHandling,
        onError
      );
    }

    // 204 No Content 응답 처리 (body가 없음)
    if (response.status === 204) {
      return { success: true };
    }

    // Content-Length가 0이거나 빈 응답 처리
    const contentLength = response.headers.get("content-length");
    if (contentLength === "0") {
      return { success: true };
    }

    return response.json();
  } catch (error) {
    // fetch 타임아웃(AbortError) 처리
    if (error instanceof DOMException && error.name === "AbortError") {
      return createAndHandleError(
        "네트워크 요청이 10초 이상 지연되어 중단되었습니다.",
        0,
        undefined,
        undefined,
        undefined,
        context,
        skipDefaultErrorHandling,
        onError
      );
    }

    // 네트워크 에러나 JSON 파싱 에러는 여기서 처리
    if (error instanceof TypeError && error.message.includes("fetch")) {
      return createAndHandleError(
        "Failed to fetch",
        0,
        undefined,
        undefined,
        undefined,
        context,
        skipDefaultErrorHandling,
        onError
      );
    }

    // 이미 처리된 에러는 그대로 throw
    if (!skipDefaultErrorHandling) {
      handleError(error as Error, { context });
    }

    if (onError) onError(error as Error, context);
    throw error;
  }
}
