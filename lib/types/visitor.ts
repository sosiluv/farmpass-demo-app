/**
 * 방문자 관련 타입 정의
 */

import type { VisitorEntry } from "./common";
import type { VisitorPurposeStats } from "./statistics";

// ===========================================
// 방문자 전용 Farm 타입 (간소화된 버전)
// ===========================================

export interface Farm {
  id: string;
  farm_name: string;
  farm_type?: string | null;
  farm_address?: string;
  owner_id?: string;
  manager_name?: string | null;
  manager_phone?: string | null;
}

// Re-export common types for convenience
export type { Profile, VisitorEntry } from "./common";

// Re-export VisitorEntry from common as VisitorBase for backward compatibility
export type { VisitorEntry as VisitorBase } from "./common";

// ===========================================
// 방문자 확장 타입
// ===========================================

/**
 * 농장 정보가 포함된 방문자
 */
export interface VisitorWithFarm extends VisitorEntry {
  farms?: Farm;
}

// ===========================================
// 방문자 폼 데이터 타입
// ===========================================

/**
 * 방문자 생성 데이터
 */
export interface CreateVisitorData {
  farm_id: string;
  visitor_name: string;
  visitor_phone: string;
  visitor_address: string;
  visitor_purpose: string | null;
  vehicle_number: string | null;
  notes: string | null;
  disinfection_check: boolean;
  consent_given: boolean;
  profile_photo_url: string | null;
}

/**
 * 방문자 수정 데이터
 */
export interface UpdateVisitorData {
  visitor_name?: string;
  visitor_phone?: string;
  visitor_address?: string;
  visitor_purpose: string | null;
  vehicle_number: string | null;
  notes: string | null;
  disinfection_check?: boolean;
}

// ===========================================
// 방문자 필터 및 검색 타입
// ===========================================

/**
 * 방문자 필터 (BaseFilter 확장)
 */
export interface VisitorFilter {
  farmId?: string;
  disinfectionCheck?: boolean;
  consentGiven?: boolean;
  sortBy?: "visit_datetime" | "visitor_name" | "created_at";
}

/**
 * 방문자 필터 (레거시 호환성용)
 * @deprecated VisitorFilter 사용 권장
 */
export interface VisitorFilters {
  searchTerm: string;
  farmId?: string;
  dateRange: string; // "all" | "today" | "week" | "month" | "custom"
  dateStart?: string;
  dateEnd?: string;
  disinfectionCheck?: boolean;
  consentGiven?: boolean;
}

/**
 * 방문자 내보내기 옵션
 */
export interface VisitorExportOptions extends VisitorFilter {
  format: "csv" | "excel";
  includeFields: Array<keyof VisitorEntry>;
  anonymize?: boolean;
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

export interface VisitorStatistics {
  total: number;
  today: number;
  thisWeek: number;
  thisMonth: number;
  byPurpose: VisitorPurposeStats[];
  byFarm: Array<{
    farmId: string;
    farmName: string;
    count: number;
  }>;
  byDate: Array<{
    date: string;
    count: number;
  }>;
}

// ===========================================
// API 응답 타입
// ===========================================

export interface VisitorStatsApiResponse {
  success: boolean;
  data: VisitorStatistics;
  error?: string;
  message?: string;
}

// ===========================================
// 컴포넌트 Props 타입
// ===========================================

export interface VisitorTableProps {
  visitors: VisitorWithFarm[];
  loading?: boolean;
  error?: string | null;
  onRefresh?: () => void;
  onEdit?: (visitor: VisitorWithFarm) => void;
  onDelete?: (visitor: VisitorWithFarm) => void;
  onViewDetails?: (visitor: VisitorWithFarm) => void;
}

export interface VisitorFormProps {
  initialData?: Partial<VisitorWithFarm>;
  onSubmit: (data: CreateVisitorData | UpdateVisitorData) => Promise<void>;
  onCancel?: () => void;
  loading?: boolean;
  farms: Farm[];
}

export interface VisitorFiltersProps {
  searchTerm: string;
  selectedFarm: string;
  dateRange: string;
  customStartDate: Date | null;
  customEndDate: Date | null;
  onSearchChange: (value: string) => void;
  onFarmChange: (value: string) => void;
  onDateRangeChange: (value: string) => void;
  onCustomStartDateChange: (date: Date | null) => void;
  onCustomEndDateChange: (date: Date | null) => void;
  farms: Farm[];
  activeFiltersCount: number;
  filteredCount: number;
  totalCount: number;
  onClearFilters: () => void;
  onClearCustomDates?: () => void;
  showFarmFilter?: boolean;
  showAllOption?: boolean;
  isAdmin?: boolean;
}
