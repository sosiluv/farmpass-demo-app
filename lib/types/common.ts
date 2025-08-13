/**
 * 🏗️ 공통 기본 타입 정의
 *
 * 프로젝트 전체에서 사용되는 기본 타입들을 정의합니다.
 * 중복을 제거하고 일관성을 유지하기 위해 모든 기본 타입은 여기에서 정의됩니다.
 */

import type { Database } from "./supabase";

// ===========================================
// 데이터베이스 기본 타입
// ===========================================

export type Tables = Database["public"]["Tables"];
export type Enums = Database["public"]["Enums"];

// ===========================================
// 기본 엔티티 타입
// ===========================================

/**
 * 사용자 프로필 타입
 */
export type Profile = Tables["profiles"]["Row"];

/**
 * 농장 기본 타입
 */
export type Farm = Tables["farms"]["Row"];

/**
 * 농장 멤버 기본 타입
 */
export type FarmMember = Tables["farm_members"]["Row"];

/**
 * 방문자 기본 타입
 */
export type VisitorEntry = Tables["visitor_entries"]["Row"];

/**
 * 시스템 로그 타입
 */
export type SystemLog = Tables["system_logs"]["Row"];

/**
 * 시스템 설정 타입
 */
export type SystemSetting = Tables["system_settings"]["Row"];

/**
 * 알림 타입
 */
export type Notification = Tables["notifications"]["Row"];

/**
 * 사용자 알림 설정 타입
 */
export type UserNotificationSetting =
  Tables["user_notification_settings"]["Row"];

/**
 * 약관 관리 타입
 */
export type TermManagement = Tables["terms_management"]["Row"];

/**
 * 사용자 동의 타입
 */
export type UserConsent = Tables["user_consents"]["Row"];

// ===========================================
// 공통 열거형 타입
// ===========================================

export type LogLevel = Enums["LogLevel"];
export type UserRole = "admin" | "owner" | "manager" | "viewer";
export type AccountType = "admin" | "user";
export type NotificationMethod = "push" | "kakao";
export type TermType = "privacy" | "privacy_consent" | "terms" | "marketing";

// ===========================================
// 공통 유틸리티 타입
// ===========================================

/**
 * API 응답 기본 구조
 */
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}
