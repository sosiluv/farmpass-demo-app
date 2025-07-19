/**
 * 로그 카테고리 정의 (최소화 버전)
 * getLogCategory 함수와 일치하는 카테고리 목록
 */

export const LOG_CATEGORIES = [
  { value: "all", label: "모든 카테고리", icon: "" },
  { value: "auth", label: "인증", icon: "🔐" },
  { value: "farm", label: "농장", icon: "🏡" },
  { value: "visitor", label: "방문자", icon: "👥" },
  { value: "member", label: "멤버", icon: "👨‍💼" },
  { value: "notification", label: "알림", icon: "🔔" },
  { value: "system", label: "시스템", icon: "🔧" },
] as const;

// 아이콘 없는 버전 (내보내기 등에서 사용)
export const LOG_CATEGORIES_NO_ICON = LOG_CATEGORIES.map(
  ({ value, label }) => ({
    value,
    label,
  })
);

// 카테고리 값 타입
export type LogCategory = (typeof LOG_CATEGORIES)[number]["value"];

// 카테고리별 설명
export const LOG_CATEGORY_DESCRIPTIONS: Record<LogCategory, string> = {
  all: "모든 카테고리의 로그",
  auth: "로그인, 로그아웃, 계정 관리 관련",
  farm: "농장 생성, 수정, 삭제 관련",
  visitor: "방문자 등록, 관리 관련",
  member: "농장 구성원 관리 관련",
  notification: "푸시 알림 관련",
  system: "기타 시스템 관련 (설정, 보안, 파일, 모니터링 등)",
};
