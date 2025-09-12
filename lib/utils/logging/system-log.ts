import { getSystemSetting } from "@/lib/cache/system-settings-cache";
import { devLog } from "@/lib/utils/logging/dev-logger";
import { normalizeIP } from "@/lib/server/ip-helpers";
import {
  createServiceRoleClient,
  validateServiceRoleConfig,
} from "@/lib/supabase/service-role";
import type { LogLevel } from "@/lib/types/common";
import { ACTIONS_BY_CATEGORY } from "@/lib/constants/log-actions";
import { NextRequest } from "next/server";
import { extractRequestContextWithLocation } from "@/lib/server/ip-helpers";

/**
 * 통합 로깅 시스템 - 단순화된 인터페이스
 *
 * 기존 30+ 로그 함수를 5개 핵심 함수로 통합
 * - 중복 제거
 * - 일관된 인터페이스
 * - 간단한 사용법
 */

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
async function shouldLogMessage(
  messageLevel: LogLevel,
  action?: string
): Promise<boolean> {
  try {
    // 로그인 관련 액션은 레벨과 무관하게 항상 기록
    const loginActions = ["LOGIN_SUCCESS", "PASSWORD_CHANGED", "USER_CREATED"];
    if (action && loginActions.includes(action)) {
      return true;
    }

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

    const shouldLog = await shouldLogMessage(level, action);
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
    let clientIP = context.ip;
    let userAgent = context.userAgent;
    if (!clientIP) {
      clientIP = "server-unknown";
    }
    if (clientIP && clientIP !== "server-unknown") {
      clientIP = normalizeIP(clientIP);
    }

    const logData = {
      user_id: currentUserId || "00000000-0000-0000-0000-000000000000",
      user_email: userEmail || "system@demo.com",
      action,
      message,
      level,
      user_ip: clientIP || "unknown",
      user_agent: userAgent || "Server",
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
    const { error } = await supabase
      .from("system_logs")
      .insert(logData)
      .select()
      .single();
    if (error) {
      devLog.error("[DEBUG] Supabase direct insert error", error);
    } else {
      devLog.log("[DEBUG] Supabase direct insert success", logData);
    }
    return;
  } catch (error) {
    devLog.error("💥 Exception creating system log:", error);
  }
}

export const logger = {
  log: async (
    level: LogLevel,
    action: string,
    message: string,
    context?: LogContext,
    metadata?: LogMetadata
  ) => {
    await createLog(level, action, message, context, metadata);
  },

  error: async (
    error: Error | string,
    context?: LogContext,
    metadata?: LogMetadata
  ) => {
    const errorMessage = error instanceof Error ? error.message : String(error);
    const stack = error instanceof Error ? error.stack : undefined;

    // 시스템 로그에 저장
    await createLog("error", "ERROR", errorMessage, context, {
      ...metadata,
      error_message: errorMessage,
      stack_trace: stack,
    });
  },
};

/**
 * Request 컨텍스트 추출 헬퍼 함수
 */
async function extractRequestContext(request?: NextRequest) {
  if (!request) {
    return { ip: undefined, userAgent: undefined, location: undefined };
  }

  const requestContext = await extractRequestContextWithLocation(request);
  return {
    ip: requestContext.ip,
    userAgent: requestContext.userAgent,
    location: requestContext.location,
  };
}

/**
 * 통합된 시스템 로그 생성 함수
 *
 * 다양한 사용 패턴을 지원하는 하나의 함수로 통합
 *
 * @param action - 로그 액션
 * @param message - 로그 메시지
 * @param level - 로그 레벨
 * @param user - 사용자 정보 (id, email 포함)
 * @param resourceType - 리소스 타입
 * @param resourceId - 리소스 ID
 * @param metadata - 추가 메타데이터
 * @param request - NextRequest 객체 (IP/User-Agent 자동 추출용)
 */
export const createSystemLog = async (
  action: string,
  message: string,
  level: LogLevel = "info",
  user?: { id: string; email: string },
  resourceType?: ResourceType,
  resourceId?: string,
  metadata?: LogMetadata,
  request?: NextRequest
) => {
  const context = await extractRequestContext(request);

  await logger.log(
    level,
    action,
    message,
    {
      userId: user?.id,
      resource: resourceType,
      email: user?.email,
      ...context,
    },
    { ...metadata, user_email: user?.email, resource_id: resourceId }
  );
};

export const logSecurityError = async (
  threat: string,
  description: string,
  user?: { id: string; email: string },
  request?: NextRequest
) => {
  const context = await extractRequestContext(request);

  await logger.error(
    `보안 위협: ${threat}`,
    {
      userId: user?.id,
      email: user?.email,
      resource: "system",
      ...context,
    },
    { threat, description, userAgent: context.userAgent }
  );
};

// ============================================
// Performance Logger 통합 (기존 호환성 유지)
// ============================================

export interface MemoryMetric {
  heap_used: number;
  heap_total: number;
  heap_limit?: number;
  warning_threshold?: number;
}

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

/**
 * 로그 카테고리 분류 함수 (ACTIONS_BY_CATEGORY 기반)
 * 로그의 액션을 기반으로 적절한 카테고리를 반환
 *
 * @param log 로그 객체
 * @returns 로그 카테고리
 */
export const getLogCategory = (log: any): string => {
  const action = log.action;

  if (!action) {
    return "system";
  }

  // ACTIONS_BY_CATEGORY를 사용하여 정확한 매칭
  for (const [category, actions] of Object.entries(ACTIONS_BY_CATEGORY)) {
    if ((actions as readonly string[]).includes(action)) {
      return category;
    }
  }

  // 매칭되지 않는 액션은 기본값: system
  return "system";
};

// 기본 내보내기 (새로운 프로젝트에서 사용)
export default {
  logger,
};
