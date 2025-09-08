/**
 * 방문자 관련 타입 정의
 */

import type { VisitorEntry, Farm } from "./common";

/**
 * 농장 정보가 포함된 방문자
 */
export interface VisitorWithFarm extends VisitorEntry {
  farms?: Farm;
}

// ===========================================
// 방문자 필터 및 검색 타입
// ===========================================

export interface VisitorFilters {
  searchTerm: string;
  farmId?: string;
  dateRange: string; // "all" | "today" | "week" | "month" | "custom"
  dateStart?: string;
  dateEnd?: string;
}

// ===========================================
// 방문자 설정 및 통계 타입
// ===========================================

export interface VisitorSettings {
  reVisitAllowInterval: number;
  maxVisitorsPerDay: number;
  visitorDataRetentionDays: number;
  requireVisitorPhoto: boolean;
  requireVisitorContact: boolean;
  requireVisitPurpose: boolean;
}
