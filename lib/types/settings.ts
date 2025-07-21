import type { LogLevel } from "./common";

export interface SystemSettings {
  id: string;
  created_at: string;
  updated_at: string;

  // 일반 설정
  siteName: string;
  siteDescription: string;
  language: string;
  timezone: string;
  dateFormat: string;
  favicon: string | null;
  logo: string | null;

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

  // 구독 정리 설정
  subscriptionCleanupDays: number;
  subscriptionFailCountThreshold: number;
  subscriptionCleanupInactive: boolean;
  subscriptionForceDelete: boolean;

  // 시스템 설정
  logLevel: LogLevel;
  logRetentionDays: number;
  maintenanceMode: boolean;
  debugMode: boolean;

  // 유지보수 설정
  maintenanceMessage: string;
  maintenanceEstimatedTime: number;
  maintenanceStartTime: string | null;
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

export interface OrphanFilesStatus {
  visitorOrphans: string[];
  profileOrphans: string[];
  visitorOrphanCount: number;
  profileOrphanCount: number;
  visitorDbOrphanCount: number;
  profileDbOrphanCount: number;
  debug?: {
    visitor: {
      usedUrls: string[];
      usedUrlCount: number;
      storageFiles: string[];
      storageFileCount: number;
      dbError?: any;
    };
    profile: {
      usedUrls: string[];
      usedUrlCount: number;
      storageFiles: string[];
      storageFileCount: number;
      dbError?: any;
    };
  };
}
