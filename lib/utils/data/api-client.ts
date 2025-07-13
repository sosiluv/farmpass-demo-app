import { refreshToken, handleSessionExpired } from "@/lib/utils/auth";

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
}

export async function apiClient(input: RequestInfo, init?: ApiClientOptions) {
  const {
    onError,
    context,
    skipAuthRefresh = false,
    ...fetchOptions
  } = init || {};

  try {
    const response = await fetch(input, {
      credentials: "include",
      ...fetchOptions,
    });

    // 401: 인증 실패 (토큰 갱신 시도)
    if (response.status === 401) {
      // 로그인 API는 세션 만료 처리를 하지 않음
      const isLoginApi =
        typeof input === "string" && input.includes("/api/auth/login");

      if (!isLoginApi && !skipAuthRefresh) {
        const refreshSuccess = await refreshToken();
        if (refreshSuccess) {
          console.log("토큰 갱신 후 요청 재시도:", input);
          return apiClient(input, { ...init, skipAuthRefresh: true });
        }
      }

      // 로그인 API의 경우 서버 응답 메시지를 그대로 사용
      if (isLoginApi) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage =
          errorData.message || errorData.error || ERROR_MESSAGES.UNAUTHORIZED;
        const error = new Error(errorMessage);
        if (onError) onError(error, context);
        throw error;
      }

      // 로그인 API가 아닌 경우에만 세션 만료 처리
      const sessionResult = await handleSessionExpired();
      const error = new Error(
        sessionResult.message || ERROR_MESSAGES.UNAUTHORIZED
      );
      if (onError) onError(error, context);
      throw error;
    }

    // 403: 권한 부족
    if (response.status === 403) {
      const error = new Error(ERROR_MESSAGES.FORBIDDEN);
      if (onError) onError(error, context);
      throw error;
    }

    // 기타 HTTP 오류
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const error = new Error(
        errorData.error || `${ERROR_MESSAGES.API_ERROR} (${response.status})`
      );

      if (onError) onError(error, context);
      throw error;
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
    // 네트워크 에러나 JSON 파싱 에러는 여기서 처리
    if (error instanceof TypeError && error.message.includes("fetch")) {
      const networkError = new Error(
        "네트워크 연결에 문제가 있습니다. 인터넷 연결을 확인해주세요."
      );
      if (onError) onError(networkError, context);
      throw networkError;
    }

    // 이미 처리된 에러는 그대로 throw
    if (onError) onError(error as Error, context);
    throw error;
  }
}
