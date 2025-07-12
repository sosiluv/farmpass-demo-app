import type { Database } from "./supabase";

export interface SystemSettings {
  id: string;
  created_at: Date;
  updated_at: Date;

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

export interface OrphanFilesStatus {
  visitorOrphans: string[];
  profileOrphans: string[];
  visitorOrphanCount: number;
  profileOrphanCount: number;
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
