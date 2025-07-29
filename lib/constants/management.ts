export const PAGE_HEADER = {
  PAGE_TITLE: "시스템 관리",
  PAGE_DESCRIPTION: "사용자, 농장, 시스템 로그 등을 관리합니다",

  FARM_DETAIL_TITLE: "농장 상세 정보",
  FARM_DETAIL_DESCRIPTION: "선택된 농장의 상세 정보를 확인할 수 있습니다.",

  FARMS_EXPORT_TITLE: "농장 데이터 내보내기",
  FARMS_EXPORT_DESCRIPTION: "내보낼 농장 정보를 설정하세요",

  LOGS_EXPORT_TITLE: "시스템 로그 내보내기",
  LOGS_EXPORT_DESCRIPTION: "내보낼 로그 범위와 정보를 설정하세요",

  USERS_EXPORT_TITLE: "사용자 데이터 내보내기",
  USERS_EXPORT_DESCRIPTION: "내보낼 사용자 정보를 설정하세요",

  USER_DETAIL_TITLE: "사용자 상세 정보",
  USER_DETAIL_DESC: "선택된 사용자의 상세 정보를 확인할 수 있습니다.",

  FARM_TYPE_DISTRIBUTION_TITLE: "농장 유형별 분포",
  FARM_TYPE_DISTRIBUTION_DESCRIPTION: "등록된 농장의 유형별 현황",

  REGION_DISTRIBUTION_TITLE: "지역별 농장 분포",
  REGION_DISTRIBUTION_DESCRIPTION: "농장 주소 기반 지역별 현황",

  USER_ROLE_DISTRIBUTION_TITLE: "사용자 역할별 분포",
  USER_ROLE_DISTRIBUTION_DESCRIPTION: "시스템 사용자의 역할별 현황",

  MONTHLY_TRENDS_TITLE: "월별 현황",
  MONTHLY_TRENDS_DESCRIPTION: "최근 4개월간 사용자 및 농장 현황",

  DELETE_OLD_LOGS_CONFIRM_TITLE: "30일 이전 로그 삭제 확인",
  DELETE_ALL_LOGS_CONFIRM_TITLE: "완전 로그 삭제 확인",
} as const;

export const BUTTONS = {
  CSV_EXPORT: "CSV 내보내기",
  RESET: "초기화",
  EXPORTING: "내보내는 중...",
  CANCEL: "취소",
  DELETING: "삭제 중...",
  DELETE: "삭제",

  FARMS_EXPORT_BUTTON: "농장 내보내기",
  LOGS_EXPORT_BUTTON: "로그 내보내기",
  USERS_EXPORT_BUTTON: "사용자 내보내기",

  CLEAR_ALL_FILTERS: "모든 필터 지우기",

  DELETE_OLD_LOGS_30_DAYS: "30일 이전 로그 삭제",
  DELETE_OLD_LOGS_30_DAYS_MOBILE: "30일 전",

  DELETE_ALL_LOGS: "전체 로그 삭제",
  DELETE_ALL_LOGS_MOBILE: "전체 삭제",
  COMPLETE_DELETE: "완전 삭제",

  SELECT_ALL: "전체 선택",
  ALL_CATEGORIES: "전체",

  UNLOCKING: "해제 중...",
  UNLOCK_ACCOUNT: "계정 잠금 해제",
} as const;

// 시스템 관리 페이지 라벨
export const LABELS = {
  TABS: {
    DASHBOARD: "대시보드",
    USERS: "사용자",
    FARMS: "농장",
    LOGS: "로그",
  },
  // 관리 대시보드 차트

  // 차트 데이터 라벨
  FARM_COUNT: "농장 수",
  USER_COUNT: "사용자",
  FARM_COUNT_LABEL: "농장",
  // 차트 상태 메시지
  LOADING_DATA: "데이터를 불러오는 중...",
  NO_REGISTERED_DATA: "등록된 데이터가 없습니다",
  // 내보내기 공통
  DATE_RANGE: "날짜 범위",
  START_DATE: "시작 날짜",
  END_DATE: "종료 날짜",
  FILTER_SETTINGS: "필터 설정",
  EXPORT_OPTIONS: "내보내기 옵션",
  INCLUDED_INFO: "포함할 정보",
  SELECTED_COUNT: "{selectedCount}/{totalCount}개 선택",
  SELECTED_COUNT_SIMPLE: "{count}개 선택",
  EXPORT_SUMMARY:
    "내보내기 요약: 총 {totalCount}개의 {itemType} 중 {selectedCount}개 정보 유형이 포함됩니다.",

  // 농장 내보내기
  FARM_TYPE: "농장 유형",
  ALL_TYPES: "모든 유형",
  STATUS: "상태",
  ALL_STATUS: "모든 상태",
  ACTIVE: "활성",
  INACTIVE: "비활성",
  BASIC_INFO: "기본 정보",
  BASIC_INFO_DESC: "농장명, 유형, 등록일",
  CONTACT_INFO: "연락처 정보",
  CONTACT_INFO_DESC: "소유자, 관리자, 연락처",
  LOCATION_INFO: "위치 정보",
  LOCATION_INFO_DESC: "주소, 지역",
  MEMBER_INFO: "구성원 정보",
  MEMBER_INFO_DESC: "구성원 수",
  STATS_INFO: "통계 정보",
  STATS_INFO_DESC: "방문자 수, 상태",
  // 사용자 내보내기

  ACCOUNT_TYPE: "계정 유형",
  ALL_ACCOUNTS: "모든 계정",
  ADMIN: "관리자",
  GENERAL_USER: "일반 사용자",
  ACTIVITY_INFO: "활동 정보",
  ACTIVITY_INFO_DESC: "마지막 로그인, 활동 기록",
  FARM_INFO: "농장 정보",
  FARM_INFO_DESC: "소속 농장, 권한",

  // 사용자 내보내기 추가
  BASIC_INFO_DESCRIPTION: "이름, 이메일, 계정 타입",
  CONTACT_INFO_DESCRIPTION: "전화번호, 주소",
  ACTIVITY_INFO_DESCRIPTION: "마지막 로그인, 활동 기록",
  FARM_INFO_DESCRIPTION: "소속 농장, 권한",
  PERMISSIONS_INFO: "권한 정보",
  PERMISSIONS_INFO_DESCRIPTION: "세부 권한 설정",
  // 로그 내보내기

  LOG_LEVEL: "로그 레벨",
  ALL_LEVELS: "모든 레벨",
  INFO: "정보",
  WARN: "경고",
  ERROR: "오류",
  DEBUG: "디버그",
  SUCCESS: "성공",
  CATEGORY: "카테고리",
  USER_INFO: "사용자 정보",
  USER_INFO_DESC: "이메일, IP 주소",
  SYSTEM_INFO: "시스템 정보",
  SYSTEM_INFO_DESC: "레벨, 카테고리",
  METADATA: "메타데이터",
  METADATA_DESC: "상세 정보, 컨텍스트",
  // 농장 관리

  OWNER_INFO: "소유자 정보",
  MANAGER_INFO: "관리자 정보",
  NO_INFO: "정보 없음",
  REGISTRATION_DATE: "등록일",
  MEMBERS: "구성원",
  FARM_DESCRIPTION: "농장 설명",
  DETAIL_INFO_VIEW: "상세 정보 보기",
  // 농장 필터

  SUSPENDED: "정지",
  // 농장 목록
  UNASSIGNED: "미지정",
  // 로그 관리
  LOG_DETAIL_TITLE: "로그 상세 정보",
  LOG_DETAIL_DESCRIPTION:
    "선택된 시스템 로그의 상세 정보를 확인할 수 있습니다.",
  RESOURCE_INFO: "리소스 정보",
  ADDITIONAL_INFO: "추가 정보",
  EMAIL: "이메일:",
  IP_ADDRESS: "IP 주소:",
  USER_AGENT: "User Agent:",
  RESOURCE_TYPE: "리소스 유형:",
  RESOURCE_ID: "리소스 ID:",
  // 로그 필터

  CATEGORY_FILTER: "카테고리 필터",

  SELECTED_CATEGORIES: "선택된 카테고리: {categories}",
  SELECTED_LEVELS: "선택된 레벨: {levels}",
  CATEGORY_COUNT: "{count}개 카테고리",
  // 로그 필터 상태
  ACTIVE_FILTERS: "활성 필터:",
  SEARCH_FILTER: '검색: "{searchTerm}"',

  // 로그 목록
  NO_LOGS: "로그가 없습니다.",
  DELETE_LOG: "로그 삭제",
  SYSTEM_LABEL: "시스템",
  // 로그 카테고리 라벨
  LOG_CATEGORY_LABELS: {
    auth: "인증",
    farm: "농장",
    member: "구성원",
    visitor: "방문자",
    system: "기타",
    settings: "설정",
    security: "보안",
    performance: "성능",
    error: "에러",
    profile: "프로필",
    system_log: "시스템 로그",
    user_activity: "사용자 활동",
  },
  // 사용자 필터

  ALL_USERS: "전체",
  // 관리 대시보드
  TOTAL_USERS: "전체 사용자",
  TOTAL_FARMS: "전체 농장",
  TOTAL_VISITORS: "총 방문자",
  SYSTEM_LOGS: "시스템 로그",
  TOTAL_USERS_DESC: "시스템 전체 사용자 수",
  TOTAL_FARMS_DESC: "등록된 농장 수",
  TOTAL_VISITORS_DESC: "전체 방문자 수",
  SYSTEM_LOGS_DESC: "시스템 활동 로그",
  // 최근 활동
  RECENT_ACTIVITIES: "최근 활동",
  RECENT_ACTIVITIES_DESC: "최근 시스템 활동 내역",
  NO_RECENT_ACTIVITIES: "최근 활동이 없습니다.",
  // 시스템 사용량
  SYSTEM_ACTIVITY_SUMMARY: "시스템 활동 요약",
  SYSTEM_ACTIVITY_SUMMARY_DESC: "오늘의 주요 활동 현황",
  NO_DATA: "데이터가 없습니다",
  // 시스템 상태
  ERROR_REPORTED: "오류 보고됨",
  NO_ERROR: "오류 없음",
  INSPECTION_NEEDED: "점검 필요",
  NORMAL_OPERATION: "정상 작동",
  QR_SCAN_ACTIVE: "QR 스캔 동작",
  RECENT_ACTIVITY: "최근 활동",

  // 농장 내보내기 CSV 컬럼
  FARM_NAME_CSV: "농장명",
  FARM_TYPE_CSV: "농장유형",
  REGISTRATION_DATE_CSV: "등록일",
  FARM_ADDRESS_CSV: "농장주소",
  MANAGER_CSV: "담당자",
  MEMBER_COUNT: "구성원수",
  VISITOR_COUNT: "방문자수",
  STATUS_CSV: "상태",
  REGION: "지역",
  DETAILED_ADDRESS: "상세주소",
  ACTIVE_CSV: "활성",
  INACTIVE_CSV: "비활성",
  NO_DATA_CSV: "-",
  // 로그 관리
  NO_LOGS_TO_DISPLAY: "표시할 로그가 없습니다.",
  ADJUST_FILTERS: "필터를 조정해보세요.",
  // 로그 삭제

  WARNING: "주의:",
  CAUTION: "경고:",
  OLD_LOGS_WARNING: "30일 이전의 모든 시스템 로그가 삭제됩니다.",
  ALL_LOGS_WARNING: "모든 시스템 로그가 완전히 삭제됩니다.",
  DELETED_CONTENT: "삭제될 내용:",
  OLD_LOGS_DELETED: "30일 이전에 생성된 모든 시스템 로그",
  DELETED_LOGS_IRRECOVERABLE: "삭제된 로그는 복구할 수 없습니다",
  ALL_SYSTEM_LOGS: "모든 시스템 로그",
  ALL_USER_ACTIVITY: "모든 사용자 활동 기록",
  ALL_FARM_MANAGEMENT: "모든 농장 관리 기록",
  ALL_SYSTEM_ERRORS: "모든 시스템 오류 기록",
  IRRECOVERABLE_DELETE: "⚠️ 복구 불가능 - 완전 삭제",
  CONFIRM_OLD_LOGS_DELETE: "정말로 30일 이전 시스템 로그를 삭제하시겠습니까?",
  CONFIRM_ALL_LOGS_DELETE: "정말로 모든 시스템 로그를 완전히 삭제하시겠습니까?",
  IRREVERSIBLE_ACTION: "이 작업은 되돌릴 수 없습니다!",

  // 로그 내보내기 CSV 컬럼
  TIME: "시간",
  LEVEL: "레벨",
  ACTION: "액션",
  MESSAGE: "메시지",
  USER: "사용자",
  IP_ADDRESS_CSV: "IP주소",
  CATEGORY_CSV: "카테고리",
  RESOURCE_ID_CSV: "리소스ID",
  BROWSER: "브라우저",
  ADDITIONAL_DATA: "추가데이터",
  SYSTEM_CSV: "시스템",
  UNKNOWN: "UNKNOWN",
  // 로그 레벨 옵션
  LOG_LEVEL_OPTIONS: [
    { value: "all", label: "모든 레벨", icon: "📊" },
    { value: "info", label: "정보", icon: "ℹ️" },
    { value: "warn", label: "경고", icon: "⚠️" },
    { value: "error", label: "오류", icon: "❌" },
    { value: "debug", label: "디버그", icon: "🐛" },
  ],
  // 탭 섹션 헤더
  CORE_STATS: "핵심 통계",
  DETAILED_ANALYSIS: "상세 분석",
  FARM_MANAGEMENT: "농장 관리",
  FARM_MANAGEMENT_DESC: "시스템에 등록된 모든 농장을 관리합니다",
  USER_MANAGEMENT: "사용자 관리",
  USER_MANAGEMENT_DESC: "시스템에 등록된 모든 사용자를 관리합니다",
  SYSTEM_LOGS_TAB: "시스템 로그",
  SYSTEM_LOGS_TAB_DESC: "시스템의 모든 활동과 이벤트를 확인하고 관리합니다",
  // 데이터 표시
  TOTAL_FARMS_COUNT_TAB: "총 {count}개의 농장",
  TOTAL_USERS_COUNT_TAB: "총 {count}명의 사용자",
  TOTAL_LOGS_COUNT: "총 {count}개의 로그 (최근 5,000개 중)",
  LAST_UPDATE_TAB: "마지막 업데이트: {datetime}",
  // 사용자 관리
  SYSTEM_ADMIN_USER: "시스템 관리자",
  GENERAL_USER_DETAIL: "일반 사용자",
  PHONE_NUMBER_USER: "전화번호",
  COMPANY_INSTITUTION: "회사/기관",
  BUSINESS_TYPE: "사업자 유형",
  COMPANY_ADDRESS_USER: "회사 주소",
  LAST_LOGIN: "마지막 로그인:",
  NO_LOGIN_RECORD: "로그인 기록 없음",
  INFO_UPDATE_DATE: "정보 수정일:",
  NO_USER_INFO: "사용자 정보가 없습니다.",

  // 사용자 목록
  NO_USERS: "사용자가 없습니다.",
  LAST_ACCESS: "마지막 접속:",
  VIEW_DETAILS: "상세 정보 보기",
  // 사용자 내보내기 CSV 컬럼
  NAME: "이름",
  EMAIL_CSV: "이메일",
  REGISTRATION_DATE_USER: "가입일",
  PHONE_NUMBER_CSV: "전화번호",
  COMPANY_ADDRESS_CSV: "회사주소",
  LAST_LOGIN_CSV: "마지막로그인",
  ACCOUNT_TYPE_CSV: "계정유형",
  AFFILIATED_FARMS: "소속농장",
  PERMISSION_LEVEL: "권한레벨",
  IS_ADMIN: "관리자여부",
  YES_CSV: "예",
  NO_CSV: "아니오",

  // 단위 표시
  COUNT_UNIT: "{count}건",

  // 권한 확인
  CHECKING_PERMISSION: "권한을 확인하는 중...",
} as const;

export const PLACEHOLDERS = {
  FARM_SEARCH_PLACEHOLDER: "농장명 또는 주소 검색...",
  FARM_TYPE_PLACEHOLDER: "농장 유형",
  STATUS_PLACEHOLDER: "상태",
  LOG_SEARCH_PLACEHOLDER: "로그 검색...",
  USER_SEARCH_PLACEHOLDER: "이름 또는 이메일로 검색...",
  ROLE_PLACEHOLDER: "권한",
  USER_STATUS_PLACEHOLDER: "상태",
} as const;
