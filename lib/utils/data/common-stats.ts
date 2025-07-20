import type { VisitorWithFarm as Visitor } from "@/lib/types/visitor";
import type { VisitorEntry } from "@/lib/types";
import { getRegionFromAddress } from "../system/region";
import {
  getKSTTodayRange,
  toDateString,
  toKSTDate,
} from "@/lib/utils/datetime/date";

/**
 * =================================
 * 📊 통합 통계 시스템 - 로직 & 데이터 계층
 * =================================
 * 디자인은 각 페이지별로 유지하되, 로직과 데이터만 통합 관리
 */

// =================================
// 공통 데이터 타입 정의 (표준화)
// =================================

/**
 * 기본 통계 데이터 (모든 페이지 공통)
 */
export interface BaseStats {
  totalVisitors: number;
  todayVisitors: number;
  weeklyVisitors: number;
  monthlyVisitors: number;
  disinfectionRate: number;
}

/**
 * 확장 통계 데이터 (농장/사용자 정보 포함)
 */
export interface ExtendedStats extends BaseStats {
  totalFarms?: number;
  totalUsers?: number;
  totalLogs?: number;
  activeUsers?: number;
  farmOwners?: number;
  todayLogins?: number;
}

/**
 * 트렌드 데이터 (문자열 기반 - 기존 방문자 시스템용)
 */
export interface TrendData {
  totalVisitorsTrend: string;
  todayVisitorsTrend: string;
  weeklyVisitorsTrend: string;
  monthlyVisitorsTrend: string;
  disinfectionTrend: string;
  userGrowthTrend?: string;
  farmGrowthTrend?: string;
  logGrowthTrend?: string;
}

/**
 * 숫자 기반 트렌드 데이터 (관리 시스템용)
 */
export interface NumericTrendData {
  userGrowth?: number;
  farmGrowth?: number;
  logGrowth?: number;
  activeUsersTrend?: number;
  farmOwnersTrend?: number;
  registrationTrend?: number;
  errorTrend?: number;
  warningTrend?: number;
  infoTrend?: number;
}

/**
 * 차트 데이터 타입 (표준화)
 */
export interface ChartDataPoint {
  label: string;
  value: number;
  percentage?: number;
  color?: string;
}

export interface TimeSeriesData {
  date: string;
  value: number;
  category?: string;
}

export interface DistributionData {
  category: string;
  count: number;
  percentage: number;
}

// =================================
// 방문자 통계 계산 유틸 함수들 (visitor-stats.ts 통합)
// =================================

export interface VisitorStats {
  total: number;
  today: number;
  thisWeek: number;
  thisMonth: number;
  disinfectionRate: number;
}

export interface VisitorStatsOptions {
  visitors: Visitor[];
  showDisinfectionRate?: boolean;
}

/**
 * 기본 방문자 통계 계산
 */
export const calculateVisitorStats = ({
  visitors,
  showDisinfectionRate = true,
}: VisitorStatsOptions): VisitorStats => {
  // KST 기준으로 오늘 범위 계산 (조회용)
  const { start: todayStart, end: todayEnd } = getKSTTodayRange();

  // 7일 전 시작 시간 (KST 기준)
  const weekAgo = new Date(todayStart);
  weekAgo.setDate(weekAgo.getDate() - 7);

  // 30일 전 시작 시간 (KST 기준)
  const monthAgo = new Date(todayStart);
  monthAgo.setDate(monthAgo.getDate() - 30);

  const total = visitors.length;
  const todayCount = visitors.filter((visitor) => {
    // ISO 문자열을 KST로 변환하여 비교
    const visitDate = new Date(visitor.visit_datetime);
    const kstVisitDate = toKSTDate(visitDate);
    return kstVisitDate >= todayStart && kstVisitDate <= todayEnd;
  }).length;

  const weekCount = visitors.filter((visitor) => {
    // ISO 문자열을 KST로 변환하여 비교
    const visitDate = new Date(visitor.visit_datetime);
    const kstVisitDate = toKSTDate(visitDate);
    return kstVisitDate >= weekAgo;
  }).length;

  const monthCount = visitors.filter((visitor) => {
    // ISO 문자열을 KST로 변환하여 비교
    const visitDate = new Date(visitor.visit_datetime);
    const kstVisitDate = toKSTDate(visitDate);
    return kstVisitDate >= monthAgo;
  }).length;

  // 방역 완료율 계산
  const disinfectionRate =
    showDisinfectionRate && visitors.length > 0
      ? Math.round(
          (visitors.filter((v) => v.disinfection_check).length /
            visitors.length) *
            100
        )
      : 0;

  return {
    total,
    today: todayCount,
    thisWeek: weekCount,
    thisMonth: monthCount,
    disinfectionRate,
  };
};

/**
 * 방문자 목적별 통계 계산
 */
export const calculatePurposeStats = (visitors: Visitor[]) => {
  const purposeCounts = visitors.reduce<Record<string, number>>(
    (acc, visitor) => {
      const purpose = visitor.visitor_purpose || "기타";
      acc[purpose] = (acc[purpose] || 0) + 1;
      return acc;
    },
    {}
  );

  return Object.entries(purposeCounts)
    .map(([purpose, count]) => ({
      purpose,
      count,
      percentage: visitors.length > 0 ? (count / visitors.length) * 100 : 0,
    }))
    .sort((a, b) => b.count - a.count);
};

/**
 * 시간대별 방문자 통계 계산 (KST 기준)
 */
export const calculateTimeStats = (visitors: Visitor[]) => {
  const timeCounts = visitors.reduce<Record<string, number>>((acc, visitor) => {
    // ISO 문자열을 KST로 변환 (정확한 방식)
    const visitDate = new Date(visitor.visit_datetime);
    const kstDate = toKSTDate(visitDate);
    const hour = kstDate.getHours();
    const hourStr = `${String(hour).padStart(2, "0")}:00`;
    acc[hourStr] = (acc[hourStr] || 0) + 1;
    return acc;
  }, {});

  // 24시간 전체 데이터 생성 (빈 시간대는 0으로)
  return Array.from({ length: 24 }, (_, i) => {
    const hourStr = `${String(i).padStart(2, "0")}:00`;
    return {
      hour: hourStr,
      count: timeCounts[hourStr] || 0,
    };
  });
};

/**
 * 요일별 방문자 통계 계산 (KST 기준)
 */
export const calculateWeekdayStats = (visitors: Visitor[]) => {
  const weekdayCounts = visitors.reduce<Record<string, number[]>>(
    (acc, visitor) => {
      // ISO 문자열을 KST로 변환 (정확한 방식)
      const visitDate = new Date(visitor.visit_datetime);
      const kstDate = toKSTDate(visitDate);
      const dayIndex = kstDate.getDay();
      const day = ["일", "월", "화", "수", "목", "금", "토"][dayIndex];

      if (!acc[day]) {
        acc[day] = [];
      }
      acc[day].push(1);
      return acc;
    },
    {}
  );

  // 요일 순서대로 정렬
  return ["일", "월", "화", "수", "목", "금", "토"].map((day) => {
    const counts = weekdayCounts[day] || [];
    return {
      day,
      count: counts.length,
      average:
        counts.length > 0
          ? counts.reduce((a, b) => a + b, 0) / counts.length
          : 0,
    };
  });
};

/**
 * 재방문율 통계 계산
 */
export const calculateRevisitStats = (visitors: Visitor[]) => {
  const visitorCounts = visitors.reduce<Record<string, number>>(
    (acc, visitor) => {
      const visitorId = visitor.visitor_phone || visitor.visitor_name;
      acc[visitorId] = (acc[visitorId] || 0) + 1;
      return acc;
    },
    {}
  );

  const uniqueVisitors = Object.keys(visitorCounts).length;
  const repeatVisitors = Object.values(visitorCounts).filter(
    (count) => count > 1
  ).length;
  const newVisitors = uniqueVisitors - repeatVisitors;

  return [
    {
      name: "신규 방문",
      value: newVisitors,
      percentage: uniqueVisitors > 0 ? (newVisitors / uniqueVisitors) * 100 : 0,
    },
    {
      name: "재방문",
      value: repeatVisitors,
      percentage:
        uniqueVisitors > 0 ? (repeatVisitors / uniqueVisitors) * 100 : 0,
    },
  ];
};

/**
 * 트렌드 계산을 위한 기간별 방문자 수 조회 (KST 기준)
 */
export const calculatePeriodVisitors = (
  visitors: Visitor[],
  startDate: Date,
  endDate: Date
): number => {
  return visitors.filter((visitor) => {
    // ISO 문자열을 KST로 변환하여 비교
    const visitDate = new Date(visitor.visit_datetime);
    const kstVisitDate = toKSTDate(visitDate);
    return kstVisitDate >= startDate && kstVisitDate <= endDate;
  }).length;
};

/**
 * 최근 30일 대비 트렌드 계산 (더 실용적인 방식)
 */
export const calculateMonthlyTrend = (visitors: Visitor[]): string => {
  const now = new Date();

  // 최근 30일 범위
  const last30DaysStart = new Date(now);
  last30DaysStart.setDate(now.getDate() - 30);
  last30DaysStart.setHours(0, 0, 0, 0);

  const last30DaysEnd = new Date(now);
  last30DaysEnd.setHours(23, 59, 59, 999);

  // 그 이전 30일 범위 (31~60일 전)
  const previous30DaysStart = new Date(now);
  previous30DaysStart.setDate(now.getDate() - 60);
  previous30DaysStart.setHours(0, 0, 0, 0);

  const previous30DaysEnd = new Date(now);
  previous30DaysEnd.setDate(now.getDate() - 31);
  previous30DaysEnd.setHours(23, 59, 59, 999);

  // 최근 30일 방문자 수 (KST 기준)
  const recentVisitors = visitors.filter((v) => {
    const visitDate = new Date(v.visit_datetime);
    const kstVisitDate = toKSTDate(visitDate);
    return kstVisitDate >= last30DaysStart && kstVisitDate <= last30DaysEnd;
  }).length;

  // 이전 30일 방문자 수 (KST 기준)
  const previousVisitors = visitors.filter((v) => {
    const visitDate = new Date(v.visit_datetime);
    const kstVisitDate = toKSTDate(visitDate);
    return (
      kstVisitDate >= previous30DaysStart && kstVisitDate <= previous30DaysEnd
    );
  }).length;

  // 데이터 상황별 처리
  if (recentVisitors === 0 && previousVisitors === 0) {
    return "방문 없음";
  }

  if (previousVisitors === 0 && recentVisitors > 0) {
    return "첫 기간"; // 이전 기간에는 없었지만 최근에 방문이 있음
  }

  if (previousVisitors > 0 && recentVisitors === 0) {
    return "방문 중단"; // 이전에는 있었지만 최근에는 방문이 없음
  }

  const trendPercentage = Math.round(
    ((recentVisitors - previousVisitors) / previousVisitors) * 100
  );

  const sign = trendPercentage >= 0 ? "+" : "";
  return `${sign}${trendPercentage}%`;
};

/**
 * 전주 대비 트렌드 계산 (개선된 버전)
 */
export const calculateWeeklyTrend = (visitors: Visitor[]): string => {
  const now = new Date();

  // 이번 주 범위 (일요일 기준)
  const dayOfWeek = now.getDay();
  const thisWeekStart = new Date(now);
  thisWeekStart.setDate(now.getDate() - dayOfWeek);
  thisWeekStart.setHours(0, 0, 0, 0);

  const thisWeekEnd = new Date(thisWeekStart);
  thisWeekEnd.setDate(thisWeekStart.getDate() + 6);
  thisWeekEnd.setHours(23, 59, 59, 999);

  // 지난 주 범위
  const lastWeekStart = new Date(thisWeekStart);
  lastWeekStart.setDate(thisWeekStart.getDate() - 7);

  const lastWeekEnd = new Date(thisWeekEnd);
  lastWeekEnd.setDate(thisWeekEnd.getDate() - 7);

  const thisWeekCount = calculatePeriodVisitors(
    visitors,
    thisWeekStart,
    thisWeekEnd
  );
  const lastWeekCount = calculatePeriodVisitors(
    visitors,
    lastWeekStart,
    lastWeekEnd
  );

  // 상황별 처리
  if (thisWeekCount === 0 && lastWeekCount === 0) {
    return "방문 없음";
  }

  if (lastWeekCount === 0 && thisWeekCount > 0) {
    return "첫 주간";
  }

  if (thisWeekCount === 0 && lastWeekCount > 0) {
    return "없음";
  }

  // 변화량 계산
  const difference = thisWeekCount - lastWeekCount;

  if (difference === 0) {
    return "동일";
  } else if (difference > 0) {
    return `+${difference}명`;
  } else {
    return `${difference}명`;
  }
};

/**
 * 전일 대비 트렌드 계산 (실제 숫자 변화 표시)
 */
export const calculateDailyTrend = (visitors: Visitor[]): string => {
  const now = new Date();

  // KST 기준으로 오늘과 어제 범위 계산 (조회용)
  const { start: todayStart, end: todayEnd } = getKSTTodayRange();

  // 어제 범위 (KST 기준)
  const yesterdayStart = new Date(todayStart);
  yesterdayStart.setDate(todayStart.getDate() - 1);
  const yesterdayEnd = new Date(todayEnd);
  yesterdayEnd.setDate(todayEnd.getDate() - 1);

  const todayCount = calculatePeriodVisitors(visitors, todayStart, todayEnd);
  const yesterdayCount = calculatePeriodVisitors(
    visitors,
    yesterdayStart,
    yesterdayEnd
  );

  // 변화량 계산
  const difference = todayCount - yesterdayCount;

  // 상황별 표시
  if (difference === 0) {
    if (todayCount === 0) {
      return "방문 없음";
    } else {
      return "동일"; // 어제와 같은 수
    }
  } else if (difference > 0) {
    if (yesterdayCount === 0) {
      return `첫 방문 ${todayCount}명`;
    } else {
      return `+${difference}명`;
    }
  } else {
    if (todayCount === 0) {
      return "없음";
    } else {
      return `${difference}명`; // 음수이므로 -가 자동으로 붙음
    }
  }
};

/**
 * 방역 완료율 트렌드 계산 (전체 데이터 기준)
 */
export const calculateDisinfectionTrend = (visitors: Visitor[]): string => {
  // 방문자 데이터가 없는 경우
  if (visitors.length === 0) {
    return "데이터 없음";
  }

  // 전체 방역 완료율 계산
  const totalRate =
    (visitors.filter((v) => v.disinfection_check).length / visitors.length) *
    100;

  // 전체 방역 완료율 기준으로 등급 판정
  if (totalRate >= 95) {
    return "우수";
  } else if (totalRate >= 80) {
    return "양호";
  } else if (totalRate >= 60) {
    return "보통";
  } else {
    return "개선필요";
  }
};

/**
 * =================================
 * 핵심 통합 계산 함수들
 * =================================

/**
 * 기본 통계 계산 (모든 페이지 공통)
 */
export const calculateUnifiedBaseStats = (
  visitors: Visitor[] | VisitorEntry[]
): BaseStats => {
  // 안전한 방문자 데이터 처리
  const visitorData = (visitors || []) as any[];
  const stats = calculateVisitorStats({ visitors: visitorData });
  return {
    totalVisitors: stats.total,
    todayVisitors: stats.today,
    weeklyVisitors: stats.thisWeek,
    monthlyVisitors: stats.thisMonth,
    disinfectionRate: stats.disinfectionRate,
  };
};

/**
 * 통합 트렌드 계산 (문자열 기반)
 */
export const calculateUnifiedTrends = (
  visitors: Visitor[] | VisitorEntry[]
): TrendData => {
  // 안전한 방문자 데이터 처리
  const visitorData = (visitors || []) as any[];
  return {
    totalVisitorsTrend: calculateMonthlyTrend(visitorData),
    todayVisitorsTrend: calculateDailyTrend(visitorData),
    weeklyVisitorsTrend: calculateWeeklyTrend(visitorData),
    monthlyVisitorsTrend: calculateMonthlyTrend(visitorData),
    disinfectionTrend: calculateDisinfectionTrend(visitorData),
  };
};

/**
 * 통합 차트 데이터 계산
 */
export const calculateUnifiedChartData = (
  visitors: Visitor[] | VisitorEntry[]
) => {
  // 안전한 방문자 데이터 처리
  const visitorData = (visitors || []) as any[];

  // 방문 목적 통계 (표준화)
  const purposeStats = calculatePurposeStats(visitorData).map((stat) => ({
    category: stat.purpose,
    count: stat.count,
    percentage: stat.percentage,
  }));

  // 시간대별 통계 (표준화)
  const timeStats = calculateTimeStats(visitorData).map((stat) => ({
    label: stat.hour,
    value: stat.count,
  }));

  // 요일별 통계 (표준화)
  const weekdayStats = calculateWeekdayStats(visitorData).map((stat) => ({
    label: stat.day,
    value: stat.count,
  }));

  // 지역별 통계 (표준화) - region.ts 유틸리티 사용
  const regionStats = visitorData
    .reduce<{ region: string; count: number }[]>((acc, visitor) => {
      // region.ts의 getRegionFromAddress 함수 사용으로 정확한 지역 분류
      const region = getRegionFromAddress(visitor.visitor_address || "");

      const existing = acc.find((r) => r.region === region);
      if (existing) {
        existing.count++;
      } else {
        acc.push({ region, count: 1 });
      }
      return acc;
    }, [])
    .map((item) => ({
      category: item.region,
      count: item.count,
      percentage:
        visitorData.length > 0 ? (item.count / visitorData.length) * 100 : 0,
    }))
    .sort((a, b) => b.count - a.count);

  // 방문자 트렌드 (표준화) - KST 기준으로 날짜 처리
  const visitorTrend = visitorData
    .reduce<{ date: string; count: number }[]>((acc, visitor) => {
      // ISO 문자열을 KST로 변환 (정확한 방식)
      const visitDate = new Date(visitor.visit_datetime);
      const kstDate = toKSTDate(visitDate);
      const date = toDateString(kstDate);

      const existing = acc.find((d) => d.date === date);
      if (existing) {
        existing.count++;
      } else {
        acc.push({ date, count: 1 });
      }
      return acc;
    }, [])
    .map((item) => ({
      date: item.date,
      value: item.count,
    }))
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  return {
    visitorTrend,
    purposeStats,
    timeStats,
    regionStats,
    weekdayStats,
  };
};

/**
 * =================================
 * 인사이트 계산 함수들
 * =================================
 */

/**
 * 평균 일일 방문자 계산
 */
export const calculateDailyAverage = (totalVisitors: number): number => {
  if (totalVisitors === 0) return 0;

  // 최소 30일, 최대 365일로 제한하여 현실적인 평균 계산
  const assumedDays = Math.min(Math.max(30, totalVisitors), 365);
  return Math.round((totalVisitors / assumedDays) * 10) / 10; // 소수점 1자리
};

/**
 * 활성도 지수 계산
 */
export const calculateActivityIndex = (
  todayVisitors: number,
  totalVisitors: number
): number => {
  const dailyAverage = calculateDailyAverage(totalVisitors);
  if (dailyAverage === 0) return 0;

  return Math.round((todayVisitors / dailyAverage) * 100);
};

/**
 * =================================
 * 페이지별 어댑터 함수들 (기존 함수들과 호환)
 * =================================
 */

/**
 * 대시보드용 통계 생성 (기존 createDashboardStatsWithTrends 대체)
 */
export const generateDashboardStats = (
  visitors: Visitor[] | VisitorEntry[]
) => {
  const stats = calculateUnifiedBaseStats(visitors || []);
  const trends = calculateUnifiedTrends(visitors || []);

  return {
    totalVisitors: stats.totalVisitors,
    todayVisitors: stats.todayVisitors,
    weeklyVisitors: stats.weeklyVisitors,
    monthlyVisitors: stats.monthlyVisitors,
    disinfectionRate: stats.disinfectionRate,
    trends,
  };
};

/**
 * 방문자 기록 페이지용 통계 생성 (기존 createVisitorStatsForCardsWithTrends 대체)
 */
export const generateVisitorPageStats = (
  visitors: Visitor[] | VisitorEntry[],
  options: {
    totalFarms: number;
    showFarmCount?: boolean;
    showDisinfectionRate?: boolean;
  }
) => {
  const stats = calculateUnifiedBaseStats(visitors || []);
  const trends = calculateUnifiedTrends(visitors || []);

  return {
    totalVisitors: stats.totalVisitors,
    todayVisitors: stats.todayVisitors,
    totalFarms: options.showFarmCount ? options.totalFarms : undefined,
    disinfectionRate: options.showDisinfectionRate
      ? stats.disinfectionRate
      : undefined,
    trends: {
      totalVisitorsTrend: trends.totalVisitorsTrend,
      todayVisitorsTrend: trends.todayVisitorsTrend,
      disinfectionTrend: options.showDisinfectionRate
        ? trends.disinfectionTrend
        : undefined,
    },
  };
};

/**
 * 농장별 방문자 페이지용 통계 생성
 */
export const generateFarmVisitorPageStats = (
  visitors: Visitor[] | VisitorEntry[],
  options: {
    showDisinfectionRate?: boolean;
  } = {}
) => {
  const stats = calculateUnifiedBaseStats(visitors || []);
  const trends = calculateUnifiedTrends(visitors || []);

  return {
    totalVisitors: stats.totalVisitors,
    todayVisitors: stats.todayVisitors,
    disinfectionRate: options.showDisinfectionRate
      ? stats.disinfectionRate
      : undefined,
    trends: {
      totalVisitorsTrend: trends.totalVisitorsTrend,
      todayVisitorsTrend: trends.todayVisitorsTrend,
      disinfectionTrend: options.showDisinfectionRate
        ? trends.disinfectionTrend
        : undefined,
    },
  };
};

/**
 * =================================
 * 관리 시스템용 통계 타입들
 * =================================
 */

/**
 * 사용자 관리 통계
 */
export interface UserManagementStats {
  totalUsers: number;
  activeUsers: number;
  farmOwners: number;
  todayLogins: number;
  trends: NumericTrendData;
}

/**
 * 농장 관리 통계
 */
export interface FarmManagementStats {
  totalFarms: number;
  totalOwners: number;
  totalRegions: number;
  monthlyRegistrations: number;
  trends: NumericTrendData;
}

/**
 * 로그 관리 통계
 */
export interface LogManagementStats {
  totalLogs: number;
  errorLogs: number;
  warningLogs: number;
  infoLogs: number;
  trends: NumericTrendData;
  logTrends: NumericTrendData; // 로그별 세부 트렌드
}

/**
 * 통합 관리 시스템 통계 카드 설정
 */
export interface ManagementStatCardConfig {
  title: string;
  value: string | number;
  description: string;
  variant: "default" | "success" | "warning" | "info";
  trend?: number; // 숫자 기반 트렌드
  icon?: string;
}

/**
 * =================================
 * 관리 시스템용 통합 함수들
 * =================================
 */

/**
 * 사용자 관리 통계 카드 생성
 */
export const generateUserManagementStats = (
  stats: UserManagementStats
): ManagementStatCardConfig[] => {
  return [
    {
      title: "전체 사용자",
      value: stats.totalUsers.toLocaleString(),
      description: "시스템 전체 사용자 수",
      variant: "info",
      trend: stats.trends.userGrowth,
      icon: "users",
    },
    {
      title: "활성 사용자",
      value: stats.activeUsers.toLocaleString(),
      description: "현재 활성 상태인 사용자",
      variant: "success",
      trend: stats.trends.activeUsersTrend,
      icon: "user-check",
    },
    {
      title: "농장 소유자",
      value: stats.farmOwners.toLocaleString(),
      description: "농장 소유자 권한 사용자",
      variant: "warning",
      trend: stats.trends.farmOwnersTrend,
      icon: "building",
    },
    {
      title: "오늘 로그인",
      value: stats.todayLogins.toLocaleString(),
      description: "오늘 로그인한 사용자",
      variant: "default",
      trend: stats.trends.userGrowth, // 로그인 트렌드가 없으면 사용자 증가율 사용
      icon: "clock",
    },
  ];
};

/**
 * 농장 관리 통계 카드 생성
 */
export const generateFarmManagementStats = (
  stats: FarmManagementStats
): ManagementStatCardConfig[] => {
  return [
    {
      title: "전체 농장",
      value: stats.totalFarms.toLocaleString(),
      description: "등록된 전체 농장 수",
      variant: "info",
      trend: stats.trends.farmGrowth,
      icon: "building",
    },
    {
      title: "농장 소유자",
      value: stats.totalOwners.toLocaleString(),
      description: "농장 소유자 수",
      variant: "success",
      trend: stats.trends.farmOwnersTrend,
      icon: "users",
    },
    {
      title: "지역 수",
      value: stats.totalRegions.toLocaleString(),
      description: "등록된 농장 지역",
      variant: "warning",
      trend: stats.trends.farmGrowth, // 지역은 농장 증가와 연관
      icon: "map-pin",
    },
    {
      title: "이달 등록",
      value: stats.monthlyRegistrations.toLocaleString(),
      description: "이번 달 신규 등록",
      variant: "default",
      trend: stats.trends.registrationTrend,
      icon: "calendar",
    },
  ];
};

/**
 * 로그 관리 통계 카드 생성
 */
export const generateLogManagementStats = (
  stats: LogManagementStats
): ManagementStatCardConfig[] => {
  return [
    {
      title: "총 로그",
      value: stats.totalLogs.toLocaleString(),
      description: "전체 시스템 로그 수",
      variant: "info",
      trend: stats.trends.logGrowth,
      icon: "file-text",
    },
    {
      title: "오류",
      value: stats.errorLogs.toLocaleString(),
      description: "오류 로그 수",
      variant: "default",
      trend: stats.logTrends.errorTrend,
      icon: "alert-circle",
    },
    {
      title: "경고",
      value: stats.warningLogs.toLocaleString(),
      description: "경고 로그 수",
      variant: "warning",
      trend: stats.logTrends.warningTrend,
      icon: "alert-triangle",
    },
    {
      title: "정보",
      value: stats.infoLogs.toLocaleString(),
      description: "정보 로그 수",
      variant: "success",
      trend: stats.logTrends.infoTrend,
      icon: "info",
    },
  ];
};
