/**
 * 알림 관련 타입 정의
 */

import type { Notification } from "./common";

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

export type SubscriptionStatus =
  | "checking"
  | "unsupported"
  | "denied"
  | "granted"
  | "subscribed";

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
