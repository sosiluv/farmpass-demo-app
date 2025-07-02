import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { logVisitorDataAccess } from "@/lib/utils/logging/system-log";
import { devLog } from "@/lib/utils/logging/dev-logger";
import { getClientIP, getUserAgent } from "@/lib/server/ip-helpers";

export async function PUT(
  request: NextRequest,
  { params }: { params: { farmId: string; visitorId: string } }
) {
  const clientIP = getClientIP(request);
  const userAgent = getUserAgent(request);

  try {
    devLog.log("방문자 수정 API 요청 시작:", params);

    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      devLog.log("인증 실패:", authError);
      return NextResponse.json(
        { message: "인증이 필요합니다. 다시 로그인해주세요." },
        { status: 401 }
      );
    }

    const { farmId, visitorId } = params;
    const updateData = await request.json();

    devLog.log("수정할 데이터:", {
      farmId,
      visitorId,
      updateData,
    });

    // 필수 필드 검증
    if (
      !updateData.visitor_name?.trim() ||
      !updateData.visitor_phone?.trim() ||
      !updateData.visitor_address?.trim()
    ) {
      devLog.log("필수 필드 누락:", {
        name: !updateData.visitor_name?.trim(),
        phone: !updateData.visitor_phone?.trim(),
        address: !updateData.visitor_address?.trim(),
      });

      return NextResponse.json(
        { message: "이름, 연락처, 주소는 필수 입력 항목입니다." },
        { status: 400 }
      );
    }

    // 방문자 정보 업데이트
    devLog.log("Supabase 업데이트 시작");

    const { data, error } = await supabase
      .from("visitor_entries")
      .update({
        visitor_name: updateData.visitor_name.trim(),
        visitor_phone: updateData.visitor_phone.trim(),
        visitor_address: updateData.visitor_address.trim(),
        visitor_purpose: updateData.visitor_purpose?.trim() || null,
        vehicle_number: updateData.vehicle_number?.trim() || null,
        notes: updateData.notes?.trim() || null,
        disinfection_check: updateData.disinfection_check || false,
        updated_at: new Date().toISOString(),
      })
      .eq("id", visitorId)
      .eq("farm_id", farmId)
      .select("*, farms(farm_name, farm_type)")
      .single();

    if (error) {
      devLog.error("Supabase 업데이트 실패:", error);

      // 실패 로그 기록
      await logVisitorDataAccess(
        "UPDATE_FAILED",
        user.id,
        user.email,
        {
          farm_id: farmId,
          visitor_id: visitorId,
          error: error.message,
          status: "failed",
          metadata: {
            message: "방문자 정보 수정 실패",
            error_details: error.details,
            error_code: error.code,
            error_hint: error.hint,
          },
        },
        {
          ip: clientIP,
          email: user.email,
          userAgent,
        }
      );

      if (error.code === "23505") {
        return NextResponse.json(
          { message: "중복된 방문자 정보가 있습니다." },
          { status: 400 }
        );
      }

      return NextResponse.json(
        { message: "방문자 정보 수정에 실패했습니다." },
        { status: 500 }
      );
    }

    devLog.log("방문자 정보 업데이트 성공:", data);

    // 성공 로그 기록
    await logVisitorDataAccess(
      "UPDATED",
      user.id,
      user.email,
      {
        farm_id: farmId,
        visitor_id: visitorId,
        visitor_name: data.visitor_name,
        status: "success",
        changes: updateData,
      },
      {
        ip: clientIP,
        email: user.email,
        userAgent,
      }
    );

    return NextResponse.json(data);
  } catch (error) {
    devLog.error("방문자 수정 중 예외 발생:", error);
    return NextResponse.json(
      { message: "서버 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { farmId: string; visitorId: string } }
) {
  const clientIP = getClientIP(request);
  const userAgent = getUserAgent(request);

  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { message: "인증이 필요합니다. 다시 로그인해주세요." },
        { status: 401 }
      );
    }

    const { farmId, visitorId } = params;

    // 방문자 정보 조회 (로그용)
    const { data: visitor } = await supabase
      .from("visitor_entries")
      .select("visitor_name")
      .eq("id", visitorId)
      .eq("farm_id", farmId)
      .single();

    // 방문자 삭제
    const { error } = await supabase
      .from("visitor_entries")
      .delete()
      .eq("id", visitorId)
      .eq("farm_id", farmId);

    if (error) {
      // 실패 로그 기록
      await logVisitorDataAccess(
        "DELETE_FAILED",
        user.id,
        user.email,
        {
          farm_id: farmId,
          visitor_id: visitorId,
          visitor_name: visitor?.visitor_name,
          error: error.message,
          status: "failed",
          metadata: {
            message: "방문자 삭제 실패",
          },
        },
        {
          ip: clientIP,
          email: user.email,
          userAgent,
        }
      );

      return NextResponse.json(
        { message: "방문자 삭제에 실패했습니다." },
        { status: 500 }
      );
    }

    // 성공 로그 기록
    if (visitor) {
      await logVisitorDataAccess(
        "DELETED",
        user.id,
        user.email,
        {
          farm_id: farmId,
          visitor_id: visitorId,
          visitor_name: visitor.visitor_name,
          status: "success",
        },
        {
          ip: clientIP,
          email: user.email,
          userAgent,
        }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    devLog.error("방문자 삭제 중 예외 발생:", error);
    return NextResponse.json(
      { message: "서버 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
