import { createBrowserClient } from "@supabase/ssr";
import { devLog } from "@/lib/utils/logging/dev-logger";

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

// 기존 클라이언트 호환성을 위해 유지 (점진적 마이그레이션용)
export const supabase = createClient();

// Session refresh utility
export async function refreshSession() {
  try {
    // 먼저 현재 사용자 상태 확인
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      // 사용자가 없으면 세션 갱신 시도
      const { data, error } = await supabase.auth.refreshSession();
      if (error) throw error;
      return data;
    }

    // 사용자가 있으면 현재 세션 정보 반환
    const {
      data: { session },
    } = await supabase.auth.getSession();

    return { session };
  } catch (error) {
    devLog.error("Failed to refresh session:", error);
    throw error;
  }
}
