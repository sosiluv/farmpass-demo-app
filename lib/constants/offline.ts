// 오프라인 페이지 관련 상수
export const OFFLINE_LABELS = {
  // 페이지 제목
  PAGE_TITLE_ONLINE: "연결 확인 중...",
  PAGE_TITLE_OFFLINE: "오프라인 상태",

  // 설명 텍스트
  DESCRIPTION_ONLINE:
    "인터넷 연결이 복구되었습니다. 잠시 후 홈페이지로 이동합니다.",
  DESCRIPTION_OFFLINE:
    "인터넷 연결을 확인해주세요. 네트워크 상태를 점검한 후 다시 시도해주세요.",

  // 확인 사항 제목
  CHECKLIST_TITLE: "확인해보세요:",

  // 확인 사항 목록
  CHECKLIST_ITEMS: {
    WIFI: "• Wi-Fi 또는 모바일 데이터가 켜져 있는지 확인",
    WEBSITE: "• 다른 웹사이트가 정상적으로 작동하는지 확인",
    SETTINGS: "• 네트워크 설정을 다시 확인",
  },

  // 버튼 텍스트
  BUTTONS: {
    RETRY_CHECKING: "확인 중...",
    RETRY: "다시 시도",
    GO_HOME: "홈으로",
  },

  // 하단 안내 텍스트
  FOOTER_NOTE: "오프라인 상태에서는 일부 기능이 제한될 수 있습니다.",
} as const;

export const OFFLINE_PLACEHOLDERS = {
  // 플레이스홀더가 필요한 경우 추가
} as const;
