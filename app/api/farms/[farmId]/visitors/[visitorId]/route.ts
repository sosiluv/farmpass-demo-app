import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
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
  const { farmId, visitorId } = params;

  // 인증 확인
  const authResult = await requireAuth(false);
  if (!authResult.success || !authResult.user) {
    return authResult.response!;
  }

  const user = authResult.user;

  try {
    devLog.log("방문자 수정 API 요청 시작:", params);
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
    devLog.log("Prisma 업데이트 시작");

    const data = await prisma.visitor_entries.update({
      where: {
        id: visitorId,
        farm_id: farmId,
      },
      data: {
        visitor_name: updateData.visitor_name.trim(),
        visitor_phone: updateData.visitor_phone.trim(),
        visitor_address: updateData.visitor_address.trim(),
        visitor_purpose: updateData.visitor_purpose?.trim() || null,
        vehicle_number: updateData.vehicle_number?.trim() || null,
        notes: updateData.notes?.trim() || null,
        disinfection_check: updateData.disinfection_check || false,
        updated_at: new Date(),
      },
      include: {
        farms: {
          select: {
            farm_name: true,
            farm_type: true,
          },
        },
      },
    });

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
  } catch (error: any) {
    devLog.error("방문자 수정 중 예외 발생:", error);

    // Prisma 에러 처리
    if (error.code === "P2002") {
      return NextResponse.json(
        {
          success: false,
          error: "DUPLICATE_VISITOR_INFO",
          message: "중복된 방문자 정보가 있습니다.",
        },
        { status: 400 }
      );
    }

    if (error.code === "P2025") {
      return NextResponse.json(
        {
          success: false,
          error: "VISITOR_NOT_FOUND",
          message: "방문자 정보를 찾을 수 없습니다.",
        },
        { status: 404 }
      );
    }

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
          error_code: error.code,
        },
      },
      user.email,
      clientIP,
      userAgent
    );

    return NextResponse.json(
      {
        success: false,
        error: "VISITOR_UPDATE_FAILED",
        message: "방문자 정보 수정에 실패했습니다.",
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
  const { farmId, visitorId } = params;

  // 인증 확인
  const authResult = await requireAuth(false);
  if (!authResult.success || !authResult.user) {
    return authResult.response!;
  }

  const user = authResult.user;

  try {
    // 방문자 정보 조회 (로그용)
    const visitor = await prisma.visitor_entries.findUnique({
      where: {
        id: visitorId,
        farm_id: farmId,
      },
      select: {
        visitor_name: true,
      },
    });

    if (!visitor) {
      return NextResponse.json(
        {
          success: false,
          error: "VISITOR_NOT_FOUND",
          message: "방문자 정보를 찾을 수 없습니다.",
        },
        { status: 404 }
      );
    }

    // 방문자 삭제
    await prisma.visitor_entries.delete({
      where: {
        id: visitorId,
        farm_id: farmId,
      },
    });

    // 성공 로그 기록
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

    return NextResponse.json({
      success: true,
      message: "방문자가 성공적으로 삭제되었습니다.",
    });
  } catch (error: any) {
    devLog.error("방문자 삭제 중 예외 발생:", error);

    if (error.code === "P2025") {
      return NextResponse.json(
        {
          success: false,
          error: "VISITOR_NOT_FOUND",
          message: "방문자 정보를 찾을 수 없습니다.",
        },
        { status: 404 }
      );
    }

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
        error: error.message,
        status: "failed",
        metadata: {
          message: "방문자 삭제 실패",
          error_code: error.code,
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
}
