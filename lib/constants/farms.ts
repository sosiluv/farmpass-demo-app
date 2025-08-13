export const PAGE_HEADER = {
  FARMS_PAGE_TITLE: "농장 관리",
  FARMS_PAGE_DESCRIPTION: "등록된 농장을 관리하고 QR 코드를 생성하세요",

  MEMBERS_PAGE_TITLE: "구성원 관리",
  MEMBERS_PAGE_DESCRIPTION:
    "{farmName} 농장의 구성원을 관리하고 권한을 설정하세요",

  FARM_VISITORS_PAGE_TITLE: "방문자 기록",
  FARM_VISITORS_PAGE_DESCRIPTION: "방문자 기록을 조회하고 관리합니다.",

  FARM_VISITORS_TITLE: "{farmName} 방문자 기록",
  FARM_VISITORS_DETAILED_DESCRIPTION:
    "{farmName}의 방문자 기록을 조회하고 관리합니다.",

  ADD_MEMBER_TITLE: "구성원 추가",
  ADD_MEMBER_DESCRIPTION: "추가할 구성원의 이메일과 권한을 입력하세요.",

  EDIT_FARM_TITLE: "농장 수정",
  EDIT_FARM_DESCRIPTION: "농장 정보를 수정하세요",
  ADD_FARM_TITLE: "새 농장 등록",
  ADD_FARM_DESCRIPTION: "새로운 농장을 등록하세요",
} as const;

export const BUTTONS = {
  EDIT_BUTTON: "수정",
  EDITING_LOADING: "수정 중...",
  REGISTER_BUTTON: "등록",
  REGISTERING_LOADING: "등록 중...",
  DELETE_BUTTON: "삭제",
  DELETE_FARM_LOADING: "삭제 중...",
  ADD_FIRST_FARM: "첫 농장 등록하기",
  ADD_FARM_BUTTON: "농장 추가",
  CANCEL_BUTTON: "취소",
  QR_CODE_DOWNLOAD: "QR 코드 다운로드",
  QR_CODE_SHARE: "QR 코드 공유",
  QR_CODE_COPY: "URL 복사",
  QR_CODE_COPY_SUCCESS: "복사됨!",
  QR_CODE_OPEN_LINK: "링크 열기",

  ADD_MEMBER: "구성원 추가",
  ADD_MEMBER_SHORT: "추가",
  QR_CODE_BUTTON: "QR코드",
  MEMBERS_BUTTON: "구성원",
} as const;

// 라벨
export const LABELS = {
  FARM_NAME: "농장명",
  FARM_TYPE: "농장 유형",
  FARM_ADDRESS: "농장 주소",
  FARM_DETAILED_ADDRESS: "상세 주소",
  MANAGER_NAME: "관리자명",
  MANAGER_PHONE: "관리자 연락처",
  DESCRIPTION: "농장 설명",
  FARM_MANAGEMENT: "농장 관리",
  LOADING: "로딩 중...",

  // 구성원 추가
  MEMBER_EMAIL: "이메일",
  MEMBER_ROLE: "역할",

  // 농장 목록
  UNASSIGNED: "미지정",
  // 소유자 권한 안내
  OWNER_ONLY_PERMISSION: "💡 소유자만 수정/삭제 가능",
  // 검색 관련
  NO_SEARCH_RESULTS_TITLE: "검색 결과가 없습니다",
  NO_SEARCH_RESULTS_DESCRIPTION: "'{searchTerm}'에 해당하는 농장이 없습니다",
  // 농장 카드
  MANAGER_LABEL: "관리자:",
  // 농장 액션
  MEMBERS: "구성원",

  EDIT_FARM_TOOLTIP: "농장 정보 수정",
  DELETE_FARM_TOOLTIP: "농장 삭제",
  // 구성원 관리
  REMOVE_MEMBER_TITLE: "구성원 제거",
  REMOVE_MEMBER_DESCRIPTION:
    "정말로 이 구성원을 제거하시겠습니까? 이 작업은 되돌릴 수 없습니다.",

  NO_MEMBERS: "멤버 없음",
  MEMBERS_COUNT: "구성원 {count}명",
  ADD_MEMBERS_SUGGESTION: "구성원을 추가해보세요",
  FARM_OWNER: "(농장 소유자)",
  NO_REGISTERED_MEMBERS: "등록된 구성원이 없습니다",
  NO_MEMBERS_DESCRIPTION:
    "위의 구성원 추가 버튼을 클릭하여 새로운 구성원을 추가하세요.",
  OWNER_EMOJI: "🛡️",
  MANAGER_EMOJI: "👨‍💼",
  VIEWER_EMOJI: "👁️",
  OWNER_TITLE: "소유자",
  MANAGER_TITLE: "관리자",
  VIEWER_TITLE: "조회자",
  // 농장 삭제 확인
  DELETE_FARM_CONFIRM_TITLE: "농장 삭제 확인",
  DELETE_FARM_CONFIRM_DESCRIPTION: "정말로 이 농장을 삭제하시겠습니까?",

  // 빈 농장 상태
  NO_REGISTERED_FARMS: "등록된 농장이 없습니다",
  NO_FARMS_DESCRIPTION: "첫 번째 농장을 등록하여 시작하세요",

  // QR 코드
  QR_CODE_TITLE: "{farmName} QR 코드",
  QR_CODE_DESCRIPTION: "방문자 등록을 위한 QR 코드입니다.",
  QR_CODE_SCAN_INFO: "QR 코드를 스캔하면 방문자 등록 페이지로 이동합니다.",
  QR_CODE_LINK_TITLE: "방문자 등록 링크",
} as const;

// 구성원 역할 옵션
export const MEMBER_ROLE_OPTIONS = [
  {
    value: "manager",
    label: "관리자",
    description: "농장 정보 수정 및 구성원 관리 가능",
  },
  { value: "viewer", label: "조회자", description: "농장 정보 조회만 가능" },
] as const;

// 플레이스홀더
export const PLACEHOLDERS = {
  FARM_NAME: "그린팜 1농장",
  FARM_TYPE: "농장 유형을 선택하세요",
  FARM_ADDRESS: "주소 검색을 통해 주소를 입력해주세요",
  FARM_DETAILED_ADDRESS: "상세 주소를 입력하세요 (예: 101동 1234호)",
  MANAGER_NAME: "이름을 입력하세요",
  MANAGER_PHONE: "하이픈(-) 없이 숫자만 입력해주세요",
  DESCRIPTION: "농장에 대한 설명을 입력하세요",
  // 구성원 추가
  MEMBER_EMAIL_PLACEHOLDER: "이메일 주소 입력 (최소 2글자)",
  MEMBER_ROLE_PLACEHOLDER: "역할을 선택하세요",
  // 검색
  SEARCH: "농장 검색... (농장명, 주소) 입력하세요",
} as const;

// 에러 메시지
export const ERROR_MESSAGES = {
  REQUIRED_FARM_NAME: "농장 이름을 입력해주세요",
  REQUIRED_FARM_ADDRESS: "농장 주소를 검색해주세요",
  REQUIRED_FARM_TYPE: "농장 유형을 선택해주세요",
  REQUIRED_MANAGER_NAME: "관리자 이름을 입력해주세요",
  REQUIRED_MANAGER_PHONE: "관리자 연락처를 입력해주세요",
  INVALID_FARM_TYPE: "올바른 농장 유형을 선택해주세요",
  INVALID_MANAGER_NAME: "관리자 이름은 2자 이상 입력해주세요",
  INVALID_MANAGER_PHONE: "올바른 전화번호 형식(010-XXXX-XXXX)을 입력해주세요",
} as const;
