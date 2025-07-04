import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { logDataChange } from "@/lib/utils/logging/system-log";
import { devLog } from "@/lib/utils/logging/dev-logger";

// PATCH: 프로필 정보 수정
export async function PATCH(request: NextRequest) {
  const supabase = await createClient();
  const clientIP = request.headers.get("x-forwarded-for") || "unknown";
  const userAgent = request.headers.get("user-agent") || "unknown";

  let user;
  try {
    const {
      data: { user: authUser },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !authUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    user = authUser;
    const data = await request.json();
    const { error } = await supabase
      .from("profiles")
      .update({
        ...data,
        updated_at: new Date().toISOString(),
      })
      .eq("id", user.id);
    if (error) throw error;
    await logDataChange(
      "PROFILE_UPDATE",
      "PROFILE",
      user.id,
      {
        target_user_id: user.id,
        action_type: "profile_info_update",
        updated_fields: Object.keys(data),
        status: "success",
      },
      {
        ip: clientIP,
        email: user.email,
        userAgent,
      }
    );
    return NextResponse.json({ success: true });
  } catch (error) {
    devLog.error("[API] PROFILE_UPDATE 실패:", error);
    await logDataChange(
      "PROFILE_UPDATE_FAILED",
      "PROFILE",
      user?.id,
      {
        target_user_id: user?.id,
        action_type: "profile_info_update",
        error: error instanceof Error ? error.message : String(error),
        status: "failed",
      },
      {
        ip: clientIP,
        email: user?.email,
        userAgent,
      }
    ).catch((logError) =>
      devLog.error("[API] PROFILE_UPDATE 로그 실패:", logError)
    );
    return NextResponse.json(
      { error: "프로필 정보 저장 실패" },
      { status: 500 }
    );
  }
}

// POST: 프로필 이미지 업로드
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const clientIP = request.headers.get("x-forwarded-for") || "unknown";
  const userAgent = request.headers.get("user-agent") || "unknown";
  let user;
  try {
    const {
      data: { user: authUser },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !authUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    user = authUser;
    const { publicUrl, fileName } = await request.json();
    const { error: updateError } = await supabase
      .from("profiles")
      .update({
        profile_image_url: publicUrl,
        updated_at: new Date().toISOString(),
      })
      .eq("id", user.id);
    if (updateError) throw updateError;
    await logDataChange(
      "PROFILE_IMAGE_UPLOAD",
      "PROFILE",
      user.id,
      {
        target_user_id: user.id,
        action_type: "profile_image_upload",
        updated_fields: ["profile_image_url"],
        file_name: fileName,
        status: "success",
      },
      {
        ip: clientIP,
        email: user.email,
        userAgent,
      }
    );
    return NextResponse.json({ success: true });
  } catch (error) {
    devLog.error("[API] PROFILE_IMAGE_UPLOAD 실패:", error);
    await logDataChange(
      "PROFILE_IMAGE_UPLOAD_FAILED",
      "PROFILE",
      user?.id,
      {
        target_user_id: user?.id,
        action_type: "profile_image_upload",
        error: error instanceof Error ? error.message : String(error),
        status: "failed",
      },
      {
        ip: clientIP,
        email: user?.email,
        userAgent,
      }
    ).catch((logError) =>
      devLog.error("[API] PROFILE_IMAGE_UPLOAD 로그 실패:", logError)
    );
    return NextResponse.json(
      { error: "프로필 이미지 업로드 실패" },
      { status: 500 }
    );
  }
}

// DELETE: 프로필 이미지 삭제
export async function DELETE(request: NextRequest) {
  const supabase = await createClient();
  const clientIP = request.headers.get("x-forwarded-for") || "unknown";
  const userAgent = request.headers.get("user-agent") || "unknown";
  let user;
  try {
    const {
      data: { user: authUser },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !authUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    user = authUser;
    const { error: updateError } = await supabase
      .from("profiles")
      .update({
        profile_image_url: null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", user.id);
    if (updateError) throw updateError;
    await logDataChange(
      "PROFILE_IMAGE_DELETE",
      "PROFILE",
      user.id,
      {
        target_user_id: user.id,
        action_type: "profile_image_delete",
        updated_fields: ["profile_image_url"],
        status: "success",
      },
      {
        ip: clientIP,
        email: user.email,
        userAgent,
      }
    );
    return NextResponse.json({ success: true });
  } catch (error) {
    devLog.error("[API] PROFILE_IMAGE_DELETE 실패:", error);
    await logDataChange(
      "PROFILE_IMAGE_DELETE_FAILED",
      "PROFILE",
      user?.id,
      {
        target_user_id: user?.id,
        action_type: "profile_image_delete",
        error: error instanceof Error ? error.message : String(error),
        status: "failed",
      },
      {
        ip: clientIP,
        email: user?.email,
        userAgent,
      }
    ).catch((logError) =>
      devLog.error("[API] PROFILE_IMAGE_DELETE 로그 실패:", logError)
    );
    return NextResponse.json(
      { error: "프로필 이미지 삭제 실패" },
      { status: 500 }
    );
  }
}
