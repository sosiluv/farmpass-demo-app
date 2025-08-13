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
} from "./common";

// ===========================================
// 도메인별 타입 (알파벳 순서)
// ===========================================

// 농장 관련 타입
export type {
  MemberWithProfile,
  FarmMembers,
  AddMemberData,
  UpdateMemberData,
} from "./farm";

export type { CleanupResult } from "./system";

// 알림 관련 타입
export type {
  SubscriptionStatus,
  NotificationsFilters,
  SubscriptionCleanupOptions,
  SubscriptionCleanupResult,
} from "./notification";

// 방문자 관련 타입
export type {
  VisitorWithFarm,
  VisitorFilters,
  VisitorSettings,
} from "./visitor";
