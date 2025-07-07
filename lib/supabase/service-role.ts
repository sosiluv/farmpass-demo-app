import { createClient } from "@supabase/supabase-js";

let serviceRoleClient: ReturnType<typeof createClient> | null = null;

export function createServiceRoleClient() {
  // 이미 생성된 클라이언트가 있으면 반환
  if (serviceRoleClient) {
    return serviceRoleClient;
  }

  // 환경 변수 검증
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl) {
    throw new Error(
      "NEXT_PUBLIC_SUPABASE_URL environment variable is required"
    );
  }

  if (!supabaseKey) {
    throw new Error(
      "SUPABASE_SERVICE_ROLE_KEY environment variable is required"
    );
  }

  // 클라이언트 생성 및 캐시
  serviceRoleClient = createClient(supabaseUrl, supabaseKey);
  return serviceRoleClient;
}

// 개발 환경에서 환경 변수 로드 상태 확인
export function validateServiceRoleConfig() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return false;
  }

  return true;
}
