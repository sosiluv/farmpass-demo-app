export const VISITOR_CONSTANTS = {
  DEFAULT_SETTINGS: {
    reVisitAllowInterval: 6,
    maxVisitorsPerDay: 100,
    visitorDataRetentionDays: 1095,
    requireVisitorPhoto: false,
    requireVisitorContact: true,
    requireVisitPurpose: true,
  },
  ERROR_MESSAGES: {
    FARM_NOT_FOUND: "농장 정보를 찾을 수 없습니다.",
    REQUIRED_NAME: "성명을 입력해주세요.",
    REQUIRED_CONTACT: "연락처를 입력해주세요.",
    REQUIRED_ADDRESS: "주소를 검색해주세요.",
    REQUIRED_PURPOSE: "방문목적을 선택해주세요.",
    REQUIRED_PHOTO: "방문자 사진을 등록해주세요.",
    REQUIRED_CONSENT: "개인정보 수집에 동의해주세요.",
    UPLOAD_FAILED: "프로필 사진 업로드에 실패했습니다.",
    REGISTRATION_FAILED: "방문자 등록에 실패했습니다. 다시 시도해주세요.",
    INVALID_PHONE: "올바른 전화번호 형식(010-XXXX-XXXX)을 입력해주세요.",
    REVISIT_INTERVAL: (hours: number) =>
      `마지막 방문 후 ${hours}시간이 지나지 않았습니다.`,
    DAILY_LIMIT: (limit: number) =>
      `일일 최대 방문자 수(${limit}명)를 초과했습니다.`,
  },
  LABELS: {
    VISIT_TIME: "출입일시",
    FULL_NAME: "성명",
    PHONE_NUMBER: "연락처",
    ADDRESS: "주소",
    CAR_PLATE: "차량번호",
    VISIT_PURPOSE: "방문목적",
    DISINFECTION: "소독여부",
    NOTES: "비고",
    PROFILE_PHOTO: "프로필 사진",
    CONSENT: "개인정보 수집 및 이용에 동의합니다.",
  },
  PLACEHOLDERS: {
    FULL_NAME: "홍길동",
    PHONE_NUMBER: "010-0000-0000",
    CAR_PLATE: "12가 3456 (선택사항)",
    VISIT_PURPOSE: "점검, 방역, 미팅, 납품 등",
    NOTES: "추가 사항이 있으면 입력해주세요",
  },
};

/**
 * 날짜 범위 라벨 매핑
 */
export const DATE_RANGE_LABELS: Record<string, string> = {
  today: "오늘",
  week: "최근 7일",
  month: "최근 30일",
  custom: "사용자 지정",
  all: "전체",
};
