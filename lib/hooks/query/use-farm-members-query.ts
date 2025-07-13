"use client";

import { useAuthenticatedQuery } from "@/lib/hooks/query-utils";
import { farmsKeys } from "@/lib/hooks/query/query-keys";
import { useAuth } from "@/components/providers/auth-provider";
import type { FarmMember } from "@/lib/types";
import { apiClient } from "@/lib/utils/data/api-client";

export interface MemberWithProfile extends FarmMember {
  representative_name: string;
  email: string;
  profile_image_url: string | null;
}

export interface FarmMembers {
  count: number;
  members: MemberWithProfile[];
  loading: boolean;
  error?: Error;
}

/**
 * React Query 기반 Farm Members Hook
 */
export function useFarmMembersQuery(farmId: string | null) {
  const { state } = useAuth();

  // 농장 멤버 데이터 쿼리
  const membersQuery = useAuthenticatedQuery(
    farmsKeys.farmMembers(farmId || "none"),
    async (): Promise<FarmMembers> => {
      if (!farmId) {
        return {
          count: 0,
          members: [],
          loading: false,
        };
      }

      try {
        const response = await apiClient(`/api/farms/${farmId}/members`, {
          method: "GET",
          context: "농장 멤버 데이터 조회",
        });

        const { members: membersArray } = response;

        // API 응답 구조에 따라 데이터 처리
        const farmMembers = (membersArray || [])
          .map((member: any) => {
            return {
              ...member,
              representative_name:
                member.profiles?.name ||
                member.representative_name ||
                "알 수 없음",
              email: member.profiles?.email || "",
              profile_image_url:
                member.profiles?.profile_image_url ||
                member.profile_image_url ||
                null,
            };
          })
          .sort((a: any, b: any) => {
            // role 순서: owner > manager > viewer
            if (a.role !== b.role) {
              if (a.role === "owner") return -1;
              if (b.role === "owner") return 1;
              if (a.role === "manager") return -1;
              if (b.role === "manager") return 1;
            }
            return (a.representative_name || "").localeCompare(
              b.representative_name || ""
            );
          });

        return {
          count: farmMembers.length,
          members: farmMembers,
          loading: false,
        };
      } catch (error) {
        throw new Error(
          `농장 멤버 데이터 조회 실패: ${
            error instanceof Error ? error.message : "Unknown error"
          }`
        );
      }
    },
    {
      enabled: state.status === "authenticated" && !!farmId,
      staleTime: 3 * 60 * 1000, // 3분 캐싱 (멤버 데이터는 중간 정도 빈도로 변경)
      refetchOnWindowFocus: false, // 멤버 데이터는 포커스 시 자동 갱신 불필요
      refetchOnReconnect: true,
    }
  );

  return {
    // 기존 인터페이스 호환성 유지
    farmMembers: {
      [farmId || ""]: {
        count: membersQuery.data?.count || 0,
        members: membersQuery.data?.members || [],
        loading: membersQuery.isLoading,
        error: membersQuery.error || undefined,
      },
    },

    // 단일 농장용 간편 접근
    members: membersQuery.data?.members || [],
    count: membersQuery.data?.count || 0,

    // 상태
    loading: membersQuery.isLoading,
    isLoading: membersQuery.isLoading,
    isError: membersQuery.isError,
    error: membersQuery.error,

    // 액션
    refetch: membersQuery.refetch,
    fetchMembers: membersQuery.refetch,
  };
}

/**
 * 다중 농장 멤버 조회를 위한 Hook
 */
export function useFarmMembersPreviewQuery(farmIds: string[]) {
  const { state } = useAuth();

  const membersQuery = useAuthenticatedQuery(
    ["farmMembersPreview", ...farmIds.sort()], // 정렬하여 일관된 쿼리 키 생성
    async (): Promise<Record<string, FarmMembers>> => {
      if (!farmIds.length) {
        return {};
      }

      try {
        const uniqueFarmIds = Array.from(new Set(farmIds));

        const response = await apiClient(
          `/api/farm-members?farmIds=${uniqueFarmIds.join(",")}`,
          {
            method: "GET",
            context: "농장 멤버 프리뷰 데이터 조회",
          }
        );

        const { members: membersArray } = response;

        // API 응답을 FarmMembers 형식으로 변환
        const result: Record<string, FarmMembers> = {};

        // 먼저 모든 농장에 빈 결과로 초기화
        uniqueFarmIds.forEach((farmId) => {
          result[farmId] = {
            count: 0,
            members: [],
            loading: false,
          };
        });

        // API에서 반환된 평면 배열을 농장별로 그룹화
        (membersArray || []).forEach((member: any) => {
          const farmId = member.farm_id;
          if (result[farmId]) {
            const processedMember = {
              ...member,
              representative_name: member.profiles?.name || "알 수 없음",
              email: member.profiles?.email || "",
              profile_image_url: member.profiles?.profile_image_url || null,
            };
            result[farmId].members.push(processedMember);
            result[farmId].count = result[farmId].members.length;
          }
        });

        return result;
      } catch (error) {
        throw new Error(
          `농장 멤버 프리뷰 데이터 조회 실패: ${
            error instanceof Error ? error.message : "Unknown error"
          }`
        );
      }
    },
    {
      enabled: state.status === "authenticated" && farmIds.length > 0,
      staleTime: 5 * 60 * 1000, // 5분 캐싱 (프리뷰는 더 길게)
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
    }
  );

  return {
    // 기존 인터페이스 호환성 유지
    farmMembers: membersQuery.data || {},

    // 상태
    loading: membersQuery.isLoading,
    isLoading: membersQuery.isLoading,
    isError: membersQuery.isError,
    error: membersQuery.error,

    // 액션
    refetch: membersQuery.refetch,
    fetchMembers: membersQuery.refetch,
  };
}
