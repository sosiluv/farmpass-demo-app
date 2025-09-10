export const PAGE_HEADER = {
  LOGIN_TITLE: "로그인",
  LOGIN_DESCRIPTION: "농장 출입 관리 시스템에 로그인하세요",
  REGISTER_TITLE: "회원가입",
  REGISTER_DESCRIPTION: "농장 출입 관리 시스템에 가입하세요",
  RESET_PASSWORD_TITLE: "비밀번호 재설정",
  RESET_PASSWORD_DESCRIPTION:
    "가입하신 이메일로 비밀번호 재설정 링크를 보내드립니다",
  RESET_PASSWORD_CONFIRM_TITLE: "비밀번호 재설정",
  RESET_PASSWORD_CONFIRM_DESCRIPTION: "새로운 비밀번호를 입력해주세요",
} as const;

export const BUTTONS = {
  LOGIN_BUTTON: "로그인",
  REGISTER_BUTTON: "회원가입",
  RESET_PASSWORD_BUTTON: "비밀번호 재설정 링크 받기",
  RESET_PASSWORD_CONFIRM_BUTTON: "비밀번호 변경하기",
  RETRY_REQUEST_BUTTON: "다시 요청하기",

  EMAIL_CONFIRMATION_LOGIN_NOW: "지금 바로 로그인하기",
  EMAIL_CONFIRMATION_LOGIN: "로그인하기",
  EMAIL_CONFIRMATION_GO_LOGIN: "로그인 페이지로 이동",
  EMAIL_CONFIRMATION_RESEND: "다시 회원가입하기",

  NO_ACCOUNT: "계정이 없으신가요?",
  HAS_ACCOUNT: "이미 계정이 있으신가요?",
  FORGOT_PASSWORD: "비밀번호를 잊으셨나요?",
  BACK_TO_LOGIN: "로그인 페이지로 돌아가기",

  LOGIN_LOADING: "로그인 중...",
  REDIRECTING: "이동 중...",
  REGISTER_LOADING: "가입 중...",
  RESET_PASSWORD_LOADING: "처리 중...",
  RESET_PASSWORD_CONFIRM_LOADING: "비밀번호 변경 중...",

  // 소셜 로그인
  KAKAO_LOGIN: "Kakao로 시작하기",
  GOOGLE_LOGIN: "Google로 시작하기",
} as const;

// 라벨
export const LABELS = {
  EMAIL: "아이디(이메일)",
  PASSWORD: "비밀번호",
  CONFIRM_PASSWORD: "비밀번호 확인",
  CURRENT_PASSWORD: "현재 비밀번호",
  NAME: "이름",
  PHONE: "휴대폰 번호",

  // 로딩 상태
  LINK_CHECKING: "링크 확인 중...",
  LINK_CHECKING_DESCRIPTION: "비밀번호 재설정 링크를 확인하고 있습니다.",
  LINK_ERROR_TITLE: "링크 오류",
  // 캡차
  CAPTCHA_LABEL: "캡차 인증",
  // 이메일 인증
  EMAIL_CONFIRMATION_LOADING: "이메일 인증 중...",
  EMAIL_CONFIRMATION_SUCCESS: "인증 완료!",
  EMAIL_CONFIRMATION_FAILED: "인증 실패",
  EMAIL_CONFIRMATION_PROCESSING:
    "이메일 인증을 확인 중입니다. 잠시만 기다려주세요...",
  EMAIL_CONFIRMATION_SUCCESS_DESC: "이메일 인증이 성공적으로 완료되었습니다.",
  EMAIL_CONFIRMATION_FAILED_DESC: "이메일 인증에 실패했습니다.",
  EMAIL_CONFIRMATION_ACTIVATED: "계정이 활성화되었습니다! 🎉",
  EMAIL_CONFIRMATION_REDIRECT: "후 로그인 페이지로 자동 이동합니다.",
  EMAIL_CONFIRMATION_REDIRECTING: "로그인 페이지로 이동 중...",
} as const;

// PageLoading 텍스트
export const PAGE_LOADING = {
  CHECKING_SESSION: "로그인 상태를 확인하는 중...",
  REDIRECTING_TO_DASHBOARD: "대시보드로 이동 중...",
  SUB_TEXT: "잠시만 기다려주세요",
} as const;

// 플레이스홀더
export const PLACEHOLDERS = {
  EMAIL: "name@example.com",
  PASSWORD: "비밀번호를 입력하세요",
  CONFIRM_PASSWORD: "비밀번호를 다시 입력하세요",
  CURRENT_PASSWORD: "현재 비밀번호를 입력하세요",
  NAME: "이름을 입력하세요",
  PHONE: "하이픈(-) 없이 숫자만 입력해주세요",
} as const;

// 에러 메시지
export const ERROR_MESSAGES = {
  // 필수 입력 검증
  REQUIRED_EMAIL: "이메일을 입력해주세요",
  REQUIRED_PASSWORD: "비밀번호를 입력해주세요",
  REQUIRED_CONFIRM_PASSWORD: "비밀번호를 입력해주세요",
  REQUIRED_NAME: "이름을 입력해주세요",
  REQUIRED_PHONE: "휴대폰 번호를 입력해주세요",
  REQUIRED_CURRENT_PASSWORD: "현재 비밀번호를 입력해주세요",

  // 형식 검증
  INVALID_EMAIL: "유효한 이메일 주소를 입력해주세요",
  INVALID_NAME: "이름은 2자 이상 50자 이하여야 합니다",
  INVALID_PHONE: "올바른 전화번호 형식(010-XXXX-XXXX)을 입력해주세요",

  // 비밀번호 관련
  PASSWORD_MISMATCH: "비밀번호가 일치하지 않습니다",
  PASSWORD_MIN_LENGTH: "비밀번호는 최소 {minLength}자 이상이어야 합니다",
  PASSWORD_COMPLEXITY:
    "비밀번호는 최소 {minLength}자 이상이어야 하며, {requirements}를 포함해야 합니다",
} as const;

export const SOCIAL_BUTTON_CONFIG = [
  {
    provider: "kakao" as const,
    label: BUTTONS.KAKAO_LOGIN,
    iconSrc: "/btn_kakao.svg",
    style: {
      background: "#FEE500",
      color: "#191600",
      border: "1px solid #e0e0e0",
      marginTop: 8,
      fontWeight: 600,
      padding: 0,
    },
  },
  {
    provider: "google" as const,
    label: BUTTONS.GOOGLE_LOGIN,
    iconSrc: "/btn_google.svg",
    style: {
      background: "#fff",
      color: "#191600",
      border: "1px solid #e0e0e0",
      marginTop: 8,
      fontWeight: 600,
      padding: 0,
    },
  },
] as const;
