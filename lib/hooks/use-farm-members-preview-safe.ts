import { useEffect, useState, useRef, useCallback } from "react";
import { devLog } from "@/lib/utils/logging/dev-logger";
import type { FarmMember } from "@/lib/types";
import isEqual from "lodash/isEqual";
import { apiClient } from "@/lib/utils/data";
import { handleError } from "@/lib/utils/error";

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

const FETCH_COOLDOWN = 2000; // 2초 쿨다운

export function useFarmMembersPreview(farmIds: string[]) {
  const [farmMembers, setFarmMembers] = useState<Record<string, FarmMembers>>(
    {}
  );
  const [loading, setLoading] = useState(false);
  const lastFetchRef = useRef<number>(0);
  const isMountedRef = useRef(true);
  const prevFarmIdsRef = useRef<string[]>([]);

  const fetchMembers = useCallback(async () => {
    const now = Date.now();
    if (now - lastFetchRef.current < FETCH_COOLDOWN) {
      return;
    }

    if (!farmIds.length) {
      return;
    }

    try {
      setLoading(true);
      lastFetchRef.current = now;

      const uniqueFarmIds = Array.from(new Set(farmIds));

      // API 엔드포인트를 통한 구성원 조회 (보안 강화)
      const { members } = await apiClient(
        `/api/farm-members?farmIds=${uniqueFarmIds.join(",")}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
          context: "농장 구성원 조회",
          onError: (error, context) => {
            handleError(error, {
              context,
              onStateUpdate: (errorMessage) => {
                devLog.error("멤버 데이터 조회 실패:", errorMessage);

                // 에러 발생 시 모든 농장에 에러 상태 설정
                const errorResults: Record<string, FarmMembers> = {};
                const uniqueFarmIds = Array.from(new Set(farmIds));

                uniqueFarmIds.forEach((farmId) => {
                  errorResults[farmId] = {
                    count: 0,
                    members: [],
                    loading: false,
                    error:
                      error instanceof Error ? error : new Error(errorMessage),
                  };
                });

                if (isMountedRef.current) {
                  setFarmMembers(errorResults);
                }
              },
            });
          },
        }
      );

      // 농장별로 데이터 그룹화
      const results: Record<string, FarmMembers> = {};

      // 먼저 모든 농장에 대해 빈 결과 초기화
      uniqueFarmIds.forEach((farmId) => {
        results[farmId] = {
          count: 0,
          members: [],
          loading: false,
        };
      });

      // API에서 반환된 데이터를 MemberWithProfile 형태로 변환
      const membersList: MemberWithProfile[] =
        members?.map((member: any) => ({
          ...member,
          name: member.profiles?.name || "",
          email: member.profiles?.email || "",
          profile_image_url: member.profiles?.profile_image_url || null,
        })) || [];

      // 농장별로 구성원 분류
      membersList.forEach((member) => {
        const farmId = member.farm_id;
        if (results[farmId]) {
          results[farmId].members.push(member);
          results[farmId].count = results[farmId].members.length;
        }
      });

      if (isMountedRef.current) {
        setFarmMembers(results);
      }
    } catch (error) {
      // 에러는 이미 onError에서 처리됨
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  }, [farmIds]);

  useEffect(() => {
    isMountedRef.current = true;

    // farmIds가 실제로 변경된 경우에만 fetchMembers 실행
    if (!isEqual(prevFarmIdsRef.current, farmIds)) {
      prevFarmIdsRef.current = farmIds.slice();
      if (farmIds.length > 0) {
        fetchMembers();
      }
    }

    return () => {
      isMountedRef.current = false;
    };
  }, [farmIds, fetchMembers]);

  const getMembersForFarm = useCallback(
    (farmId: string): FarmMembers => {
      return (
        farmMembers[farmId] || {
          count: 0,
          members: [],
          loading: loading,
        }
      );
    },
    [farmMembers, loading]
  );

  return {
    getMembersForFarm,
    loading,
    refresh: fetchMembers,
  };
}
