import { getSystemSetting } from "@/lib/cache/system-settings-cache";
import { devLog } from "@/lib/utils/logging/dev-logger";
import { normalizeIP } from "@/lib/server/ip-helpers";
import { slackNotifier } from "@/lib/slack";
import {
  createServiceRoleClient,
  validateServiceRoleConfig,
} from "@/lib/supabase/service-role";

/**
 * 통합 로깅 시스템 - 단순화된 인터페이스
 *
 * 기존 30+ 로그 함수를 5개 핵심 함수로 통합
 * - 중복 제거
 * - 일관된 인터페이스
 * - 간단한 사용법
 */

export type LogLevel = "info" | "warn" | "error" | "debug";

export type ResourceType =
  | "user"
  | "farm"
  | "member"
  | "visitor"
  | "notification"
  | "system"
  | "auth"
  | "api";

export interface LogMetadata {
  [key: string]: any;
}

export interface LogContext {
  userId?: string;
  email?: string;
  resource?: ResourceType;
  action?: string;
  ip?: string;
  userAgent?: string;
}

export interface ApiResult {
  status?: number;
  duration?: number;
  error?: Error | string;
}

// 중복 방지를 위한 캐시 (간단한 메모리 캐시)
const logCache = new Map<string, number>();
const CACHE_DURATION = 60000; // 60초

// 환경 변수 로드 상태 확인
let isConfigValidated = false;

// 로그 레벨 우선순위
const LOG_LEVEL_PRIORITY: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

async function validateConfig() {
  if (!isConfigValidated) {
    isConfigValidated = validateServiceRoleConfig();
  }
  return isConfigValidated;
}

/**
 * 중복 로그 방지 헬퍼
 */
function shouldSkipDuplicate(key: string): boolean {
  const now = Date.now();
  const lastLogged = logCache.get(key);

  if (lastLogged && now - lastLogged < CACHE_DURATION) {
    return true; // 중복이므로 스킵
  }

  logCache.set(key, now);
  return false;
}

/**
 * 기존 시스템 설정의 로그 레벨 필터링 함수 재사용
 */
async function shouldLogMessage(messageLevel: LogLevel): Promise<boolean> {
  try {
    // 서버 환경에서만 동작
    const systemLogLevel = await getSystemSetting("logLevel");
    const effectiveLogLevel = (systemLogLevel as LogLevel) || "info"; // 기본값은 info
    const messagePriority = LOG_LEVEL_PRIORITY[messageLevel];
    const systemPriority = LOG_LEVEL_PRIORITY[effectiveLogLevel];
    return messagePriority >= systemPriority;
  } catch (error) {
    devLog.warn("Error checking log level, allowing log:", error);
    return true; // 에러 시 기본적으로 로그 허용
  }
}

/**
 * 기본 로그 생성 함수 (기존 createSystemLog와 호환)
 */
async function createLog(
  level: LogLevel,
  action: string,
  message: string,
  context: LogContext = {},
  metadata: LogMetadata = {}
): Promise<void> {
  try {
    // 환경 변수 검증 - 설정되지 않은 경우 조용히 리턴
    const isConfigValid = await validateConfig();
    if (!isConfigValid) {
      devLog.log("Logging skipped due to invalid configuration");
      return;
    }

    const shouldLog = await shouldLogMessage(level);
    devLog.log("[DEBUG] shouldLogMessage", { level, action, shouldLog });
    if (!shouldLog) {
      devLog.log(
        `[DEBUG] Log filtered out due to level: ${level} (action: ${action})`
      );
      return;
    }
    const cacheKey = `${action}_${message}_${level}`;
    const isDuplicate = shouldSkipDuplicate(cacheKey);
    devLog.log("[DEBUG] shouldSkipDuplicate", { cacheKey, isDuplicate });
    if (isDuplicate) {
      devLog.log(`[DEBUG] Log skipped due to duplicate: ${cacheKey}`);
      return;
    }
    let currentUserId = context.userId;
    let userEmail = context.email;
    if (!currentUserId || !userEmail) {
      userEmail =
        userEmail || process.env.ENV_COMPANY_EMAIL || "k331502@nate.com";
    }
    let clientIP = context.ip;
    if (!clientIP) {
      clientIP = "server-unknown";
    }
    if (clientIP && clientIP !== "server-unknown") {
      clientIP = normalizeIP(clientIP);
    }
    let userAgent = context.userAgent;
    if (!userAgent) {
      userAgent = "Server";
    }
    const logData = {
      user_id: currentUserId || null,
      user_email: userEmail || null,
      action,
      message,
      level,
      user_ip: clientIP || "unknown",
      user_agent: userAgent,
      resource_type: context.resource || null,
      resource_id: null,
      metadata:
        Object.keys(metadata).length > 0
          ? JSON.stringify(metadata)
          : JSON.stringify({
              environment: "server",
              context_provided: {
                userId: !!context.userId,
                email: !!context.email,
                ip: !!context.ip,
                userAgent: !!context.userAgent,
              },
            }),
    };
    // 서버 환경: 서비스 롤 키로 직접 insert

    const supabase = createServiceRoleClient();
    const { data: insertedLog, error } = await supabase
      .from("system_logs")
      .insert(logData)
      .select()
      .single();
    if (error) {
      devLog.error("[DEBUG] Supabase direct insert error", error);
    } else {
      devLog.log("[DEBUG] Supabase direct insert success", logData);

      // 🔥 시스템 로그 생성 실시간 브로드캐스트
      try {
        await supabase.channel("log_updates").send({
          type: "broadcast",
          event: "log_created",
          payload: {
            eventType: "INSERT",
            new: insertedLog,
            old: null,
            table: "system_logs",
            schema: "public",
          },
        });
        devLog.log("📡 [SYSTEM-LOG] Supabase Broadcast 발송 완료");
      } catch (broadcastError) {
        devLog.error("⚠️ [SYSTEM-LOG] Broadcast 발송 실패:", broadcastError);
      }
    }
    return;
  } catch (error) {
    devLog.error("💥 Exception creating system log:", error);
  }
}

/**
 * 통합 로거 객체
 */
export const logger = {
  /**
   * 1. 기본 로깅 (모든 로그의 기반)
   */
  log: async (
    level: LogLevel,
    action: string,
    message: string,
    context?: LogContext,
    metadata?: LogMetadata
  ) => {
    await createLog(level, action, message, context, metadata);
  },

  /**
   * 2. API 관련 (에러 + 성능 통합)
   */
  api: async (
    endpoint: string,
    method: string,
    result: ApiResult,
    context?: LogContext
  ) => {
    const cacheKey = `api_${endpoint}_${method}`;

    if (result.error) {
      // API 에러 로깅 (중복 방지)
      if (shouldSkipDuplicate(cacheKey)) return;

      const errorMessage =
        result.error instanceof Error
          ? result.error.message
          : String(result.error);

      await createLog(
        "error",
        "API_ERROR",
        `${method} ${endpoint} 실패: ${errorMessage}`,
        { ...context, resource: "api" },
        {
          endpoint,
          method,
          status_code: result.status,
          duration_ms: result.duration,
          error_message: errorMessage,
        }
      );
    } else if (result.duration && result.duration > 1000) {
      // 느린 API 성능 로깅
      await createLog(
        "warn",
        "API_SLOW",
        `느린 API 감지: ${method} ${endpoint} (${result.duration}ms)`,
        { ...context, resource: "api" },
        {
          endpoint,
          method,
          duration_ms: result.duration,
          status_code: result.status,
        }
      );
    }
  },

  /**
   * 3. 비즈니스 이벤트 (데이터 변경, 사용자 행동)
   */
  business: async (
    action: string,
    resource: string,
    context?: LogContext,
    metadata?: LogMetadata
  ) => {
    await createLog(
      "info",
      action,
      `${resource} 관련 작업: ${action}`,
      context,
      {
        ...metadata,
        business_action: action,
        business_resource: resource,
      }
    );
  },

  /**
   * 4. 성능 모니터링
   */
  performance: async (
    operation: string,
    duration: number,
    threshold = 1000,
    context?: LogContext
  ) => {
    if (duration > threshold) {
      await createLog(
        "warn",
        "PERFORMANCE_SLOW",
        `느린 작업 감지: ${operation} (${duration}ms)`,
        { ...context, resource: "system" },
        {
          operation,
          duration_ms: duration,
          threshold_ms: threshold,
        }
      );
    }
  },

  /**
   * 5. 에러 전용 (간단한 에러 로깅)
   */
  error: async (
    error: Error | string,
    context?: LogContext,
    metadata?: LogMetadata
  ) => {
    const errorMessage = error instanceof Error ? error.message : String(error);
    const stack = error instanceof Error ? error.stack : undefined;

    // 1. 기존 시스템 로그에 저장
    await createLog("error", "ERROR", errorMessage, context, {
      ...metadata,
      error_message: errorMessage,
      stack_trace: stack,
    });

    // 2. Slack 알림 전송 (에러 레벨인 경우)
    await slackNotifier.sendSystemAlert(
      "error",
      "시스템 에러 발생",
      errorMessage,
      {
        action: metadata?.action || "ERROR",
        userId: context?.userId || "unknown",
        stack: stack?.split("\n")[0], // 첫 번째 스택 라인만
        timestamp: new Date().toISOString(),
      }
    );
  },
};

// ============================================
// 기존 함수 호환성 유지 (기존 코드 수정 없이 사용 가능)
// ============================================

export const createSystemLog = async (
  action: string,
  message: string,
  level: LogLevel = "info",
  userId?: string,
  resourceType?: ResourceType,
  resourceId?: string,
  metadata?: LogMetadata,
  userEmail?: string,
  userIP?: string,
  userAgent?: string
) => {
  await logger.log(
    level,
    action,
    message,
    { userId, resource: resourceType, ip: userIP, email: userEmail, userAgent },
    { ...metadata, user_email: userEmail, resource_id: resourceId }
  );
};

export const logApiError = (
  endpoint: string,
  method: string,
  error: Error | string,
  userId?: string,
  context?: Partial<LogContext>,
  resourceType: ResourceType = "api"
) => {
  return logger.api(
    endpoint,
    method,
    { error },
    { userId, resource: resourceType, ...context }
  );
};

export const logPageView = async (
  fromPath: string,
  toPath: string,
  userId?: string,
  context?: Partial<LogContext>,
  resourceType: ResourceType = "system"
) => {
  await logger.business(
    "PAGE_VIEW",
    "navigation",
    { userId, resource: resourceType, ...context },
    { fromPath, toPath }
  );
};

export const logSecurityError = async (
  threat: string,
  description: string,
  userId?: string,
  ip?: string,
  userAgent?: string,
  resourceType: ResourceType = "system"
) => {
  await logger.error(
    `보안 위협: ${threat}`,
    { userId, ip, resource: resourceType },
    { threat, description, userAgent }
  );
};

export const logSystemWarning = async (
  operation: string,
  message: string,
  logContext?: Partial<LogContext>,
  metadata?: Record<string, any>,
  userId?: string,
  resourceType: ResourceType = "system"
) => {
  await logger.log(
    "warn",
    "SYSTEM_WARNING",
    `${operation}: ${message}`,
    { userId, resource: resourceType, ...logContext },
    metadata
  );
};

// ============================================
// Performance Logger 통합 (기존 호환성 유지)
// ============================================

export interface PerformanceMetric {
  duration_ms: number;
  operation: string;
  metadata?: Record<string, any>;
}

export interface DatabaseQueryMetric {
  query: string;
  table: string;
  duration_ms: number;
  row_count?: number;
}

export interface MemoryMetric {
  heap_used: number;
  heap_total: number;
  heap_limit?: number;
  warning_threshold?: number;
}

export interface ApiResponseMetric {
  endpoint: string;
  method: string;
  duration_ms: number;
  status_code: number;
  response_size?: number;
}

export const logDatabasePerformance = async (
  metric: DatabaseQueryMetric,
  userId?: string,
  context?: Partial<LogContext>
) => {
  if (metric.duration_ms > 1000) {
    // 1초 이상만 로깅
    await logger.performance(
      `DB Query: ${metric.table}`,
      metric.duration_ms,
      1000,
      { userId, ...context }
    );
  }
};

export const logMemoryUsage = async (metric: MemoryMetric, userId?: string) => {
  const usagePercentage = (metric.heap_used / metric.heap_total) * 100;
  const threshold = metric.warning_threshold || 80;

  if (usagePercentage > threshold) {
    await logger.log(
      "warn",
      "MEMORY_USAGE_WARNING",
      `메모리 사용량 경고: ${usagePercentage.toFixed(1)}%`,
      { userId },
      metric
    );
  }
};

export const logApiPerformance = async (
  metric: ApiResponseMetric,
  userId?: string,
  context?: Partial<LogContext>
) => {
  if (metric.duration_ms > 1000) {
    // 1초 이상만 로깅
    await logger.performance(
      `${metric.method} ${metric.endpoint}`,
      metric.duration_ms,
      1000,
      { userId, ...context }
    );
  }
};

export class PerformanceMonitor {
  private startTime: number;
  private operation: string;
  private metadata: Record<string, any>;

  constructor(operation: string, metadata: Record<string, any> = {}) {
    this.operation = operation;
    this.metadata = metadata;
    this.startTime = performance.now();
  }

  async finish(threshold = 1000, userId?: string): Promise<number> {
    const duration = performance.now() - this.startTime;

    if (duration > threshold) {
      await logger.performance(this.operation, duration, threshold, { userId });
    }

    return duration;
  }

  async end(threshold = 1000, userId?: string): Promise<number> {
    return this.finish(threshold, userId);
  }
}

export const logSystemResources = async (): Promise<void> => {
  try {
    // Edge Runtime에서는 Node.js API를 사용할 수 없음
    // 안전한 방법으로 Node.js 환경인지 확인
    let isNodeEnv = false;

    try {
      isNodeEnv =
        typeof process !== "undefined" &&
        typeof process.memoryUsage === "function" &&
        typeof process.env?.NEXT_RUNTIME !== "string";
    } catch {
      // Edge Runtime에서 process.env 접근 시 에러 발생 가능
      isNodeEnv = false;
    }

    if (!isNodeEnv) {
      // Edge Runtime 또는 브라우저 환경에서는 스킵
      devLog.log(
        "[SYSTEM_RESOURCES] Edge Runtime/브라우저 환경에서 시스템 리소스 모니터링 스킵"
      );
      return;
    }

    const memUsage = process.memoryUsage();
    await logMemoryUsage({
      heap_used: memUsage.heapUsed / 1024 / 1024, // MB로 변환
      heap_total: memUsage.heapTotal / 1024 / 1024, // MB로 변환
      warning_threshold: 80,
    });
  } catch (error) {
    devLog.error("[SYSTEM_RESOURCES] 시스템 리소스 모니터링 실패:", error);
  }
};

// ============================================
// Validation Logger 통합 (기존 호환성 유지)
// ============================================

/**
 * 감사 로그 여부 판단 함수
 * 사용자의 중요한 행동이나 시스템 변경 사항을 기록하는 로그인지 확인
 *
 * @param log 로그 객체
 * @returns 감사 로그 여부
 */
export const isAuditLog = (log: any): boolean => {
  const auditActions = [
    // 인증 관련
    "LOGIN_FAILED",
    "LOGIN_SUCCESS",
    "LOGOUT_SUCCESS",
    "LOGOUT_ERROR",
    "SESSION_EXPIRED",
    "PASSWORD_RESET_REQUESTED",
    "PASSWORD_RESET_REQUEST_FAILED",
    "PASSWORD_RESET_SYSTEM_ERROR",
    "LOGIN_ATTEMPTS_RESET",
    "LOGIN_ATTEMPTS_RESET_ERROR",
    "ACCOUNT_LOCKED",
    "ACCOUNT_UNLOCKED",
    "SUSPICIOUS_LOGIN_ATTEMPTS",

    // 사용자 관련
    "USER_SEARCH",
    "USER_SEARCH_UNAUTHORIZED",
    "USER_SEARCH_FAILED",
    "IP_ADDRESS_QUERY",
    "IP_ADDRESS_QUERY_FAILED",
    "PROFILE_UPDATE",
    "PROFILE_UPDATE_FAILED",
    "PROFILE_IMAGE_UPLOAD",
    "PROFILE_IMAGE_UPLOAD_FAILED",
    "PROFILE_IMAGE_DELETE",
    "PROFILE_IMAGE_DELETE_FAILED",

    // 방문자 관련
    "VISITOR_DATA_ACCESS",
    "VISITOR_REGISTRATION_SUCCESS",
    "VISITOR_REGISTRATION_FAILED",
    "VISITOR_REGISTRATION_EXCEPTION",
    "VISITOR_CREATED",
    "VISITOR_CREATION_FAILED",
    "VISITOR_UPDATED",
    "VISITOR_UPDATE_FAILED",
    "VISITOR_DELETED",
    "VISITOR_DELETE_FAILED",
    "VISITOR_FETCH_FAILED",
    "VISITOR_DAILY_LIMIT_EXCEEDED",
    "VISITOR_DAILY_LIMIT_WARNING",
    "VISITOR_SESSION_NOT_FOUND",
    "VISITOR_RECORD_NOT_FOUND",
    "VISITOR_SESSION_EXPIRED",
    "VISITOR_SESSION_VALID",
    "VISITOR_SESSION_CHECK_ERROR",

    // 농장 관련
    "FARM_CREATE",
    "FARM_CREATE_FAILED",
    "FARM_READ",
    "FARM_READ_FAILED",
    "FARM_UPDATE",
    "FARM_UPDATE_FAILED",
    "FARM_DELETE",
    "FARM_DELETE_FAILED",

    // 멤버 관련
    "MEMBER_READ",
    "MEMBER_READ_FAILED",
    "MEMBER_CREATE",
    "MEMBER_CREATE_FAILED",
    "MEMBER_UPDATE",
    "MEMBER_UPDATE_FAILED",
    "MEMBER_DELETE",
    "MEMBER_DELETE_FAILED",
    "MEMBER_BULK_READ",
    "MEMBER_BULK_READ_FAILED",
    "FARM_MEMBER_ACCESS_DENIED",

    // SQL 트리거에서 사용되는 액션들 (누락된 것들)
    "USER_CREATED",
    "USER_CREATION_FAILED",
    "PASSWORD_CHANGED",
    "PASSWORD_CHANGE_FAILED",
    "LOGOUT_SUCCESS",
    "LOGOUT_FAILED",
    "SCHEDULED_JOB",
    "BUSINESS_EVENT",

    // 시스템 설정
    "SETTINGS_INITIALIZE",
    "SETTINGS_BULK_UPDATE",
    "SETTINGS_UPDATE_ERROR",

    // 푸시 알림
    "VAPID_KEY_CREATED",
    "VAPID_KEY_CREATE_FAILED",
    "VAPID_KEY_RETRIEVED",
    "VAPID_KEY_RETRIEVE_FAILED",
    "PUSH_SUBSCRIPTION_CREATED",
    "PUSH_SUBSCRIPTION_GET",
    "PUSH_SUBSCRIPTION_DELETED",
    "PUSH_SUBSCRIPTION_CLEANUP",
    "PUSH_SUBSCRIPTION_CLEANUP_NONE",
    "PUSH_SUBSCRIPTION_CLEANUP_ALL_VALID",
    "PUSH_NOTIFICATION_SENT",
    "PUSH_NOTIFICATION_SEND_FAILED",
    "PUSH_NOTIFICATION_NO_SUBSCRIBERS",
    "PUSH_NOTIFICATION_FILTERED_OUT",
    "NOTIFICATION_SETTINGS_CREATION_FAILED",
    "NOTIFICATION_SETTINGS_READ_FAILED",
    "NOTIFICATION_SETTINGS_READ_SYSTEM_ERROR",
    "NOTIFICATION_SETTINGS_UPDATE_FAILED",
    "NOTIFICATION_SETTINGS_CREATE_FAILED",
    "NOTIFICATION_SETTINGS_UPDATE_SYSTEM_ERROR",
    "BROADCAST_NOTIFICATION_SENT",
    "BROADCAST_NOTIFICATION_FAILED",

    // 관리 기능
    "LOG_DELETE",
    "EXPIRED_COUNT_INVALID_PARAMS",
    "EXPIRED_COUNT_QUERY_FAILED",
    "ORPHAN_FILE_CLEANUP",
    "ORPHAN_FILE_CLEANUP_ERROR",

    // 보안 관련
    "RATE_LIMIT_EXCEEDED",
    "MALICIOUS_REQUEST_BLOCKED",

    // 모니터링
    "SYSTEM_RESOURCE_WARNING",
    "monitoring_health_check_failed",
    "monitoring_uptime_failed",
    "monitoring_analytics_failed",
    "monitoring_error_logs_failed",
  ];
  const upperAction = log.action?.toUpperCase();
  return (
    auditActions.some((action) => upperAction?.includes(action)) ||
    log.user_id !== null
  );
};

/**
 * 에러 로그 여부 판단 함수
 * 시스템 오류, 실패한 작업, 경고 상황을 기록하는 로그인지 확인
 *
 * @param log 로그 객체
 * @returns 에러 로그 여부
 */
export const isErrorLog = (log: any): boolean => {
  const errorActions = [
    // 실제 사용되는 에러 액션들
    // 인증 관련 오류
    "LOGIN_FAILED",
    "PASSWORD_RESET_REQUEST_FAILED",
    "PASSWORD_RESET_SYSTEM_ERROR",
    "LOGIN_ATTEMPTS_RESET_ERROR",

    // 사용자 관련 오류
    "USER_SEARCH_FAILED",
    "IP_ADDRESS_QUERY_FAILED",
    "PROFILE_UPDATE_FAILED",
    "PROFILE_IMAGE_UPLOAD_FAILED",
    "PROFILE_IMAGE_DELETE_FAILED",

    // 방문자 관련 오류
    "VISITOR_REGISTRATION_FAILED",
    "VISITOR_REGISTRATION_EXCEPTION",
    "VISITOR_CREATION_FAILED",
    "VISITOR_UPDATE_FAILED",
    "VISITOR_DELETE_FAILED",
    "VISITOR_FETCH_FAILED",
    "VISITOR_SESSION_CHECK_ERROR",

    // 농장 관련 오류
    "FARM_CREATE_FAILED",
    "FARM_READ_FAILED",
    "FARM_UPDATE_FAILED",
    "FARM_DELETE_FAILED",

    // 멤버 관련 오류
    "MEMBER_READ_FAILED",
    "MEMBER_CREATE_FAILED",
    "MEMBER_UPDATE_FAILED",
    "MEMBER_DELETE_FAILED",
    "MEMBER_BULK_READ_FAILED",
    "FARM_MEMBER_ACCESS_DENIED",

    // SQL 트리거에서 사용되는 에러 액션들 (누락된 것들)
    "USER_CREATION_FAILED",
    "PASSWORD_CHANGE_FAILED",
    "LOGOUT_FAILED",

    // 시스템 설정 오류
    "SETTINGS_UPDATE_ERROR",

    // 푸시 알림 오류
    "VAPID_KEY_CREATE_FAILED",
    "VAPID_KEY_RETRIEVE_FAILED",
    "PUSH_NOTIFICATION_INVALID_INPUT",
    "PUSH_NOTIFICATION_VAPID_INIT_FAILED",
    "PUSH_NOTIFICATION_SUBSCRIBER_FETCH_FAILED",
    "PUSH_NOTIFICATION_SETTINGS_FETCH_FAILED",
    "PUSH_NOTIFICATION_SEND_FAILED",
    "NOTIFICATION_SETTINGS_CREATION_FAILED",
    "NOTIFICATION_SETTINGS_READ_FAILED",
    "NOTIFICATION_SETTINGS_READ_SYSTEM_ERROR",
    "NOTIFICATION_SETTINGS_UPDATE_FAILED",
    "NOTIFICATION_SETTINGS_CREATE_FAILED",
    "NOTIFICATION_SETTINGS_UPDATE_SYSTEM_ERROR",
    "BROADCAST_NOTIFICATION_FAILED",

    // 관리 기능 오류
    "EXPIRED_COUNT_INVALID_PARAMS",
    "EXPIRED_COUNT_QUERY_FAILED",
    "ORPHAN_FILE_CLEANUP_ERROR",

    // 보안 관련 오류
    "RATE_LIMIT_EXCEEDED",
    "MALICIOUS_REQUEST_BLOCKED",
    "SUSPICIOUS_LOGIN_ATTEMPTS",

    // 모니터링 오류
    "SYSTEM_RESOURCE_WARNING",
    "monitoring_health_check_failed",
    "monitoring_uptime_failed",
    "monitoring_analytics_failed",
    "monitoring_error_logs_failed",
  ];
  const upperAction = log.action?.toUpperCase();
  return (
    errorActions.some((action) => upperAction?.includes(action)) ||
    log.level === "error" ||
    log.level === "warn"
  );
};

/**
 * 로그 카테고리 분류 함수
 * 로그의 액션과 내용을 기반으로 적절한 카테고리를 반환
 *
 * 카테고리 목록 (LogCategoryFilters.tsx와 일치):
 * - auth: 🔐 인증 관련 (로그인, 로그아웃, 계정 관리)
 * - farm: 🏡 농장 관리 관련
 * - visitor: 👥 방문자 관리 관련
 * - member: 👨‍💼 농장 구성원 관리 관련
 * - settings: ⚙️ 시스템 설정 관련
 * - security: 🛡️ 보안 관련
 * - file: 📁 파일 업로드/다운로드 관련
 * - notification: 🔔 푸시 알림 관련
 * - data: 📊 데이터 관리 (내보내기/가져오기) 관련
 * - log: 📋 로그 관리 관련
 * - application: 🖥️ 애플리케이션 라이프사이클 관련
 * - performance: ⚡ 성능 모니터링 관련
 * - error: ❌ 분류되지 않은 에러
 * - system: 🔧 기타 시스템 관련
 *
 * @param log 로그 객체
 * @returns 로그 카테고리
 */
export const getLogCategory = (log: any): string => {
  const upperAction = log.action?.toUpperCase();
  if (!upperAction) return "application";

  // 1. 인증 관련 🔐
  if (
    upperAction.includes("USER_") ||
    upperAction.includes("LOGIN") ||
    upperAction.includes("LOGOUT") ||
    upperAction.includes("PASSWORD") ||
    upperAction.includes("ACCOUNT") ||
    upperAction.includes("SESSION") ||
    upperAction.includes("IP_ADDRESS") ||
    upperAction.includes("PROFILE_") ||
    upperAction.includes("AUTH")
  ) {
    return "auth";
  }

  // 2. 농장 관련 🏡
  if (upperAction.includes("FARM_") || upperAction.includes("FARM")) {
    return "farm";
  }

  // 3. 방문자 관련 👥
  if (upperAction.includes("VISITOR_") || upperAction.includes("VISITOR")) {
    return "visitor";
  }

  // 4. 멤버 관련 👨‍💼
  if (upperAction.includes("MEMBER_") || upperAction.includes("MEMBER")) {
    return "member";
  }

  // 5. 설정 관련 ⚙️
  if (
    upperAction.includes("SETTINGS_") ||
    upperAction.includes("NOTIFICATION_SETTINGS_") ||
    upperAction.includes("CONFIG")
  ) {
    return "settings";
  }

  // 6. 보안 관련 🛡️
  if (
    upperAction.includes("MALICIOUS_REQUEST_BLOCKED") ||
    upperAction.includes("RATE_LIMIT_EXCEEDED") ||
    upperAction.includes("SUSPICIOUS") ||
    upperAction.includes("UNAUTHORIZED") ||
    upperAction.includes("ACCESS_DENIED") ||
    upperAction.includes("PERMISSION_ERROR") ||
    upperAction.includes("SECURITY") ||
    upperAction.includes("BLOCKED")
  ) {
    return "security";
  }

  // 7. 파일 관련 📁
  if (
    upperAction.includes("PROFILE_IMAGE_") ||
    upperAction.includes("IMAGE_") ||
    upperAction.includes("FILE_") ||
    upperAction.includes("UPLOAD") ||
    upperAction.includes("DELETE") ||
    upperAction.includes("STORAGE")
  ) {
    return "file";
  }

  // 8. 알림 관련 🔔
  if (
    upperAction.includes("PUSH_") ||
    upperAction.includes("VAPID_") ||
    upperAction.includes("BROADCAST_") ||
    upperAction.includes("NOTIFICATION") ||
    upperAction.includes("SUBSCRIPTION")
  ) {
    return "notification";
  }

  // 9. 로그 관리 관련 📋
  if (
    upperAction.includes("LOG_DELETE") ||
    upperAction.includes("LOG_") ||
    upperAction.includes("AUDIT") ||
    upperAction.includes("SYSTEM_LOGS") ||
    upperAction.includes("CLEANUP") ||
    upperAction.includes("RETENTION")
  ) {
    return "log";
  }

  // 10. 데이터 관리 관련 📊
  if (
    upperAction.includes("EXPIRED_COUNT_") ||
    upperAction.includes("SCHEDULED_JOB") ||
    upperAction.includes("ADMIN_DASHBOARD_") ||
    upperAction.includes("ADMIN_STATS_") ||
    upperAction.includes("EXPORT") ||
    upperAction.includes("IMPORT") ||
    upperAction.includes("BACKUP") ||
    upperAction.includes("DATA_") ||
    upperAction.includes("STATS") ||
    upperAction.includes("ANALYTICS")
  ) {
    return "data";
  }

  // 11. 성능 관련 ⚡
  if (
    upperAction.includes("SYSTEM_RESOURCE_WARNING") ||
    upperAction.includes("MEMORY_WARNING") ||
    upperAction.includes("MEMORY_USAGE") ||
    upperAction.includes("PERFORMANCE") ||
    upperAction.includes("SLOW") ||
    upperAction.includes("monitoring_") ||
    upperAction.includes("API_SLOW") ||
    upperAction.includes("TIMEOUT") ||
    upperAction.includes("HEALTH_CHECK") ||
    upperAction.includes("UPTIME")
  ) {
    return "performance";
  }

  // 12. 애플리케이션 관련 🖥️
  if (
    upperAction.includes("BUSINESS_EVENT") ||
    upperAction.includes("PAGE_VIEW") ||
    upperAction.includes("APP_") ||
    upperAction.includes("APPLICATION") ||
    upperAction.includes("NAVIGATION") ||
    upperAction.includes("SYSTEM_WARNING") ||
    upperAction.includes("API_ERROR")
  ) {
    return "application";
  }

  // 13. 에러 관련 ❌ (실패/에러가 포함된 액션들)
  if (
    upperAction.includes("_FAILED") ||
    upperAction.includes("_ERROR") ||
    upperAction.includes("ERROR") ||
    upperAction.includes("EXCEPTION") ||
    upperAction.includes("CRITICAL") ||
    upperAction.includes("FATAL") ||
    (log.level === "error" && !upperAction.includes("SUCCESS"))
  ) {
    return "error";
  }

  // 14. 기타 시스템 🔧 (기본값)
  return "system";
};

// 기본 내보내기 (새로운 프로젝트에서 사용)
export default {
  logger,
  PerformanceMonitor,
};
