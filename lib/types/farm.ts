/**
 * 농장 관련 타입 정의
 */

import type { Farm, FarmMember } from "./common";

// Re-export common types
export type { Farm, FarmMember } from "./common";

// ===========================================
// 농장 폼 데이터 타입
// ===========================================

export interface FarmFormValues {
  farm_name: string;
  description?: string;
  farm_address: string;
  farm_detailed_address?: string;
  farm_type?: string;
  manager_phone?: string;
  manager_name?: string;
}

// ===========================================
// 농장 멤버 확장 타입
// ===========================================

export interface MemberWithProfile extends FarmMember {
  name: string;
  email: string;
  profile_image_url: string | null;
}

export interface FarmMembers {
  count: number;
  members: MemberWithProfile[];
  loading: boolean;
  error?: Error;
}

// ===========================================
// 농장 통계 타입
// ===========================================

export interface FarmStats {
  total_farms: number;
  active_farms: number;
  total_members: number;
  recent_activity: number;
}
