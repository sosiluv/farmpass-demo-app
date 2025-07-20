// 에러 바운더리 및 에러 관련 상수
export const ERROR_LABELS = {
  // 일반 에러
  GENERAL_ERROR_TITLE: "오류가 발생했습니다",
  GENERAL_ERROR_DESCRIPTION:
    "예상치 못한 오류가 발생했습니다. 페이지를 새로고침하거나 잠시 후 다시 시도해주세요.",

  // 권한 에러
  PERMISSION_ERROR_TITLE: "권한 없음",
  PERMISSION_ERROR_DESCRIPTION: "이 페이지에 접근할 권한이 없습니다.",

  // 로딩 에러
  LOADING_ERROR_TITLE: "데이터 로딩 오류",
  LOADING_ERROR_DESCRIPTION:
    "데이터를 불러오는 중 문제가 발생했습니다. 다시 시도해주세요.",

  // 404 에러
  NOT_FOUND_ERROR_TITLE: "페이지를 찾을 수 없습니다",
  NOT_FOUND_ERROR_DESCRIPTION: "요청하신 페이지가 존재하지 않습니다.",

  // 타임아웃 에러
  TIMEOUT_ERROR_TITLE: "데이터를 불러오지 못했습니다",
  TIMEOUT_ERROR_DESCRIPTION: "네트워크 상태를 확인하거나 다시 시도해 주세요.",

  // 404 Not Found 페이지
  NOT_FOUND_PAGE_TITLE: "페이지를 찾을 수 없습니다",
  NOT_FOUND_PAGE_DESCRIPTION:
    "요청하신 페이지가 존재하지 않거나\n다른 위치로 이동했을 수 있어요",
  NOT_FOUND_ERROR_CODE: "404",
  NOT_FOUND_GO_HOME: "홈으로 돌아가기",

  // 권한 에러
  ACCESS_DENIED_DEFAULT_TITLE: "권한 없음",
  ACCESS_DENIED_DEFAULT_DESCRIPTION: "이 페이지에 접근할 권한이 없습니다.",
  ACCESS_DENIED_PERMISSION_INFO: "권한 정보",
  ACCESS_DENIED_REQUIRED_ROLE: "필요한 권한:",
  ACCESS_DENIED_CURRENT_ROLE: "현재 권한:",
  ACCESS_DENIED_GO_DASHBOARD: "대시보드로 이동",

  // 전역 에러 페이지
  GLOBAL_ERROR_PAGE_TITLE: "서비스에 문제가 발생했어요",
  GLOBAL_ERROR_PAGE_DESCRIPTION:
    "일시적인 오류입니다\n잠시 후 다시 시도해주세요",
  GLOBAL_ERROR_CODE: "500",
  GLOBAL_ERROR_RETRY: "다시 시도하기",
  GLOBAL_ERROR_DEVELOPER_INFO: "개발자 정보",
  GLOBAL_ERROR_ERROR_LABEL: "Error:",
  GLOBAL_ERROR_DIGEST_LABEL: "Digest:",
} as const;

// 에러 타입별 기본 설정
export const ERROR_CONFIGS = {
  GENERAL: {
    title: ERROR_LABELS.GENERAL_ERROR_TITLE,
    description: ERROR_LABELS.GENERAL_ERROR_DESCRIPTION,
  },
  PERMISSION: {
    title: ERROR_LABELS.PERMISSION_ERROR_TITLE,
    description: ERROR_LABELS.PERMISSION_ERROR_DESCRIPTION,
  },
  LOADING: {
    title: ERROR_LABELS.LOADING_ERROR_TITLE,
    description: ERROR_LABELS.LOADING_ERROR_DESCRIPTION,
  },
  NOT_FOUND: {
    title: ERROR_LABELS.NOT_FOUND_ERROR_TITLE,
    description: ERROR_LABELS.NOT_FOUND_ERROR_DESCRIPTION,
  },
  TIMEOUT: {
    title: ERROR_LABELS.TIMEOUT_ERROR_TITLE,
    description: ERROR_LABELS.TIMEOUT_ERROR_DESCRIPTION,
  },
} as const;

// 404 Not Found 페이지 관련 상수
export const NOT_FOUND_LABELS = {
  // 페이지 제목
  PAGE_TITLE: ERROR_LABELS.NOT_FOUND_PAGE_TITLE,

  // 설명 텍스트
  DESCRIPTION: ERROR_LABELS.NOT_FOUND_PAGE_DESCRIPTION,

  // 버튼 텍스트
  BUTTONS: {
    GO_HOME: ERROR_LABELS.NOT_FOUND_GO_HOME,
  },

  // 404 숫자
  ERROR_CODE: ERROR_LABELS.NOT_FOUND_ERROR_CODE,
} as const;

// 전역 에러 페이지 관련 상수
export const GLOBAL_ERROR_LABELS = {
  // 페이지 제목
  PAGE_TITLE: ERROR_LABELS.GLOBAL_ERROR_PAGE_TITLE,

  // 설명 텍스트
  DESCRIPTION: ERROR_LABELS.GLOBAL_ERROR_PAGE_DESCRIPTION,

  // 버튼 텍스트
  BUTTONS: {
    RETRY: ERROR_LABELS.GLOBAL_ERROR_RETRY,
  },

  // 에러 코드
  ERROR_CODE: ERROR_LABELS.GLOBAL_ERROR_CODE,

  // 개발자 정보
  DEVELOPER_INFO: {
    TITLE: ERROR_LABELS.GLOBAL_ERROR_DEVELOPER_INFO,
    ERROR_LABEL: ERROR_LABELS.GLOBAL_ERROR_ERROR_LABEL,
    DIGEST_LABEL: ERROR_LABELS.GLOBAL_ERROR_DIGEST_LABEL,
  },
} as const;

export const NOT_FOUND_PLACEHOLDERS = {
  // 플레이스홀더가 필요한 경우 추가
} as const;

export const GLOBAL_ERROR_PLACEHOLDERS = {
  // 플레이스홀더가 필요한 경우 추가
} as const;
