import { useAuthenticatedQuery } from "@/lib/hooks/query-utils";
import { createClient } from "@/lib/supabase/client";
import type { Profile } from "@/lib/types";
import { profileKeys } from "@/lib/hooks/query/query-keys";

const supabase = createClient();

const fetchProfile = async (userId: string): Promise<Profile | null> => {
  if (!userId) throw new Error("userId is required");
  const { data, error } = await Promise.race([
    supabase.from("profiles").select("*").eq("id", userId).single(),
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error("프로필 로딩 타임아웃")), 3000)
    ),
  ]);
  if (error) throw error;
  return data;
};

export function useProfileQuery(userId?: string) {
  return useAuthenticatedQuery(
    profileKeys.detail(userId),
    () => (userId ? fetchProfile(userId) : Promise.reject("No userId")),
    {
      enabled: !!userId,
    }
  );
}
