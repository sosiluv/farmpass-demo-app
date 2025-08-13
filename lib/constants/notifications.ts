export const PAGE_HEADER = {
  PAGE_TITLE: "알림 설정",
  PAGE_DESCRIPTION: "농장 관령 알림을 설정하세요",

  NOTIFICATION_SETTINGS: "알림 설정",
  NOTIFICATION_SETTINGS_DESC: "알림 방식과 종류를 설정하세요",

  NOTIFICATION_TYPES_TITLE: "알림 유형 설정",
  NOTIFICATION_TYPES_DESCRIPTION: "받고 싶은 알림 유형을 선택하세요.",

  PUSH_NOTIFICATION_SETTINGS: "푸시 알림 설정",
  PUSH_DESCRIPTION: "실시간 알림을 받아보세요",
} as const;

export const BUTTONS = {
  SETTING_NOTIFICATIONS: "알림 설정 중...",
  ALLOW_NOTIFICATIONS_BUTTON: "알림 허용하기",
  RESUBSCRIBE_BUTTON: "다시 구독하기",
  LATER_SETTINGS: "나중에 설정하기",
  LATER_SUBSCRIBE: "나중에 구독하기",

  SAVING: "저장 중...",
  SAVE_SETTINGS: "설정 저장",
  SUBSCRIBING: "구독 진행 중...",
  SUBSCRIBE_PUSH: "푸시 알림 구독하기",
  CLEANUP: "정리",
  CLEANUP_TITLE: "만료된 구독 정리",
  UNSUBSCRIBE: "해제",
  UNSUBSCRIBE_TITLE: "구독 해제",
  CHECK_PERMISSION_AGAIN: "권한 다시 확인하기",
} as const;

// 알림 페이지 라벨
export const LABELS = {
  // 알림 유형
  VISITOR_ALERTS: "방문자 알림",
  VISITOR_ALERTS_DESCRIPTION: "새로운 방문자가 등록되면 알림을 받습니다.",
  SYSTEM_ALERTS: "시스템 알림",
  SYSTEM_ALERTS_DESCRIPTION:
    "공지사항, 긴급 알림, 유지보수 알림을 포함한 모든 시스템 알림을 받습니다.",

  // NotificationStatus 컴포넌트
  CHECKING_STATUS: "푸시 알림 상태 확인 중",
  UNSUPPORTED_TITLE: "푸시 알림 미지원",
  UNSUPPORTED_DESCRIPTION: "현재 브라우저에서는 푸시 알림을 지원하지 않습니다.",
  SUPPORTED_BROWSERS: "지원 브라우저/환경:",
  CHROME: "Chrome",
  EDGE: "Edge",
  FIREFOX: "Firefox",
  SAFARI: "iOS/iPadOS Safari",
  SAFARI_NOTE: "16.4 이상, 홈 화면에 추가한 PWA만 지원",
  SAFARI_WARNING:
    "※ iOS 사파리는 브라우저 탭에서는 지원하지 않으며, 반드시 홈 화면에 추가한 앱에서만 푸시 알림이 가능합니다.",
  SECURITY_NOTE: "보안상 HTTPS 환경에서만 지원됩니다",

  // 권한 관련
  PERMISSION_NEEDED: "알림 권한 필요",
  PERMISSION_DENIED: "브라우저에서 알림 권한이 차단되었습니다.",
  PERMISSION_INSTRUCTION:
    "주소창 옆의 🔒 아이콘을 클릭하여 권한을 허용해주세요.",

  // 구독 상태
  PUSH_READY: "푸시 알림 준비 완료",
  PUSH_READY_DESC: "브라우저 알림 권한이 허용되었습니다.",
  PUSH_SUBSCRIBE_DESC: "구독하시면 농장 관련 실시간 알림을 받을 수 있습니다.",

  // 구독된 상태
  PUSH_ACTIVE: "푸시 알림 활성화됨",
  PUSH_ACTIVE_DESC: "모든 농장의 실시간 알림을 수신하고 있습니다",

  // 알림 범위
  NOTIFICATION_SCOPE: "알림 수신 범위",
  VISITOR_REGISTRATION: "모든 농장의 방문자 등록 알림",
  FARM_MANAGEMENT: "농장 관리 관련 중요 알림",
  SYSTEM_NOTICE: "시스템 공지사항 및 업데이트",

  // 농장 목록
  MANAGED_FARMS: "관리 중인 농장",
  FARM_COUNT: "{count}개 농장",
  NOTIFICATION_RECEIVING: "알림 수신 중",

  // NotificationPermission
  ALLOW_NOTIFICATIONS: "알림을 허용하시겠어요?",
  RESUBSCRIBE_NOTIFICATIONS: "알림을 다시 구독하시겠어요?",
  ALLOW_DESCRIPTION: "농장 관리에 필요한 중요한 알림을 놓치지 마세요",
  RESUBSCRIBE_DESCRIPTION:
    "알림 구독이 해제되어 있습니다. 중요한 농장 관리 알림을 다시 받아보세요",
  FARM_COUNT_MANAGING: "{count}개 농장 관리 중",

  // 혜택 목록
  VISITOR_NOTIFICATION: "방문자 알림",
  VISITOR_NOTIFICATION_DESC: "새로운 방문자 등록 시 즉시 알림",
  VISITOR_NOTIFICATION_RESUBSCRIBE:
    "방문자 등록 알림을 다시 받으실 수 있습니다",
  REAL_TIME_STATUS: "실시간 현황",
  REAL_TIME_STATUS_DESC: "농장 활동 및 중요 이벤트 알림",
  REAL_TIME_STATUS_RESUBSCRIBE: "농장 활동 알림을 다시 받으실 수 있습니다",
  SECURITY_NOTIFICATION: "보안 알림",
  SECURITY_NOTIFICATION_DESC: "계정 보안 및 시스템 알림",
  SECURITY_NOTIFICATION_RESUBSCRIBE:
    "중요한 보안 알림을 다시 받으실 수 있습니다",

  // 보안 안내
  SECURITY_INFO:
    "알림은 중요한 농장 관리 정보만 발송되며, 언제든지 설정에서 변경할 수 있습니다.",
  SECURITY_INFO_RESUBSCRIBE:
    "알림을 다시 구독하면 중요한 농장 관리 정보를 받으실 수 있습니다.",

  // SubscriptionGuideCard
  SUBSCRIPTION_REQUIRED: "알림 설정을 위해 구독이 필요합니다",
  SUBSCRIPTION_DESCRIPTION:
    "위의 푸시 알림을 구독하시면 알림 방식과 종류를 세부적으로 설정할 수 있습니다.",

  // NotificationMethodsCard
  PUSH_NOTIFICATION: "푸시 알림",
  PUSH_NOTIFICATION_DESC: "실시간 알림을 받아보세요",
  KAKAO_NOTIFICATION: "카카오톡",
  KAKAO_NOTIFICATION_DESC:
    "카카오톡 메시지를 통해 알림을 받을 수 있습니다. (미구현)",
} as const;

// 알림 유형 정의
export const NOTIFICATION_TYPES = [
  {
    key: "visitor_alerts" as const,
    icon: "Bell",
    label: LABELS.VISITOR_ALERTS,
    description: LABELS.VISITOR_ALERTS_DESCRIPTION,
    iconColor: "bg-blue-100 text-blue-600",
  },
  {
    key: "system_alerts" as const,
    icon: "Bell",
    label: "시스템 알림",
    description: "공지사항, 긴급 알림, 유지보수 알림을 포함한 모든 시스템 알림",
    iconColor: "bg-gray-100 text-gray-600",
  },
] as const;
