import type { UserRole } from "./index";

export interface AdminStats {
  todayLogins: number;
  todayFarms: number;
  todayVisitors: number;
  todayQRScans: number;
  hasErrors: boolean;
  totalUsers: number;
  activeUsers: number;
  inactiveUsers: number;
  systemAdmins: number;
  farmOwners: number;
}

export interface FarmStatistics {
  id: string;
  farm_id: string;
  total_visitors: number;
  recent_visitors: number;
  member_count: number;
  manager_count: number;
  viewer_count: number;
  disinfection_rate: number;
  created_at: string;
  updated_at: string;
}

export interface RoleStatistics {
  role_type: string;
  user_count: number;
  role_code: UserRole | "general";
}

export interface VisitorStats {
  date: string;
  visitors: number;
  disinfectionRate: number;
}

export interface VisitorPurposeStats {
  purpose: string;
  count: number;
  percentage: number;
}

export interface WeekdayStats {
  day: string;
  count: number;
  average: number;
}

export interface RevisitStats {
  name: string;
  value: number;
  percentage: number;
}

export interface DashboardStats {
  totalVisitors: number;
  todayVisitors: number;
  weeklyVisitors: number;
  disinfectionRate: number;
  trends: {
    totalVisitorsTrend: string;
    todayVisitorsTrend: string;
    weeklyVisitorsTrend: string;
    disinfectionTrend: string;
  };
}
