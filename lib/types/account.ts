/**
 * 계정 관련 타입 정의
 */

import type { Profile } from "./common";

// Re-export common types
export type { Profile } from "./common";

// ===========================================
// 계정 폼 데이터 타입 (DB 스키마 기반)
// ===========================================

/**
 * 프로필 폼 데이터 타입 (DB profiles 테이블 기반)
 */
export interface ProfileFormData {
  name: string;
  email: string;
  phoneNumber: string | null;
  position: string | null;
  department: string | null;
  bio: string | null;
}

/**
 * 회사 정보 폼 데이터 타입 (DB profiles 테이블 기반)
 */
export interface CompanyFormData {
  companyName: string | null;
  companyAddress: string | null;
  businessType: string | null;
  company_description: string | null;
  establishment_date: string | null;
  employee_count: string | null;
  company_website: string | null;
}

export interface PasswordFormData {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

// ===========================================
// 계정 컴포넌트 Props 타입
// ===========================================

export interface ProfileSectionProps {
  profile: Profile;
  loading: boolean;
  onSave: (data: ProfileFormData) => Promise<void>;
  onImageUpload: (
    file: File | null
  ) => Promise<{ publicUrl: string; fileName: string } | void>;
  onImageDelete: () => Promise<void>;
}

export interface CompanySectionProps {
  profile: Profile;
  loading: boolean;
  onSave: (data: CompanyFormData) => Promise<void>;
}

export interface SecuritySectionProps {
  profile: Profile;
  loading: boolean;
  onPasswordChange: (data: PasswordFormData) => Promise<void>;
}

// ===========================================
// 소셜 계정 연동 관련 타입
// ===========================================

/**
 * 소셜 계정 연동 정보 타입 (Supabase Auth Identities 기반)
 */
export interface SocialIdentity {
  id: string;
  user_id: string;
  identity_id: string;
  provider: string;
  identity_data:
    | {
        email?: string;
        name?: string;
        avatar_url?: string;
      }
    | undefined;
  created_at: string;
  last_sign_in_at: string;
}
