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

  // 농장 정보
  info: (farmId: string) => [...farmsKeys.all, "info", farmId] as const,
} as const;

/**
 * 관리자 관련 Query Key Factory
 */
export const adminKeys = {
  // 모든 관리자 쿼리
  all: ["admin"] as const,

  // 대시보드 통계 (선택 농장 필터 포함)
  dashboard: (farmId?: string) =>
    [...adminKeys.all, "dashboard", farmId ?? "all"] as const,

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

/**
 * 소셜 연동 관련 Query Key Factory
 */
export const socialLinkingKeys = {
  all: ["social-linking"] as const,
  identities: () => [...socialLinkingKeys.all, "identities"] as const,
  linkStatus: (provider: string) =>
    [...socialLinkingKeys.all, "link-status", provider] as const,
} as const;

/**
 * 약관 관리 관련 Query Key Factory
 */
export const termsKeys = {
  all: ["terms"] as const,

  // 관리자용 약관
  admin: {
    all: () => [...termsKeys.all, "admin"] as const,
    list: (type?: string, isActive?: boolean) =>
      [...termsKeys.all, "admin", "list", type, isActive] as const,
    detail: (id: string) => [...termsKeys.all, "admin", "detail", id] as const,
  },

  // 공개 약관 (회원가입용)
  public: {
    all: () => [...termsKeys.all, "public"] as const,
    list: (type?: string) =>
      [...termsKeys.all, "public", "list", type] as const,
  },

  // 사용자 동의
  consents: {
    all: () => [...termsKeys.all, "consents"] as const,
    list: (userId?: string, termType?: string, agreed?: boolean) =>
      [...termsKeys.all, "consents", "list", userId, termType, agreed] as const,
    user: (userId: string) =>
      [...termsKeys.all, "consents", "user", userId] as const,
  },
} as const;

/**
 * 사용자 동의 관련 Query Key Factory
 */
export const userConsentsKeys = {
  all: ["user-consents"] as const,

  // 사용자 동의 상태 확인
  check: () => [...userConsentsKeys.all, "check"] as const,

  // 사용자 동의 업데이트
  update: () => [...userConsentsKeys.all, "update"] as const,
} as const;

// ===========================================
// 인증 관련 Query Keys 그룹화
// ===========================================

/**
 * 인증 상태 변경 시 관리해야 할 모든 Query Keys
 * AuthProvider에서 사용
 */
export const authRelatedKeys = {
  // 모든 인증 관련 Query Keys
  all: [
    profileKeys.all,
    farmsKeys.all,
    notificationKeys.all,
    visitorsKeys.all,
    adminKeys.all,
    termsKeys.all,
    userConsentsKeys.all,
  ] as const,

  // 사용자별 데이터만 (프로필, 동의 등)
  userSpecific: [
    profileKeys.all,
    userConsentsKeys.all,
    termsKeys.consents.all(),
  ] as const,

  // 관리자 전용 데이터
  adminOnly: [adminKeys.all, termsKeys.admin.all()] as const,
} as const;
