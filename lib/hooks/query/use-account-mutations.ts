"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/components/providers/auth-provider";
import { apiClient } from "@/lib/utils/data/api-client";
import { handleError } from "@/lib/utils/error";
import type {
  ProfileFormData,
  CompanyFormData,
  PasswordFormData,
} from "@/lib/types/account";

/**
 * 프로필 정보 저장 Mutation Hook
 */
export function useUpdateProfileMutation() {
  const { refreshProfile } = useAuth();

  return useMutation({
    mutationFn: async (data: {
      name: string;
      phoneNumber: string;
      position: string;
      department: string;
      bio: string;
    }): Promise<{ success: boolean }> => {
      const profileData = {
        name: data.name,
        phone: data.phoneNumber,
        position: data.position,
        department: data.department,
        bio: data.bio,
      };

      await apiClient("/api/profile", {
        method: "PATCH",
        body: JSON.stringify(profileData),
        context: "프로필 정보 저장",
        onError: (error, context) => {
          handleError(error, context);
        },
      });

      return { success: true };
    },
    onSuccess: async () => {
      // 프로필 데이터 새로고침
      await refreshProfile();
    },
  });
}

/**
 * 회사 정보 저장 Mutation Hook
 */
export function useUpdateCompanyMutation() {
  const { refreshProfile } = useAuth();

  return useMutation({
    mutationFn: async (data: {
      companyName: string;
      companyAddress: string;
      businessType: string;
      company_description: string;
      establishment_date: string;
      employee_count: string;
      company_website: string;
    }): Promise<{ success: boolean }> => {
      const companyData = {
        company_name: data.companyName,
        company_address: data.companyAddress,
        business_type: data.businessType,
        company_description: data.company_description,
        establishment_date: data.establishment_date,
        employee_count: parseInt(data.employee_count),
        company_website: data.company_website,
      };

      await apiClient("/api/profile", {
        method: "PATCH",
        body: JSON.stringify(companyData),
        context: "회사 정보 저장",
        onError: (error, context) => {
          handleError(error, context);
        },
      });

      return { success: true };
    },
    onSuccess: async () => {
      // 프로필 데이터 새로고침
      await refreshProfile();
    },
  });
}

/**
 * 비밀번호 변경 Mutation Hook
 */
export function useChangePasswordMutation() {
  const { changePassword } = useAuth();

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
