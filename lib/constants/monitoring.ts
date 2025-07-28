// 시스템 모니터링 페이지 라벨
export const PAGE_HEADER = {
  PAGE_TITLE: "시스템 모니터링",
  PAGE_DESCRIPTION:
    "서버 상태, 가동시간, 에러 로그를 실시간으로 모니터링하세요",
  BREADCRUMB: "시스템 모니터링",

  ANALYTICS_TITLE: "방문자 통계",
  RECENT_ERRORS: "최근 에러",
  SYSTEM_STATUS: "시스템 상태",
  TECH_STACK: "개발 스택",
  UPTIME: "가동시간",
} as const;

export const LABELS = {
  ERROR_TITLE: "Error",
  // AnalyticsCard
  VISITORS: "방문자",
  VISITORS_DESC: "고유 방문자 수",
  PAGEVIEWS: "페이지뷰",
  PAGEVIEWS_DESC: "총 조회 수",
  SESSIONS: "세션 수",
  SESSIONS_DESC: "총 세션(방문) 횟수",
  NEW_USERS: "신규 방문자",
  NEW_USERS_DESC: "7일간 새로 방문한 사용자",
  BOUNCE_RATE: "이탈률",
  BOUNCE_RATE_DESC: "한 페이지만 보고 떠난 비율",
  AVG_SESSION_TIME: "평균 세션 시간",
  AVG_SESSION_TIME_DESC: "세션당 평균 체류시간",

  // AnalyticsCard 에러 메시지
  GA_DATA_ERROR: "Google Analytics 데이터를 불러올 수 없습니다.",
  GA_CONFIG_NOT_FOUND:
    "Google Analytics 설정이 완료되지 않았습니다. 환경 변수를 확인해주세요.",
  GA_JSON_PARSE_ERROR:
    "Google Analytics 서비스 계정 키 JSON 형식이 올바르지 않습니다.",
  GA_CREDENTIALS_INVALID:
    "Google Analytics 서비스 계정 키에 필수 필드가 누락되었습니다.",
  GA_API_ERROR:
    "Google Analytics API 호출에 실패했습니다. 권한을 확인해주세요.",
  DETAILED_ERROR: "상세 오류:",

  // ErrorLogsCard
  TOTAL_ERRORS: "총 {count}건",
  LOADING_ERRORS: "에러 로그를 불러오는 중입니다.",
  NO_RECENT_ERRORS: "최근 발생한 에러가 없습니다.",
  ALL_SYSTEMS_NORMAL: "모든 시스템이 정상적으로 작동 중입니다.",

  // SystemStatusCard
  LOADING_SYSTEM_STATUS: "데이터를 불러오는 중...",
  SYSTEM_STATUS_LOADING: "시스템 상태 정보를 불러오고 있습니다.",
  LAST_UPDATE: "마지막 업데이트: {datetime}",
  CPU: "CPU",
  CPU_USAGE: "사용량: {percent}%",
  CPU_USER: "User: {percent}%",
  CPU_SYSTEM: "System: {percent}%",
  MEMORY: "메모리",
  MEMORY_USED: "사용: {used}MB",
  MEMORY_TOTAL: "전체: {total}MB",
  MEMORY_EXTERNAL: "External: {external}MB",
  RESPONSE_TIME: "응답 시간",
  SERVER_STATUS: "서버 상태:",
  SYSTEM_INFO: "시스템 정보",
  NODE_VERSION: "Node: {version}",
  OS_INFO: "OS: {platform} ({arch})",

  // SystemStatusCard 상태
  STATUS_NORMAL: "정상",
  STATUS_UNHEALTHY: "비정상",
  STATUS_WARNING: "주의",
  STATUS_UNKNOWN: "알 수 없음",

  // TechStackCard
  TECH_STACK_DESC: "현재 사용 중인 기술 스택 정보",
  FRAMEWORK: "Framework",
  RUNTIME: "Runtime",
  REACT: "React",
  TYPESCRIPT: "TypeScript",
  DATABASE: "Database",
  AUTHENTICATION: "Authentication",
  DEPLOYMENT: "Deployment",
  UI: "UI",
  STATE: "State",
  MONITORING: "Monitoring",
  ANALYTICS: "Analytics",

  // UptimeCard
  UPTIME_DATA_ERROR: "UptimeRobot 데이터를 불러올 수 없습니다.",
  UPTIME_API_KEY_NOT_CONFIGURED:
    "UptimeRobot API 키가 설정되지 않았습니다. 환경 변수를 확인해주세요.",
  UPTIME_API_ERROR:
    "UptimeRobot API 호출에 실패했습니다. API 키와 권한을 확인해주세요.",
  NO_UPTIME_DATA: "가동시간 모니터링 데이터가 없습니다.",
  UPTIME_RATIO: "가동률: {ratio}%",
  UPTIME_30_DAYS: "(30일)",
  NORMAL: "정상",
  ISSUE_DETECTED: "문제 발생",
  MONITOR_ID: "ID: {id}",
  CHECK_INTERVAL: "체크: {interval}",
  CREATED: "생성: {time}",
  UNKNOWN_TIME: "알 수 없음",
  TODAY: "오늘",
  YESTERDAY: "어제",
  DAYS_AGO: "{days}일 전",
  WEEKS_AGO: "{weeks}주 전",
  MONTHS_AGO: "{months}개월 전",

  // 시간 단위
  SECONDS: "초",
  MINUTES: "분",
  HOURS: "시간",
  DAYS: "일",

  // 권한 확인
  CHECKING_PERMISSION: "권한을 확인하는 중...",
} as const;
