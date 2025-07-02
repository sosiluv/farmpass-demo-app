export type NotificationMethod = "push" | "kakao";

export interface Notification {
  id: string;
  user_id: string;
  farm_id?: string;
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
  farm_id?: string;
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
  farm_id: string | null;
  endpoint: string;
  p256dh: string | null;
  auth: string | null;
  created_at: string;
}

export interface NotificationPayload {
  title: string;
  message: string;
  notificationType?: "visitor" | "emergency" | "maintenance" | "notice";
  metadata?: Record<string, unknown>;
  target_user_ids?: string[];
  farm_id?: string;
  icon?: string;
  badge?: string;
  tag?: string;
  data?: Record<string, any>;
  test?: boolean;
}

export interface NotificationFilter {
  userId?: string;
  farmId?: string;
  isRead?: boolean;
  startDate?: string;
  endDate?: string;
}

export interface Farm {
  id: string;
  farm_name: string;
  address?: string;
  isSubscribed?: boolean;
}
