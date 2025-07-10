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
export interface Farm {
  id: string;
  farm_name: string;
  description: string | null;
  farm_address: string;
  farm_detailed_address: string | null;
  farm_type: string | null;
  owner_id: string;
  manager_phone: string | null;
  manager_name: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  // 확장 필드
  owner?: {
    id: string;
    name: string;
    email: string;
  };
}

/**
 * 농장 멤버 기본 타입
 */
export interface FarmMember {
  id: string;
  farm_id: string;
  user_id: string;
  role: "owner" | "manager" | "viewer";
  representative_name: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  // 관계 필드
  users?: {
    id: string;
    name: string;
    email: string;
  };
}

/**
 * 방문자 기본 타입
 */
export interface VisitorEntry {
  id: string;
  farm_id: string;
  visit_datetime: string;
  visitor_name: string;
  visitor_phone: string;
  visitor_address: string;
  visitor_purpose: string | null;
  vehicle_number: string | null;
  notes: string | null;
  disinfection_check: boolean;
  consent_given: boolean;
  session_token: string;
  registered_by?: string;
  created_at: string;
  updated_at?: string;
  profile_photo_url?: string | null;
}

/**
 * 시스템 로그 타입
 */
export type SystemLog = Tables["system_logs"]["Row"];

/**
 * 시스템 설정 타입
 */
export type SystemSetting = Tables["system_settings"]["Row"];

// ===========================================
// 공통 열거형 타입
// ===========================================

export type LogLevel = Enums["LogLevel"];
export type UserRole = "admin" | "owner" | "manager" | "viewer";
export type AccountType = "admin" | "user";
export type NotificationMethod = "push" | "kakao";

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

/**
 * 페이지네이션 정보
 */
export interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

/**
 * 페이지네이션된 응답
 */
export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: PaginationInfo;
}

/**
 * 정렬 옵션
 */
export interface SortOption {
  field: string;
  direction: "asc" | "desc";
}

/**
 * 날짜 범위
 */
export interface DateRange {
  startDate?: string;
  endDate?: string;
}

/**
 * 기본 필터 인터페이스
 */
export interface BaseFilter extends DateRange {
  searchTerm?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  page?: number;
  limit?: number;
}
