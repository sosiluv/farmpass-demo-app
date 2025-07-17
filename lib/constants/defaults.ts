/**
 * 시스템 전체에서 사용하는 기본값 상수
 *
 * 이 파일의 값들을 변경하면 모든 관련 파일에 자동으로 반영됩니다.
 * 단일 진실 공급원(Single Source of Truth) 역할을 합니다.
 */

// =================================
// 보안 설정 기본값
// =================================
export const SECURITY_DEFAULTS = {
  maxLoginAttempts: 5,
  accountLockoutDurationMinutes: 15,
  passwordMinLength: 8,
  passwordRequireSpecialChar: true,
  passwordRequireNumber: true,
  passwordRequireUpperCase: true,
  passwordRequireLowerCase: true,
} as const;

// =================================
// 방문자 정책 기본값
// =================================
export const VISITOR_DEFAULTS = {
  reVisitAllowInterval: 6,
  maxVisitorsPerDay: 100,
  visitorDataRetentionDays: 1095,
  requireVisitorPhoto: false,
  requireVisitorContact: true,
  requireVisitPurpose: true,
} as const;

// =================================
// 시스템 설정 기본값
// =================================
export const SYSTEM_DEFAULTS = {
  logLevel: "info" as const,
  logRetentionDays: 90,
  maintenanceMode: false,
  debugMode: false,
  maintenanceEstimatedTime: 30,
} as const;

// =================================
// 알림 설정 기본값
// =================================
export const NOTIFICATION_DEFAULTS = {
  visitTemplate:
    "{방문자명}님이 {방문날짜} {방문시간}에 {농장명}을 방문하였습니다.",
  pushRequireInteraction: false,
  pushSoundEnabled: false,
  pushVibrateEnabled: false,
} as const;

// =================================
// 구독 정리 설정 기본값
// =================================
export const SUBSCRIPTION_CLEANUP_DEFAULTS = {
  subscriptionCleanupDays: 30,
  subscriptionFailCountThreshold: 5,
  subscriptionCleanupInactive: true,
  subscriptionForceDelete: false,
} as const;

// =================================
// 일반 설정 기본값
// =================================
export const GENERAL_DEFAULTS = {
  siteName: "농장 출입 관리 시스템(FarmPass)",
  siteDescription:
    "방역은 출입자 관리부터 시작됩니다. QR기록으로 축산 질병 예방의 첫걸음을 함께하세요.",
  language: "ko",
  timezone: "Asia/Seoul",
  dateFormat: "YYYY-MM-DD",
  maintenanceContactInfo: "문의사항이 있으시면 관리자에게 연락해 주세요.",
  maintenanceMessage: "현재 시스템 업데이트 및 유지보수 작업이 진행 중입니다.",
} as const;

// =================================
// 입력 검증 규칙
// =================================
export const INPUT_VALIDATION_RULES = {
  // 보안 설정
  maxLoginAttempts: {
    min: 3,
    max: 10,
    defaultValue: SECURITY_DEFAULTS.maxLoginAttempts,
  },
  accountLockoutDurationMinutes: {
    min: 5,
    max: 1440,
    defaultValue: SECURITY_DEFAULTS.accountLockoutDurationMinutes,
  },
  passwordMinLength: {
    min: 6,
    max: 32,
    defaultValue: SECURITY_DEFAULTS.passwordMinLength,
  },

  // 방문자 정책
  reVisitAllowInterval: {
    min: 0,
    max: 168,
    defaultValue: VISITOR_DEFAULTS.reVisitAllowInterval,
  },
  maxVisitorsPerDay: {
    min: 1,
    max: 1000,
    defaultValue: VISITOR_DEFAULTS.maxVisitorsPerDay,
  },
  visitorDataRetentionDays: {
    min: 30,
    max: 3650,
    defaultValue: VISITOR_DEFAULTS.visitorDataRetentionDays,
  },

  // 시스템 설정
  logRetentionDays: {
    min: 7,
    max: 365,
    defaultValue: SYSTEM_DEFAULTS.logRetentionDays,
  },
  apiRateLimit: { min: 10, max: 1000, defaultValue: 100 },
} as const;

// =================================
// 통합 기본값 (기존 호환성 유지)
// =================================
export const DEFAULT_SYSTEM_SETTINGS = {
  // 일반 설정
  siteName: GENERAL_DEFAULTS.siteName,
  siteDescription: GENERAL_DEFAULTS.siteDescription,
  language: GENERAL_DEFAULTS.language,
  timezone: GENERAL_DEFAULTS.timezone,
  dateFormat: GENERAL_DEFAULTS.dateFormat,
  favicon: null,
  logo: null,

  // 보안 설정
  maxLoginAttempts: SECURITY_DEFAULTS.maxLoginAttempts,
  accountLockoutDurationMinutes:
    SECURITY_DEFAULTS.accountLockoutDurationMinutes,
  passwordMinLength: SECURITY_DEFAULTS.passwordMinLength,
  passwordRequireSpecialChar: SECURITY_DEFAULTS.passwordRequireSpecialChar,
  passwordRequireNumber: SECURITY_DEFAULTS.passwordRequireNumber,
  passwordRequireUpperCase: SECURITY_DEFAULTS.passwordRequireUpperCase,
  passwordRequireLowerCase: SECURITY_DEFAULTS.passwordRequireLowerCase,

  // 방문자 정책
  reVisitAllowInterval: VISITOR_DEFAULTS.reVisitAllowInterval,
  maxVisitorsPerDay: VISITOR_DEFAULTS.maxVisitorsPerDay,
  visitorDataRetentionDays: VISITOR_DEFAULTS.visitorDataRetentionDays,
  requireVisitorPhoto: VISITOR_DEFAULTS.requireVisitorPhoto,
  requireVisitorContact: VISITOR_DEFAULTS.requireVisitorContact,
  requireVisitPurpose: VISITOR_DEFAULTS.requireVisitPurpose,

  // 알림 설정
  visitTemplate: NOTIFICATION_DEFAULTS.visitTemplate,
  pushRequireInteraction: NOTIFICATION_DEFAULTS.pushRequireInteraction,
  pushSoundEnabled: NOTIFICATION_DEFAULTS.pushSoundEnabled,
  pushVibrateEnabled: NOTIFICATION_DEFAULTS.pushVibrateEnabled,

  // 시스템 설정
  logLevel: SYSTEM_DEFAULTS.logLevel,
  logRetentionDays: SYSTEM_DEFAULTS.logRetentionDays,
  maintenanceMode: SYSTEM_DEFAULTS.maintenanceMode,
  debugMode: SYSTEM_DEFAULTS.debugMode,
  maintenanceEstimatedTime: SYSTEM_DEFAULTS.maintenanceEstimatedTime,
  maintenanceStartTime: null,
  maintenanceContactInfo: GENERAL_DEFAULTS.maintenanceContactInfo,
  maintenanceMessage: GENERAL_DEFAULTS.maintenanceMessage,

  // 웹푸시 설정
  vapidPublicKey: null,
  vapidPrivateKey: null,
  notificationIcon: null,
  notificationBadge: null,

  // 구독 정리 설정
  subscriptionCleanupDays:
    SUBSCRIPTION_CLEANUP_DEFAULTS.subscriptionCleanupDays,
  subscriptionFailCountThreshold:
    SUBSCRIPTION_CLEANUP_DEFAULTS.subscriptionFailCountThreshold,
  subscriptionCleanupInactive:
    SUBSCRIPTION_CLEANUP_DEFAULTS.subscriptionCleanupInactive,
  subscriptionForceDelete:
    SUBSCRIPTION_CLEANUP_DEFAULTS.subscriptionForceDelete,
} as const;
