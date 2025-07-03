import { create } from "zustand";
import type { FarmMember } from "@/lib/types";
import { devLog } from "@/lib/utils/logging/dev-logger";
import { logApiError } from "@/lib/utils/logging/system-log";

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

      // API 라우트를 통해 멤버 목록 조회 (로그 기록 포함)
      const response = await fetch(`/api/farms/${farmId}/members`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to fetch members");
      }

      const { members: membersData } = await response.json();

      const members: FarmMember[] = membersData.map((member: any) => ({
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
        ...members.filter((m) => m.role === "owner"),
        ...members.filter((m) => m.role !== "owner"),
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
      // finally 블록처럼 ref 값들 초기화
      state.isFetchingRef.current = false;
      set({ error: error as Error, loading: false });
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
      const response = await fetch(`/api/farms/${farmId}/members`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, role }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to add member");
      }

      const { member: newMemberData } = await response.json();

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
      devLog.error("Member addition error:", error);
      set({ error: error as Error, loading: false });
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
      const response = await fetch(`/api/farms/${farmId}/members/${memberId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ role }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to update member role");
      }

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
      set({ error: error as Error, loading: false });
      throw error;
    }
  },

  removeMember: async (farmId: string, memberId: string) => {
    try {
      set({ loading: true, error: null });

      // API 라우트를 통해 멤버 제거 (로그 기록 포함)
      const response = await fetch(`/api/farms/${farmId}/members/${memberId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to remove member");
      }

      set((state) => ({
        members: state.members.filter((member) => member.id !== memberId),
        loading: false,
      }));

      devLog.success("Member removed successfully via API route:", memberId);
    } catch (error) {
      set({ error: error as Error, loading: false });
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
