import { create } from "zustand";
import type { FarmMember } from "@/lib/types";
import { devLog } from "@/lib/utils/logging/dev-logger";
import { apiClient } from "@/lib/utils/data/api-client";
import { handleError } from "@/lib/utils/error";

interface FarmMembersState {
  members: FarmMember[];
  loading: boolean;
  initialized: boolean;
  currentFarmId: string | null;
  error: Error | null;
  isFetchingRef: { current: boolean };
  lastFarmIdRef: { current: string | null };
  hasDataRef: { current: boolean };
  fetchMembers: (farmId: string, forceRefetch?: boolean) => Promise<void>;
  addMember: (
    farmId: string,
    email: string,
    role: "manager" | "viewer"
  ) => Promise<FarmMember>;
  updateMemberRole: (
    farmId: string,
    memberId: string,
    role: "manager" | "viewer"
  ) => Promise<void>;
  removeMember: (farmId: string, memberId: string) => Promise<void>;
  refetch: () => Promise<void>;
}

export const useFarmMembersStore = create<FarmMembersState>((set, get) => ({
  members: [],
  loading: false,
  initialized: false,
  currentFarmId: null,
  error: null,
  isFetchingRef: { current: false },
  lastFarmIdRef: { current: null },
  hasDataRef: { current: false },

  fetchMembers: async (farmId: string, forceRefetch: boolean = false) => {
    const state = get();

    // 중복 요청 방지
    if (state.isFetchingRef.current) {
      devLog.log(`Already loading members for farmId: ${farmId}`);
      return;
    }

    // farmId가 변경되지 않았고 데이터가 있으면 요청하지 않음 (강제 새로고침이 아닌 경우)
    if (
      !forceRefetch &&
      farmId === state.lastFarmIdRef.current &&
      state.hasDataRef.current
    ) {
      devLog.log(`FarmId unchanged and has data, skipping fetch: ${farmId}`);
      return;
    }

    try {
      set({ loading: true });
      state.isFetchingRef.current = true;
      state.lastFarmIdRef.current = farmId;

      devLog.log(`Fetching members for farmId: ${farmId}`);

      const { members } = await apiClient(`/api/farms/${farmId}/members`, {
        method: "GET",
        context: "농장 멤버 조회",
        onError: (error, context) => {
          handleError(error, {
            context,
            onStateUpdate: (errorMessage) => {
              state.isFetchingRef.current = false;
              set({ error: new Error(errorMessage), loading: false });
            },
          });
          // 토스트는 컴포넌트에서 처리
        },
      });

      const membersData: FarmMember[] = members.map((member: any) => ({
        id: member.id,
        farm_id: member.farm_id,
        user_id: member.user_id,
        role: member.role,
        position: member.position || null,
        responsibilities: member.responsibilities || null,
        is_active: member.is_active ?? true,
        created_at: member.created_at,
        updated_at: member.updated_at || member.created_at,
        email: member.profiles?.email || "",
        representative_name: member.profiles?.name || "알 수 없음",
        profile_image_url: member.profiles?.profile_image_url || null,
      }));

      // owner가 맨 위에 오도록 정렬
      const sortedMembers = [
        ...membersData.filter((m) => m.role === "owner"),
        ...membersData.filter((m) => m.role !== "owner"),
      ];

      set({
        members: sortedMembers,
        currentFarmId: farmId,
        initialized: true,
        error: null,
        loading: false,
      });
      // ref 값들도 제대로 초기화
      state.isFetchingRef.current = false;
      state.hasDataRef.current = true;
    } catch (error) {
      // 에러는 이미 onError에서 처리됨
      throw error;
    }
  },

  addMember: async (
    farmId: string,
    email: string,
    role: "manager" | "viewer"
  ) => {
    try {
      set({ loading: true, error: null });

      // API 라우트를 통해 멤버 추가 (로그 기록 포함)
      const { member: newMemberData } = await apiClient(
        `/api/farms/${farmId}/members`,
        {
          method: "POST",
          body: JSON.stringify({ email, role }),
          context: "농장 멤버 추가",
          onError: (error, context) => {
            handleError(error, {
              context,
              onStateUpdate: (errorMessage) => {
                set({ error: new Error(errorMessage), loading: false });
              },
            });
          },
        }
      );

      const memberWithProfile: FarmMember = {
        id: newMemberData.id,
        farm_id: newMemberData.farm_id,
        user_id: newMemberData.user_id,
        role: newMemberData.role,
        position: newMemberData.position || null,
        responsibilities: newMemberData.responsibilities || null,
        is_active: newMemberData.is_active ?? true,
        created_at: newMemberData.created_at,
        updated_at: newMemberData.updated_at || newMemberData.created_at,
        email: newMemberData.profiles?.email || "",
        representative_name: newMemberData.profiles?.name || "알 수 없음",
        profile_image_url: newMemberData.profiles?.profile_image_url || null,
      };

      set((state) => ({
        members: [...state.members, memberWithProfile],
        loading: false,
      }));

      devLog.success(
        "Member added successfully via API route:",
        newMemberData.id
      );
      return memberWithProfile;
    } catch (error: any) {
      // 에러는 이미 onError에서 처리됨
      throw error;
    }
  },

  updateMemberRole: async (
    farmId: string,
    memberId: string,
    role: "manager" | "viewer"
  ) => {
    try {
      set({ loading: true, error: null });

      // API 라우트를 통해 멤버 역할 변경 (로그 기록 포함)
      await apiClient(`/api/farms/${farmId}/members/${memberId}`, {
        method: "PUT",
        body: JSON.stringify({ role }),
        context: "농장 멤버 역할 변경",
        onError: (error, context) => {
          handleError(error, {
            context,
            onStateUpdate: (errorMessage) => {
              set({ error: new Error(errorMessage), loading: false });
            },
          });
        },
      });

      set((state) => ({
        members: state.members.map((member) =>
          member.id === memberId ? { ...member, role } : member
        ),
        loading: false,
      }));

      devLog.success(
        "Member role updated successfully via API route:",
        memberId
      );
    } catch (error) {
      // 에러는 이미 onError에서 처리됨
      throw error;
    }
  },

  removeMember: async (farmId: string, memberId: string) => {
    try {
      set({ loading: true, error: null });

      // API 라우트를 통해 멤버 제거 (로그 기록 포함)
      await apiClient(`/api/farms/${farmId}/members/${memberId}`, {
        method: "DELETE",
        context: "농장 멤버 제거",
        onError: (error, context) => {
          handleError(error, {
            context,
            onStateUpdate: (errorMessage) => {
              set({ error: new Error(errorMessage), loading: false });
            },
          });
        },
      });

      set((state) => ({
        members: state.members.filter((member) => member.id !== memberId),
        loading: false,
      }));

      devLog.success("Member removed successfully via API route:", memberId);
    } catch (error) {
      // 에러는 이미 onError에서 처리됨
      throw error;
    }
  },

  refetch: async () => {
    const state = get();
    if (state.currentFarmId) {
      await state.fetchMembers(state.currentFarmId, true);
    }
  },
}));
