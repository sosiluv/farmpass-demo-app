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

  // 목록 조회 쿼리들
  lists: () => [...visitorsKeys.all, "list"] as const,
  list: (filters: Record<string, any>) =>
    [...visitorsKeys.lists(), { filters }] as const,

  // 무한 스크롤 쿼리들
  infinites: () => [...visitorsKeys.all, "infinite"] as const,
  infinite: (filters: Record<string, any>) =>
    [...visitorsKeys.infinites(), { filters }] as const,

  // 특정 방문자 상세
  details: () => [...visitorsKeys.all, "detail"] as const,
  detail: (id: string) => [...visitorsKeys.details(), id] as const,

  // 농장별 방문자
  farms: () => [...visitorsKeys.all, "farm"] as const,
  farm: (farmId: string, filters?: Record<string, any>) =>
    filters
      ? ([...visitorsKeys.farms(), farmId, { filters }] as const)
      : ([...visitorsKeys.farms(), farmId] as const),

  // 통계 쿼리들
  stats: () => [...visitorsKeys.all, "stats"] as const,
  farmStats: (farmId: string) => [...visitorsKeys.stats(), farmId] as const,
  globalStats: () => [...visitorsKeys.stats(), "global"] as const,
  // 계층적 구조로 통일
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
  lists: () => [...farmsKeys.all, "list"] as const,
  list: (filters?: Record<string, any>) =>
    filters
      ? ([...farmsKeys.lists(), { filters }] as const)
      : ([...farmsKeys.lists()] as const),

  // 특정 농장 상세
  details: () => [...farmsKeys.all, "detail"] as const,
  detail: (id: string) => [...farmsKeys.details(), id] as const,

  // 농장 멤버
  members: () => [...farmsKeys.all, "members"] as const,
  farmMembers: (farmId: string) => [...farmsKeys.members(), farmId] as const,
  memberDetail: (farmId: string, memberId: string) =>
    [...farmsKeys.farmMembers(farmId), memberId] as const,

  // 농장 통계
  stats: () => [...farmsKeys.all, "stats"] as const,
  farmStats: (farmId: string) => [...farmsKeys.stats(), farmId] as const,
  // 계층적 구조로 통일
  info: (farmId: string) => [...farmsKeys.all, "info", farmId] as const,
  farmMembersPreview: (farmIds: string[]) =>
    ["farms", "farmMembersPreview", ...farmIds.sort()] as const,
} as const;

/**
 * 대시보드 관련 Query Key Factory
 */
export const dashboardKeys = {
  // 모든 대시보드 쿼리
  all: ["dashboard"] as const,

  // 전체 통계
  stats: () => [...dashboardKeys.all, "stats"] as const,
  globalStats: () => [...dashboardKeys.stats(), "global"] as const,
  adminStats: () => [...dashboardKeys.stats(), "admin"] as const,

  // 차트 데이터
  charts: () => [...dashboardKeys.all, "charts"] as const,
  chart: (type: string, period?: string) =>
    period
      ? ([...dashboardKeys.charts(), type, period] as const)
      : ([...dashboardKeys.charts(), type] as const),

  // 최근 활동
  activities: () => [...dashboardKeys.all, "activities"] as const,
  recentActivities: (limit?: number) =>
    limit
      ? ([...dashboardKeys.activities(), { limit }] as const)
      : ([...dashboardKeys.activities()] as const),
} as const;

/**
 * 사용자 관련 Query Key Factory
 */
export const usersKeys = {
  all: ["users"] as const,
  lists: () => [...usersKeys.all, "list"] as const,
  list: (filters?: Record<string, any>) =>
    filters
      ? ([...usersKeys.lists(), { filters }] as const)
      : ([...usersKeys.lists()] as const),
  details: () => [...usersKeys.all, "detail"] as const,
  detail: (id: string) => [...usersKeys.details(), id] as const,
  profile: (id: string) => [...usersKeys.all, "profile", id] as const,
} as const;

/**
 * 시스템 설정 관련 Query Key Factory
 */
export const settingsKeys = {
  all: ["settings"] as const,
  system: () => [...settingsKeys.all, "system"] as const,
  general: () => [...settingsKeys.all, "general"] as const,
  notifications: () => [...settingsKeys.all, "notifications"] as const,
  security: () => [...settingsKeys.all, "security"] as const,
  visitor: () => [...settingsKeys.all, "visitor"] as const,
  cache: () => [...settingsKeys.all, "cache"] as const,
  cleanup: () => [...settingsKeys.all, "cleanup"] as const,
  images: () => [...settingsKeys.all, "images"] as const,
  logs: () => [...settingsKeys.all, "logs"] as const,
} as const;

/**
 * 정리 관리 관련 Query Key Factory
 */
export const cleanupKeys = {
  all: ["cleanup"] as const,
  status: () => [...cleanupKeys.all, "status"] as const,
  orphanFiles: () => [...cleanupKeys.all, "orphan-files"] as const,
} as const;

/**
 * 알림 관련 Query Key Factory
 */
export const notificationKeys = {
  all: ["notifications"] as const,
  lists: () => [...notificationKeys.all, "list"] as const,
  list: (filters?: Record<string, any>) =>
    filters
      ? ([...notificationKeys.lists(), { filters }] as const)
      : ([...notificationKeys.lists()] as const),
  details: () => [...notificationKeys.all, "detail"] as const,
  detail: (id: string) => [...notificationKeys.details(), id] as const,
  settings: () => [...notificationKeys.all, "settings"] as const,
  subscriptions: () => [...notificationKeys.all, "subscriptions"] as const,
  subscription: (endpoint?: string) =>
    endpoint
      ? ([...notificationKeys.subscriptions(), endpoint] as const)
      : ([...notificationKeys.subscriptions()] as const),
} as const;

/**
 * 푸시 알림 관련 Query Key Factory
 */
export const pushKeys = {
  all: ["push"] as const,
  vapid: () => [...pushKeys.all, "vapid"] as const,
  subscriptions: () => [...pushKeys.all, "subscriptions"] as const,
  subscription: (endpoint?: string) =>
    endpoint
      ? ([...pushKeys.subscriptions(), endpoint] as const)
      : ([...pushKeys.subscriptions()] as const),
  status: () => [...pushKeys.all, "status"] as const,
} as const;

/**
 * 로그 관련 Query Key Factory
 */
export const logsKeys = {
  all: ["logs"] as const,
  admin: () => [...logsKeys.all, "admin"] as const,
  system: () => [...logsKeys.all, "system"] as const,
  list: (filters?: Record<string, any>) =>
    filters
      ? ([...logsKeys.all, "list", { filters }] as const)
      : ([...logsKeys.all, "list"] as const),
} as const;

/**
 * 계정 관련 Query Key Factory
 */
export const accountKeys = {
  all: ["account"] as const,
  profile: () => [...accountKeys.all, "profile"] as const,
  company: () => [...accountKeys.all, "company"] as const,
  settings: () => [...accountKeys.all, "settings"] as const,
} as const;

/**
 * 프로필 관련 Query Key Factory
 */
export const profileKeys = {
  all: ["profile"] as const,
  detail: (userId: string | undefined) => ["profile", userId] as const,
};

// ===========================================
// Cache Invalidation Helpers
// ===========================================

/**
 * 관련 쿼리 무효화 헬퍼 함수들
 */
export const invalidationHelpers = {
  // 방문자 관련 모든 쿼리 무효화
  invalidateAllVisitors: (queryClient: any) => {
    queryClient.invalidateQueries({ queryKey: visitorsKeys.all });
  },

  // 특정 농장의 방문자 쿼리 무효화
  invalidateFarmVisitors: (queryClient: any, farmId: string) => {
    queryClient.invalidateQueries({ queryKey: visitorsKeys.farm(farmId) });
  },

  // 방문자 통계 무효화
  invalidateVisitorStats: (queryClient: any) => {
    queryClient.invalidateQueries({ queryKey: visitorsKeys.stats() });
    queryClient.invalidateQueries({ queryKey: dashboardKeys.stats() });
  },

  // 농장 관련 모든 쿼리 무효화
  invalidateAllFarms: (queryClient: any) => {
    queryClient.invalidateQueries({ queryKey: farmsKeys.all });
  },

  // 특정 농장 쿼리 무효화
  invalidateFarm: (queryClient: any, farmId: string) => {
    queryClient.invalidateQueries({ queryKey: farmsKeys.detail(farmId) });
    queryClient.invalidateQueries({ queryKey: farmsKeys.farmMembers(farmId) });
    queryClient.invalidateQueries({ queryKey: visitorsKeys.farm(farmId) });
  },

  // 농장 멤버 쿼리 무효화
  invalidateFarmMembers: (queryClient: any, farmId: string) => {
    queryClient.invalidateQueries({ queryKey: farmsKeys.farmMembers(farmId) });
  },

  // 대시보드 쿼리 무효화
  invalidateDashboard: (queryClient: any) => {
    queryClient.invalidateQueries({ queryKey: dashboardKeys.all });
  },
} as const;

// ===========================================
// Query Key 유틸리티
// ===========================================

/**
 * Query Key 일치 여부 확인
 */
export function isKeyMatch(
  key1: readonly any[],
  key2: readonly any[]
): boolean {
  if (key1.length !== key2.length) return false;
  return key1.every((item, index) => {
    if (typeof item === "object" && typeof key2[index] === "object") {
      return JSON.stringify(item) === JSON.stringify(key2[index]);
    }
    return item === key2[index];
  });
}

/**
 * Query Key에서 특정 레벨 추출
 */
export function getKeyLevel<T>(
  key: readonly any[],
  level: number
): T | undefined {
  return key[level] as T;
}

/**
 * Query Key 디버깅 유틸리티
 */
export function debugQueryKey(key: readonly any[]): string {
  return key
    .map((item) =>
      typeof item === "object" ? JSON.stringify(item, null, 2) : String(item)
    )
    .join(" → ");
}

// ===========================================
// 사용 예제
// ===========================================

/**
 * Query Key Factory 사용 예제:
 *
 * ```typescript
 * // 기본 사용법
 * const { data } = useQuery({
 *   queryKey: visitorsKeys.list({ farmId: "123", search: "홍길동" }),
 *   queryFn: fetchVisitors
 * });
 *
 * // 캐시 무효화
 * const queryClient = useQueryClient();
 *
 * // 특정 농장의 모든 방문자 쿼리 무효화
 * queryClient.invalidateQueries({
 *   queryKey: visitorsKeys.farm("farmId123")
 * });
 *
 * // 모든 방문자 통계 무효화
 * invalidationHelpers.invalidateVisitorStats(queryClient);
 *
 * // 특정 쿼리만 정확히 무효화
 * queryClient.removeQueries({
 *   queryKey: visitorsKeys.list({ farmId: "123" })
 * });
 * ```
 *
 * 장점:
 * 1. **타입 안전성**: 컴파일 타임에 오타 방지
 * 2. **일관성**: 모든 곳에서 동일한 키 구조 사용
 * 3. **효율성**: 필요한 쿼리만 정확히 무효화
 * 4. **유지보수성**: 키 구조 변경 시 한 곳에서 관리
 * 5. **디버깅**: 명확한 키 구조로 디버깅 용이
 */
