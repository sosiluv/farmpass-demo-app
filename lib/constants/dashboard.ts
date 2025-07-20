export const PAGE_HEADER = {
  PAGE_TITLE: "대시보드",
  PAGE_DESCRIPTION: "농장 방문자 현황과 통계를 한눈에 확인하세요",
  BREADCRUMB: "대시보드",
} as const;

// 대시보드 페이지 라벨
export const LABELS = {
  CORE_STATS: "핵심 통계",
  DETAILED_ANALYSIS: "상세 분석",
  // 차트 제목
  VISITOR_TREND_TITLE: "방문자 추이",
  VISITOR_PURPOSE_TITLE: "방문 목적 분포",
  VISITOR_TIME_TITLE: "시간대별 방문자",
  VISITOR_REGION_TITLE: "지역별 방문자",
  WEEKDAY_VISITOR_TITLE: "요일별 방문자",
  // 차트 설명
  VISITOR_TREND_DESCRIPTION: "기간별 방문자 수 변화 추이를 확인하세요",
  VISITOR_PURPOSE_DESCRIPTION: "방문 목적별 비율과 분포 현황",
  VISITOR_TIME_DESCRIPTION: "시간대별 방문자 분포 패턴",
  VISITOR_REGION_DESCRIPTION: "방문자 출신 지역별 분포 현황",
  WEEKDAY_VISITOR_DESCRIPTION: "요일별 방문자 수와 평균 방문 패턴",
  // 농장 선택기
  ALL_FARMS: "전체 농장",
  FARM_SELECT_ADMIN_DESC: "전체 또는 특정 농장의 통계를 확인할 수 있습니다",
  FARM_SELECT_USER_DESC: "관리 중인 농장을 선택하세요",
  // 통계 카드
  TOTAL_VISITORS: "총 방문자",
  TODAY_VISITORS: "오늘 방문자",
  WEEKLY_VISITORS: "이번 주 방문자",
  DISINFECTION_RATE: "소독 실시율",
  TOTAL_VISITORS_DESC: "전체 기간 누적",
  TODAY_VISITORS_DESC: "오늘 방문한 방문자",
  WEEKLY_VISITORS_DESC: "최근 7일간",
  DISINFECTION_RATE_DESC: "전체 방문자 대비",
} as const;

// 플레이스홀더
export const PLACEHOLDERS = {
  FARM_SELECT: "농장을 선택하세요",
} as const;
