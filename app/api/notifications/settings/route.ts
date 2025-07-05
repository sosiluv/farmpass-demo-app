import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { devLog } from "@/lib/utils/logging/dev-logger";

// 동적 렌더링 강제
export const dynamic = "force-dynamic";

// GET: 알림 설정 조회
export async function GET(request: NextRequest) {
  try {
    devLog.log("[API] /api/notifications/settings GET 요청 시작");

    const supabase = await createClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError) {
      devLog.error("유저 인증 오류:", userError);
      return NextResponse.json({ error: "User auth error" }, { status: 500 });
    }

    if (!user) {
      devLog.log("인증되지 않은 요청");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    devLog.log("사용자 ID:", user.id);

    const { data: settings, error } = await supabase
      .from("user_notification_settings")
      .select("*")
      .eq("user_id", user.id)
      .single();

    if (error) {
      devLog.error("알림 설정 조회 오류:", error);

      // 데이터가 없는 경우 (PGRST116 오류)
      if (error.code === "PGRST116") {
        devLog.log("알림 설정이 없음, 기본값 반환");
        return NextResponse.json(
          {
            id: null,
            user_id: user.id,
            notification_method: "push",
            visitor_alerts: true,
            notice_alerts: true,
            emergency_alerts: true,
            maintenance_alerts: true,
            kakao_user_id: null,
            is_active: false,
            created_at: null,
            updated_at: null,
          },
          {
            headers: {
              "Cache-Control": "no-store",
            },
          }
        );
      }

      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    devLog.log("알림 설정 조회 성공:", settings);
    return NextResponse.json(settings || {}, {
      headers: {
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    devLog.error("알림 설정 조회 중 예외 발생:", error);
    return NextResponse.json(
      { error: "알림 설정을 조회하는 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

// PUT: 알림 설정 업데이트
export async function PUT(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError) {
      return NextResponse.json({ error: "User auth error" }, { status: 500 });
    }

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { data: existingSettings } = await supabase
      .from("user_notification_settings")
      .select("id")
      .eq("user_id", user.id)
      .single();

    let result;
    if (existingSettings) {
      // 기존 레코드 업데이트 시 updated_at 자동 설정
      const { updated_at, ...updateData } = body;
      const now = new Date().toISOString();
      const { data, error } = await supabase
        .from("user_notification_settings")
        .update({ ...updateData, updated_at: now })
        .eq("user_id", user.id)
        .select()
        .single();

      if (error) {
        devLog.error("알림 설정 업데이트 오류:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
      result = data;
    } else {
      // 새 레코드 생성 시 id 필드 제외하고 타임스탬프 설정
      const { id, created_at, updated_at, ...insertData } = body;
      const now = new Date().toISOString();
      const { data, error } = await supabase
        .from("user_notification_settings")
        .insert([
          {
            ...insertData,
            user_id: user.id,
            created_at: now,
            updated_at: now,
          },
        ])
        .select()
        .single();

      if (error) {
        devLog.error("알림 설정 생성 오류:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
      result = data;
    }

    return NextResponse.json(result);
  } catch (error) {
    devLog.error("알림 설정 업데이트 중 예외 발생:", error);
    return NextResponse.json(
      { error: "알림 설정을 업데이트하는 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
