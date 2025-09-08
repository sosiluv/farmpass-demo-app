import { useAuthenticatedQuery } from "@/lib/hooks/query-utils";
import { createClient } from "@/lib/supabase/client";
import type { Profile } from "@/lib/types";
import { profileKeys } from "@/lib/hooks/query/query-keys";
import {
  mapRawErrorToCode,
  getErrorMessage,
} from "@/lib/utils/error/errorUtil";

const supabase = createClient();

const fetchProfile = async (userId: string): Promise<Profile | null> => {
  if (!userId) throw new Error("userId is required");
  const { data, error } = await Promise.race([
    supabase.from("profiles").select("*").eq("id", userId).single(),
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error("프로필 로딩 타임아웃")), 3000)
    ),
  ]);
  if (error) {
    const errorCode = mapRawErrorToCode(error, "db");
    const message = getErrorMessage(errorCode);
    throw new Error(message);
  }
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
