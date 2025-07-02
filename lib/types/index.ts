import type { Database } from "./supabase";

// 기본 데이터베이스 테이블 타입
export type Tables = Database["public"]["Tables"];
export type Profile = Tables["profiles"]["Row"];
export type Farm = Database["public"]["Tables"]["farms"]["Row"];
export type FarmMember = Tables["farm_members"]["Row"] & {
  email: Tables["profiles"]["Row"]["email"];
  representative_name: Tables["profiles"]["Row"]["name"];
  profile_image_url: Tables["profiles"]["Row"]["profile_image_url"];
};
export type VisitorEntry = Tables["visitor_entries"]["Row"];
export type SystemLog = Tables["system_logs"]["Row"];
export type SystemSetting = Tables["system_settings"]["Row"];

// Enum 타입
export type Enums = Database["public"]["Enums"];
export type LogLevel = Enums["LogLevel"];

// 공통 타입
export type UserRole = "admin" | "owner" | "manager" | "viewer";
export type AccountType = "admin" | "user";

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
  VisitorWithProfile,
  VisitorFilter,
  VisitorExportOptions,
} from "./visitor";

// 알림 관련 타입
export type {
  Notification,
  NotificationPreference,
  NotificationPayload,
  NotificationFilter,
} from "./notification";

export interface ExtendedFarm extends Farm {
  owner_name: string;
  member_count: number;
  visitor_count: number;
}
