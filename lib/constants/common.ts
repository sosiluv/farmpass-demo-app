export const BUTTONS = {
  ADDRESS_SEARCH_RESEARCH: "주소 다시 검색",
  ADDRESS_SEARCH_CONFIRM: "확인",
  IMAGE_PREVIEW_CLOSE: "닫기",

  INSTALL_GUIDE_BUTTON_TEXT: "앱 설치 가이드",
  INSTALL_PROMPT_INSTALLING: "설치 중...",
  INSTALL_PROMPT_INSTALL: "설치",

  LAYOUT_ADD_NEW_FARM: "새 농장 추가",
  LAYOUT_GO_TO_DASHBOARD: "대시보드로 이동",
  LAYOUT_LOGOUT: "로그아웃",
  LAYOUT_LOGOUT_LOADING: "로그아웃 중...",

  LAYOUT_ALL_VISITORS_STATUS: "전체 방문자 현황",
  LAYOUT_VISITORS_STATUS: "방문자 현황",
  LAYOUT_FARM_REGISTRATION_NEEDED: "농장 등록 필요",

  MOBILE_MENU_CLOSE: "메뉴 닫기",
  MOBILE_MENU_OPEN: "메뉴 열기",

  // quick-action-buttons.tsx
  QUICK_ACTION_CHANGE_PERMISSION: "권한 변경",
  QUICK_ACTION_CHANGE_TO_MANAGER: "관리자로 변경",
  QUICK_ACTION_CHANGE_TO_VIEWER: "조회자로 변경",
  QUICK_ACTION_DELETE: "삭제",

  PAGINATION_LOADING: "로딩 중...",
  PAGINATION_LOAD_MORE: "더보기 ({remaining}개 남음)",
  PAGINATION_DISPLAY_COUNT: "{current} / {total}개 표시",
  PAGINATION_PAGE_RANGE: "{start}-{end} / {total}개",

  THEME_TOGGLE_SCREEN_READER: "테마 전환",
  PROFILE_MENU_SCREEN_READER: "사용자 프로필 메뉴",

  ADDRESS_SEARCH_BUTTON: "주소 검색",

  REFRESH_BUTTON: "새로고침",

  // 알림 관련
  NOTIFICATION_LOAD_MORE: "더보기",
  NOTIFICATION_LOADING: "로딩 중...",
  NOTIFICATION_MARK_ALL_READ: "모두 읽음 처리",
  NOTIFICATION_DELETE_ALL: "전체 삭제",

  // 프로필 설정 관련
  PROFILE_SETUP_GO_BACK: "로그인 페이지로 돌아가기",
  PROFILE_SETUP_NEXT: "다음",
  PROFILE_SETUP_CONSENT_TERMS: "약관 동의하기",
  PROFILE_SETUP_PROCESSING: "처리 중...",
  PROFILE_SETUP_SAVING: "저장 중...",
} as const;

// 헤더 메뉴 상수
export const HEADER_MENU = {
  MY_PROFILE: "내 프로필",
  PASSWORD_CHANGE: "비밀번호 변경",
  COMPANY_INFO: "회사 정보",
  MENU: "메뉴",
} as const;

// Footer 상수
export const FOOTER = {
  BADGES: {
    MOBILE_OPTIMIZED: "모바일 최적화",
    QR_CODE_SUPPORT: "QR 코드 지원",
    REAL_TIME_NOTIFICATION: "실시간 알림",
  },
  LINKS: {
    COMPANY_INTRO: "회사소개",
    LOCATION: "오시는길",
    TERMS_OF_SERVICE: "이용약관",
    PRIVACY_POLICY: "개인정보처리방침",
  },
  COMPANY_INFO: {
    PHONE: "대표전화 : 054-843-1141",
    FAX: "팩스 : 054-855-9398",
    ADDRESS: "주소 : 경상북도 안동시 풍산읍 괴정2길 106-23 주101~104동",
    COPYRIGHT: "Copyright. © {year} SWKorea All rights reserved.",
  },
  URLS: {
    COMPANY_INTRO: "http://www.swkukorea.com/theme/sample60/html/a1.php",
    LOCATION: "http://www.swkukorea.com/theme/sample60/html/a5.php",
    TERMS: "/terms",
    PRIVACY: "/privacy",
  },
} as const;

// 소셜 링크 상수
export const SOCIAL_LINKS = [
  {
    href: "http://pf.kakao.com/_fQFhG",
    title: "카카오톡 채널",
    src: "/btn_kakao_ch.svg",
    alt: "카카오톡 채널",
  },
  {
    href: "https://blog.naver.com/k331502",
    title: "블로그",
    src: "/btn_blog.svg",
    alt: "블로그",
  },
  {
    href: "mailto:k331502@nate.com",
    title: "이메일",
    src: "/btn_mail.svg",
    alt: "이메일",
  },
  {
    href: "http://www.swkukorea.com/",
    title: "홈페이지",
    src: "/btn_homepage.svg",
    alt: "홈페이지",
  },
] as const;

// 공통 컴포넌트 라벨
export const LABELS = {
  // 주소 검색 라벨
  ADDRESS_SEARCH_TITLE: "주소 검색",
  ADDRESS_SEARCH_DESCRIPTION:
    "도로명 주소나 지번 주소로 검색하여 정확한 주소를 입력해주세요.",

  ADDRESS_SEARCH_BASIC_ADDRESS: "기본 주소",
  ADDRESS_SEARCH_DETAILED_ADDRESS: "상세 주소",

  ADDRESS_SEARCH_LOADING: "주소 검색 서비스를 불러오는 중...",
  // 이미지 미리보기 라벨
  IMAGE_PREVIEW_TITLE: "이미지 미리보기",
  IMAGE_PREVIEW_DESCRIPTION: "이미지를 확대하여 자세히 볼 수 있습니다.",
  // 차트 라벨
  CHART_VISITOR_COUNT: "방문자 수",
  CHART_DAILY_AVERAGE: "일평균",
  CHART_OTHER: "기타",
  // 차트 빈 데이터 메시지
  CHART_NO_PURPOSE_DATA: "방문 목적별 데이터가 없습니다.",
  CHART_NO_REGION_DATA: "지역별 방문자 데이터가 없습니다.",
  CHART_NO_TIME_DATA: "시간대별 방문자 데이터가 없습니다.",
  CHART_NO_TREND_DATA: "방문자 추이 데이터가 없습니다.",

  LAYOUT_MANAGEMENT_MENU: "관리 메뉴",
  LAYOUT_FARM_QUICK_ACCESS: "농장별 바로가기",
  LAYOUT_QUICK_ACTIONS: "빠른 액션",

  LAYOUT_FARM_NEEDED: "농장 필요",
  LAYOUT_CURRENT_LOGIN: "현재 로그인",
  LAYOUT_LOGIN_REQUIRED: "로그인 필요",
  LAYOUT_LOGIN_NEEDED: "로그인이 필요합니다",

  // 모바일 메뉴 버튼 라벨

  // 페이지 헤더 라벨
  PAGE_HEADER_DASHBOARD: "대시보드",

  // 비밀번호 강도
  PASSWORD_STRENGTH_VERY_WEAK: "매우 취약",
  PASSWORD_STRENGTH_WEAK: "취약",
  PASSWORD_STRENGTH_NORMAL: "보통",
  PASSWORD_STRENGTH_STRONG: "강력",
  PASSWORD_STRENGTH_VERY_STRONG: "매우 강력",
  PASSWORD_STRENGTH_LENGTH_LABEL: "{minLength}자 이상",
  PASSWORD_STRENGTH_LENGTH_SHORT: "{minLength}+",
  PASSWORD_STRENGTH_NUMBER_LABEL: "숫자 포함",
  PASSWORD_STRENGTH_NUMBER_SHORT: "123",
  PASSWORD_STRENGTH_UPPERCASE_LABEL: "대문자 포함",
  PASSWORD_STRENGTH_UPPERCASE_SHORT: "ABC",
  PASSWORD_STRENGTH_LOWERCASE_LABEL: "소문자 포함",
  PASSWORD_STRENGTH_LOWERCASE_SHORT: "abc",
  PASSWORD_STRENGTH_SPECIAL_LABEL: "특수문자 포함",
  PASSWORD_STRENGTH_SPECIAL_SHORT: "#@!",
  PASSWORD_STRENGTH_OPTIONAL: " (선택)",

  // 역할 배지
  ROLE_BADGE_OWNER_LABEL: "농장 소유자",
  ROLE_BADGE_OWNER_SHORT: "소유자",
  ROLE_BADGE_OWNER_MOBILE: "소유자",
  ROLE_BADGE_MANAGER_LABEL: "농장 관리자",
  ROLE_BADGE_MANAGER_SHORT: "관리자",
  ROLE_BADGE_MANAGER_MOBILE: "관리자",
  ROLE_BADGE_VIEWER_LABEL: "조회 전용",
  ROLE_BADGE_VIEWER_SHORT: "조회자",
  ROLE_BADGE_VIEWER_MOBILE: "조회",

  // InstallGuide - OtherPlatformsCard
  INSTALL_GUIDE_OTHER_PLATFORMS_TITLE: "다른 플랫폼 가이드",
  INSTALL_GUIDE_TAB_IOS: "iOS",
  INSTALL_GUIDE_TAB_ANDROID: "Android",
  INSTALL_GUIDE_TAB_SAMSUNG: "Samsung",
  INSTALL_GUIDE_TAB_DESKTOP: "Desktop",

  // InstallGuide - PlatformGuideCard
  INSTALL_GUIDE_AUTO_BANNER: "자동 배너",
  INSTALL_GUIDE_MANUAL_INSTALL: "수동 설치",

  // InstallGuide - TipsCard
  INSTALL_GUIDE_TIPS_TITLE: "유용한 팁",

  // InstallGuide - InstallStepsCard
  INSTALL_GUIDE_STEPS_TITLE: "설치 단계",

  // InstallGuide - Platform Data
  INSTALL_GUIDE_PLATFORM_IOS_SAFARI: "iOS Safari",
  INSTALL_GUIDE_PLATFORM_ANDROID_CHROME: "Android Chrome",
  INSTALL_GUIDE_PLATFORM_SAMSUNG_INTERNET: "Android Samsung Internet",
  INSTALL_GUIDE_PLATFORM_DESKTOP_CHROME: "Desktop Chrome",

  // InstallGuide - iOS Safari Steps
  INSTALL_GUIDE_IOS_STEP1_TITLE: "공유 버튼 탭",
  INSTALL_GUIDE_IOS_STEP1_DESC: "Safari 하단의 공유 버튼(□↑)을 탭하세요",
  INSTALL_GUIDE_IOS_STEP2_TITLE: "홈 화면에 추가 선택",
  INSTALL_GUIDE_IOS_STEP2_DESC: "공유 메뉴에서 '홈 화면에 추가'를 선택하세요",
  INSTALL_GUIDE_IOS_STEP3_TITLE: "추가 완료",
  INSTALL_GUIDE_IOS_STEP3_DESC: "이름을 확인하고 '추가'를 탭하면 완료됩니다",

  // InstallGuide - Android Chrome Steps
  INSTALL_GUIDE_ANDROID_STEP1_TITLE: "설치 배너 확인",
  INSTALL_GUIDE_ANDROID_STEP1_DESC:
    "주소창 아래에 나타나는 설치 배너를 확인하세요",
  INSTALL_GUIDE_ANDROID_STEP2_TITLE: "설치 버튼 탭",
  INSTALL_GUIDE_ANDROID_STEP2_DESC: "배너의 '설치' 버튼을 탭하세요",
  INSTALL_GUIDE_ANDROID_STEP3_TITLE: "설치 완료",
  INSTALL_GUIDE_ANDROID_STEP3_DESC:
    "설치가 완료되면 홈 화면에서 앱을 실행할 수 있습니다",

  // InstallGuide - Samsung Internet Steps
  INSTALL_GUIDE_SAMSUNG_STEP1_TITLE: "메뉴 버튼 탭",
  INSTALL_GUIDE_SAMSUNG_STEP1_DESC:
    "Samsung Internet 하단의 메뉴 버튼을 탭하세요",
  INSTALL_GUIDE_SAMSUNG_STEP2_TITLE: "홈 화면에 추가 선택",
  INSTALL_GUIDE_SAMSUNG_STEP2_DESC: "메뉴에서 '홈 화면에 추가'를 선택하세요",
  INSTALL_GUIDE_SAMSUNG_STEP3_TITLE: "추가 완료",
  INSTALL_GUIDE_SAMSUNG_STEP3_DESC: "확인 후 홈 화면에 아이콘이 추가됩니다",

  // InstallGuide - Desktop Chrome Steps
  INSTALL_GUIDE_DESKTOP_STEP1_TITLE: "설치 아이콘 확인",
  INSTALL_GUIDE_DESKTOP_STEP1_DESC:
    "주소창 오른쪽에 나타나는 설치 아이콘(⬇)을 확인하세요",
  INSTALL_GUIDE_DESKTOP_STEP2_TITLE: "설치 버튼 클릭",
  INSTALL_GUIDE_DESKTOP_STEP2_DESC:
    "설치 아이콘을 클릭하고 '설치'를 선택하세요",
  INSTALL_GUIDE_DESKTOP_STEP3_TITLE: "설치 완료",
  INSTALL_GUIDE_DESKTOP_STEP3_DESC:
    "데스크톱에 앱이 설치되고 시작 메뉴에 추가됩니다",

  // InstallGuide - Platform Tips
  INSTALL_GUIDE_IOS_TIP1: "iOS 16.4 이상에서 PWA 알림이 지원됩니다",
  INSTALL_GUIDE_IOS_TIP2: "홈 화면에서 앱처럼 실행됩니다",
  INSTALL_GUIDE_IOS_TIP3: "오프라인에서도 사용할 수 있습니다",

  INSTALL_GUIDE_ANDROID_TIP1: "Chrome 67 이상에서 지원됩니다",
  INSTALL_GUIDE_ANDROID_TIP2: "푸시 알림을 받을 수 있습니다",
  INSTALL_GUIDE_ANDROID_TIP3: "백그라운드 동기화가 가능합니다",

  INSTALL_GUIDE_SAMSUNG_TIP1: "Samsung Internet 7.2 이상에서 지원됩니다",
  INSTALL_GUIDE_SAMSUNG_TIP2: "Samsung 기기에서 최적화된 경험을 제공합니다",
  INSTALL_GUIDE_SAMSUNG_TIP3: "다크 모드를 지원합니다",

  INSTALL_GUIDE_DESKTOP_TIP1: "Chrome 67 이상에서 지원됩니다",
  INSTALL_GUIDE_DESKTOP_TIP2: "독립적인 창으로 실행됩니다",
  INSTALL_GUIDE_DESKTOP_TIP3: "시스템 알림을 받을 수 있습니다",

  // InstallGuide.tsx

  INSTALL_GUIDE_SHEET_TITLE: "PWA 설치 가이드",
  INSTALL_GUIDE_SHEET_DESCRIPTION:
    "현재 플랫폼에 맞는 PWA 설치 방법을 안내합니다.",

  // InstallPrompt.tsx
  INSTALL_PROMPT_IOS_TEXT: "홈 화면에 추가",
  INSTALL_PROMPT_ANDROID_TEXT: "앱으로 설치",
  INSTALL_PROMPT_DESKTOP_TEXT: "앱으로 설치",
  INSTALL_PROMPT_DEFAULT_TEXT: "설치하기",
  INSTALL_PROMPT_BANNER_GUIDE:
    "더 빠르고 편리한 경험을 위해 홈화면에 추가하세요",
  INSTALL_PROMPT_IOS_GUIDE:
    'iOS에서는 사파리 하단의 공유 버튼을 누른 후 "홈 화면에 추가"를 선택하세요.',
  INSTALL_PROMPT_ANDROID_GUIDE:
    '브라우저 메뉴에서 "홈 화면에 추가"를 선택하세요.',
  INSTALL_PROMPT_DEFAULT_GUIDE:
    "이 브라우저에서는 메뉴에서 홈 화면에 추가를 선택하세요.",

  INSTALL_PROMPT_ADD_TO_HOME: "{action}하세요!",

  // turnstile.tsx
  TURNSTILE_LOADING: "캡차 로딩 중...",
  TURNSTILE_ERROR_MESSAGE: "캡차 인증에 실패했습니다.",
  TURNSTILE_LOAD_ERROR: "캡차 로드에 실패했습니다.",

  // admin-sidebar.tsx
  ADMIN_SIDEBAR_DASHBOARD: "대시보드",
  ADMIN_SIDEBAR_FARM_MANAGEMENT: "농장 관리",
  ADMIN_SIDEBAR_ALL_VISITORS_RECORD: "전체 방문자 기록",
  ADMIN_SIDEBAR_VISITORS_RECORD: "방문자 기록",
  ADMIN_SIDEBAR_NOTIFICATION_SETTINGS: "알림 설정",
  ADMIN_SIDEBAR_ACCOUNT_MANAGEMENT: "계정 관리",
  ADMIN_SIDEBAR_SYSTEM_MANAGEMENT: "시스템 관리",
  ADMIN_SIDEBAR_TERMS_MANAGEMENT: "약관 관리",
  ADMIN_SIDEBAR_SYSTEM_SETTINGS: "시스템 설정",
  ADMIN_SIDEBAR_MONITORING: "모니터링",

  // mobile-header.tsx
  MOBILE_HEADER_DASHBOARD: "대시보드",
  MOBILE_HEADER_FARM_MANAGEMENT: "농장 관리",
  MOBILE_HEADER_VISITOR_MANAGEMENT: "방문자 관리",
  MOBILE_HEADER_SYSTEM_MANAGEMENT: "시스템 관리",
  MOBILE_HEADER_MONITORING: "모니터링",
  MOBILE_HEADER_NOTIFICATION_SETTINGS: "알림 설정",
  MOBILE_HEADER_SETTINGS: "설정",
  MOBILE_HEADER_ACCOUNT_MANAGEMENT: "계정 관리",
  MOBILE_HEADER_ADMIN: "관리자",
  MOBILE_HEADER_SYSTEM_ADMIN: "시스템 관리자",
  MOBILE_HEADER_FARM_COUNT: "{count}개 농장",
  MOBILE_HEADER_FARM_REGISTRATION_NEEDED: "농장 등록 필요",

  // 알림 관련
  NOTIFICATION_TITLE: "실시간 알림",
  NOTIFICATION_LOADING_TEXT: "알림을 불러오는 중...",
  NOTIFICATION_EMPTY: "알림이 없습니다.",
  NOTIFICATION_DETAIL_MODAL: "알림 상세 모달",
  NOTIFICATION_DELETE: "알림 삭제",

  // 프로필 설정 관련
  PROFILE_SETUP_LOADING_TEXT: "사용자 정보를 확인하는 중...",
  PROFILE_SETUP_CONSENT_REQUIRED_TITLE: "약관 동의가 필요합니다",
  PROFILE_SETUP_CONSENT_REQUIRED_DESC:
    "서비스 이용을 위해 업데이트된 약관에 동의해주세요.",
  PROFILE_SETUP_PROFILE_INPUT_TITLE: "프로필 정보 입력",
  PROFILE_SETUP_PROFILE_INPUT_DESC:
    "서비스 이용을 위해 추가 정보를 입력해주세요.",

  PROFILE_SETUP_CANCEL_TITLE: "프로필 설정을 취소하시겠습니까?",
  PROFILE_SETUP_CANCEL_TITLE_CONSENT: "약관 동의를 취소하시겠습니까?",
  PROFILE_SETUP_CANCEL_DESC: "확인을 누르면 작성 중인 내용이 사라집니다.",
  PROFILE_SETUP_CANCEL_DESC_CONSENT:
    "확인을 누르면 프로필 설정으로 돌아갑니다.",

  // 사이드바 스와이프 가이드 관련
  SIDEBAR_SWIPE_GUIDE_TITLE: "← 왼쪽으로 스와이프",
  SIDEBAR_SWIPE_GUIDE_DESCRIPTION: "화면을 터치하고 왼쪽으로 밀어보세요",
  SIDEBAR_SWIPE_GUIDE_DESCRIPTION_MOBILE: "터치 후 왼쪽으로 밀기",
} as const;

// 공통 컴포넌트 플레이스홀더
export const PLACEHOLDERS = {
  // 주소 검색 플레이스홀더
  ADDRESS_SEARCH_DETAILED_PLACEHOLDER:
    "상세 주소를 입력하세요 (예: 101동 1234호)",
} as const;
