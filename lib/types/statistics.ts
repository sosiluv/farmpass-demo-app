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
