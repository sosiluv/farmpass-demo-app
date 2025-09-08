/**
 * 농장 관련 타입 정의
 */

import type { FarmMember } from "./common";

export interface MemberWithProfile extends FarmMember {
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

export interface AddMemberData {
  email: string;
  role: "manager" | "viewer";
}

export interface UpdateMemberData {
  role: "manager" | "viewer";
}
