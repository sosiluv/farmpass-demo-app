import type { Database } from "./supabase";
import { VisitorPurposeStats } from "./index";

export type Profile = Database["public"]["Tables"]["profiles"]["Row"];

export interface Farm {
  id: string;
  farm_name: string;
  farm_type?: string | null;
  farm_address?: string;
  owner_id?: string;
  manager_name?: string | null;
  manager_phone?: string | null;
}

export interface VisitorBase {
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

export interface VisitorWithFarm extends VisitorBase {
  farms?: Farm;
}

export interface VisitorWithProfile extends VisitorBase {
  registered_by_profile?: Pick<
    Profile,
    "name" | "email" | "company_name" | "profile_image_url"
  >;
}

export interface CreateVisitorData {
  farm_id: string;
  visitor_name: string;
  visitor_phone: string;
  visitor_address: string;
  visitor_purpose?: string | null;
  vehicle_number?: string | null;
  notes?: string | null;
  disinfection_check: boolean;
  consent_given: boolean;
  profile_photo_url?: string | null;
}

export interface UpdateVisitorData {
  visitor_name?: string;
  visitor_phone?: string;
  visitor_address?: string;
  visitor_purpose?: string | null;
  vehicle_number?: string | null;
  notes?: string | null;
  disinfection_check?: boolean;
}

export interface VisitorFilter {
  farmId?: string;
  startDate?: string;
  endDate?: string;
  searchTerm?: string;
  disinfectionCheck?: boolean;
  consentGiven?: boolean;
  sortBy?: "visit_datetime" | "visitor_name" | "created_at";
  sortOrder?: "asc" | "desc";
}

export interface VisitorExportOptions extends VisitorFilter {
  format: "csv" | "excel";
  includeFields: Array<keyof VisitorBase>;
  anonymize?: boolean;
}

export interface VisitorSettings {
  reVisitAllowInterval: number;
  maxVisitorsPerDay: number;
  visitorDataRetentionDays: number;
  requireVisitorPhoto: boolean;
  requireVisitorContact: boolean;
  requireVisitPurpose: boolean;
}

export interface VisitorFormData {
  fullName: string;
  phoneNumber: string;
  address: string;
  detailedAddress: string;
  carPlateNumber: string;
  visitPurpose: string;
  disinfectionCheck: boolean;
  notes: string;
  consentGiven: boolean;
  profilePhoto: File | null;
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

export interface VisitorApiResponse {
  success: boolean;
  data?: VisitorWithFarm | VisitorWithFarm[];
  error?: string;
  message?: string;
}

export interface VisitorListApiResponse {
  success: boolean;
  data: {
    visitors: VisitorWithFarm[];
    total: number;
    page: number;
    limit: number;
    hasMore: boolean;
  };
  error?: string;
  message?: string;
}

export interface VisitorStatsApiResponse {
  success: boolean;
  data: VisitorStatistics;
  error?: string;
  message?: string;
}

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

export const visitorSchema = {
  id: "string",
  farm_id: "string",
  visit_datetime: "string",
  visitor_name: "string",
  visitor_phone: "string",
  visitor_address: "string",
  visitor_purpose: "string|null",
  vehicle_number: "string|null",
  notes: "string|null",
  disinfection_check: "boolean",
  consent_given: "boolean",
  session_token: "string",
  registered_by: "string|undefined",
  created_at: "string",
  updated_at: "string|undefined",
  profile_photo_url: "string|null|undefined",
} as const;

export function isVisitorBase(obj: any): obj is VisitorBase {
  return (
    typeof obj === "object" &&
    obj !== null &&
    typeof obj.id === "string" &&
    typeof obj.farm_id === "string" &&
    typeof obj.visit_datetime === "string" &&
    typeof obj.visitor_name === "string" &&
    typeof obj.visitor_phone === "string" &&
    typeof obj.visitor_address === "string" &&
    (obj.visitor_purpose === null || typeof obj.visitor_purpose === "string") &&
    (obj.vehicle_number === null || typeof obj.vehicle_number === "string") &&
    (obj.notes === null || typeof obj.notes === "string") &&
    typeof obj.disinfection_check === "boolean" &&
    typeof obj.consent_given === "boolean" &&
    typeof obj.session_token === "string" &&
    typeof obj.created_at === "string"
  );
}

export function isFarm(obj: any): obj is Farm {
  return (
    typeof obj === "object" &&
    obj !== null &&
    typeof obj.id === "string" &&
    typeof obj.farm_name === "string" &&
    (obj.farm_type === null || typeof obj.farm_type === "string")
  );
}

export type VisitorEntry = VisitorBase;
export type VisitorEntryWithFarm = VisitorWithFarm;
