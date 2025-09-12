interface ErrorHandlerOptions {
  context?: string;
  onStateUpdate?: (errorMessage: string) => void;
}

export function handleError(
  error: any,
  options?: string | ErrorHandlerOptions
) {
  // 옵션 파싱
  const opts: ErrorHandlerOptions =
    typeof options === "string" ? { context: options } : { ...options };

  let message =
    error?.message ||
    error?.toString() ||
    "알 수 없는 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.";

  // 네트워크 에러 분기
  if (message.includes("NetworkError") || message.includes("Failed to fetch")) {
    message = "네트워크 연결에 문제가 있습니다. 인터넷을 확인해 주세요.";
  }

  // HTTP 상태코드별 UX (axios/fetch 등에서 error.response.status 활용 가능)
  const status = error?.status || error?.response?.status;
  if (status === 500) {
    message = "서버에 문제가 발생했습니다. 잠시 후 다시 시도해 주세요.";
  } else if (status === 404) {
    message = "요청하신 데이터를 찾을 수 없습니다.";
  } else if (status === 429) {
    message = "요청이 너무 많습니다. 잠시 후 다시 시도해 주세요.";
  }

  // 상태 업데이트 콜백 실행 (토스트는 apiClient에서 처리됨)
  if (opts.onStateUpdate) {
    opts.onStateUpdate(message);
  }

  return message;
}
