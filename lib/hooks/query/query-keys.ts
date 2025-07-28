/**
 * 🔑 React Query Key 표준화 및 최적화
 *
 * 일관된 Query Key 패턴으로 캐시 관리 효율성 향상
 * - 계층적 구조로 관련 쿼리 그룹화
 * - 타입 안전성 보장
 * - 캐시 무효화 최적화
 */

// ===========================================
// Query Key Factory Pattern
// ===========================================

/**
 * 방문자 관련 Query Key Factory
 */
export const visitorsKeys = {
  // 모든 방문자 쿼리
  all: ["visitors"] as const,

  // 농장별 방문자
  list: (farmId: string, filters?: Record<string, any>) =>
    filters
      ? ([...visitorsKeys.all, "farm", farmId, { filters }] as const)
      : ([...visitorsKeys.all, "farm", farmId] as const),

  // 세션 및 일일 카운트
  session: (farmId: string) =>
    [...visitorsKeys.all, "session", farmId] as const,
  dailyCount: (farmId: string) =>
    [...visitorsKeys.all, "daily-count", farmId] as const,
} as const;

/**
 * 농장 관련 Query Key Factory
 */
export const farmsKeys = {
  // 모든 농장 쿼리
  all: ["farms"] as const,

  // 목록 조회
  list: (filters?: Record<string, any>) =>
    filters
      ? ([...farmsKeys.all, "list", { filters }] as const)
      : ([...farmsKeys.all, "list"] as const),

  // 농장 멤버
  farmMembers: (farmId: string) =>
    [...farmsKeys.all, "members", farmId] as const,

  // 농장 정보
  info: (farmId: string) => [...farmsKeys.all, "info", farmId] as const,

  // 농장 멤버 미리보기
  farmMembersPreview: (farmIds: string[]) =>
    [...farmsKeys.all, "farmMembersPreview", ...farmIds.sort()] as const,
} as const;

/**
 * 관리자 관련 Query Key Factory
 */
export const adminKeys = {
  // 모든 관리자 쿼리
  all: ["admin"] as const,

  // 대시보드 통계
  dashboard: () => [...adminKeys.all, "dashboard"] as const,

  // 농장 관리
  farms: {
    stats: () => [...adminKeys.all, "farms", "stats"] as const,
    list: () => [...adminKeys.all, "farms", "list"] as const,
  },

  // 사용자 관리
  users: {
    stats: () => [...adminKeys.all, "users", "stats"] as const,
    list: () => [...adminKeys.all, "users", "list"] as const,
  },

  // 로그 관리
  logs: {
    all: () => [...adminKeys.all, "logs"] as const,
    list: (filters?: Record<string, any>) =>
      filters
        ? ([...adminKeys.all, "logs", "list", { filters }] as const)
        : ([...adminKeys.all, "logs", "list"] as const),
    stats: () => [...adminKeys.all, "logs", "stats"] as const,
  },
} as const;

/**
 * 시스템 설정 관련 Query Key Factory
 */
export const settingsKeys = {
  all: ["settings"] as const,
  system: () => [...settingsKeys.all, "system"] as const,
  general: () => [...settingsKeys.all, "general"] as const,
  notifications: () => [...settingsKeys.all, "notifications"] as const,
  visitor: () => [...settingsKeys.all, "visitor"] as const,
  cleanup: {
    status: () => [...settingsKeys.all, "cleanup", "status"] as const,
    orphanFiles: () =>
      [...settingsKeys.all, "cleanup", "orphan-files"] as const,
  },
} as const;

/**
 * 모니터링 관련 Query Key Factory
 */
export const monitoringKeys = {
  all: ["monitoring"] as const,
  health: () => [...monitoringKeys.all, "health"] as const,
  uptime: () => [...monitoringKeys.all, "uptime"] as const,
  analytics: () => [...monitoringKeys.all, "analytics"] as const,
  errors: () => [...monitoringKeys.all, "errors"] as const,
} as const;

/**
 * 알림 관련 Query Key Factory
 */
export const notificationKeys = {
  all: ["notifications"] as const,
  list: (filters?: Record<string, any>) =>
    filters
      ? ([...notificationKeys.all, "list", { filters }] as const)
      : ([...notificationKeys.all, "list"] as const),
  settings: () => [...notificationKeys.all, "settings"] as const,
} as const;

/**
 * 푸시 알림 관련 Query Key Factory
 */
export const pushKeys = {
  all: ["push"] as const,
  vapid: () => [...pushKeys.all, "vapid"] as const,
  status: () => [...pushKeys.all, "status"] as const,
} as const;

/**
 * 프로필 관련 Query Key Factory
 */
export const profileKeys = {
  all: ["profile"] as const,
  detail: (userId: string | undefined) => ["profile", userId] as const,
};
