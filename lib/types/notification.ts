/**
 * 알림 관련 타입 정의
 */

import type { NotificationMethod, Notification } from "./common";

// Re-export common types
export type { NotificationMethod, Notification } from "./common";

// ===========================================
// 알림 기본 타입
// ===========================================

export interface NotificationsResponse {
  notifications: Notification[];
  total: number;
  page: number;
  totalPages: number;
  pageSize: number;
}

export interface NotificationsFilters {
  page?: number;
  pageSize?: number;
  read?: boolean;
  type?: string;
}

export interface NotificationSettings {
  id: string;
  user_id: string;
  notification_method: NotificationMethod;
  visitor_alerts: boolean;
  emergency_alerts: boolean;
  maintenance_alerts: boolean;
  notice_alerts: boolean;
  kakao_user_id: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export type SubscriptionStatus =
  | "checking"
  | "unsupported"
  | "denied"
  | "granted"
  | "subscribed";

export interface NotificationPayload {
  title: string;
  message: string;
  notificationType?: "visitor" | "emergency" | "maintenance" | "notice";
  metadata?: Record<string, unknown>;
  target_user_ids?: string[];
  icon?: string;
  badge?: string;
  tag?: string;
  data?: Record<string, any>;
  test?: boolean;
}

// ===========================================
// 푸시 구독 관련 타입
// ===========================================

export interface SubscriptionCleanupOptions {
  realTimeCheck?: boolean;
  forceDelete?: boolean;
  failCountThreshold?: number;
  cleanupInactive?: boolean;
  deleteAfterDays?: number;
}

export interface SubscriptionCleanupResult {
  message: string;
  cleanedCount: number;
  validCount: number;
  totalChecked: number;
  checkType: "realtime" | "basic";
  forceDelete: boolean;
  deleteAfterDays: number;
  stats: {
    failCountCleaned: number;
    inactiveCleaned: number;
    expiredCleaned: number;
    forceDeleted: number;
    oldSoftDeletedCleaned: number;
  };
}
