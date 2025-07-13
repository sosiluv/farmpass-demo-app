import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createSystemLog } from "@/lib/utils/logging/system-log";
import { devLog } from "@/lib/utils/logging/dev-logger";
import { getClientIP, getUserAgent } from "@/lib/server/ip-helpers";
import { requireAuth } from "@/lib/server/auth-utils";

export async function PUT(
  request: NextRequest,
  { params }: { params: { farmId: string; visitorId: string } }
) {
  const clientIP = getClientIP(request);
  const userAgent = getUserAgent(request);

  try {
    devLog.log("방문자 수정 API 요청 시작:", params);

    const supabase = await createClient();

    // 인증 확인
    const authResult = await requireAuth(false);
    if (!authResult.success || !authResult.user) {
      return authResult.response!;
    }

    const user = authResult.user;

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
        {
          success: false,
          error: "MISSING_REQUIRED_FIELDS",
          message: "이름, 연락처, 주소는 필수 입력 항목입니다.",
        },
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
      await createSystemLog(
        "VISITOR_UPDATE_FAILED",
        `방문자 정보 수정 실패: ${error.message} (방문자 ID: ${visitorId}, 농장 ID: ${farmId})`,
        "error",
        user.id,
        "visitor",
        visitorId,
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
        user.email,
        clientIP,
        userAgent
      );

      if (error.code === "23505") {
        return NextResponse.json(
          {
            success: false,
            error: "DUPLICATE_VISITOR_INFO",
            message: "중복된 방문자 정보가 있습니다.",
          },
          { status: 400 }
        );
      }

      return NextResponse.json(
        {
          success: false,
          error: "VISITOR_UPDATE_FAILED",
          message: "방문자 정보 수정에 실패했습니다.",
        },
        { status: 500 }
      );
    }

    devLog.log("방문자 정보 업데이트 성공:", data);

    // 성공 로그 기록
    await createSystemLog(
      "VISITOR_UPDATED",
      `방문자 정보 수정: ${data.visitor_name} (방문자 ID: ${visitorId}, 농장 ID: ${farmId})`,
      "info",
      user.id,
      "visitor",
      visitorId,
      {
        farm_id: farmId,
        visitor_id: visitorId,
        visitor_name: data.visitor_name,
        status: "success",
        changes: updateData,
      },
      user.email,
      clientIP,
      userAgent
    );

    return NextResponse.json({
      ...data,
      success: true,
      message: "방문자 정보가 성공적으로 수정되었습니다.",
    });
  } catch (error) {
    devLog.error("방문자 수정 중 예외 발생:", error);
    return NextResponse.json(
      {
        success: false,
        error: "VISITOR_UPDATE_SYSTEM_ERROR",
        message: "서버 오류가 발생했습니다.",
      },
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

    // 인증 확인
    const authResult = await requireAuth(false);
    if (!authResult.success || !authResult.user) {
      return authResult.response!;
    }

    const user = authResult.user;

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
      await createSystemLog(
        "VISITOR_DELETE_FAILED",
        `방문자 삭제 실패: ${error.message} (방문자 ID: ${visitorId}, 농장 ID: ${farmId})`,
        "error",
        user.id,
        "visitor",
        visitorId,
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
        user.email,
        clientIP,
        userAgent
      );

      return NextResponse.json(
        {
          success: false,
          error: "VISITOR_DELETE_FAILED",
          message: "방문자 삭제에 실패했습니다.",
        },
        { status: 500 }
      );
    }

    // 성공 로그 기록
    if (visitor) {
      await createSystemLog(
        "VISITOR_DELETED",
        `방문자 삭제: ${visitor.visitor_name} (방문자 ID: ${visitorId}, 농장 ID: ${farmId})`,
        "info",
        user.id,
        "visitor",
        visitorId,
        {
          farm_id: farmId,
          visitor_id: visitorId,
          visitor_name: visitor.visitor_name,
          status: "success",
        },
        user.email,
        clientIP,
        userAgent
      );
    }

    return NextResponse.json({
      success: true,
      message: "방문자가 성공적으로 삭제되었습니다.",
    });
  } catch (error) {
    devLog.error("방문자 삭제 중 예외 발생:", error);
    return NextResponse.json(
      {
        success: false,
        error: "VISITOR_DELETE_SYSTEM_ERROR",
        message: "서버 오류가 발생했습니다.",
      },
      { status: 500 }
    );
  }
}
