import { create } from "zustand";
import type { FarmMember } from "@/lib/types";
import { devLog } from "@/lib/utils/logging/dev-logger";

interface FarmMembersState {
  members: FarmMember[];
  loading: boolean;
  initialized: boolean;
  currentFarmId: string | null;
  error: Error | null;
  fetchMembers: (farmId: string) => Promise<void>;
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
}

export const useFarmMembersStore = create<FarmMembersState>((set, get) => ({
  members: [],
  loading: false,
  initialized: false,
  currentFarmId: null,
  error: null,

  fetchMembers: async (farmId: string) => {
    const { currentFarmId, initialized, loading } = get();

    // 이미 로딩 중이거나, 초기화되었고 같은 농장 ID인 경우 스킵
    if (loading || (initialized && currentFarmId === farmId)) {
      devLog.log(
        `⏭️ Skipping fetch for farm ${farmId} - already ${
          loading ? "loading" : "initialized"
        }`
      );
      return;
    }

    try {
      devLog.log(`🔄 Fetching members for farm: ${farmId}`);
      set({ loading: true, error: null, initialized: false }); // initialized를 false로 설정

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

      devLog.success(
        `Fetched ${members.length} members via API route for farm ${farmId}`
      );

      set({
        members,
        initialized: true,
        currentFarmId: farmId,
        loading: false,
      });
    } catch (error) {
      devLog.error("❌ Error in fetchMembers:", error);
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
        position: newMemberData.position,
        responsibilities: newMemberData.responsibilities,
        is_active: newMemberData.is_active,
        created_at: newMemberData.created_at,
        updated_at: newMemberData.updated_at,
        email: newMemberData.profiles?.email || "",
        representative_name: newMemberData.profiles?.name || "알 수 없음",
        profile_image_url:
          newMemberData.profiles?.profile_image_url || undefined,
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
}));
