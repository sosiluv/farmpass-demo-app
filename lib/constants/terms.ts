export const PAGE_HEADER = {
  PAGE_TITLE: "약관 관리",
  PAGE_DESCRIPTION:
    "개인정보처리방침, 서비스 이용약관, 마케팅 정보 수신 동의를 관리합니다.",

  TERMS_CARD_DESCRIPTION: "약관 내용을 편집하고 관리합니다.",

  // 약관 동의 시트 모드별 제목/설명
  CONSENT_SHEET_TITLE_REGISTER: "회원가입을 위해 동의가 필요해요",
  CONSENT_SHEET_TITLE_RECONSENT: "약관 동의가 필요합니다",
  CONSENT_SHEET_DESC_REGISTER: "서비스 이용을 위한 필수 약관에 동의해주세요",
  CONSENT_SHEET_DESC_RECONSENT: "서비스 이용을 위해 다음 약관에 동의해주세요",
} as const;

export const BUTTONS = {
  SAVE_TEMP: "임시 저장",
  DELETE_TERMS: "약관 삭제",
  ACTIVATE: "활성화",
  DEACTIVATE: "비활성화",
  CREATE_NEW_VERSION: "새 버전 생성",
  SAVING: "저장 중...",
  DELETING: "삭제 중...",
  ACTIVATING: "처리 중...",

  // 약관 동의 시트 버튼
  CONSENT_REGISTER: "동의하고 회원가입하기",
  CONSENT_RECONSENT: "동의하고 계속하기",
  PROCESSING_REGISTER: "회원가입 중...",
  PROCESSING_RECONSENT: "처리 중...",
  TERMS_CONFIRM: "동의하기",

  // 약관 페이지 버튼
  GO_BACK: "뒤로가기",
} as const;

// 약관 관리 페이지 라벨
export const LABELS = {
  // 탭 라벨
  TABS: {
    PRIVACY: "개인정보처리방침",
    PRIVACY_CONSENT: "개인정보 수집 및 이용 동의",
    TERMS: "서비스 이용약관",
    MARKETING: "마케팅 정보 수신 동의",
  },

  // 약관 상태
  STATUS_ACTIVE: "활성화됨",
  STATUS_INACTIVE: "비활성화됨",

  // 버전 관리
  VERSION_ACTIVE_SUFFIX: "(활성)",

  // 미리보기 모드
  PREVIEW_MODE: "미리보기 모드",

  // 약관 카드 헤더 동적 함수
  LAST_MODIFIED: (date: Date) => `마지막 수정: ${date.toLocaleDateString()}`,
  PUBLISHED_DATE: (date: Date) => `배포일: ${date.toLocaleDateString()}`,

  // 약관 동의 시트 공통 텍스트
  LOADING_TERMS: "약관을 불러오는 중...",
  ALL_CONSENT: "전체 동의하기",
  ALL_CONSENT_DESC: "모든 약관에 동의합니다",
  REQUIRED_TAG: "[필수]",
  OPTIONAL_TAG: "[선택]",
  CONSENT_REQUIRED_MESSAGE: "필수 약관에 동의해주세요",

  // 약관 모달 관련
  MODAL_DESCRIPTION: "약관 내용을 확인하세요",
  TERMS_NOT_AVAILABLE: "약관 내용을 불러올 수 없습니다.",

  // 약관 페이지 래퍼 관련
  TERMS_EFFECTIVE_DATE: "본 약관은 2025년 7월 23일부터 적용됩니다.",

  // 기본 약관 제목 (fallback)
  DEFAULT_PRIVACY_TITLE: "개인정보처리방침",
  DEFAULT_PRIVACY_CONSENT_TITLE: "개인정보 수집 및 이용",
  DEFAULT_TERMS_TITLE: "서비스 이용약관",
  DEFAULT_MARKETING_TITLE: "마케팅 및 이벤트 정보 수신",
  DEFAULT_AGE_CONSENT_TITLE: "만 14세 이상입니다.",
  DEFAULT_TERMS_FALLBACK: "약관",
} as const;

// 플레이스홀더
export const PLACEHOLDERS = {
  VERSION_SELECT: "버전 선택",
} as const;

// 약관 타입별 설정
export const TERM_TYPE_CONFIG = {
  privacy: {
    title: "개인정보처리방침",
    icon: "Shield",
  },
  privacy_consent: {
    title: "개인정보 수집 및 이용 동의",
    icon: "Shield",
  },
  terms: {
    title: "서비스 이용약관",
    icon: "FileText",
  },
  marketing: {
    title: "마케팅 정보 수신 동의",
    icon: "Mail",
  },
  age_consent: {
    title: "만 14세 이상입니다.",
    icon: "UserCheck",
  },
} as const;

export const TERM_CONFIGS = [
  {
    type: "age_consent" as const,
    isRequired: true,
    hasViewOption: false,
    order: 1,
  },
  {
    type: "privacy_consent" as const,
    isRequired: true,
    hasViewOption: true,
    order: 2,
  },
  { type: "terms" as const, isRequired: true, hasViewOption: true, order: 3 },
  {
    type: "marketing" as const,
    isRequired: false,
    hasViewOption: true,
    order: 4,
  },
] as const;
