import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createSystemLog } from "@/lib/utils/logging/system-log";
import { requireAuth } from "@/lib/server/auth-utils";
import {
  getErrorResultFromRawError,
  makeErrorResponseFromResult,
  throwBusinessError,
} from "@/lib/utils/error/errorUtil";
import { LOG_MESSAGES } from "@/lib/utils/logging/log-templates";

export async function PUT(
  request: NextRequest,
  { params }: { params: { farmId: string; visitorId: string } }
) {
  const { farmId, visitorId } = params;

  let updateData: any = {};

  // 인증 확인
  const authResult = await requireAuth(false);
  if (!authResult.success || !authResult.user) {
    return authResult.response!;
  }

  const user = authResult.user;

  try {
    updateData = await request.json();

    // 필수 필드 검증
    if (
      !updateData.visitor_name?.trim() ||
      !updateData.visitor_phone?.trim() ||
      !updateData.visitor_address?.trim()
    ) {
      throwBusinessError("MISSING_REQUIRED_FIELDS", {
        operation: "update_visitor",
        visitorId: visitorId,
        farmId: farmId,
      });
    }

    const visitorUpdateData = {
      visitor_name: updateData.visitor_name.trim(),
      visitor_phone: updateData.visitor_phone.trim(),
      visitor_address: updateData.visitor_address.trim(),
      visitor_purpose: updateData.visitor_purpose?.trim() || null,
      vehicle_number: updateData.vehicle_number?.trim() || null,
      notes: updateData.notes?.trim() || null,
      disinfection_check: updateData.disinfection_check || false,
      updated_at: new Date(),
    };

    // 방문자 정보 업데이트 + 알림 트랜잭션 처리
    let data;
    try {
      data = await prisma.$transaction(async (tx: any) => {
        const updatedVisitor = await tx.visitor_entries.update({
          where: {
            id: visitorId,
            farm_id: farmId,
          },
          data: visitorUpdateData,
          include: {
            farms: {
              select: {
                farm_name: true,
                farm_type: true,
              },
            },
          },
        });
        // const members = await tx.farm_members.findMany({
        //   where: { farm_id: farmId },
        //   select: { user_id: true },
        // });
        // await tx.notifications.createMany({
        //   data: members.map((m: any) => ({
        //     user_id: m.user_id,
        //     type: "visitor_updated",
        //     title: `방문자 정보 수정`,
        //     message: `${updatedVisitor.farms?.farm_name} 농장 방문자 정보가 수정되었습니다: ${updatedVisitor.visitor_name}`,
        //     data: {
        //       farm_id: farmId,
        //       farm_name: updatedVisitor.farms?.farm_name,
        //       visitor_id: updatedVisitor.id,
        //       visitor_name: updatedVisitor.visitor_name,
        //       updated_fields: Object.keys(visitorUpdateData),
        //     },
        //     link: `/admin/farms/${farmId}/visitors`,
        //   })),
        // });
        return updatedVisitor;
      });
    } catch (transactionError) {
      throwBusinessError(
        "GENERAL_QUERY_FAILED",
        {
          resourceType: "visitor",
        },
        transactionError
      );
    }
    // 성공 로그 기록
    await createSystemLog(
      "VISITOR_UPDATED",
      LOG_MESSAGES.VISITOR_UPDATED(data.visitor_name, farmId),
      "info",
      { id: user.id, email: user.email || "" },
      "visitor",
      visitorId,
      {
        action_type: "visitor_event",
        event: "visitor_updated",
        farm_id: farmId,
        farm_name: data.farms?.farm_name,
        visitor_id: visitorId,
        updated_fields: Object.keys(visitorUpdateData),
      },
      request
    );

    return NextResponse.json({
      ...data,
      success: true,
      message: "방문자 정보가 성공적으로 수정되었습니다.",
    });
  } catch (error) {
    // 실패 로그 기록
    const errorMessage = error instanceof Error ? error.message : String(error);
    await createSystemLog(
      "VISITOR_UPDATE_FAILED",
      LOG_MESSAGES.VISITOR_UPDATE_FAILED(visitorId, farmId, errorMessage),
      "error",
      { id: user.id, email: user.email || "" },
      "visitor",
      visitorId,
      {
        action_type: "visitor_event",
        event: "visitor_update_failed",
        farm_id: farmId,
        visitor_id: visitorId,
        error_message: errorMessage,
      },
      request
    );

    // 비즈니스 에러 또는 시스템 에러를 표준화된 에러 코드로 매핑
    const result = getErrorResultFromRawError(error, {
      operation: "update_visitor",
      visitorId: visitorId,
      farmId: farmId,
      userId: user.id,
    });

    return NextResponse.json(makeErrorResponseFromResult(result), {
      status: result.status,
    });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { farmId: string; visitorId: string } }
) {
  const { farmId, visitorId } = params;

  // 인증 확인
  const authResult = await requireAuth(false);
  if (!authResult.success || !authResult.user) {
    return authResult.response!;
  }

  const user = authResult.user;

  try {
    // 방문자 정보 조회 (로그용)
    let visitor;
    try {
      visitor = await prisma.visitor_entries.findUnique({
        where: {
          id: visitorId,
          farm_id: farmId,
        },
        select: {
          visitor_name: true,
        },
      });
    } catch (visitorError) {
      throwBusinessError(
        "GENERAL_QUERY_FAILED",
        {
          resourceType: "visitor",
        },
        visitorError
      );
    }

    if (!visitor) {
      throwBusinessError("VISITOR_NOT_FOUND", {
        operation: "delete_visitor_check",
        visitorId: visitorId,
        farmId: farmId,
      });
    }

    // 방문자 삭제 + 알림 트랜잭션 처리
    try {
      await prisma.$transaction(async (tx: any) => {
        await tx.visitor_entries.delete({
          where: {
            id: visitorId,
            farm_id: farmId,
          },
        });
        // const members = await tx.farm_members.findMany({
        //   where: { farm_id: farmId },
        //   select: { user_id: true },
        // });
        // await tx.notifications.createMany({
        //   data: members.map((m: any) => ({
        //     user_id: m.user_id,
        //     type: "visitor_deleted",
        //     title: `방문자 정보 삭제`,
        //     message: `농장 방문자가 삭제되었습니다: ${visitor.visitor_name}`,
        //     data: {
        //       farm_id: farmId,
        //       visitor_id: visitorId,
        //       visitor_name: visitor.visitor_name,
        //     },
        //     link: `/admin/farms/${farmId}/visitors`,
        //   })),
        // });
      });
    } catch (deleteError) {
      throwBusinessError(
        "GENERAL_QUERY_FAILED",
        {
          resourceType: "visitor",
        },
        deleteError
      );
    }
    // 성공 로그 기록
    await createSystemLog(
      "VISITOR_DELETED",
      LOG_MESSAGES.VISITOR_DELETED(visitor.visitor_name, farmId),
      "info",
      { id: user.id, email: user.email || "" },
      "visitor",
      visitorId,
      {
        farm_id: farmId,
        visitor_id: visitorId,
        visitor_name: visitor.visitor_name,
      },
      request
    );

    return NextResponse.json({
      success: true,
      message: "방문자가 성공적으로 삭제되었습니다.",
    });
  } catch (error) {
    // 실패 로그 기록
    const errorMessage = error instanceof Error ? error.message : String(error);
    await createSystemLog(
      "VISITOR_DELETE_FAILED",
      LOG_MESSAGES.VISITOR_DELETE_FAILED(visitorId, farmId, errorMessage),
      "error",
      { id: user.id, email: user.email || "" },
      "visitor",
      visitorId,
      {
        action_type: "visitor_event",
        event: "visitor_delete_failed",
        farm_id: farmId,
        visitor_id: visitorId,
        error_message: errorMessage,
      },
      request
    );

    // 비즈니스 에러 또는 시스템 에러를 표준화된 에러 코드로 매핑
    const result = getErrorResultFromRawError(error, {
      operation: "delete_visitor",
      visitorId: visitorId,
      farmId: farmId,
      userId: user.id,
    });

    return NextResponse.json(makeErrorResponseFromResult(result), {
      status: result.status,
    });
  }
}
