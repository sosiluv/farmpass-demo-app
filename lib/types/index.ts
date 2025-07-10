/**
 * 🏗️ 메인 타입 정의 모듈
 *
 * 프로젝트에서 사용되는 모든 타입들의 중앙 집중 관리
 */

// ===========================================
// 공통 기본 타입 (최우선 import)
// ===========================================

export type {
  // 데이터베이스 기본 타입
  Tables,
  Enums,
  Profile,
  Farm,
  FarmMember,
  VisitorEntry,
  SystemLog,
  SystemSetting,

  // 공통 열거형
  LogLevel,
  UserRole,
  AccountType,
  NotificationMethod,

  // 공통 유틸리티 타입
  ApiResponse,
  PaginationInfo,
  PaginatedResponse,
  SortOption,
  DateRange,
  BaseFilter,
} from "./common";

// ===========================================
// 도메인별 타입 (알파벳 순서)
// ===========================================

// 계정 관련 타입
export type {
  ProfileFormData,
  CompanyFormData,
  PasswordFormData,
  ProfileSectionProps,
  CompanySectionProps,
  SecuritySectionProps,
} from "./account";

// 농장 관련 타입
export type {
  FarmFormValues,
  MemberWithProfile,
  FarmMembers,
  FarmStats,
} from "./farm";

// 알림 관련 타입
export type {
  Notification,
  NotificationSettings,
  UpdateNotificationSettingsDTO,
  NotificationPreference,
  SubscriptionStatus,
  PushSubscriptionData,
  NotificationPayload,
  NotificationFilter,
} from "./notification";

// 통계 관련 타입
export type {
  AdminStats,
  FarmStatistics,
  RoleStatistics,
  VisitorStats,
  VisitorPurposeStats,
  WeekdayStats,
  RevisitStats,
  DashboardStats,
} from "./statistics";

// 방문자 관련 타입
export type {
  VisitorWithFarm,
  VisitorWithProfile,
  CreateVisitorData,
  UpdateVisitorData,
  VisitorFilter,
  VisitorFilters,
  VisitorExportOptions,
  VisitorSettings,
  VisitorStatistics,
  VisitorApiResponse,
  VisitorListApiResponse,
  VisitorStatsApiResponse,
  VisitorTableProps,
  VisitorFormProps,
  VisitorFiltersProps,
} from "./visitor";

// ===========================================
// 레거시 호환성 (필요시에만 유지)
// ===========================================

// 기존 코드 호환성을 위한 타입 별칭
export type { VisitorEntry as VisitorBase } from "./common";
