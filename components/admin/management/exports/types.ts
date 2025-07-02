// 기본 내보내기 옵션 타입
export interface BaseExportOptions {
  startDate?: string;
  endDate?: string;
  [key: string]: any;
}

// 필터 옵션 타입
export interface FilterOption {
  value: string;
  label: string;
}

// 필터 설정 타입
export interface FilterConfig {
  key: string;
  label: string;
  value: string;
  options: FilterOption[];
  onChange: (value: string) => void;
}

// 내보내기 옵션 타입
export interface ExportOption {
  key: string;
  label: string;
  description?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}

// 유효성 검사 결과 타입
export interface ValidationResult {
  isValid: boolean;
  message?: string;
}

// 유효성 검사 함수 타입
export type ValidationFunction<T> = (options: T) => ValidationResult;

// 내보내기 함수 타입
export type ExportFunction<T> = (options: T) => Promise<void>;

// 색상 타입
export type ColorVariant = "blue" | "green" | "orange" | "purple";

// 사용자 내보내기 옵션
export interface UsersExportOptions {
  roleFilter: string;
  statusFilter: string;
  includeBasic: boolean;
  includeContact: boolean;
  includeActivity: boolean;
  includeFarms: boolean;
  includePermissions: boolean;
}

// 농장 내보내기 옵션
export interface FarmsExportOptions extends BaseExportOptions {
  farmType: string;
  status: string;
  includeBasic: boolean;
  includeContact: boolean;
  includeLocation: boolean;
  includeMembers: boolean;
  includeStats: boolean;
}

// 로그 내보내기 옵션
export interface LogsExportOptions extends BaseExportOptions {
  levelFilter: string;
  categoryFilter: string;
  auditFilter: string;
  includeBasic: boolean;
  includeUser: boolean;
  includeSystem: boolean;
  includeMetadata: boolean;
}

// 방문자 내보내기 옵션
export interface VisitorsExportOptions extends BaseExportOptions {
  farmFilter: string;
  visitorType: string;
  includeBasic: boolean;
  includeContact: boolean;
  includeVisit: boolean;
  includeExtra: boolean;
}
