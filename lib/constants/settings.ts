export const PAGE_HEADER = {
  PAGE_TITLE: "시스템 설정",
  PAGE_DESCRIPTION: "시스템의 전반적인 설정을 관리하세요",
  BREADCRUMB: "시스템 설정",

  CLEANUP_SYSTEM_LOGS_CONFIRM_TITLE: "시스템 로그 정리 확인",

  CLEANUP_ALL_DATA_CONFIRM_TITLE: "전체 데이터 정리 확인",
  CLEANUP_ALL_DATA_CONFIRM_DESC: "만료된 모든 데이터가 삭제됩니다.",

  ORPHAN_FILES_CLEANUP_CONFIRM_TITLE: "Orphan 파일 정리 확인",
  ORPHAN_FILES_CLEANUP_CONFIRM_DESC:
    "사용되지 않는 {count}개의 이미지 파일이 삭제됩니다.",

  SUBSCRIPTION_CLEANUP_CONFIRM_TITLE: "구독 정리 확인",
  SUBSCRIPTION_CLEANUP_CONFIRM_DESC: "현재 설정에 따라 구독이 정리됩니다.",

  BRANDING_TITLE: "사이트 브랜딩",
  BRANDING_DESCRIPTION: "사이트의 로고, 파비콘 및 기본 정보를 설정합니다",

  DISPLAY_FORMAT_TITLE: "표시 형식 설정",
  DISPLAY_FORMAT_DESCRIPTION: "날짜 및 시간 표시 형식을 설정합니다",

  LOCALIZATION_TITLE: "지역화 설정",
  LOCALIZATION_DESCRIPTION: "언어, 시간대 및 지역별 설정을 관리합니다",

  NOTIFICATION_BEHAVIOR_TITLE: "알림 동작 설정",
  NOTIFICATION_BEHAVIOR_DESCRIPTION: "푸시 알림의 동작 방식을 설정합니다.",

  NOTIFICATION_ICON_TITLE: "알림/배지 아이콘",
  NOTIFICATION_ICON_DESCRIPTION:
    "푸시 알림에 표시될 아이콘과 배지를 설정합니다. (로고/파비콘과 동일한 방식)",

  VAPID_SECTION_TITLE: "VAPID 키 설정",
  VAPID_SECTION_DESCRIPTION:
    "웹푸시 알림을 위한 VAPID (Voluntary Application Server Identification) 키를 설정합니다.",

  LOGIN_SECURITY_TITLE: "로그인 보안",
  LOGIN_SECURITY_DESCRIPTION:
    "사용자 로그인 시도 및 계정 보안 설정을 관리합니다",

  PASSWORD_POLICY_TITLE: "비밀번호 정책",
  PASSWORD_POLICY_DESCRIPTION: "사용자 계정의 비밀번호 보안 규칙을 설정합니다",

  BROADCAST_SECTION_TITLE: "푸시 알림 브로드캐스트",
  BROADCAST_SECTION_DESC: "모든 푸시 알림 구독자에게 메시지를 전송합니다.",

  CLEANUP_SECTION_TITLE: "로그 정리 관리",
  CLEANUP_SECTION_DESC:
    "만료된 시스템 로그와 방문자 데이터를 수동으로 정리할 수 있습니다",

  DOCUMENTATION_SECTION_TITLE: "사용자 문서",
  DOCUMENTATION_SECTION_DESC:
    "시스템 사용에 도움이 되는 각종 문서들입니다. 관리자만 접근할 수 있습니다.",

  LOGGING_SECTION_TITLE: "로깅 설정",
  LOGGING_SECTION_DESC: "시스템 로그 수준과 보관 기간을 설정합니다",

  ORPHAN_FILES_SECTION_TITLE: "Orphan 파일 정리",
  ORPHAN_FILES_SECTION_DESC:
    "사용되지 않는 이미지 파일을 정리하여 저장공간을 확보합니다",

  SUBSCRIPTION_CLEANUP_SECTION_TITLE: "구독 정리 설정",
  SUBSCRIPTION_CLEANUP_SECTION_DESC:
    "푸시 구독 정리 정책을 관리합니다. 만료되거나 실패한 구독을 자동으로 정리합니다.",

  SYSTEM_MODE_SECTION_TITLE: "시스템 모드",
  SYSTEM_MODE_SECTION_DESC: "시스템 운영 모드 및 디버깅 설정을 관리합니다",

  VISIT_NOTIFICATION_TEMPLATE_TITLE: "방문 알림 템플릿",
  VISIT_NOTIFICATION_TEMPLATE_DESC:
    "새로운 방문자 등록 시 발송되는 알림 메시지 템플릿을 설정합니다.",

  VISITOR_POLICY_TITLE: "방문자 정책",
  VISITOR_POLICY_DESC: "방문자 관련 정책을 설정합니다.",
} as const;

export const BUTTONS = {
  VAPID_GENERATE_BUTTON: "생성",

  BROADCAST_SEND_BUTTON: "브로드캐스트 발송",
  BROADCAST_SENDING: "발송 중...",

  CLEANUP_CANCEL: "취소",
  CLEANUP_DELETE: "삭제",
  CLEANUP_CLEANING: "정리 중...",
  CLEANUP_REFRESH_BUTTON: "새로고침",
  CLEANUP_SYSTEM_LOGS_BUTTON: "시스템 로그 정리",
  CLEANUP_ALL_DATA_BUTTON: "모든 만료 데이터 정리",

  ORPHAN_FILES_CLEANUP_BUTTON: "Orphan 파일 정리",

  SUBSCRIPTION_CLEANUP_TEST_BUTTON: "정리 테스트",
  SUBSCRIPTION_CLEANUP_BUTTON: "구독 정리",

  SAVING: "저장 중...",
  SAVE_SETTINGS: "설정 저장",

  SYSTEM_MODE_MAINTENANCE_DETAILS: "유지보수 상세 설정",

  DOCUMENTATION_OPEN_BUTTON: "문서 열기",

  TEMPLATE_PREVIEW_BUTTON: "미리보기",
} as const;

// 설정 페이지 라벨
export const LABELS = {
  // 표시 형식 설정

  DATE_FORMAT: "날짜 형식",
  DATE_FORMAT_DESCRIPTION: "시스템 전체에서 사용할 날짜 표시 형식입니다",
  // 날짜 형식 옵션
  DATE_FORMAT_YYYY_MM_DD: "YYYY-MM-DD (2025-01-21)",
  DATE_FORMAT_DD_MM_YYYY: "DD/MM/YYYY (21/01/2025)",
  DATE_FORMAT_MM_DD_YYYY: "MM/DD/YYYY (01/21/2025)",
  DATE_FORMAT_YYYY_MM_DD_KR: "YYYY년 MM월 DD일 (2025년 01월 21일)",
  // 브랜딩 설정
  SITE_LOGO: "사이트 로고",
  SITE_LOGO_DESCRIPTION: "헤더 및 대시보드에 표시됩니다",
  FAVICON: "파비콘",
  FAVICON_DESCRIPTION: "브라우저 탭에 표시됩니다",
  SITE_NAME: "사이트명",
  SITE_NAME_DESCRIPTION: "브라우저 탭과 헤더에 표시되는 사이트 이름입니다",
  SITE_DESCRIPTION: "사이트 설명",
  SITE_DESCRIPTION_HELP: "SEO 및 소셜 미디어 공유 시 사용되는 설명입니다",
  // 지역화 설정
  LANGUAGE: "언어",
  LANGUAGE_DESCRIPTION: "시스템 전체에서 사용할 기본 언어입니다",
  TIMEZONE: "시간대",
  TIMEZONE_DESCRIPTION: "로그 및 방문 기록에 사용할 시간대입니다",
  // 언어 옵션
  LANGUAGE_KO: "한국어",
  LANGUAGE_EN: "English",
  LANGUAGE_JA: "日本語",
  LANGUAGE_ZH: "中文",
  // 시간대 옵션
  TIMEZONE_ASIA_SEOUL: "Asia/Seoul (UTC+9)",
  TIMEZONE_ASIA_TOKYO: "Asia/Tokyo (UTC+9)",
  TIMEZONE_ASIA_SHANGHAI: "Asia/Shanghai (UTC+8)",
  TIMEZONE_UTC: "UTC",
  // VAPID 키 설정
  VAPID_PUBLIC_KEY: "공개 키 (Public Key)",
  VAPID_PRIVATE_KEY: "비공개 키 (Private Key)",

  VAPID_SECURITY_TITLE: "보안 주의사항",
  VAPID_SECURITY_DESCRIPTION:
    "비공개 키는 안전하게 보관하세요. 외부에 노출되면 보안상 위험할 수 있습니다. 생성된 키는 복사 버튼을 통해 클립보드에 복사할 수 있습니다.",

  VAPID_PUBLIC_KEY_LABEL: "공개 키 (Public Key)",
  VAPID_PRIVATE_KEY_LABEL: "비공개 키 (Private Key)",
  // 알림 아이콘 설정
  NOTIFICATION_ICON_LABEL: "알림 아이콘",
  NOTIFICATION_ICON_DESC: "푸시 알림에 표시됩니다",
  NOTIFICATION_BADGE_LABEL: "배지 아이콘",
  NOTIFICATION_BADGE_DESC: "푸시 알림 배지에 표시됩니다",
  // 로그인 보안 설정
  LOGIN_ATTEMPTS_DESC:
    "로그인 실패 시 계정을 일시적으로 잠그는 기준 횟수입니다 (3-10회)",
  ACCOUNT_LOCKOUT_DESC:
    "로그인 시도 횟수 초과 시 계정이 잠기는 시간입니다 (5분-24시간)",
  // 비밀번호 정책 설정
  PASSWORD_MIN_LENGTH_DESC:
    "사용자가 설정해야 하는 최소 비밀번호 길이입니다 (8-20자)",
  PASSWORD_SPECIAL_CHAR: "특수문자 포함",
  PASSWORD_SPECIAL_CHAR_DESC:
    "!@#$%^&* 등의 특수문자를 반드시 포함하도록 합니다",
  PASSWORD_NUMBER: "숫자 포함",
  PASSWORD_NUMBER_DESC: "0-9 숫자를 반드시 포함하도록 합니다",
  PASSWORD_UPPERCASE: "대문자 포함",
  PASSWORD_UPPERCASE_DESC: "A-Z 대문자를 반드시 포함하도록 합니다",
  PASSWORD_LOWERCASE: "소문자 포함",
  PASSWORD_LOWERCASE_DESC: "a-z 소문자를 반드시 포함하도록 합니다",
  // 브로드캐스트 설정
  BROADCAST_NOTIFICATION_TYPE: "알림 유형",
  BROADCAST_NOTIFICATION_TYPE_PLACEHOLDER: "알림 유형을 선택하세요",
  BROADCAST_NOTIFICATION_TYPE_DESC:
    "선택한 알림 유형에 따라 해당 알림을 구독한 사용자에게만 전송됩니다.",
  BROADCAST_TITLE: "알림 제목",
  BROADCAST_TITLE_PLACEHOLDER: "예: 시스템 점검 안내",
  BROADCAST_MESSAGE: "알림 내용",
  BROADCAST_MESSAGE_PLACEHOLDER:
    "예: 오늘 밤 12시부터 새벽 2시까지 시스템 점검이 진행됩니다.",
  BROADCAST_URL: "알림 클릭 시 이동할 URL",
  BROADCAST_URL_PLACEHOLDER: "/admin/dashboard",
  BROADCAST_REQUIRE_INTERACTION: "사용자 상호작용 필요",
  BROADCAST_REQUIRE_INTERACTION_DESC:
    "활성화하면 사용자가 직접 알림을 닫아야 합니다.",

  BROADCAST_GUIDE_TITLE: "브로드캐스트 사용 가이드:",
  BROADCAST_GUIDE_NOTICE: "• 공지사항: 일반적인 공지나 안내사항에 사용",
  BROADCAST_GUIDE_EMERGENCY: "• 긴급 알림: 중요하고 긴급한 상황 전파에 사용",
  BROADCAST_GUIDE_MAINTENANCE:
    "• 유지보수 알림: 시스템 점검이나 업데이트 안내에 사용",
  BROADCAST_GUIDE_TITLE_TIP: "• 제목은 간결하고 명확하게 작성해주세요",
  BROADCAST_GUIDE_REVIEW: "• 발송 전 내용을 다시 한 번 확인해주세요",

  // BroadcastAlert
  BROADCAST_ALERT_WARNING: "주의:",
  BROADCAST_ALERT_DESCRIPTION:
    "이 기능은 선택한 알림 유형에 따라 해당 알림을 구독한 사용자에게만 메시지를 발송합니다.",
  BROADCAST_ALERT_NOTICE: "공지사항:",
  BROADCAST_ALERT_NOTICE_DESC:
    "일반적인 공지나 안내사항을 구독한 사용자에게 전송",
  BROADCAST_ALERT_EMERGENCY: "긴급 알림:",
  BROADCAST_ALERT_EMERGENCY_DESC: "긴급 알림을 구독한 사용자에게 즉시 전송",
  BROADCAST_ALERT_MAINTENANCE: "유지보수 알림:",
  BROADCAST_ALERT_MAINTENANCE_DESC:
    "시스템 점검이나 업데이트 알림을 구독한 사용자에게 전송",
  BROADCAST_ALERT_SPAM_WARNING:
    "스팸성 메시지나 불필요한 알림은 사용자 경험을 해칠 수 있으니 신중하게 사용해주세요.",

  // BroadcastResult
  BROADCAST_RESULT_SUCCESS: "발송 완료",
  BROADCAST_RESULT_FAILURE: "발송 실패",
  BROADCAST_RESULT_SUCCESS_COUNT: "성공: {count}명",
  BROADCAST_RESULT_FAILURE_COUNT: "실패: {count}명",

  // CleanupActions
  CLEANUP_DELETE_DATA_TITLE: "삭제될 데이터:",
  CLEANUP_SYSTEM_LOGS_DELETE: "{date} 이전의 모든 시스템 로그",
  CLEANUP_VISITOR_DATA_DELETE: "방문자 데이터: {count}건",
  CLEANUP_ALL_DATA_DELETE: "{date} 이전의 모든 데이터",
  CLEANUP_IRRECOVERABLE: "삭제된 데이터는 복구할 수 없습니다",

  // CleanupSuccessMessage
  CLEANUP_SUCCESS_TITLE: "🎉 {type} 정리가 완료되었습니다!",
  CLEANUP_SUCCESS_DESC:
    "데이터가 성공적으로 정리되었고 상태가 업데이트되었습니다.",
  CLEANUP_ALL_CLEANED_TITLE: "✅ 모든 데이터가 정리되었습니다",
  CLEANUP_ALL_CLEANED_DESC:
    "현재 정리할 만료된 데이터가 없습니다. 시간이 지나면 새로운 만료 데이터가 생성됩니다.",

  // OrphanFilesActions
  ORPHAN_FILES_DELETE_FILES_TITLE: "삭제될 파일:",
  ORPHAN_FILES_VISITOR_IMAGES_DELETE: "방문자 이미지: {count}개",
  ORPHAN_FILES_VISITOR_DB_ORPHAN_DELETE: "방문자 DB orphan: {count}개",
  ORPHAN_FILES_PROFILE_IMAGES_DELETE: "프로필 이미지: {count}개",
  ORPHAN_FILES_PROFILE_DB_ORPHAN_DELETE: "프로필 DB orphan: {count}개",
  ORPHAN_FILES_IRRECOVERABLE: "삭제된 파일은 복구할 수 없습니다",
  ORPHAN_FILES_DELETING: "삭제 중...",

  // OrphanFilesSuccessMessage
  ORPHAN_FILES_SUCCESS_TITLE: "🎉 {type} 정리가 완료되었습니다!",
  ORPHAN_FILES_SUCCESS_DESC:
    "Orphan 파일이 성공적으로 정리되었고 상태가 업데이트되었습니다.",
  ORPHAN_FILES_ALL_CLEANED_TITLE: "✅ 모든 orphan 파일이 정리되었습니다",
  ORPHAN_FILES_ALL_CLEANED_DESC:
    "현재 정리할 orphan 파일이 없습니다. 새로운 이미지 업로드 시 orphan 파일이 생성될 수 있습니다.",

  // SubscriptionCleanupActions
  SUBSCRIPTION_CLEANUP_CONDITIONS_TITLE: "정리 조건:",
  SUBSCRIPTION_CLEANUP_FAIL_COUNT: "실패 횟수: {count}회 이상",
  SUBSCRIPTION_CLEANUP_INACTIVE: "비활성 구독: {status}",
  SUBSCRIPTION_CLEANUP_FORCE_DELETE: "강제 삭제: {status}",
  SUBSCRIPTION_CLEANUP_AUTO_DELETE: "자동 삭제: {days}일 후",
  SUBSCRIPTION_CLEANUP_IRRECOVERABLE: "정리된 구독은 복구할 수 없습니다",
  SUBSCRIPTION_CLEANUP_CLEANING: "정리 중...",
  SUBSCRIPTION_CLEANUP_CLEAN: "정리",
  SUBSCRIPTION_CLEANUP_MAINTAIN: "유지",
  SUBSCRIPTION_CLEANUP_ENABLED: "활성화",
  SUBSCRIPTION_CLEANUP_DISABLED: "비활성화",

  // SubscriptionCleanupSuccessMessage
  SUBSCRIPTION_CLEANUP_ALL_VALID_TITLE: "✅ 모든 구독이 유효합니다",
  SUBSCRIPTION_CLEANUP_ALL_VALID_DESC:
    "현재 정리할 구독이 없습니다. 총 {count}개의 구독이 모두 정상 상태입니다.",
  SUBSCRIPTION_CLEANUP_SUCCESS_TITLE: "🎉 구독 정리가 완료되었습니다!",
  SUBSCRIPTION_CLEANUP_SUCCESS_DESC: "총 {count}개의 구독이 정리되었습니다.",
  SUBSCRIPTION_CLEANUP_DETAILS_TITLE: "정리 상세:",
  SUBSCRIPTION_CLEANUP_FAIL_COUNT_CLEANED: "• 실패 횟수 초과: {count}개",
  SUBSCRIPTION_CLEANUP_INACTIVE_CLEANED: "• 비활성 구독: {count}개",
  SUBSCRIPTION_CLEANUP_EXPIRED_CLEANED: "• 만료된 구독: {count}개",
  SUBSCRIPTION_CLEANUP_FORCE_DELETED: "• 강제 삭제: {count}개",
  SUBSCRIPTION_CLEANUP_OLD_SOFT_DELETED: "• 오래된 Soft Delete: {count}개",
  SUBSCRIPTION_CLEANUP_SUMMARY: "유효한 구독: {valid}개 / 총 검사: {total}개",

  // CleanupSection

  CLEANUP_STATUS_CHECKING: "정리 상태를 확인하는 중...",

  // DocumentationSection
  DOCUMENTATION_USER_MANUAL: "사용자 매뉴얼",
  DOCUMENTATION_USER_MANUAL_DESC: "시스템의 모든 기능에 대한 상세한 설명서",
  DOCUMENTATION_QUICK_START: "빠른 시작 가이드",
  DOCUMENTATION_QUICK_START_DESC: "5분만에 시작하는 농장 출입 관리 시스템",
  DOCUMENTATION_PRODUCT_OVERVIEW: "제품 소개서",
  DOCUMENTATION_PRODUCT_OVERVIEW_DESC: "시스템의 주요 기능과 비즈니스 효과",
  DOCUMENTATION_FAQ: "자주 묻는 질문",
  DOCUMENTATION_FAQ_DESC: "고객들이 가장 궁금해하는 질문과 답변",
  DOCUMENTATION_PWA_GUIDE: "PWA 사용 가이드",
  DOCUMENTATION_PWA_GUIDE_DESC: "모바일 앱처럼 사용하는 방법과 설치 가이드",
  DOCUMENTATION_USAGE_TIP: "💡 사용 팁",
  DOCUMENTATION_TIP_1: "• 처음 사용하시는 경우 빠른 시작 가이드부터 읽어보세요",
  DOCUMENTATION_TIP_2: "• 상세한 기능 설명은 사용자 매뉴얼을 참고하세요",
  DOCUMENTATION_TIP_3: "• 문제가 생기면 자주 묻는 질문을 먼저 확인해보세요",

  // OrphanFilesSection
  ORPHAN_FILES_STATUS_CHECKING: "Orphan 파일 상태를 확인하는 중...",

  // 정리 상태 설정
  CLEANUP_SYSTEM_LOGS: "만료된 시스템 로그",
  CLEANUP_VISITOR_DATA: "만료된 방문자 데이터",
  CLEANUP_NO_EXPIRED_LOGS: "정리할 만료된 로그가 없습니다",
  CLEANUP_NO_EXPIRED_DATA: "정리할 만료된 데이터가 없습니다",
  CLEANUP_BEFORE_DATE: "{date} 이전 로그",
  CLEANUP_BEFORE_DATE_DATA: "{date} 이전 데이터",
  // 로깅 설정
  LOGGING_LEVEL: "로깅 레벨",
  LOGGING_LEVEL_PLACEHOLDER: "로그 레벨 선택",
  LOGGING_RETENTION: "로그 보관 기간",
  LOGGING_RETENTION_PLACEHOLDER: "보관 기간을 선택하세요",
  LOGGING_RETENTION_DESC: "{days}일이 지난 로그는 자동으로 삭제됩니다",
  LOGGING_DEBUG_WARNING: "디버그 모드는 성능에 영향을 줄 수 있습니다.",
  // 디버그 모드 설정
  DEBUG_MODE: "디버그 모드",
  DEBUG_MODE_DESC: "개발 및 문제 해결을 위한 상세한 디버그 정보를 표시합니다",
  DEBUG_MODE_ACTIVE: "활성화",
  DEBUG_MODE_PANEL_WARNING: "디버그 패널이 화면 우측 하단에 표시됩니다",
  // 유지보수 모드 설정
  MAINTENANCE_MODE: "유지보수 모드",
  MAINTENANCE_MODE_DESC: "시스템 업데이트 시 일반 사용자의 접근을 제한합니다",
  MAINTENANCE_MODE_ACTIVE: "활성화",
  MAINTENANCE_MODE_WARNING: "일반 사용자는 현재 시스템에 접근할 수 없습니다",
  // 유지보수 설정
  MAINTENANCE_MESSAGE: "유지보수 메시지",
  MAINTENANCE_ESTIMATED_TIME: "예상 완료 시간 (분)",
  MAINTENANCE_CONTACT_INFO: "연락처 정보",
  MAINTENANCE_START_TIME: "유지보수 시작 시간",
  MAINTENANCE_CURRENT_SETTING: "현재 설정:",
  // 고아 파일 상태
  ORPHAN_FILES_VISITOR_IMAGES: "방문자 이미지",
  ORPHAN_FILES_PROFILE_IMAGES: "프로필 이미지",
  ORPHAN_FILES_STORAGE_ORPHAN: "Storage orphan {count}개",
  ORPHAN_FILES_DB_ORPHAN: "DB orphan {count}개",
  ORPHAN_FILES_NO_STORAGE_ORPHAN: "정리할 Storage orphan 파일이 없습니다",
  ORPHAN_FILES_NO_DB_ORPHAN: "정리할 DB orphan 파일이 없습니다",
  ORPHAN_FILES_STORAGE_ORPHAN_DESC:
    "Storage에는 있는데 DB에는 없는 방문자 이미지",
  ORPHAN_FILES_DB_ORPHAN_DESC: "DB에는 있는데 Storage에는 없는 방문자 이미지",
  ORPHAN_FILES_STORAGE_ORPHAN_PROFILE_DESC:
    "Storage에는 있는데 DB에는 없는 프로필 이미지",
  ORPHAN_FILES_DB_ORPHAN_PROFILE_DESC:
    "DB에는 있는데 Storage에는 없는 프로필 이미지",
  // 구독 정리 설정
  SUBSCRIPTION_CLEANUP_DAYS: "자동 삭제 일수",
  SUBSCRIPTION_CLEANUP_DAYS_DESC:
    "Soft delete된 구독을 지정된 일수 후 완전히 삭제합니다. 0으로 설정하면 자동 삭제하지 않습니다.",
  SUBSCRIPTION_FAIL_COUNT_THRESHOLD: "실패 횟수 임계값",
  SUBSCRIPTION_FAIL_COUNT_DESC:
    "푸시 발송 실패가 지정된 횟수를 초과하면 구독을 비활성화합니다.",
  SUBSCRIPTION_CLEANUP_INACTIVE_SETTING: "비활성 구독 정리",
  SUBSCRIPTION_CLEANUP_INACTIVE_DESC: "비활성화된 구독을 자동으로 정리합니다.",
  SUBSCRIPTION_FORCE_DELETE_SETTING: "강제 삭제",
  SUBSCRIPTION_FORCE_DELETE_DESC:
    "Soft delete 대신 즉시 완전 삭제합니다. (주의: 복구 불가능)",
  // 알림 탭 설정
  VISIT_NOTIFICATION_TEMPLATE_LABEL: "알림 메시지 템플릿",
  VISIT_NOTIFICATION_TEMPLATE_VARIABLES:
    "사용 가능한 변수: {방문자명}, {방문날짜}, {방문시간}, {농장명}, {방문목적}, {연락처}, {차량번호}, {방역상태}, {등록시간}",

  // 방문자 탭 설정
  VISITOR_REVISIT_INTERVAL: "재방문 허용 간격 (시간)",
  VISITOR_MAX_PER_DAY: "일일 최대 방문자 수",
  VISITOR_DATA_RETENTION: "방문자 데이터 보존 기간 (일)",
  VISITOR_PHOTO_REQUIRED: "방문자 사진 필수",
  VISITOR_CONTACT_REQUIRED: "연락처 필수",
  VISITOR_PURPOSE_REQUIRED: "방문 목적 필수",
  // 탭 라벨
  TABS: {
    GENERAL: "일반",
    SECURITY: "보안",
    VISITOR: "방문자",
    NOTIFICATIONS: "알림",
    SYSTEM: "시스템",
  },

  // 단위 표시
  COUNT_UNIT: "{count}건",

  // 권한 확인
  CHECKING_PERMISSION: "권한을 확인하는 중...",
} as const;

// 설정 페이지 플레이스홀더
export const PLACEHOLDERS = {
  // 표시 형식 설정
  DATE_FORMAT_SELECT: "날짜 형식 선택",
  // 브랜딩 설정
  SITE_NAME: "농장 출입 관리 시스템(FarmPass)",
  SITE_DESCRIPTION:
    "방역은 출입자 관리부터 시작됩니다. QR기록으로 축산 질병 예방의 첫걸음을 함께하세요.",
  // 지역화 설정
  LANGUAGE_SELECT: "언어 선택",
  TIMEZONE_SELECT: "시간대 선택",
  // VAPID 키 설정
  VAPID_PUBLIC_KEY: "VAPID 키를 생성해주세요",
  VAPID_PRIVATE_KEY: "VAPID 키를 생성해주세요",
  // 로그인 보안 설정
  MAX_LOGIN_ATTEMPTS: "최대 로그인 시도 횟수",
  ACCOUNT_LOCKOUT_DURATION: "계정 잠금 시간 (분)",
  // 비밀번호 정책 설정
  PASSWORD_MIN_LENGTH: "최소 비밀번호 길이",
  // 브로드캐스트 설정
  BROADCAST_NOTIFICATION_TYPE: "알림 유형을 선택하세요",
  BROADCAST_TITLE: "예: 시스템 점검 안내",
  BROADCAST_MESSAGE:
    "예: 오늘 밤 12시부터 새벽 2시까지 시스템 점검이 진행됩니다.",
  BROADCAST_URL: "/admin/dashboard",
  // 로깅 설정
  LOGGING_LEVEL: "로그 레벨 선택",
  LOGGING_RETENTION: "보관 기간을 선택하세요",
  // 유지보수 설정
  MAINTENANCE_MESSAGE: "유지보수 중 사용자에게 표시할 메시지를 입력하세요",
  MAINTENANCE_ESTIMATED_TIME: "30",
  MAINTENANCE_CONTACT_INFO: "문의사항이 있으시면 관리자에게 연락해 주세요.",
  // 구독 정리 설정
  SUBSCRIPTION_CLEANUP_DAYS: "삭제 일수를 선택하세요",
  SUBSCRIPTION_FAIL_COUNT_THRESHOLD: "실패 횟수 임계값을 선택하세요",
  // 알림 탭 설정
  VISIT_NOTIFICATION_TEMPLATE:
    "새로운 방문자가 등록되었습니다. 방문자: {방문자명}, 농장: {농장명}, 시간: {방문시간}",
} as const;

// 브로드캐스트 알림 유형 옵션
export const BROADCAST_NOTIFICATION_TYPE_OPTIONS = [
  { value: "notice", label: "공지사항" },
  { value: "emergency", label: "긴급 알림" },
  { value: "maintenance", label: "유지보수 알림" },
] as const;

// 로깅 레벨 옵션
export const LOGGING_LEVEL_OPTIONS = [
  {
    value: "error",
    label: "Error",
    description: "오류만 기록",
  },
  {
    value: "warn",
    label: "Warning",
    description: "경고 이상 기록",
  },
  {
    value: "info",
    label: "Info",
    description: "정보 이상 기록 (기본값)",
  },
  {
    value: "debug",
    label: "Debug",
    description: "모든 로그 기록",
  },
] as const;

// 로그 보관 기간 옵션
export const LOGGING_RETENTION_OPTIONS = [
  { value: "7", label: "7일" },
  { value: "14", label: "14일" },
  { value: "30", label: "30일" },
  { value: "60", label: "60일" },
  { value: "90", label: "90일" },
  { value: "180", label: "180일" },
  { value: "365", label: "365일" },
] as const;

// 구독 정리 일수 옵션
export const SUBSCRIPTION_CLEANUP_DAYS_OPTIONS = [
  { label: "자동 삭제 안함", value: 0 },
  { label: "7일 후 삭제", value: 7 },
  { label: "15일 후 삭제", value: 15 },
  { label: "30일 후 삭제", value: 30 },
  { label: "60일 후 삭제", value: 60 },
  { label: "90일 후 삭제", value: 90 },
] as const;

// 구독 실패 횟수 옵션
export const SUBSCRIPTION_FAIL_COUNT_OPTIONS = [
  { label: "3회 실패", value: 3 },
  { label: "5회 실패", value: 5 },
  { label: "10회 실패", value: 10 },
  { label: "15회 실패", value: 15 },
] as const;

// 알림 동작 설정 토글 옵션
export const NOTIFICATION_BEHAVIOR_TOGGLES = [
  {
    id: "push-sound",
    key: "pushSoundEnabled" as const,
    label: "소리 알림",
    description: "알림 수신 시 소리를 재생합니다",
  },
  {
    id: "push-vibrate",
    key: "pushVibrateEnabled" as const,
    label: "진동 알림",
    description: "모바일 기기에서 진동을 발생시킵니다",
  },
  {
    id: "push-require-interaction",
    key: "pushRequireInteraction" as const,
    label: "지속적 표시",
    description: "사용자가 확인할 때까지 알림을 유지합니다",
  },
] as const;

// 날짜 형식 옵션
export const DATE_FORMAT_OPTIONS = [
  { value: "YYYY-MM-DD", label: LABELS.DATE_FORMAT_YYYY_MM_DD },
  { value: "DD/MM/YYYY", label: LABELS.DATE_FORMAT_DD_MM_YYYY },
  { value: "MM/DD/YYYY", label: LABELS.DATE_FORMAT_MM_DD_YYYY },
  { value: "YYYY년 MM월 DD일", label: LABELS.DATE_FORMAT_YYYY_MM_DD_KR },
] as const;

// 언어 옵션
export const LANGUAGE_OPTIONS = [
  { value: "ko", label: LABELS.LANGUAGE_KO },
  { value: "en", label: LABELS.LANGUAGE_EN },
  { value: "ja", label: LABELS.LANGUAGE_JA },
  { value: "zh", label: LABELS.LANGUAGE_ZH },
] as const;

// 시간대 옵션
export const TIMEZONE_OPTIONS = [
  { value: "Asia/Seoul", label: LABELS.TIMEZONE_ASIA_SEOUL },
  { value: "Asia/Tokyo", label: LABELS.TIMEZONE_ASIA_TOKYO },
  { value: "Asia/Shanghai", label: LABELS.TIMEZONE_ASIA_SHANGHAI },
  { value: "UTC", label: LABELS.TIMEZONE_UTC },
] as const;
