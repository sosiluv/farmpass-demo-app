import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createSystemLog } from "@/lib/utils/logging/system-log";
import { devLog } from "@/lib/utils/logging/dev-logger";
import { requireAuth } from "@/lib/server/auth-utils";
import { getClientIP, getUserAgent } from "@/lib/server/ip-helpers";
import { logApiError } from "@/lib/utils/logging/system-log";

// PATCH: 프로필 정보 수정
export async function PATCH(request: NextRequest) {
  const supabase = await createClient();
  const clientIP = getClientIP(request);
  const userAgent = getUserAgent(request);

  // 인증 확인
  const authResult = await requireAuth(false);
  if (!authResult.success || !authResult.user) {
    return authResult.response!;
  }

  const user = authResult.user;

  try {
    const data = await request.json();
    const { error } = await supabase
      .from("profiles")
      .update({
        ...data,
        updated_at: new Date().toISOString(),
      })
      .eq("id", user.id);
    if (error) throw error;
    await createSystemLog(
      "PROFILE_UPDATE",
      `프로필 정보 수정: ${Object.keys(data).length}개 필드 수정`,
      "info",
      user.id,
      "user",
      user.id,
      {
        target_user_id: user.id,
        action_type: "profile_info_update",
        updated_fields: Object.keys(data),
        status: "success",
      },
      user.email,
      clientIP,
      userAgent
    );
    return NextResponse.json(
      { success: true },
      {
        headers: {
          "Cache-Control": "no-store",
        },
      }
    );
  } catch (error) {
    devLog.error("[API] PROFILE_UPDATE 실패:", error);

    // API 에러 로깅
    await logApiError(
      "/api/profile",
      "PATCH",
      error instanceof Error ? error : String(error),
      user?.id,
      {
        ip: clientIP,
        userAgent,
      }
    );

    await createSystemLog(
      "PROFILE_UPDATE_FAILED",
      `프로필 정보 수정 실패: ${
        error instanceof Error ? error.message : String(error)
      }`,
      "error",
      user?.id,
      "user",
      user?.id,
      {
        target_user_id: user?.id,
        action_type: "profile_info_update",
        error: error instanceof Error ? error.message : String(error),
        status: "failed",
      },
      user?.email,
      clientIP,
      userAgent
    ).catch((logError: any) =>
      devLog.error("[API] PROFILE_UPDATE 로그 실패:", logError)
    );
    return NextResponse.json(
      { error: "프로필 정보 저장 실패" },
      { status: 500, headers: { "Cache-Control": "no-store" } }
    );
  }
}

// POST: 프로필 이미지 업로드
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const clientIP = getClientIP(request);
  const userAgent = getUserAgent(request);

  // 인증 확인
  const authResult = await requireAuth(false);
  if (!authResult.success || !authResult.user) {
    return authResult.response!;
  }

  const user = authResult.user;

  try {
    const { publicUrl, fileName } = await request.json();
    const { error: updateError } = await supabase
      .from("profiles")
      .update({
        profile_image_url: publicUrl,
        updated_at: new Date().toISOString(),
      })
      .eq("id", user.id);
    if (updateError) throw updateError;
    await createSystemLog(
      "PROFILE_IMAGE_UPLOAD",
      `프로필 이미지 업로드: ${fileName}`,
      "info",
      user.id,
      "user",
      user.id,
      {
        target_user_id: user.id,
        action_type: "profile_image_upload",
        updated_fields: ["profile_image_url"],
        file_name: fileName,
        status: "success",
      },
      user.email,
      clientIP,
      userAgent
    );
    return NextResponse.json(
      { success: true },
      {
        headers: {
          "Cache-Control": "no-store",
        },
      }
    );
  } catch (error) {
    devLog.error("[API] PROFILE_IMAGE_UPLOAD 실패:", error);

    // API 에러 로깅
    await logApiError(
      "/api/profile",
      "POST",
      error instanceof Error ? error : String(error),
      user?.id,
      {
        ip: clientIP,
        userAgent,
      }
    );

    await createSystemLog(
      "PROFILE_IMAGE_UPLOAD_FAILED",
      `프로필 이미지 업로드 실패: ${
        error instanceof Error ? error.message : String(error)
      }`,
      "error",
      user?.id,
      "user",
      user?.id,
      {
        target_user_id: user?.id,
        action_type: "profile_image_upload",
        error: error instanceof Error ? error.message : String(error),
        status: "failed",
      },
      user?.email,
      clientIP,
      userAgent
    ).catch((logError: any) =>
      devLog.error("[API] PROFILE_IMAGE_UPLOAD 로그 실패:", logError)
    );
    return NextResponse.json(
      { error: "프로필 이미지 업로드 실패" },
      { status: 500, headers: { "Cache-Control": "no-store" } }
    );
  }
}

// DELETE: 프로필 이미지 삭제
export async function DELETE(request: NextRequest) {
  const supabase = await createClient();
  const clientIP = getClientIP(request);
  const userAgent = getUserAgent(request);

  // 인증 확인
  const authResult = await requireAuth(false);
  if (!authResult.success || !authResult.user) {
    return authResult.response!;
  }

  const user = authResult.user;

  try {
    const { error: updateError } = await supabase
      .from("profiles")
      .update({
        profile_image_url: null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", user.id);
    if (updateError) throw updateError;
    await createSystemLog(
      "PROFILE_IMAGE_DELETE",
      "프로필 이미지 삭제",
      "info",
      user.id,
      "user",
      user.id,
      {
        target_user_id: user.id,
        action_type: "profile_image_delete",
        updated_fields: ["profile_image_url"],
        status: "success",
      },
      user.email,
      clientIP,
      userAgent
    );
    return NextResponse.json(
      { success: true },
      {
        headers: {
          "Cache-Control": "no-store",
        },
      }
    );
  } catch (error) {
    devLog.error("[API] PROFILE_IMAGE_DELETE 실패:", error);

    // API 에러 로깅
    await logApiError(
      "/api/profile",
      "DELETE",
      error instanceof Error ? error : String(error),
      user?.id,
      {
        ip: clientIP,
        userAgent,
      }
    );

    await createSystemLog(
      "PROFILE_IMAGE_DELETE_FAILED",
      `프로필 이미지 삭제 실패: ${
        error instanceof Error ? error.message : String(error)
      }`,
      "error",
      user?.id,
      "user",
      user?.id,
      {
        target_user_id: user?.id,
        action_type: "profile_image_delete",
        error: error instanceof Error ? error.message : String(error),
        status: "failed",
      },
      user?.email,
      clientIP,
      userAgent
    ).catch((logError: any) =>
      devLog.error("[API] PROFILE_IMAGE_DELETE 로그 실패:", logError)
    );
    return NextResponse.json(
      { error: "프로필 이미지 삭제 실패" },
      { status: 500, headers: { "Cache-Control": "no-store" } }
    );
  }
}
