/**
 * 농장 관련 타입 정의
 */

export interface Farm {
  id: string;
  farm_name: string;
  description: string | null;
  farm_address: string;
  farm_detailed_address: string | null;
  farm_type: string | null;
  owner_id: string;
  manager_phone: string | null;
  manager_name: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  owner?: {
    id: string;
    name: string;
    email: string;
  };
}

export interface FarmFormValues {
  farm_name: string;
  description?: string;
  farm_address: string;
  farm_detailed_address?: string;
  farm_type?: string;
  manager_phone?: string;
  manager_name?: string;
}

export interface FarmMember {
  id: string;
  farm_id: string;
  user_id: string;
  role: 'owner' | 'manager' | 'worker';
  representative_name: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  users?: {
    id: string;
    name: string;
    email: string;
  };
}

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

export interface FarmStats {
  total_farms: number;
  active_farms: number;
  total_members: number;
  recent_activity: number;
}
