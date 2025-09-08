import {
  startOfDay,
  endOfDay,
  addDays,
  format,
  formatDistanceToNow,
} from "date-fns";
import { ko } from "date-fns/locale";
import { toZonedTime, fromZonedTime, formatInTimeZone } from "date-fns-tz";

const KST_TZ = "Asia/Seoul";

// KST 날짜 문자열 (yyyy-MM-dd)
export const formatKSTDate = (date: Date): string =>
  formatInTimeZone(date, KST_TZ, "yyyy-MM-dd");

// 주어진 시점의 KST 하루 경계를 UTC instant로 반환
export const getKSTDayBoundsUTC = (
  date: Date
): { startUTC: Date; endUTC: Date } => {
  const kstZoned = toZonedTime(date, KST_TZ);
  const kstStart = startOfDay(kstZoned);
  const kstEnd = endOfDay(kstZoned);
  const startUTC = fromZonedTime(kstStart, KST_TZ);
  const endUTC = fromZonedTime(kstEnd, KST_TZ);
  return { startUTC, endUTC };
};

// 최근 N일의 KST 자정(00:00) 시각을 UTC instant로 반환 (과거→현재)
export const getLastNDaysKSTMidnightsUTC = (days: number): Date[] => {
  const now = new Date();
  const kstNow = toZonedTime(now, KST_TZ);
  const todayKstMidnight = startOfDay(kstNow);
  return Array.from({ length: days }, (_, i) => {
    const kstMidnight = addDays(todayKstMidnight, -(days - 1 - i));
    return fromZonedTime(kstMidnight, KST_TZ);
  });
};

/**
 * 상대적 시간 표시 (몇 분 전, 몇 시간 전 등)
 * @param date 기준 날짜
 * @returns 상대적 시간 문자열
 */
export const formatTimeAgo = (date: string | Date): string => {
  const dateObj = typeof date === "string" ? new Date(date) : date;
  return formatDistanceToNow(dateObj, { addSuffix: true, locale: ko });
};

/**
 * 한국 시간대 기준으로 Date 객체를 YYYY-MM-DD 형식 문자열로 변환
 * UTC 변환으로 인한 날짜 차이 문제를 방지합니다.
 * @param date 변환할 Date 객체
 * @returns YYYY-MM-DD 형식의 날짜 문자열
 */
export const formatDate = (date: Date): string => format(date, "yyyy-MM-dd");

/**
 * 한국 시간대(KST) 기준 날짜/시간 포맷팅
 * @param date 문자열 또는 Date 객체
 * @param pattern date-fns 포맷 패턴 (기본값: yyyy-MM-dd HH:mm:ss)
 */
export const formatDateTime = (
  date: string | Date,
  pattern: string = "yyyy-MM-dd HH:mm:ss"
): string => {
  const dateObj = typeof date === "string" ? new Date(date) : date;
  return formatInTimeZone(dateObj, KST_TZ, pattern);
};

/**
 * 파일명용 KST 날짜시간 문자열 (YYYYMMDD_HHMMSS)
 */
export const getKSTDateTimeForFileName = (): string => {
  return formatInTimeZone(new Date(), KST_TZ, "yyyyMMdd_HHmmss");
};
