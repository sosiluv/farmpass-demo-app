"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/utils/data/api-client";
import { termsKeys } from "@/lib/hooks/query/query-keys";
import { TermManagement, UserConsent, TermType } from "@/lib/types/common";

// 약관 요청 타입 (이 파일에서만 사용하므로 인라인 정의)
interface UpdateTermRequest {
  id: string;
  title?: string;
  content?: string;
  version?: string;
  is_active?: boolean;
  is_draft?: boolean;
}

/**
 * 관리자용 약관 목록 조회 훅
 */
export function useTermsQuery(type?: TermType, isActive?: boolean) {
  return useQuery({
    queryKey: termsKeys.admin.list(type, isActive),
    queryFn: async (): Promise<TermManagement[]> => {
      const params = new URLSearchParams();
      if (type) params.append("type", type);
      if (isActive !== undefined)
        params.append("is_active", isActive.toString());

      const response = await apiClient(`/api/admin/terms?${params}`, {
        method: "GET",
        context: "약관 목록 조회",
      });

      return response.terms || [];
    },
    staleTime: 5 * 60 * 1000, // 5분
  });
}

/**
 * 공개 약관 조회 훅 (회원가입용)
 */
export function usePublicTermsQuery(type?: TermType) {
  return useQuery({
    queryKey: termsKeys.public.list(type),
    queryFn: async (): Promise<TermManagement[]> => {
      const params = new URLSearchParams();
      if (type) params.append("type", type);

      const response = await apiClient(`/api/terms?${params}`, {
        method: "GET",
        context: "공개 약관 조회",
      });

      return response.terms || [];
    },
    staleTime: 10 * 60 * 1000, // 10분
  });
}

/**
 * 사용자 동의 목록 조회 훅
 */
export function useConsentsQuery(
  userId?: string,
  termType?: TermType,
  agreed?: boolean
) {
  return useQuery({
    queryKey: termsKeys.consents.list(userId, termType, agreed),
    queryFn: async (): Promise<UserConsent[]> => {
      const params = new URLSearchParams();
      if (userId) params.append("user_id", userId);
      if (termType) params.append("term_type", termType);
      if (agreed !== undefined) params.append("agreed", agreed.toString());

      const response = await apiClient(`/api/admin/terms/consents?${params}`, {
        method: "GET",
        context: "동의 목록 조회",
      });

      return response.consents || [];
    },
    staleTime: 2 * 60 * 1000, // 2분
    enabled: !!userId, // userId가 있을 때만 실행
  });
}

/**
 * 약관 생성 뮤테이션 훅
 */
export function useCreateTermMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (
      termData: any
    ): Promise<{ term: TermManagement; message: string }> => {
      const response = await apiClient("/api/admin/terms", {
        method: "POST",
        body: JSON.stringify(termData),
        context: "약관 생성",
      });

      return { term: response.term, message: response.message };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: termsKeys.all });
    },
  });
}

/**
 * 약관 수정 뮤테이션 훅
 */
export function useUpdateTermMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (
      termData: UpdateTermRequest
    ): Promise<{ term: TermManagement; message: string }> => {
      const response = await apiClient("/api/admin/terms", {
        method: "PUT",
        body: JSON.stringify(termData),
        context: "약관 수정",
      });

      return { term: response.term, message: response.message };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: termsKeys.all });
    },
  });
}

/**
 * 약관 삭제 뮤테이션 훅
 */
export function useDeleteTermMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (termId: string): Promise<{ message: string }> => {
      const response = await apiClient(`/api/admin/terms?id=${termId}`, {
        method: "DELETE",
        context: "약관 삭제",
      });

      return { message: response.message };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: termsKeys.all });
    },
  });
}

/**
 * 약관 활성화/비활성화 뮤테이션 훅
 */
export function useActivateTermMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (activateData: {
      termId: string;
      activate: boolean;
    }): Promise<{ term: TermManagement; message: string }> => {
      const response = await apiClient("/api/admin/terms/activate", {
        method: "POST",
        body: JSON.stringify(activateData),
        context: "약관 활성화/비활성화",
      });

      return { term: response.term, message: response.message };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: termsKeys.all });
    },
  });
}

/**
 * 동의 철회 뮤테이션 훅
 */
export function useRevokeConsentMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (
      revokeData: any
    ): Promise<{ consent: UserConsent; message: string }> => {
      const response = await apiClient("/api/admin/terms/consents", {
        method: "POST",
        body: JSON.stringify(revokeData),
        context: "동의 철회",
      });

      return { consent: response.consent, message: response.message };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: termsKeys.consents.all() });
    },
  });
}
