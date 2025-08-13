export const PAGE_HEADER = {
  PAGE_TITLE: "계정 관리",
  PAGE_DESCRIPTION: "개인 정보 및 회사 정보를 관리하세요",

  COMPANY_INFO_TITLE: "회사 정보",
  COMPANY_INFO_DESCRIPTION: "회사 및 농장 정보를 관리합니다",

  LOGIN_ACTIVITY_TITLE: "로그인 활동",
  LOGIN_ACTIVITY_DESCRIPTION: "최근 로그인 기록과 계정 활동을 확인합니다.",

  PASSWORD_CHANGE_TITLE: "비밀번호 변경",
  PASSWORD_CHANGE_DESCRIPTION:
    "계정 보안을 위해 정기적으로 비밀번호를 변경하세요.",

  PROFILE_INFO_TITLE: "개인 정보",
  PROFILE_INFO_DESCRIPTION: "개인 프로필 정보를 관리합니다",

  WITHDRAW_TITLE: "회원탈퇴",
  WITHDRAW_DESCRIPTION:
    "회원탈퇴 시 계정 및 모든 데이터가 영구적으로 삭제되며 복구할 수 없습니다.",

  // 소셜 연동 섹션
  SOCIAL_LINKING_TITLE: "소셜 계정 연동",
  SOCIAL_LINKING_DESCRIPTION:
    "다양한 소셜 계정을 연동하여 편리하게 로그인하세요",

  // 개인정보 섹션
  PRIVACY_MARKETING_TITLE: "마케팅 정보 수신",
  PRIVACY_MARKETING_DESCRIPTION:
    "농장 관리에 도움이 되는 유용한 정보와 서비스 업데이트를 받아보실 수 있습니다.",
  PRIVACY_STATUS_TITLE: "개인정보 처리 현황",
  PRIVACY_STATUS_DESCRIPTION:
    "현재 동의하신 개인정보 처리 내역을 확인하실 수 있습니다.",
} as const;

export const BUTTONS = {
  SAVE_COMPANY_INFO: "회사 정보 저장",
  SAVE_PROFILE_INFO: "프로필 정보 저장",
  SAVING: "저장 중...",
  CHANGE_PASSWORD: "비밀번호 변경",
  CHANGING: "변경 중...",
  WITHDRAW: "회원탈퇴",
  WITHDRAWING: "탈퇴 중...",
  WITHDRAW_CONFIRM: "탈퇴하기",
  WITHDRAW_CANCEL: "취소",

  // 소셜 연동 버튼
  LINK_ACCOUNT: "연동하기",
  LINK_ACCOUNT_MOBILE: "연동",
  UNLINK_ACCOUNT: "연동 해제",
  UNLINK_ACCOUNT_MOBILE: "해제",
} as const;

// 계정 관리 페이지 라벨
export const LABELS = {
  // 회사 정보 섹션
  COMPANY_NAME: "회사명",
  BUSINESS_TYPE: "업종",
  COMPANY_ADDRESS: "회사 주소",
  ESTABLISHMENT_DATE: "설립일",
  EMPLOYEE_COUNT: "직원 수",
  COMPANY_WEBSITE: "웹사이트",
  COMPANY_DESCRIPTION: "회사 소개",
  // 비밀번호 섹션
  CURRENT_PASSWORD: "현재 비밀번호",

  // 프로필 섹션
  PROFILE_PHOTO: "프로필 사진",
  NAME: "이름",
  EMAIL: "이메일",
  PHONE_NUMBER: "휴대폰 번호",
  POSITION: "직책",
  DEPARTMENT: "부서",
  BIO: "자기소개",
  EMAIL_CHANGE_DISABLED: "이메일은 보안상 변경할 수 없습니다.",
  // 탭 라벨
  TABS: {
    PROFILE: "프로필",
    COMPANY: "회사 정보",
    SECURITY: "보안",
    PRIVACY: "개인정보",
  },
  // 로그인 활동
  CURRENT_SESSION: "현재 세션",
  CURRENT_LOCATION: "현재 위치",
  NOW: "지금",
  UNKNOWN_LOCATION: "알 수 없음",
  NO_RECORD: "기록 없음",
  LAST_LOGIN: "마지막 로그인",
  PASSWORD_CHANGE: "비밀번호 변경",
  LOGIN_COUNT: "로그인 횟수",
  ACCOUNT_STATUS: "계정 상태",
  ACTIVE: "활성화",
  INACTIVE: "비활성화",
  WITHDRAW_DIALOG_TITLE: "회원탈퇴",
  WITHDRAW_DIALOG_DESC: "정말로 회원탈퇴 하시겠습니까?",
  WITHDRAW_ACCOUNT: "계정",

  // 소셜 로그인
  SOCIAL_LOGIN_ACCOUNT: "소셜 로그인 계정",
  SOCIAL_PASSWORD_CHANGE_GUIDE:
    "소셜 로그인 계정의 비밀번호는 해당 서비스에서 변경하세요.",
  SECURITY_INFO_MANAGED: "보안 정보는 해당 서비스에서 관리됩니다",

  // 소셜 연동 섹션
  ACCOUNT_LINKING_MANAGEMENT: "계정 연동 관리",
  LINKED: "연동됨",
  LINKING_DATE: "연동일",
  EMAIL_INFO_UNAVAILABLE: "이메일 정보 없음",
  LOADING_ACCOUNT_INFO: "계정 정보를 불러오는 중...",
  MIN_LOGIN_METHOD_WARNING: "최소 1개의 로그인 방법을 유지해야 합니다",
  MIN_LOGIN_METHOD_DESCRIPTION:
    "다른 계정을 연동한 후에 현재 계정을 해제할 수 있습니다.",

  // 개인정보 섹션
  MARKETING_CONSENT: "마케팅 정보 수신 동의",
  MARKETING_CONSENT_DESCRIPTION:
    "새로운 기능, 이벤트, 유용한 농장 관리 팁 등을 이메일로 받아보세요.",
  MARKETING_CONSENT_OPTIONAL: "선택사항입니다",
  MARKETING_CONSENT_OPTIONAL_DESC:
    "이 동의를 거부하셔도 서비스 이용에 제한이 없으며, 언제든지 변경하실 수 있습니다.",
  CONSENT_REQUIRED: "필수",
  CONSENT_OPTIONAL: "선택",
  CONSENT_AGREED: "동의",
  CONSENT_DATE: (date?: string) =>
    date ? `동의일: ${new Date(date).toLocaleDateString()}` : "동의일: -",
  NO_CONSENT_RECORDS: "동의 내역이 없습니다.",
} as const;

// 플레이스홀더
export const PLACEHOLDERS = {
  BUSINESS_TYPE_SELECT: "업종 선택",
  EMPLOYEE_COUNT_SELECT: "직원 수 선택",
  COMPANY_NAME: "회사명을 입력하세요",
  COMPANY_ADDRESS: "주소 검색을 통해 주소를 입력해주세요",
  COMPANY_WEBSITE: "https://example.com",
  COMPANY_DESCRIPTION: "회사 및 농장에 대한 간단한 소개를 입력하세요",
  // 비밀번호 섹션
  CURRENT_PASSWORD_PLACEHOLDER: "현재 비밀번호를 입력하세요",
  // 프로필 섹션
  EMAIL: "name@example.com",
  NAME: "이름을 입력하세요",
  PHONE_NUMBER: "하이픈(-) 없이 숫자만 입력해주세요",
  POSITION: "직책을 선택하세요",
  DEPARTMENT: "부서명을 입력하세요",
  BIO: "자기소개를 입력하세요",
} as const;

// 소셜 로그인 메시지
export const SOCIAL_LOGIN_MESSAGES = {
  GOOGLE_LOGIN: "Google 계정으로 로그인하셨습니다.",
  KAKAO_LOGIN: "카카오 계정으로 로그인하셨습니다.",
  OTHER_LOGIN: (provider: string) => `${provider} 계정으로 로그인하셨습니다.`,
} as const;

// 직원 수 옵션
export const EMPLOYEE_COUNT_OPTIONS = [
  { value: "10", label: "1-10명" },
  { value: "50", label: "10-50명" },
  { value: "100", label: "50-100명" },
  { value: "500", label: "100명 이상" },
] as const;

// 업종 옵션
export const BUSINESS_TYPE_OPTIONS = [
  { value: "축산업", label: "축산업" },
  { value: "농업", label: "농업" },
  { value: "원예업", label: "원예업" },
  { value: "수산업", label: "수산업" },
  { value: "기타", label: "기타" },
] as const;

// 프로필 섹션
export const POSITION_OPTIONS = [
  { value: "대표", label: "대표" },
  { value: "관리자", label: "관리자" },
  { value: "직원", label: "직원" },
  { value: "방역담당자", label: "방역담당자" },
] as const;

export const SOCIAL_PROVIDERS: Array<{
  id: string;
  name: string;
  iconSrc?: string;
  color: string;
  description: string;
}> = [
  // {
  //   id: "email",
  //   name: "이메일",
  //   iconSrc: "/btn_mail.svg",
  //   color: "bg-blue-50 text-blue-600 border-blue-200",
  //   description: "이메일/비밀번호로 로그인",
  // },
  {
    id: "google",
    name: "Google",
    iconSrc: "/btn_google.svg",
    color: "bg-white border-gray-200",
    description: "Google 계정으로 로그인",
  },
  {
    id: "kakao",
    name: "Kakao",
    iconSrc: "/btn_kakao.svg",
    color: "bg-yellow-50 border-yellow-200",
    description: "카카오 계정으로 로그인",
  },
];
