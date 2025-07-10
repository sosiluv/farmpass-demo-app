/**
 * 날짜/시간 포맷팅 유틸리티
 *
 * 여러 페이지에서 사용되는 공통 날짜/시간 처리 로직을 모아둔 유틸리티입니다.
 */

/**
 * 한국 시간대로 날짜/시간 포맷팅
 * @param date 포맷팅할 날짜
 * @param options 포맷 옵션
 * @returns 포맷된 날짜/시간 문자열
 */
export const formatDateTime = (
  date: string | Date,
  options?: Intl.DateTimeFormatOptions
): string => {
  const dateObj = typeof date === "string" ? new Date(date) : date;

  const defaultOptions: Intl.DateTimeFormatOptions = {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    timeZone: "Asia/Seoul",
  };

  return dateObj.toLocaleString("ko-KR", { ...defaultOptions, ...options });
};

/**
 * 날짜만 포맷팅 (시간 제외)
 * @param date 포맷팅할 날짜
 * @returns 포맷된 날짜 문자열 (YYYY-MM-DD)
 */
export const formatDate = (date: string | Date): string => {
  const dateObj = typeof date === "string" ? new Date(date) : date;
  return dateObj.toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    timeZone: "Asia/Seoul",
  });
};

/**
 * 시간만 포맷팅 (날짜 제외)
 * @param date 포맷팅할 날짜
 * @returns 포맷된 시간 문자열 (HH:MM:SS)
 */
export const formatTime = (date: string | Date): string => {
  const dateObj = typeof date === "string" ? new Date(date) : date;
  return dateObj.toLocaleTimeString("ko-KR", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    timeZone: "Asia/Seoul",
  });
};

/**
 * 상대적 시간 표시 (몇 분 전, 몇 시간 전 등)
 * @param date 기준 날짜
 * @returns 상대적 시간 문자열
 */
export const formatTimeAgo = (date: string | Date): string => {
  const dateObj = typeof date === "string" ? new Date(date) : date;
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - dateObj.getTime()) / 1000);

  if (diffInSeconds < 60) {
    return "방금 전";
  } else if (diffInSeconds < 3600) {
    const minutes = Math.floor(diffInSeconds / 60);
    return `${minutes}분 전`;
  } else if (diffInSeconds < 86400) {
    const hours = Math.floor(diffInSeconds / 3600);
    const minutes = Math.floor((diffInSeconds % 3600) / 60);
    return minutes > 0 ? `${hours}시간 ${minutes}분 전` : `${hours}시간 전`;
  } else if (diffInSeconds < 604800) {
    // 7일 이내
    const days = Math.floor(diffInSeconds / 86400);
    const hours = Math.floor((diffInSeconds % 86400) / 3600);
    return hours > 0 ? `${days}일 ${hours}시간 전` : `${days}일 전`;
  } else {
    return dateObj.toLocaleString("ko-KR", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }
};

/**
 * 한국 시간대 기준으로 Date 객체를 YYYY-MM-DD 형식 문자열로 변환
 * UTC 변환으로 인한 날짜 차이 문제를 방지합니다.
 * @param date 변환할 Date 객체
 * @returns YYYY-MM-DD 형식의 날짜 문자열
 */
export const formatLocalDate = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

/**
 * 한국 시간대 기준으로 오늘 날짜 문자열 반환 (YYYY-MM-DD)
 * @returns 오늘 날짜 문자열
 */
export const getTodayString = (): string => {
  return formatLocalDate(new Date());
};

/**
 * 한국 시간대 기준으로 날짜 범위의 시작/종료 Date 객체 생성
 * @param dateString YYYY-MM-DD 형식의 날짜 문자열
 * @param isEndOfDay true면 23:59:59.999로 설정, false면 00:00:00.000으로 설정
 * @returns 한국 시간대 기준으로 설정된 Date 객체
 */
export const createKSTDateRange = (
  dateString: string,
  isEndOfDay = false
): Date => {
  const date = new Date(dateString);
  if (isEndOfDay) {
    date.setHours(23, 59, 59, 999);
  } else {
    date.setHours(0, 0, 0, 0);
  }
  return date;
};

/**
 * 한국 시간대 기준으로 오늘의 시작/종료 시간 반환
 * @returns {start: Date, end: Date} 오늘의 시작(00:00:00)과 종료(23:59:59) 시간
 */
export const getTodayRange = (): { start: Date; end: Date } => {
  const today = new Date();
  const start = new Date(today);
  start.setHours(0, 0, 0, 0);
  const end = new Date(today);
  end.setHours(23, 59, 59, 999);
  return { start, end };
};

/**
 * 현재 날짜/시간 문자열 반환 (한국 시간대)
 * @returns 현재 날짜/시간 문자열
 */
export const getCurrentDateTime = (): string => {
  return formatDateTime(new Date());
};

/**
 * 날짜 범위 내 데이터 필터링
 * @param data 필터링할 데이터 배열
 * @param dateField 날짜 필드명
 * @param startDate 시작 날짜 (YYYY-MM-DD)
 * @param endDate 종료 날짜 (YYYY-MM-DD)
 * @returns 필터링된 데이터
 */
export const filterByDateRange = <T extends Record<string, any>>(
  data: T[],
  dateField: keyof T,
  startDate?: string,
  endDate?: string
): T[] => {
  if (!startDate && !endDate) return data;

  return data.filter((item) => {
    const itemDate = new Date(item[dateField]);
    const itemDateString = formatLocalDate(itemDate);

    if (startDate && itemDateString < startDate) return false;
    if (endDate && itemDateString > endDate) return false;

    return true;
  });
};

/**
 * 오늘 데이터 필터링
 * @param data 필터링할 데이터 배열
 * @param dateField 날짜 필드명
 * @returns 오늘 데이터만 필터링된 배열
 */
export const getTodayData = <T extends Record<string, any>>(
  data: T[],
  dateField: keyof T
): T[] => {
  const today = getTodayString();
  return data.filter((item) => {
    const itemDate = new Date(item[dateField]);
    const itemDateString = formatLocalDate(itemDate);
    return itemDateString === today;
  });
};

/**
 * 이번 주 데이터 필터링
 * @param data 필터링할 데이터 배열
 * @param dateField 날짜 필드명
 * @returns 이번 주 데이터만 필터링된 배열
 */
export const getThisWeekData = <T extends Record<string, any>>(
  data: T[],
  dateField: keyof T
): T[] => {
  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);

  return data.filter((item) => {
    const itemDate = new Date(item[dateField]);
    return itemDate >= weekAgo;
  });
};

/**
 * 이번 달 데이터 필터링
 * @param data 필터링할 데이터 배열
 * @param dateField 날짜 필드명
 * @returns 이번 달 데이터만 필터링된 배열
 */
export const getThisMonthData = <T extends Record<string, any>>(
  data: T[],
  dateField: keyof T
): T[] => {
  const now = new Date();
  const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  return data.filter((item) => {
    const itemDate = new Date(item[dateField]);
    return itemDate >= firstDayOfMonth;
  });
};

/**
 * 날짜 범위 계산 (시작일부터 종료일까지의 일수)
 * @param startDate 시작 날짜
 * @param endDate 종료 날짜
 * @returns 일수
 */
export const calculateDateRangeDays = (
  startDate: string | Date,
  endDate: string | Date
): number => {
  const start = typeof startDate === "string" ? new Date(startDate) : startDate;
  const end = typeof endDate === "string" ? new Date(endDate) : endDate;

  const diffTime = end.getTime() - start.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

/**
 * 날짜가 유효한지 확인
 * @param date 확인할 날짜
 * @returns 유효한 날짜인지 여부
 */
export const isValidDate = (date: string | Date): boolean => {
  const dateObj = typeof date === "string" ? new Date(date) : date;
  return !isNaN(dateObj.getTime());
};

/**
 * 파일명용 날짜 문자열 생성 (YYYYMMDD_HHMMSS)
 * @param date 날짜 (기본값: 현재 시간)
 * @returns 파일명용 날짜 문자열
 */
export const getFileNameDate = (date?: Date): string => {
  const dateObj = date || new Date();
  const year = dateObj.getFullYear();
  const month = String(dateObj.getMonth() + 1).padStart(2, "0");
  const day = String(dateObj.getDate()).padStart(2, "0");
  const hours = String(dateObj.getHours()).padStart(2, "0");
  const minutes = String(dateObj.getMinutes()).padStart(2, "0");
  const seconds = String(dateObj.getSeconds()).padStart(2, "0");

  return `${year}${month}${day}_${hours}${minutes}${seconds}`;
};

/**
 * CSV 파일명용 KST 날짜+시간 문자열 생성 (YYYYMMDD_HHMMSS)
 * @returns KST 기준 현재 날짜+시간 문자열
 */
export const getKSTDateTimeForFileName = (): string => {
  const now = new Date();

  // KST는 UTC+9이므로 9시간을 더함
  const kstTime = new Date(now.getTime() + 9 * 60 * 60 * 1000);

  const year = kstTime.getUTCFullYear();
  const month = String(kstTime.getUTCMonth() + 1).padStart(2, "0");
  const day = String(kstTime.getUTCDate()).padStart(2, "0");
  const hours = String(kstTime.getUTCHours()).padStart(2, "0");
  const minutes = String(kstTime.getUTCMinutes()).padStart(2, "0");
  const seconds = String(kstTime.getUTCSeconds()).padStart(2, "0");

  return `${year}${month}${day}_${hours}${minutes}${seconds}`;
};

/**
 * 월별 데이터 그룹화
 * @param data 그룹화할 데이터 배열
 * @param dateField 날짜 필드명
 * @returns 월별로 그룹화된 데이터
 */
export const groupByMonth = <T extends Record<string, any>>(
  data: T[],
  dateField: keyof T
): Record<string, T[]> => {
  return data.reduce((groups, item) => {
    const date = new Date(item[dateField]);
    const monthKey = `${date.getFullYear()}-${String(
      date.getMonth() + 1
    ).padStart(2, "0")}`;

    if (!groups[monthKey]) {
      groups[monthKey] = [];
    }
    groups[monthKey].push(item);

    return groups;
  }, {} as Record<string, T[]>);
};

/**
 * 주별 데이터 그룹화
 * @param data 그룹화할 데이터 배열
 * @param dateField 날짜 필드명
 * @returns 주별로 그룹화된 데이터
 */
export const groupByWeek = <T extends Record<string, any>>(
  data: T[],
  dateField: keyof T
): Record<string, T[]> => {
  return data.reduce((groups, item) => {
    const date = new Date(item[dateField]);
    const startOfWeek = new Date(date);
    startOfWeek.setDate(date.getDate() - date.getDay());
    const weekKey = formatLocalDate(startOfWeek);

    if (!groups[weekKey]) {
      groups[weekKey] = [];
    }
    groups[weekKey].push(item);

    return groups;
  }, {} as Record<string, T[]>);
};

/**
 * 현재 시간을 KST 기준으로 ISO 문자열로 반환 (조회/표시용)
 * DB 저장용이 아닌 조회/표시용으로만 사용
 * @returns KST 기준 현재 시간의 ISO 문자열
 */
export const getKSTNowISO = (): string => {
  const now = new Date();
  // KST는 UTC+9이므로 9시간을 더함
  const kstTime = new Date(now.getTime() + 9 * 60 * 60 * 1000);
  return kstTime.toISOString();
};

/**
 * Date 객체를 KST 기준 날짜 문자열(YYYY-MM-DD)로 변환 (조회/표시용)
 * DB 저장용이 아닌 조회/표시용으로만 사용
 * @param date 변환할 Date 객체
 * @returns KST 기준 YYYY-MM-DD 형식 문자열
 */
export const toKSTDateString = (date: Date): string => {
  // KST는 UTC+9이므로 9시간을 더함
  const kstTime = new Date(date.getTime() + 9 * 60 * 60 * 1000);
  return kstTime.toISOString().split("T")[0];
};

/**
 * KST 기준으로 N일 전 날짜의 ISO 문자열 반환 (조회/표시용)
 * DB 저장용이 아닌 조회/표시용으로만 사용
 * @param days 며칠 전 (기본값: 0일 = 오늘)
 * @returns KST 기준 N일 전 날짜의 ISO 문자열
 */
export const getKSTDaysAgo = (days: number = 0): string => {
  const now = new Date();
  // KST는 UTC+9이므로 9시간을 더함
  const kstTime = new Date(now.getTime() + 9 * 60 * 60 * 1000);
  kstTime.setUTCDate(kstTime.getUTCDate() - days);
  return kstTime.toISOString();
};

/**
 * KST 기준으로 N일 전 날짜 문자열(YYYY-MM-DD) 반환 (조회/표시용)
 * DB 저장용이 아닌 조회/표시용으로만 사용
 * @param days 며칠 전 (기본값: 0일 = 오늘)
 * @returns KST 기준 N일 전 YYYY-MM-DD 형식 문자열
 */
export const getKSTDaysAgoDateString = (days: number = 0): string => {
  const now = new Date();
  // KST는 UTC+9이므로 9시간을 더함
  const kstTime = new Date(now.getTime() + 9 * 60 * 60 * 1000);
  kstTime.setUTCDate(kstTime.getUTCDate() - days);
  return kstTime.toISOString().split("T")[0];
};

/**
 * KST 기준으로 오늘의 시작/종료 시간 반환 (조회/표시용)
 * DB 저장용이 아닌 조회/표시용으로만 사용
 * @returns KST 기준 오늘의 시작(00:00:00)과 종료(23:59:59) 시간
 */
export const getKSTTodayRange = (): { start: Date; end: Date } => {
  const now = new Date();
  // KST는 UTC+9이므로 9시간을 더함
  const kstTime = new Date(now.getTime() + 9 * 60 * 60 * 1000);

  const startOfDay = new Date(kstTime);
  startOfDay.setUTCHours(0, 0, 0, 0);
  // UTC로 저장하기 위해 9시간 빼기
  const start = new Date(startOfDay.getTime() - 9 * 60 * 60 * 1000);

  const endOfDay = new Date(kstTime);
  endOfDay.setUTCHours(23, 59, 59, 999);
  // UTC로 저장하기 위해 9시간 빼기
  const end = new Date(endOfDay.getTime() - 9 * 60 * 60 * 1000);

  return { start, end };
};

/**
 * 반응형 방문일시 표시 (테이블용)
 * 데스크탑에서 창 크기가 줄어들 때 년도/날짜는 한 줄, 시간은 다음 줄에 표시
 * @param date 포맷팅할 날짜
 * @returns 반응형 날짜/시간 표시 컴포넌트용 데이터
 */
export const formatResponsiveDateTime = (date: string | Date) => {
  const dateObj = typeof date === "string" ? new Date(date) : date;

  // 년도/날짜 부분 (항상 한 줄)
  const datePart = dateObj.toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    timeZone: "Asia/Seoul",
  });

  // 시간 부분 (오후/오전 포함)
  const timePart = dateObj.toLocaleTimeString("ko-KR", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
    timeZone: "Asia/Seoul",
  });

  return {
    datePart, // "2024. 12. 19."
    timePart, // "오후 2:30"
    fullDateTime: `${datePart} ${timePart}`, // 전체 문자열
  };
};
