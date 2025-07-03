import type { Database } from "./supabase";

export interface SystemSettings {
  id: string;
  createdAt: Date;
  updatedAt: Date;

  // 일반 설정
  siteName: string;
  siteDescription: string;
  language: string;
  timezone: string;
  dateFormat: string;
  favicon: string | null;
  logo: string | null;
  logoCacheBuster?: number;
  faviconCacheBuster?: number;

  // 보안 설정
  maxLoginAttempts: number;
  accountLockoutDurationMinutes: number;
  passwordMinLength: number;
  passwordRequireSpecialChar: boolean;
  passwordRequireNumber: boolean;
  passwordRequireUpperCase: boolean;
  passwordRequireLowerCase: boolean;

  // 방문자 정책
  reVisitAllowInterval: number;
  maxVisitorsPerDay: number;
  visitorDataRetentionDays: number;
  requireVisitorPhoto: boolean;
  requireVisitorContact: boolean;
  requireVisitPurpose: boolean;

  // 알림 설정
  visitTemplate: string;

  // 웹푸시 상세 설정
  vapidPublicKey: string | null;
  vapidPrivateKey: string | null;
  notificationIcon: string | null;
  notificationBadge: string | null;
  pushSoundEnabled: boolean;
  pushVibrateEnabled: boolean;
  pushRequireInteraction: boolean;

  // 시스템 설정
  logLevel: Database["public"]["Enums"]["LogLevel"];
  logRetentionDays: number;
  maintenanceMode: boolean;
  debugMode: boolean;

  // 유지보수 설정
  maintenanceMessage: string;
  maintenanceEstimatedTime: number;
  maintenanceStartTime: Date | null;
  maintenanceContactInfo: string;
}

export interface CleanupStatus {
  settings: {
    logRetentionDays: number;
    visitorDataRetentionDays: number;
  };
  expiredData: {
    systemLogs: {
      count: number;
      cutoffDate: string;
    };
    visitorEntries: {
      count: number;
      cutoffDate: string;
    };
  };
}

// 기본 시스템 설정값 (Prisma에서 자동 생성되는 필드 제외)
export const DEFAULT_SYSTEM_SETTINGS = {
  // 일반 설정
  siteName: "농장 출입 관리 시스템(FarmPass)",
  siteDescription:
    "방역은 출입자 관리부터 시작됩니다. QR기록으로 축산 질병 예방의 첫걸음을 함께하세요.",
  language: "ko",
  timezone: "Asia/Seoul",
  dateFormat: "YYYY-MM-DD",
  favicon: null,
  logo: null,

  // 보안 설정
  maxLoginAttempts: 5,
  accountLockoutDurationMinutes: 15,
  passwordMinLength: 8,
  passwordRequireSpecialChar: true,
  passwordRequireNumber: true,
  passwordRequireUpperCase: true,
  passwordRequireLowerCase: true,

  // 방문자 정책
  reVisitAllowInterval: 6,
  maxVisitorsPerDay: 100,
  visitorDataRetentionDays: 1095,
  requireVisitorPhoto: false,
  requireVisitorContact: true,
  requireVisitPurpose: true,

  // 알림 설정
  visitTemplate:
    "{방문자명}님이 {방문날짜} {방문시간}에 {농장명}을 방문하였습니다.",

  // 웹푸시 상세 설정
  vapidPublicKey: null,
  vapidPrivateKey: null,
  notificationIcon: null,
  notificationBadge: null,
  pushSoundEnabled: false,
  pushVibrateEnabled: false,
  pushRequireInteraction: false,

  // 시스템 설정
  logLevel: "info",
  logRetentionDays: 90,
  maintenanceMode: false,
  debugMode: false,

  // 유지보수 설정
  maintenanceMessage: "현재 시스템 업데이트 및 유지보수 작업이 진행 중입니다.",
  maintenanceEstimatedTime: 30,
  maintenanceStartTime: null,
  maintenanceContactInfo: "문의사항이 있으시면 관리자에게 연락해 주세요.",
};
