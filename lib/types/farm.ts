/**
 * 농장 관련 타입 정의
 */

import type { FarmMember } from "./common";

// Re-export common types
export type { Farm, FarmMember } from "./common";

// ===========================================
// 농장 멤버 확장 타입
// ===========================================

export interface MemberWithProfile extends FarmMember {
  member_name: string; // 농장 내 별칭(멤버명)
  representative_name: string; // 실제 사용되는 필드명
  email: string;
  profile_image_url: string | null;
  avatar_seed: string | null;
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

/**
 * 관리자 농장 통계 타입
 */
export interface FarmStats {
  totalFarms: number;
  totalOwners: number;
  farmOwners: number; // 농장 소유자 수 (UsersTab과 호환성)
  totalRegions: number;
  monthlyRegistrations: number;
  monthlyFarmRegistrations: number; // 호환성
  trends: {
    farmGrowth: number;
    farmOwnersTrend: number;
    regionsTrend: number;
    registrationTrend: number;
  };
}
