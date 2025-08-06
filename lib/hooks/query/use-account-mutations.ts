"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/utils/data/api-client";
import { createClient } from "@/lib/supabase/client";
import { profileKeys } from "@/lib/hooks/query/query-keys";
import type {
  ProfileFormData,
  CompanyFormData,
  PasswordFormData,
} from "@/lib/types/account";
import { useAuthActions } from "@/hooks/auth/useAuthActions";
import {
  mapRawErrorToCode,
  getErrorMessage,
} from "@/lib/utils/error/errorUtil";

/**
 * 프로필 정보 저장 Mutation Hook
 */
export function useUpdateProfileMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (
      data: Partial<ProfileFormData>
    ): Promise<{ success: boolean; message?: string }> => {
      // 변경된 필드만 PATCH로 보냄
      const profileData: any = {};
      if (data.name !== undefined) profileData.name = data.name;
      if (data.phoneNumber !== undefined) profileData.phone = data.phoneNumber;
      if (data.position !== undefined) profileData.position = data.position;
      if (data.department !== undefined)
        profileData.department = data.department;
      if (data.bio !== undefined) profileData.bio = data.bio;

      const result = await apiClient("/api/profile", {
        method: "PATCH",
        body: JSON.stringify(profileData),
        context: "프로필 정보 업데이트",
      });

      return { success: result.success, message: result.message };
    },
    onSuccess: async () => {
      // 프로필 데이터 캐시 무효화
      await queryClient.invalidateQueries({ queryKey: profileKeys.all });
    },
  });
}

/**
 * 회사 정보 저장 Mutation Hook
 */
export function useUpdateCompanyMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (
      data: Partial<CompanyFormData>
    ): Promise<{ success: boolean; message?: string }> => {
      const companyData: any = {};
      if (data.companyName !== undefined)
        companyData.company_name = data.companyName;
      if (data.companyAddress !== undefined)
        companyData.company_address = data.companyAddress;
      if (data.businessType !== undefined)
        companyData.business_type = data.businessType;
      if (data.company_description !== undefined)
        companyData.company_description = data.company_description;
      if (data.establishment_date !== undefined)
        companyData.establishment_date =
          data.establishment_date && data.establishment_date.trim()
            ? new Date(data.establishment_date).toISOString()
            : null;
      if (data.employee_count !== undefined)
        companyData.employee_count = data.employee_count
          ? parseInt(data.employee_count)
          : null;
      if (data.company_website !== undefined)
        companyData.company_website = data.company_website;

      const result = await apiClient("/api/profile", {
        method: "PATCH",
        body: JSON.stringify(companyData),
        context: "회사 정보 저장",
      });

      return { success: result.success, message: result.message };
    },
    onSuccess: async () => {
      // 프로필 데이터 캐시 무효화
      await queryClient.invalidateQueries({ queryKey: profileKeys.all });
    },
  });
}

/**
 * 비밀번호 변경 Mutation Hook
 */
export function useChangePasswordMutation() {
  const { changePassword } = useAuthActions();

  return useMutation({
    mutationFn: async (
      data: PasswordFormData
    ): Promise<{ success: boolean; error?: string }> => {
      const result = await changePassword({
        newPassword: data.newPassword,
        currentPassword: data.currentPassword,
        email: "", // Auth provider에서 현재 사용자 정보를 자동으로 사용
      });

      if (!result.success) {
        throw new Error(result.error || "비밀번호 변경에 실패했습니다.");
      }

      return { success: true };
    },
  });
}

/**
 * 아바타 시드 업데이트 Mutation Hook
 */
export function useUpdateAvatarSeedMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      userId: string;
      seed: string;
    }): Promise<{ success: boolean; message?: string }> => {
      const { userId, seed } = data;

      const supabase = createClient();

      const { error } = await supabase
        .from("profiles")
        .update({
          avatar_seed: seed.trim(),
          updated_at: new Date().toISOString(),
        })
        .eq("id", userId)
        .select()
        .single();

      if (error) {
        const errorCode = mapRawErrorToCode(error, "db");
        const message = getErrorMessage(errorCode);
        throw new Error(message);
      }

      return {
        success: true,
        message: "아바타가 성공적으로 업데이트되었습니다.",
      };
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: profileKeys.all });
    },
  });
}

/**
 * 계정 관리 Mutation Hook들을 통합한 객체
 */
export function useAccountMutations() {
  const updateProfile = useUpdateProfileMutation();
  const updateCompany = useUpdateCompanyMutation();
  const changePassword = useChangePasswordMutation();

  return {
    updateProfile,
    updateCompany,
    changePassword,

    // 편의 메서드들
    updateProfileAsync: updateProfile.mutateAsync,
    updateCompanyAsync: updateCompany.mutateAsync,
    changePasswordAsync: changePassword.mutateAsync,

    // 로딩 상태
    isLoading:
      updateProfile.isPending ||
      updateCompany.isPending ||
      changePassword.isPending,
  };
}
