export const AUTH_LABELS = {
  EMAIL: "아이디(이메일)",
  NAME: "이름",
  PASSWORD: "비밀번호",
  CONFIRM_PASSWORD: "비밀번호 확인",
  CURRENT_PASSWORD: "현재 비밀번호",
  PHONE: "휴대폰 번호",
};

export const AUTH_PLACEHOLDERS = {
  EMAIL: "name@example.com",
  NAME: "홍길동",
  PASSWORD: "비밀번호를 입력하세요",
  CONFIRM_PASSWORD: "비밀번호를 다시 입력하세요",
  CURRENT_PASSWORD: "현재 비밀번호를 입력하세요",
  PHONE: "010-0000-0000",
};

export const AUTH_ERROR_MESSAGES = {
  REQUIRED_EMAIL: "이메일을 입력해주세요",
  INVALID_EMAIL: "유효한 이메일 주소를 입력해주세요",
  REQUIRED_NAME: "이름을 입력해주세요",
  INVALID_NAME: "이름은 2자 이상 50자 이하여야 합니다",
  REQUIRED_PASSWORD: "비밀번호를 입력해주세요",
  PASSWORD_MISMATCH: "비밀번호가 일치하지 않습니다",
  REQUIRED_PHONE: "전화번호를 입력해주세요",
  INVALID_PHONE: "올바른 전화번호 형식(010-XXXX-XXXX)을 입력해주세요",
  PASSWORD_MIN_LENGTH: "비밀번호는 최소 6자 이상이어야 합니다",
  REQUIRED_CURRENT_PASSWORD: "현재 비밀번호를 입력해주세요",
};

export const AUTH_GUIDE_MESSAGES = {
  SIGNUP_TITLE: "회원가입",
  SIGNUP_DESCRIPTION: "농장 출입 관리 시스템에 가입하세요",
  LOGIN_TITLE: "로그인",
  LOGIN_DESCRIPTION: "농장 출입 관리 시스템에 로그인하세요",
  ALREADY_HAVE_ACCOUNT: "이미 계정이 있으신가요?",
  GO_LOGIN: "로그인",
  GO_SIGNUP: "회원가입",
};

export const AUTH_SERVER_ERROR_MESSAGES = {
  NETWORK: "회원가입 요청이 실패했습니다. 네트워크 상태를 확인해주세요.",
  DB: "프로필 생성 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.",
  SECURITY: "보안을 위해 잠시 후에 다시 시도해주세요. (약 40초 후)",
  DUPLICATE: "이미 등록된 이메일입니다.",
  UNKNOWN: "회원가입 중 오류가 발생했습니다. 다시 시도해주세요.",
};

export const AUTH_AUTH_ERROR_MESSAGES = {
  ACCOUNT_LOCKED:
    "계정이 잠겼습니다. 관리자에게 문의하거나 잠시 후 다시 시도해주세요.",
  TOO_MANY_REQUESTS:
    "너무 많은 로그인 시도가 있었습니다. 잠시 후 다시 시도해주세요.",
  PASSWORD_SAME: "이전 비밀번호와 동일한 비밀번호로 변경할 수 없습니다.",
  SESSION_EXPIRED: "세션이 만료되었습니다. 다시 시도해주세요.",
  PASSWORD_RULE:
    "비밀번호는 최소 8자 이상이어야 하며, 영문, 숫자, 특수문자를 포함해야 합니다.",
  INVALID_CREDENTIALS: "인증에 실패했습니다. 다시 시도해주세요.",
  TOKEN_EXPIRED:
    "비밀번호 재설정 링크가 만료되었거나 유효하지 않습니다. 새로운 링크를 요청해주세요.",
  TOKEN_USED:
    "이미 사용된 비밀번호 재설정 링크입니다. 새로운 링크를 요청해주세요.",
  EMAIL_NOT_CONFIRMED: "이메일 인증이 필요합니다. 이메일을 확인해주세요.",
  AUTH_ERROR: "인증 처리 중 오류가 발생했습니다. 다시 시도해주세요.",
  DEFAULT: "처리 중 오류가 발생했습니다. 다시 시도해주세요.",
};
