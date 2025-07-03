/**
 * =================================
 * 🔧 개발 로깅 유틸리티
 * =================================
 * devLog.log를 production에서 제거하고 개발 환경에서만 실행
 */

const isDev = process.env.NODE_ENV === "development";

export const devLog = {
  /**
   * 일반 로그 (개발 환경에서만)
   */
  log: (...args: any[]) => {
    if (isDev) {
      console.log(...args);
    }
  },

  /**
   * 에러 로그 (항상 출력)
   */
  error: (...args: any[]) => {
    console.error(...args);
  },

  /**
   * 경고 로그 (항상 출력)
   */
  warn: (...args: any[]) => {
    if (isDev) {
      console.warn(...args);
    }
  },

  /**
   * 정보 로그 (개발 환경에서만)
   */
  info: (...args: any[]) => {
    if (isDev) {
      console.info(...args);
    }
  },

  /**
   * 성공 로그 (개발 환경에서만)
   */
  success: (message: string, ...args: any[]) => {
    if (isDev) {
      console.log(`✅ ${message}`, ...args);
    }
  },

  /**
   * API 성공 로그 (개발 환경에서만)
   */
  apiSuccess: (message: string, data?: any) => {
    if (isDev) {
      console.log(`🔄 ${message}`, data);
    }
  },

  /**
   * 그룹 로그 시작
   */
  group: (label: string) => {
    if (isDev) {
      console.group(label);
    }
  },

  /**
   * 그룹 로그 종료
   */
  groupEnd: () => {
    if (isDev) {
      console.groupEnd();
    }
  },

  /**
   * 시간 측정 시작
   */
  time: (label: string) => {
    if (isDev) {
      console.time(label);
    }
  },

  /**
   * 시간 측정 종료
   */
  timeEnd: (label: string) => {
    if (isDev) {
      console.timeEnd(label);
    }
  },

  /**
   * 테이블 형태로 출력
   */
  table: (data: any) => {
    if (isDev) {
      console.table(data);
    }
  },

  /**
   * 성능 메트릭 로그
   */
  performance: (operation: string, startTime: number) => {
    if (isDev) {
      const duration = performance.now() - startTime;
      console.log(`⚡ ${operation}: ${duration.toFixed(2)}ms`);
    }
  },

  /**
   * 조건부 로그
   */
  conditional: (condition: boolean, ...args: any[]) => {
    if (isDev && condition) {
      console.log(...args);
    }
  },
};

// 개발 환경 체크 유틸리티
export const isDevelopment = isDev;

export default devLog;
