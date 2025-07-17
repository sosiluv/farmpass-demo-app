/**
 * 알림 관련 타입 정의
 */

import type { NotificationMethod, BaseFilter } from "./common";

// Re-export common types
export type { NotificationMethod } from "./common";

// ===========================================
// 알림 기본 타입
// ===========================================

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  is_read: boolean;
  metadata?: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface NotificationSettings {
  id: string;
  user_id: string;
  notification_method: NotificationMethod;
  visitor_alerts: boolean;
  emergency_alerts: boolean;
  maintenance_alerts: boolean;
  notice_alerts: boolean;
  kakao_user_id?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface UpdateNotificationSettingsDTO {
  notification_method?: NotificationMethod;
  visitor_alerts?: boolean;
  emergency_alerts?: boolean;
  maintenance_alerts?: boolean;
  notice_alerts?: boolean;
  kakao_user_id?: string;
  is_active?: boolean;
}

export interface NotificationPreference {
  id: string;
  user_id: string;
  visitor_notifications: boolean;
  disinfection_notifications: boolean;
  member_notifications: boolean;
  system_notifications: boolean;
  email_notifications: boolean;
  push_notifications: boolean;
  kakao_notifications: boolean;
  quiet_hours_start?: string;
  quiet_hours_end?: string;
  created_at: string;
  updated_at: string;
}

export type SubscriptionStatus =
  | "checking"
  | "unsupported"
  | "denied"
  | "granted"
  | "subscribed";

export interface PushSubscriptionData {
  id: string;
  user_id: string;
  endpoint: string;
  p256dh: string | null;
  auth: string | null;
  created_at: string;
  updated_at: string | null;
  deleted_at: string | null;
  device_id: string | null;
  fail_count: number | null;
  is_active: boolean | null;
  last_fail_at: string | null;
  last_used_at: string | null;
  user_agent: string | null;
}

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

export interface NotificationFilter extends BaseFilter {
  userId?: string;
  isRead?: boolean;
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
