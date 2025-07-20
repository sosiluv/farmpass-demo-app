/**
 * 계정 관련 타입 정의
 */

import type { Profile } from "./common";

// Re-export common types
export type { Profile } from "./common";

// ===========================================
// 계정 폼 데이터 타입
// ===========================================

export interface ProfileFormData {
  name: string;
  email: string;
  phoneNumber: string;
  position: string;
  department: string;
  bio: string;
}

export interface CompanyFormData {
  companyName: string;
  companyAddress: string;
  businessType: string;
  company_description: string;
  establishment_date: string;
  employee_count: string;
  company_website: string;
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
