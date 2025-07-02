// 인증 관련 헬퍼 함수들
import { supabase } from "@/lib/supabase/client";
import { devLog } from "@/lib/utils/logging/dev-logger";

/**
 * 로그인 시 last_login_at 업데이트 (SQL 함수 사용)
 */
export async function updateLoginTime(userId: string) {
  try {
    // 현재 login_count 조회
    const { data: profile, error: fetchError } = await supabase
      .from("profiles")
      .select("login_count")
      .eq("id", userId)
      .single();

    if (fetchError) {
      devLog.error("Failed to fetch current login count:", fetchError);
      return false;
    }

    // 로그인 시간과 카운트 업데이트
    const { error: updateError } = await supabase
      .from("profiles")
      .update({
        last_login_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        login_count: (profile?.login_count || 0) + 1,
      })
      .eq("id", userId);

    if (updateError) {
      devLog.error("Failed to update login time:", updateError);
      return false;
    }

    devLog.log("Login time updated successfully");
    return true;
  } catch (error) {
    devLog.error("Error updating login time:", error);
    return false;
  }
}

/**
 * 브라우저 정보 감지
 */
export function getDeviceInfo(): string {
  if (typeof window === "undefined") return "Server";

  const userAgent = window.navigator.userAgent;
  let browser = "Unknown Browser";
  let os = "Unknown OS";

  // 브라우저 감지
  if (userAgent.includes("Chrome")) browser = "Chrome";
  else if (userAgent.includes("Firefox")) browser = "Firefox";
  else if (userAgent.includes("Safari")) browser = "Safari";
  else if (userAgent.includes("Edge")) browser = "Edge";

  // OS 감지
  if (userAgent.includes("Windows")) os = "Windows";
  else if (userAgent.includes("Mac")) os = "macOS";
  else if (userAgent.includes("Linux")) os = "Linux";
  else if (userAgent.includes("Android")) os = "Android";
  else if (userAgent.includes("iOS")) os = "iOS";

  return `${browser} on ${os}`;
}
