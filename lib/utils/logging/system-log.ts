import { supabase } from "@/lib/supabase/client";
import { getSystemSetting } from "@/lib/cache/system-settings-cache";
import { devLog } from "@/lib/utils/logging/dev-logger";
import { normalizeIP } from "@/lib/server/ip-helpers";
import { slackNotifier } from "@/lib/slack";

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
  | "visitor"
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

// 기존 시스템과 동일한 로그 레벨 우선순위
const LOG_LEVEL_PRIORITY = {
  debug: 1,
  info: 2,
  warn: 3,
  error: 4,
} as const;

/**
 * 기존 시스템 설정의 로그 레벨 필터링 함수 재사용
 */
async function shouldLogMessage(messageLevel: LogLevel): Promise<boolean> {
  try {
    // 클라이언트에서는 기본 로그 레벨 사용 (중복 호출 방지)
    if (typeof window !== "undefined") {
      const messagePriority = LOG_LEVEL_PRIORITY[messageLevel];
      const defaultPriority = LOG_LEVEL_PRIORITY["info"]; // 기본값은 info
      return messagePriority >= defaultPriority;
    }
    const systemLogLevel = await getSystemSetting("logLevel");
    // logLevel은 이미 소문자로 저장되어 있으므로 변환 불필요
    const effectiveLogLevel = (systemLogLevel as LogLevel) || "info"; // 기본값은 info

    const messagePriority = LOG_LEVEL_PRIORITY[messageLevel];
    const systemPriority = LOG_LEVEL_PRIORITY[effectiveLogLevel];

    // 메시지 우선순위가 시스템 설정 우선순위보다 높거나 같으면 로그 기록
    return messagePriority >= systemPriority;
  } catch (error) {
    devLog.warn("Error checking log level, allowing log:", error);
    return true; // 에러 시 기본적으로 로그 허용
  }
}

// 파일 상단에 추가
let cachedUserInfo: { ip: string; userAgent: string } | null = null;
let userInfoPromise: Promise<{ ip: string; userAgent: string }> | null = null;

async function getUserInfoOnce(): Promise<{ ip: string; userAgent: string }> {
  if (cachedUserInfo) return cachedUserInfo;
  if (!userInfoPromise) {
    userInfoPromise = fetch("/api/user-info")
      .then((response) =>
        response.ok
          ? response.json()
          : { ip: "client-fetch-failed", userAgent: "" }
      )
      .then((userInfo) => {
        cachedUserInfo = userInfo;
        return userInfo;
      })
      .catch((error) => {
        devLog.warn("Failed to fetch client IP:", error);
        return { ip: "client-error", userAgent: "" };
      });
  }
  return userInfoPromise;
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
    // 기존 시스템과 동일한 레벨 필터링 체크
    if (!(await shouldLogMessage(level))) {
      devLog.log(
        `🚫 Log filtered out due to level: ${level} (action: ${action})`
      );
      return;
    }

    const isServer = typeof window === "undefined";

    // 사용자 정보 처리 - context 우선, 없으면 인증에서 가져오기
    let currentUserId = context.userId;
    let userEmail = context.email;

    // context에 사용자 정보가 없는 경우 서버 사이드에서는 undefined 사용
    if (!currentUserId || !userEmail) {
      if (isServer) {
        // 서버 사이드에서는 시스템 로그로 처리 (UUID 필드에는 undefined 사용)
        currentUserId = currentUserId || undefined;
        userEmail =
          userEmail || process.env.ENV_COMPANY_EMAIL || "k331502@nate.com";
      } else {
        // 클라이언트 사이드에서만 경고 로그
        // devLog.warn(`Missing user context for log: ${action}`, {
        //   hasUserId: !!currentUserId,
        //   hasEmail: !!userEmail,
        // });
      }
    }

    // 사용자 이메일이 여전히 없고 userId가 있으면 profiles에서 조회
    if (!userEmail && currentUserId) {
      try {
        const { data: userData } = await supabase
          .from("profiles")
          .select("email")
          .eq("id", currentUserId)
          .single();
        userEmail = userData?.email || undefined;
      } catch (error) {
        devLog.warn("Failed to fetch user email from profiles:", error);
      }
    }

    // IP 주소 처리 - context 우선
    let clientIP = context.ip;

    if (!clientIP) {
      if (isServer) {
        // 서버사이드에서는 기본값 사용
        clientIP = "server-system";
      } else {
        // 클라이언트에서만 /api/user-info 호출 가능 (최초 1회만, Promise 공유)
        try {
          const userInfo = await getUserInfoOnce();
          clientIP = userInfo.ip || "client-unknown";
        } catch (error) {
          devLog.warn("Failed to fetch client IP:", error);
          clientIP = "client-error";
        }
      }
    }

    // IP 주소 정규화 (클라이언트/서버 모두 적용)
    if (
      clientIP &&
      clientIP !== "server-unknown" &&
      clientIP !== "client-unknown" &&
      clientIP !== "client-fetch-failed" &&
      clientIP !== "client-error"
    ) {
      clientIP = normalizeIP(clientIP);
    }

    // User-Agent 처리 - context 우선
    let userAgent = context.userAgent;
    if (!userAgent) {
      if (isServer) {
        // 서버사이드에서는 context에 의존하거나 기본값 사용
        userAgent = "Server";
      } else {
        // 클라이언트에서는 navigator에서 가져오기
        userAgent = window.navigator.userAgent || "Unknown-Client";
      }
    }

    // 로그 데이터 구조 (개선된 정보 포함)
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
          ? JSON.stringify({
              ...metadata,
              environment: isServer ? "server" : "client",
              context_provided: {
                userId: !!context.userId,
                email: !!context.email,
                ip: !!context.ip,
                userAgent: !!context.userAgent,
              },
            })
          : JSON.stringify({
              environment: isServer ? "server" : "client",
              context_provided: {
                userId: !!context.userId,
                email: !!context.email,
                ip: !!context.ip,
                userAgent: !!context.userAgent,
              },
            }),
    };

    // Supabase에 로그 삽입
    const { error } = await supabase.from("system_logs").insert(logData);

    if (error) {
      devLog.error("❌ Failed to create system log:", error);
      devLog.error("Failed log data:", logData);
      return;
    }

    devLog.log(`✅ System log created: ${action} - ${message}`, {
      environment: isServer ? "server" : "client",
      userId: currentUserId ? "provided" : "missing",
      email: userEmail ? "provided" : "missing",
      ip:
        !clientIP || clientIP.includes("unknown") || clientIP.includes("error")
          ? `⚠️ ${clientIP || "missing"}`
          : "✅ provided",
    });
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

/**
 * 성능 측정 헬퍼 클래스 (단순화)
 */
export class PerformanceTimer {
  private startTime: number;
  private operation: string;

  constructor(operation: string) {
    this.operation = operation;
    this.startTime = performance.now();
  }

  async end(threshold = 1000, context?: LogContext): Promise<number> {
    const duration = performance.now() - this.startTime;

    if (duration > threshold) {
      await logger.performance(this.operation, duration, threshold, context);
    }

    return duration;
  }
}

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

export const createErrorLog = async (
  action: string,
  error: any,
  context?: string,
  userId?: string
) => {
  await logger.error(error, { userId }, { action, context });
};

export const logApiError = (
  endpoint: string,
  method: string,
  error: Error | string,
  userId?: string,
  context?: Partial<LogContext>
) => {
  return logger.api(endpoint, method, { error }, { userId, ...context });
};

export const logDataChange = (
  action: string,
  resource: string,
  userId?: string,
  metadata?: LogMetadata,
  context?: Partial<LogContext>
) => {
  return logger.business(action, resource, { userId, ...context }, metadata);
};

export const logAuthError = async (
  action: string,
  error: any,
  email?: string,
  userId?: string
) => {
  await logger.error(error, { userId }, { action, email, type: "auth" });
};

export const logFileUploadError = async (
  fileName: string,
  fileSize: number,
  error: any,
  userId?: string,
  context?: Partial<LogContext>
) => {
  await logger.error(
    error,
    { userId, ...context },
    { fileName, fileSize, type: "file_upload" }
  );
};

export const logPermissionError = async (
  resource: string,
  action: string,
  userId?: string,
  requiredRole?: string,
  context?: Partial<LogContext>
) => {
  await logger.log(
    "warn",
    "PERMISSION_ERROR",
    `권한 에러: ${resource}에 대한 ${action} 권한 없음`,
    { userId, ...context },
    { resource, action, requiredRole }
  );
};

export const logBusinessError = async (
  operation: string,
  error: any,
  context?: Record<string, any>,
  userId?: string
) => {
  await logger.error(
    error,
    { userId },
    { operation, context, type: "business" }
  );
};

export const logSystemResourceError = async (
  resource: string,
  error: any,
  metrics?: Record<string, any>
) => {
  await logger.error(error, {}, { resource, metrics, type: "system_resource" });
};

export const logExternalServiceError = async (
  service: string,
  operation: string,
  error: any,
  userId?: string
) => {
  await logger.error(
    error,
    { userId },
    { service, operation, type: "external_service" }
  );
};

export const logUserActivity = async (
  action: string,
  message: string,
  userId?: string,
  metadata?: Record<string, any>,
  context?: Partial<LogContext>
) => {
  await logger.business(
    action,
    "user_activity",
    { userId, ...context },
    metadata
  );
};

export const logPageView = async (
  fromPath: string,
  toPath: string,
  userId?: string,
  context?: Partial<LogContext>
) => {
  await logger.business(
    "PAGE_VIEW",
    "navigation",
    { userId, ...context },
    { fromPath, toPath }
  );
};

export const logUserLogin = async (
  userId: string,
  email: string,
  loginMethod: "email" | "oauth" = "email",
  context?: Partial<LogContext>
) => {
  await logger.business(
    "USER_LOGIN",
    "auth",
    { userId, email, ...context },
    { email, loginMethod }
  );
};

export const logUserLogout = async (
  userId: string,
  email: string,
  context?: Partial<LogContext>
) => {
  await logger.business(
    "USER_LOGOUT",
    "auth",
    { userId, email, ...context },
    { email }
  );
};

export const logLoginFailed = async (
  email: string,
  reason: string,
  ip?: string,
  context?: Partial<LogContext>
) => {
  await logger.log(
    "warn",
    "USER_LOGIN_FAILED",
    `로그인 실패: ${email} - ${reason}`,
    { ip, email, ...context },
    { email, reason }
  );
};

export const logAppStart = async (userId?: string) => {
  await logger.business("APP_START", "application", { userId }, {});
};

export const logAppEnd = async (userId?: string, sessionDuration?: number) => {
  await logger.business(
    "APP_END",
    "application",
    { userId },
    { sessionDuration }
  );
};

export const logFarmActivity = async (
  action: "CREATED" | "UPDATED" | "DELETED" | "ACCESSED",
  farmId: string,
  farmName: string,
  userId?: string,
  details?: Record<string, any>
) => {
  await logger.business(
    `FARM_${action}`,
    "farm",
    { userId },
    { farmId, farmName, ...details }
  );
};

export const logMemberActivity = async (
  action: "ADDED" | "REMOVED" | "ROLE_CHANGED",
  memberEmail: string,
  farmId: string,
  userId?: string,
  details?: Record<string, any>
) => {
  await logger.business(
    `MEMBER_${action}`,
    "member",
    { userId },
    { memberEmail, farmId, ...details }
  );
};

export const logSettingsChange = async (
  settingKey: string,
  oldValue: any,
  newValue: any,
  userId?: string
) => {
  await logger.business(
    "SETTINGS_UPDATED",
    "settings",
    { userId },
    { settingKey, oldValue, newValue }
  );
};

export const logValidationError = async (
  field: string,
  value: any,
  rule: string,
  userId?: string,
  context?: string
) => {
  await logger.log(
    "warn",
    "VALIDATION_ERROR",
    `유효성 검사 실패: ${field}`,
    { userId },
    { field, value, rule, context }
  );
};

export const logSecurityError = async (
  threat: string,
  description: string,
  userId?: string,
  ip?: string,
  userAgent?: string
) => {
  await logger.error(
    `보안 위협: ${threat}`,
    { userId, ip },
    { threat, description, userAgent }
  );
};

export const logPerformanceError = async (
  endpoint: string,
  actualDuration: number,
  threshold: number,
  userId?: string
) => {
  await logger.performance(endpoint, actualDuration, threshold, { userId });
};

export const logAdminAction = async (
  action: string,
  target: string,
  userId: string,
  changes?: Record<string, any>
) => {
  await logger.business(
    "ADMIN_ACTION",
    "admin",
    { userId },
    { action, target, changes }
  );
};

export const logBusinessEvent = async (
  event: string,
  description: string,
  userId?: string,
  metadata?: Record<string, any>
) => {
  await logger.business(
    "BUSINESS_EVENT",
    "business",
    { userId },
    { event, description, ...metadata }
  );
};

export const createAuthLog = async (
  action: string,
  message: string,
  email?: string,
  userId?: string,
  metadata?: Record<string, any>,
  context?: Partial<LogContext>
) => {
  await logger.log(
    "info",
    action,
    message,
    { userId, email, ...context },
    { email, ...metadata }
  );
};

export const logVisitorDataAccess = async (
  accessType: string,
  userId?: string,
  email?: string,
  details?: Record<string, any>,
  context?: Partial<LogContext>
) => {
  await logger.business(
    `VISITOR_DATA_${accessType}`,
    "visitor_data",
    { userId, email, ...context },
    details
  );
};

export const logVisitorDataExport = async (
  exportCount: number,
  userId?: string,
  details?: Record<string, any>
) => {
  await logger.business(
    "VISITOR_DATA_EXPORT",
    "visitor_data",
    { userId },
    { exportCount, ...details }
  );
};

export const logSystemWarning = async (
  operation: string,
  message: string,
  logContext?: Partial<LogContext>,
  metadata?: Record<string, any>,
  userId?: string
) => {
  await logger.log(
    "warn",
    "SYSTEM_WARNING",
    `${operation}: ${message}`,
    { userId, ...logContext },
    metadata
  );
};

export const logConfigurationWarning = async (
  configKey: string,
  issue: string,
  fallbackValue?: any,
  userId?: string
) => {
  await logger.log(
    "warn",
    "CONFIGURATION_WARNING",
    `설정 경고: ${configKey} - ${issue}`,
    { userId },
    { configKey, issue, fallbackValue }
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

export const logPerformanceMetric = async (
  metricType: string,
  metric: PerformanceMetric,
  userId?: string
) => {
  await logger.performance(metricType, metric.duration_ms, 1000, { userId });
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
    // 브라우저 환경에서는 process가 undefined이거나 memoryUsage 함수가 없음
    if (
      typeof process === "undefined" ||
      typeof process.memoryUsage !== "function"
    ) {
      devLog.log(
        "[SYSTEM_RESOURCES] 브라우저 환경에서 시스템 리소스 모니터링 스킵"
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

export interface ValidationError {
  field: string;
  value: any;
  message: string;
  errorType: string;
}

export interface ValidationSummary {
  formType: string;
  totalFields: number;
  failedFields: string[];
  errors: ValidationError[];
  completionRate: number;
  userId?: string;
  farmId?: string;
}

export const logValidationSummary = async (
  summary: ValidationSummary
): Promise<void> => {
  try {
    if (summary.errors.length === 0) {
      return;
    }

    await logger.log(
      "warn",
      "VALIDATION_SUMMARY",
      `${summary.formType} 폼 검증 실패: ${summary.failedFields.join(", ")}`,
      { userId: summary.userId },
      {
        formType: summary.formType,
        failedFields: summary.failedFields,
        errorCount: summary.errors.length,
        completionRate: summary.completionRate,
        errors: summary.errors,
      }
    );
  } catch (error) {
    devLog.error("[VALIDATION_SUMMARY] 유효성 검사 로그 생성 실패:", error);
  }
};

export class VisitorFormValidator {
  private errors: ValidationError[] = [];
  private userId?: string;
  private farmId?: string;

  constructor(userId?: string, farmId?: string) {
    this.userId = userId;
    this.farmId = farmId;
  }

  validateField(
    field: string,
    value: any,
    validator: (value: any) => {
      isValid: boolean;
      message?: string;
      errorType?: string;
    }
  ): boolean {
    const result = validator(value);

    if (!result.isValid) {
      this.errors.push({
        field,
        value: this.maskSensitiveData(field, value),
        message: result.message || "유효하지 않은 값입니다",
        errorType: result.errorType || "validation_failed",
      });
      return false;
    }

    return true;
  }

  validateRequired(field: string, value: any): boolean {
    return this.validateField(field, value, (val) => ({
      isValid: val !== null && val !== undefined && val !== "",
      message: `${field}은(는) 필수 입력 항목입니다`,
      errorType: "required_field_missing",
    }));
  }

  validatePhone(value: string): boolean {
    const PHONE_PATTERN = /^010-\d{4}-\d{4}$/;
    return this.validateField("phone", value, (val) => ({
      isValid: PHONE_PATTERN.test(val || ""),
      message: "올바른 전화번호 형식(010-XXXX-XXXX)을 입력해주세요",
      errorType: "invalid_phone_format",
    }));
  }

  validateVehicleNumber(value: string): boolean {
    return this.validateField("vehicle_number", value, (val) => {
      if (!val) return { isValid: true };
      const vehicleRegex = /^[0-9]{2,3}[가-힣][0-9]{4}$/;
      return {
        isValid: vehicleRegex.test(val),
        message: "올바른 차량번호 형식이 아닙니다 (예: 12가3456)",
        errorType: "invalid_vehicle_format",
      };
    });
  }

  async finalize(totalFields: number): Promise<boolean> {
    const completionRate = (totalFields - this.errors.length) / totalFields;

    if (this.errors.length > 0) {
      await logValidationSummary({
        formType: "visitor_registration",
        totalFields,
        failedFields: this.errors.map((e) => e.field),
        errors: this.errors,
        completionRate,
        userId: this.userId,
        farmId: this.farmId,
      });
    }

    return this.errors.length === 0;
  }

  getErrors(): ValidationError[] {
    return [...this.errors];
  }

  reset(): void {
    this.errors = [];
  }

  private maskSensitiveData(field: string, value: any): any {
    if (typeof value !== "string") return value;

    switch (field) {
      case "phone":
        return value.replace(/(\d{3})-?(\d{4})-?(\d{4})/, "$1-****-$3");
      case "name":
        return value.length > 1
          ? value[0] + "*".repeat(value.length - 1)
          : value;
      default:
        return value;
    }
  }
}

// ============================================
// 로그 분류 및 분석 함수들 (기존 호환성 유지)
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
    // 사용자 인증 관련
    "USER_LOGIN",
    "USER_LOGOUT",
    "LOGIN_FAILED",
    "LOGIN_ATTEMPT_FAILED",
    "LOGIN_SUCCESS",
    "LOGOUT_SUCCESS",
    "LOGOUT_ERROR",
    "SESSION_EXPIRED",

    // 사용자 계정 관리
    "USER_CREATED",
    "USER_CREATION_FAILED",
    "USER_UPDATED",
    "USER_UPDATE_FAILED",
    "USER_DELETED",
    "USER_DELETE_FAILED",
    "PASSWORD_CHANGED",
    "PASSWORD_CHANGE_FAILED",
    "PASSWORD_RESET",
    "PASSWORD_RESET_FAILED",
    "ACCOUNT_LOCKED",
    "ACCOUNT_UNLOCKED",

    // 농장 관리
    "FARM_CREATED",
    "FARM_CREATE",
    "FARM_CREATE_FAILED",
    "FARM_UPDATED",
    "FARM_UPDATE",
    "FARM_UPDATE_FAILED",
    "FARM_DELETED",
    "FARM_DELETE",
    "FARM_DELETE_FAILED",
    "FARM_READ",
    "FARM_ACCESS",
    "FARM_STATUS_CHANGED",
    "FARM_FETCH_FAILED",

    // 농장 구성원 관리
    "MEMBER_ADDED",
    "MEMBER_REMOVED",
    "MEMBER_CREATE",
    "MEMBER_CREATE_FAILED",
    "MEMBER_UPDATE",
    "MEMBER_UPDATE_FAILED",
    "MEMBER_DELETE",
    "MEMBER_DELETE_FAILED",
    "MEMBER_READ",
    "MEMBER_READ_FAILED",
    "MEMBER_BULK_READ",
    "MEMBER_BULK_READ_FAILED",
    "MEMBER_ROLE_CHANGED",

    // 방문자 관리
    "VISITOR_CREATED",
    "VISITOR_UPDATED",
    "VISITOR_DELETED",
    "VISITOR_CHECKED_IN",
    "VISITOR_CHECKED_OUT",
    "VISITOR_LIST_VIEW",
    "VISITOR_DETAIL_VIEW",
    "VISITOR_EXPORT",
    "LIST_VIEW",
    "LIST_VIEW_FAILED",
    "DETAIL_VIEW",
    "DETAIL_VIEW_FAILED",
    "CREATED",
    "UPDATED",
    "DELETED",
    "CREATION_FAILED",
    "UPDATE_FAILED",
    "DELETE_FAILED",

    // 시스템 설정
    "SETTINGS_UPDATED",
    "SETTINGS_CHANGE",
    "SETTINGS_BULK_UPDATE",
    "SETTINGS_ACCESS_DENIED",
    "CONFIGURATION_ERROR",

    // 푸시 알림
    "PUSH_SUBSCRIPTION_CREATED",
    "PUSH_SUBSCRIPTION_DELETED",
    "PUSH_NOTIFICATION_SENT",
    "PUSH_NOTIFICATION_NO_SUBSCRIBERS",
    "PUSH_NOTIFICATION_FILTERED_OUT",
    "PUSH_NOTIFICATION_SEND_FAILED",
    "PUSH_SUBSCRIPTION_CLEANUP",
    "BROADCAST_NOTIFICATION_SENT",
    "BROADCAST_NOTIFICATION_FAILED",
    "NOTIFICATION_SETTINGS_CREATION_FAILED",
    "NOTIFICATION_VAPID_KEY_RETRIEVED",
    "NOTIFICATION_SUBSCRIPTION_SUCCESS",

    // 관리 기능
    "LOG_CLEANUP",
    "LOG_EXPORT",
    "LOG_EXPORT_ERROR",
    "LOG_CLEANUP_ERROR",
    "DATA_EXPORT",
    "DATA_IMPORT",
    "SYSTEM_BACKUP",
    "SYSTEM_RESTORE",

    // 관리자 통계
    "ADMIN_STATS_GENERATION_STARTED",
    "ADMIN_STATS_GENERATION_COMPLETED",
    "ADMIN_STATS_GENERATION_FAILED",

    // 애플리케이션 라이프사이클
    "PAGE_VIEW",
    "APP_START",
    "APP_END",
    "BUSINESS_EVENT",
    "USER_ACTIVITY",
    "ADMIN_ACTION",

    // 보안 관련
    "UNAUTHORIZED_ACCESS",
    "SECURITY_THREAT_DETECTED",
    "SUSPICIOUS_ACTIVITY",
    "ACCESS_DENIED",
    "PERMISSION_DENIED",
    "IP_BLOCKED",
    "RATE_LIMIT_EXCEEDED",

    // 데이터 접근
    "DATA_ACCESS",
    "DATA_CHANGE",
    "BULK_OPERATION",
    "EXPORT_OPERATION",
    "IMPORT_OPERATION",
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
    // 사용자 관련 오류
    "USER_CREATION_FAILED",
    "USER_UPDATE_FAILED",
    "USER_DELETE_FAILED",
    "PASSWORD_CHANGE_FAILED",
    "PASSWORD_RESET_FAILED",
    "LOGIN_FAILED",
    "LOGIN_ATTEMPT_FAILED",
    "LOGIN_VALIDATION_ERROR",
    "LOGOUT_ERROR",

    // 농장 관련 오류
    "FARM_CREATE_FAILED",
    "FARM_UPDATE_FAILED",
    "FARM_DELETE_FAILED",
    "FARM_ACCESS_DENIED",
    "FARM_FETCH_FAILED",

    // 구성원 관련 오류
    "MEMBER_CREATE_FAILED",
    "MEMBER_UPDATE_FAILED",
    "MEMBER_DELETE_FAILED",
    "MEMBER_READ_FAILED",
    "MEMBER_BULK_READ_FAILED",

    // 방문자 관련 오류
    "VISITOR_CREATION_FAILED",
    "VISITOR_UPDATE_FAILED",
    "VISITOR_DELETE_FAILED",
    "LIST_VIEW_FAILED",
    "DETAIL_VIEW_FAILED",
    "CREATION_FAILED",
    "UPDATE_FAILED",
    "DELETE_FAILED",

    // API 및 데이터베이스 오류
    "API_ERROR",
    "DATABASE_ERROR",
    "CONNECTION_ERROR",
    "TIMEOUT_ERROR",
    "DATA_INTEGRITY_ERROR",
    "QUERY_ERROR",
    "TRANSACTION_ERROR",

    // 파일 및 업로드 오류
    "FILE_UPLOAD_ERROR",
    "IMAGE_DELETE_ERROR",
    "IMAGE_UPLOAD_ERROR",
    "FILE_DELETE_ERROR",
    "UPLOAD_PROCESS_ERROR",
    "DELETE_PROCESS_ERROR",
    "STORAGE_ERROR",

    // 유효성 검사 오류
    "VALIDATION_ERROR",
    "VALIDATION_WARNING",
    "FORM_VALIDATION_ERROR",
    "INPUT_VALIDATION_FAILED",
    "DATA_VALIDATION_FAILED",

    // 시스템 성능 오류
    "PERFORMANCE_ERROR",
    "PERFORMANCE_WARNING",
    "SLOW_QUERY",
    "MEMORY_WARNING",
    "CPU_WARNING",
    "DISK_SPACE_WARNING",
    "SYSTEM_RESOURCE_ERROR",

    // 보안 오류
    "SECURITY_ERROR",
    "UNAUTHORIZED_ACCESS",
    "ACCESS_DENIED",
    "PERMISSION_DENIED",
    "SECURITY_THREAT_DETECTED",
    "SUSPICIOUS_ACTIVITY",
    "RATE_LIMIT_EXCEEDED",
    "IP_BLOCKED",

    // 설정 관련 오류
    "SETTINGS_UPDATE_ERROR",
    "CONFIGURATION_ERROR",
    "SETTINGS_ACCESS_DENIED",

    // 알림 관련 오류
    "PUSH_NOTIFICATION_ERROR",
    "PUSH_NOTIFICATION_SEND_FAILED",
    "PUSH_NOTIFICATION_NO_SUBSCRIBERS",
    "PUSH_NOTIFICATION_FILTERED_OUT",
    "BROADCAST_NOTIFICATION_FAILED",
    "NOTIFICATION_SETTINGS_CREATION_FAILED",
    "SUBSCRIPTION_ERROR",

    // 로그 및 관리 오류
    "LOG_CLEANUP_ERROR",
    "LOG_EXPORT_ERROR",
    "LOG_CREATION_FAILED",
    "EXPORT_ERROR",
    "IMPORT_ERROR",
    "BACKUP_ERROR",
    "RESTORE_ERROR",

    // 관리자 통계 오류
    "ADMIN_STATS_GENERATION_FAILED",

    // 일반 시스템 오류
    "SYSTEM_ERROR",
    "INTERNAL_ERROR",
    "UNEXPECTED_ERROR",
    "CRITICAL_ERROR",
    "FATAL_ERROR",
    "SERVICE_UNAVAILABLE",
    "MAINTENANCE_MODE_ERROR",
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
 * 카테고리 목록:
 * - auth: 인증 관련 (로그인, 로그아웃, 계정 관리)
 * - farm: 농장 관리 관련
 * - member: 농장 구성원 관리 관련
 * - visitor: 방문자 관리 관련
 * - settings: 시스템 설정 관련
 * - file: 파일 업로드/다운로드 관련
 * - performance: 성능 모니터링 관련
 * - notification: 푸시 알림 관련
 * - security: 보안 관련
 * - data: 데이터 관리 (내보내기/가져오기) 관련
 * - log: 로그 관리 관련
 * - application: 애플리케이션 라이프사이클 관련
 * - error: 분류되지 않은 에러
 * - system: 기타 시스템 관련
 *
 * @param log 로그 객체
 * @returns 로그 카테고리
 */
export const getLogCategory = (log: any): string => {
  const upperAction = log.action?.toUpperCase();

  // 인증 관련
  if (
    upperAction?.includes("USER_") ||
    upperAction?.includes("LOGIN") ||
    upperAction?.includes("LOGOUT") ||
    upperAction?.includes("PASSWORD") ||
    upperAction?.includes("AUTH") ||
    upperAction?.includes("SESSION") ||
    upperAction?.includes("TOKEN") ||
    upperAction?.includes("ACCOUNT")
  ) {
    return "auth";
  }

  // 농장 관련
  if (upperAction?.includes("FARM_") || upperAction?.includes("FARM")) {
    return "farm";
  }

  // 구성원 관련
  if (
    upperAction?.includes("MEMBER_") ||
    upperAction?.includes("MEMBER") ||
    upperAction?.includes("ROLE")
  ) {
    return "member";
  }

  // 방문자 관련
  if (
    upperAction?.includes("VISITOR_") ||
    upperAction?.includes("VISITOR") ||
    upperAction?.includes("LIST_VIEW") ||
    upperAction?.includes("DETAIL_VIEW")
  ) {
    return "visitor";
  }

  // 설정 관련
  if (
    upperAction?.includes("SETTINGS_") ||
    upperAction?.includes("SETTINGS") ||
    upperAction?.includes("CONFIGURATION") ||
    upperAction?.includes("CONFIG")
  ) {
    return "settings";
  }

  // 파일 업로드 관련
  if (
    upperAction?.includes("FILE_UPLOAD") ||
    upperAction?.includes("IMAGE_") ||
    upperAction?.includes("UPLOAD") ||
    upperAction?.includes("STORAGE")
  ) {
    return "file";
  }

  // 성능 관련
  if (
    upperAction?.includes("PERFORMANCE_") ||
    upperAction?.includes("SLOW_") ||
    upperAction?.includes("MEMORY") ||
    upperAction?.includes("CPU") ||
    upperAction?.includes("DISK")
  ) {
    return "performance";
  }

  // 푸시 알림 관련
  if (
    upperAction?.includes("PUSH_") ||
    upperAction?.includes("NOTIFICATION") ||
    upperAction?.includes("SUBSCRIPTION")
  ) {
    return "notification";
  }

  // 보안 관련
  if (
    upperAction?.includes("SECURITY") ||
    upperAction?.includes("UNAUTHORIZED") ||
    upperAction?.includes("ACCESS_DENIED") ||
    upperAction?.includes("PERMISSION") ||
    upperAction?.includes("SUSPICIOUS") ||
    upperAction?.includes("BLOCKED") ||
    upperAction?.includes("THREAT")
  ) {
    return "security";
  }

  // 데이터 관리 관련
  if (
    upperAction?.includes("EXPORT") ||
    upperAction?.includes("IMPORT") ||
    upperAction?.includes("BACKUP") ||
    upperAction?.includes("RESTORE") ||
    upperAction?.includes("BULK") ||
    upperAction?.includes("DATA_") ||
    upperAction?.includes("STATS") ||
    upperAction?.includes("GENERATION")
  ) {
    return "data";
  }

  // 로그 관리 관련
  if (
    upperAction?.includes("LOG_") ||
    upperAction?.includes("CLEANUP") ||
    upperAction?.includes("AUDIT")
  ) {
    return "log";
  }

  // 애플리케이션 관련
  if (
    upperAction?.includes("APP_") ||
    upperAction?.includes("PAGE_VIEW") ||
    upperAction?.includes("BUSINESS_EVENT") ||
    upperAction?.includes("USER_ACTIVITY") ||
    upperAction?.includes("ADMIN_ACTION")
  ) {
    return "application";
  }

  // 에러 관련 (다른 카테고리에 속하지 않는 경우)
  if (isErrorLog(log)) {
    return "error";
  }

  return "system";
};

export const calculateLogStats = (logs: any[]) => {
  return {
    total: logs.length,
    byLevel: {
      info: logs.filter((log) => log.level === "info").length,
      warn: logs.filter((log) => log.level === "warn").length,
      error: logs.filter((log) => log.level === "error").length,
      debug: logs.filter((log) => log.level === "debug").length,
    },
    recentErrors: logs.filter(
      (log) =>
        log.level === "error" &&
        new Date(log.created_at) > new Date(Date.now() - 24 * 60 * 60 * 1000)
    ).length,
  };
};

// ============================================
// 로그 필터링 함수들의 테스트를 위한 유틸리티
// ============================================

export const validateLogFiltering = (
  logs: any[] = []
): {
  totalLogs: number;
  auditLogs: number;
  errorLogs: number;
  categoryCounts: Record<string, number>;
  uncategorizedActions: string[];
} => {
  const auditLogs = logs.filter(isAuditLog);
  const errorLogs = logs.filter(isErrorLog);

  const categoryCounts: Record<string, number> = {};
  const uncategorizedActions: string[] = [];

  logs.forEach((log) => {
    const category = getLogCategory(log);
    categoryCounts[category] = (categoryCounts[category] || 0) + 1;

    // 시스템 카테고리에 속하는 로그 중 알려지지 않은 액션 찾기
    if (
      category === "system" &&
      log.action &&
      !isCommonSystemAction(log.action)
    ) {
      if (!uncategorizedActions.includes(log.action)) {
        uncategorizedActions.push(log.action);
      }
    }
  });

  return {
    totalLogs: logs.length,
    auditLogs: auditLogs.length,
    errorLogs: errorLogs.length,
    categoryCounts,
    uncategorizedActions,
  };
};

/**
 * 일반적인 시스템 액션인지 확인하는 헬퍼 함수
 */
const isCommonSystemAction = (action: string): boolean => {
  const commonActions = [
    "SYSTEM_START",
    "SYSTEM_STOP",
    "SYSTEM_RESTART",
    "HEALTH_CHECK",
    "HEARTBEAT",
    "PING",
    "CACHE_CLEAR",
    "CACHE_UPDATE",
    "CACHE_HIT",
    "CACHE_MISS",
    "MAINTENANCE_START",
    "MAINTENANCE_END",
    "DEBUG_INFO",
    "INFO",
    "WARN",
    "ERROR",
    "DEBUG",
  ];

  return commonActions.some((common) =>
    action.toUpperCase().includes(common.toUpperCase())
  );
};

/**
 * 로그 액션의 완전성을 검사하는 함수
 * 새로운 로그 액션이 추가되었을 때 필터링 함수들을 업데이트해야 하는지 확인
 */
export const checkLogActionCoverage = (
  logs: any[] = []
): {
  missingInAudit: string[];
  missingInError: string[];
  missingInCategory: string[];
  recommendations: string[];
} => {
  const actionSet = new Set(logs.map((log) => log.action).filter(Boolean));
  const allActions = Array.from(actionSet);
  const recommendations: string[] = [];

  const missingInAudit = allActions.filter((action) => {
    const testLog = { action, user_id: "test" };
    const shouldBeAudit =
      action.includes("CREATE") ||
      action.includes("UPDATE") ||
      action.includes("DELETE") ||
      action.includes("LOGIN") ||
      action.includes("USER_") ||
      action.includes("ADMIN_");
    return shouldBeAudit && !isAuditLog(testLog);
  });

  const missingInError = allActions.filter((action) => {
    const testLog = { action, level: "info" };
    const shouldBeError =
      action.includes("FAILED") ||
      action.includes("ERROR") ||
      action.includes("DENIED") ||
      action.includes("WARNING");
    return shouldBeError && !isErrorLog(testLog);
  });

  const missingInCategory = allActions.filter((action) => {
    const testLog = { action };
    return (
      getLogCategory(testLog) === "system" && !isCommonSystemAction(action)
    );
  });

  if (missingInAudit.length > 0) {
    recommendations.push(
      `다음 액션들을 isAuditLog에 추가 고려: ${missingInAudit.join(", ")}`
    );
  }

  if (missingInError.length > 0) {
    recommendations.push(
      `다음 액션들을 isErrorLog에 추가 고려: ${missingInError.join(", ")}`
    );
  }

  if (missingInCategory.length > 0) {
    recommendations.push(
      `다음 액션들의 카테고리 분류 검토 필요: ${missingInCategory.join(", ")}`
    );
  }

  return {
    missingInAudit,
    missingInError,
    missingInCategory,
    recommendations,
  };
};

// 기본 내보내기 (새로운 프로젝트에서 사용)
export default {
  logger,
  PerformanceTimer,
  PerformanceMonitor,
  VisitorFormValidator,
};
