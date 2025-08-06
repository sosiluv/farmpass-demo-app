import { NextRequest, NextResponse } from "next/server";
import { createSystemLog } from "@/lib/utils/logging/system-log";
import { devLog } from "@/lib/utils/logging/dev-logger";
import { requireAuth } from "@/lib/server/auth-utils";
import { prisma } from "@/lib/prisma";
import {
  getErrorResultFromRawError,
  makeErrorResponseFromResult,
  throwBusinessError,
} from "@/lib/utils/error/errorUtil";
import { LOG_MESSAGES } from "@/lib/utils/logging/log-templates";

export async function GET(
  request: NextRequest,
  { params }: { params: { farmId: string } }
) {
  try {
    devLog.log("🔍 농장 정보 조회 시작:", { farmId: params.farmId });

    // Prisma를 사용하여 RLS 우회
    let farm;
    try {
      farm = await prisma.farms.findUnique({
        where: { id: params.farmId },
        select: {
          id: true,
          farm_name: true,
          farm_address: true,
          farm_detailed_address: true,
          manager_name: true,
          manager_phone: true,
          farm_type: true,
          is_active: true,
          created_at: true,
        },
      });
    } catch (queryError) {
      throwBusinessError(
        "GENERAL_QUERY_FAILED",
        {
          resourceType: "farm",
        },
        queryError
      );
    }

    if (!farm) {
      throwBusinessError("GENERAL_NOT_FOUND", {
        resourceType: "farm",
      });
    }

    return NextResponse.json(
      { farm },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (error) {
    // 비즈니스 에러 또는 시스템 에러를 표준화된 에러 코드로 매핑
    const result = getErrorResultFromRawError(error, {
      operation: "get_farm_by_id",
      farmId: params.farmId,
    });

    return NextResponse.json(makeErrorResponseFromResult(result), {
      status: result.status,
    });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { farmId: string } }
) {
  let user: any = null;
  let farmData: any = {};

  try {
    // 인증 확인
    const authResult = await requireAuth(false);
    if (!authResult.success || !authResult.user) {
      return authResult.response!;
    }

    const user = authResult.user;
    const isAdmin = authResult.isAdmin || false;
    farmData = await request.json();

    // Verify ownership (관리자가 아닌 경우에만 소유권 확인)
    if (!isAdmin) {
      let existingFarm;
      try {
        existingFarm = await prisma.farms.findUnique({
          where: { id: params.farmId },
          select: { owner_id: true },
        });
      } catch (farmError) {
        throwBusinessError(
          "GENERAL_QUERY_FAILED",
          {
            resourceType: "farm",
          },
          farmError
        );
      }

      if (!existingFarm) {
        throwBusinessError("GENERAL_NOT_FOUND", {
          resourceType: "farm",
        });
      }

      if (existingFarm.owner_id !== user.id) {
        throwBusinessError("GENERAL_UNAUTHORIZED", {
          resourceType: "farm",
          operationType: "update",
        });
      }
    } else {
      // 관리자인 경우에도 농장 존재 여부는 확인
      let existingFarm;
      try {
        existingFarm = await prisma.farms.findUnique({
          where: { id: params.farmId },
          select: { id: true },
        });
      } catch (farmError) {
        throwBusinessError(
          "GENERAL_QUERY_FAILED",
          {
            resourceType: "farm",
          },
          farmError
        );
      }

      if (!existingFarm) {
        throwBusinessError("GENERAL_NOT_FOUND", {
          resourceType: "farm",
        });
      }
    }

    const farmUpdateData = {
      farm_name: farmData.farm_name?.trim(),
      farm_address: farmData.farm_address?.trim(),
      farm_detailed_address: farmData.farm_detailed_address?.trim() || null,
      farm_type: farmData.farm_type,
      description: farmData.description?.trim() || null,
      manager_name: farmData.manager_name?.trim() || null,
      manager_phone: farmData.manager_phone?.trim() || null,
    };

    // 트랜잭션으로 묶어서 처리
    let farm;
    try {
      farm = await prisma.$transaction(async (tx: any) => {
        const updatedFarm = await tx.farms.update({
          where: { id: params.farmId },
          data: farmUpdateData,
        });
        const members = await tx.farm_members.findMany({
          where: { farm_id: params.farmId },
          select: { user_id: true },
        });
        await tx.notifications.createMany({
          data: members.map((m: any) => ({
            user_id: m.user_id,
            type: "farm_updated",
            title: `농장 정보 변경`,
            message: `${updatedFarm.farm_name} 농장 정보가 변경되었습니다.`,
            data: {
              farm_id: params.farmId,
              farm_name: updatedFarm.farm_name,
              updated_fields: Object.keys(farmUpdateData),
            },
            link: `/admin/farms`,
          })),
        });
        return updatedFarm;
      });
    } catch (transactionError) {
      throwBusinessError(
        "GENERAL_TRANSACTION_FAILED",
        {
          resourceType: "farm",
          operationType: "update",
        },
        transactionError
      );
    }

    // 농장 수정 로그
    await createSystemLog(
      "FARM_UPDATED",
      LOG_MESSAGES.FARM_UPDATED(farm.farm_name),
      "info",
      { id: user.id, email: user.email || "" },
      "farm",
      params.farmId,
      {
        action_type: "farm_event",
        event: "farm_updated",
        farm_id: params.farmId,
        updated_fields: Object.keys(farmUpdateData),
        farm_name: farm.farm_name,
        admin_action: isAdmin,
      },
      request
    );

    return NextResponse.json(
      {
        farm,
        success: true,
        message: `${farm.farm_name}의 정보가 수정되었습니다.`,
      },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (error) {
    // 농장 수정 실패 로그 기록
    const errorMessage = error instanceof Error ? error.message : String(error);
    await createSystemLog(
      "FARM_UPDATE_FAILED",
      LOG_MESSAGES.FARM_UPDATE_FAILED(params.farmId, errorMessage),
      "error",
      user?.id ? { id: user.id, email: user.email || "" } : undefined,
      "farm",
      params.farmId,
      {
        action_type: "farm_event",
        event: "farm_update_failed",
        farm_id: params.farmId,
        error_message: errorMessage,
      },
      request
    );

    // 비즈니스 에러 또는 시스템 에러를 표준화된 에러 코드로 매핑
    const result = getErrorResultFromRawError(error, {
      operation: "update_farm",
      farmId: params.farmId,
      userId: user?.id,
    });

    return NextResponse.json(makeErrorResponseFromResult(result), {
      status: result.status,
    });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { farmId: string } }
) {
  let user: any = null;
  let existingFarm: any = null;
  let isAdmin = false;

  try {
    // 인증 확인
    const authResult = await requireAuth(false);
    if (!authResult.success || !authResult.user) {
      return authResult.response!;
    }

    const user = authResult.user;
    const isAdmin = authResult.isAdmin || false;

    // Verify ownership and get farm info for logging
    // 브로드캐스트를 위해 항상 owner_id도 조회
    let farm;
    try {
      farm = await prisma.farms.findUnique({
        where: { id: params.farmId },
        select: { owner_id: true, farm_name: true },
      });
    } catch (farmError) {
      throwBusinessError(
        "GENERAL_QUERY_FAILED",
        {
          resourceType: "farm",
        },
        farmError
      );
    }

    if (!farm) {
      throwBusinessError("GENERAL_NOT_FOUND", {
        resourceType: "farm",
      });
    }

    // 소유권 확인 (관리자가 아닌 경우에만)
    if (!isAdmin) {
      if (farm.owner_id !== user.id) {
        throwBusinessError("GENERAL_UNAUTHORIZED", {
          resourceType: "farm",
          operationType: "delete",
        });
      }
    }

    // 트랜잭션으로 묶어서 처리
    try {
      await prisma.$transaction(async (tx: any) => {
        // 농장 삭제 (CASCADE로 farm_members도 자동 삭제됨)
        await tx.farms.delete({
          where: { id: params.farmId },
        });
        const members = await tx.farm_members.findMany({
          where: { farm_id: params.farmId },
          select: { user_id: true },
        });
        await tx.notifications.createMany({
          data: members.map((m: any) => ({
            user_id: m.user_id,
            type: "farm_deleted",
            title: "농장 정보 삭제",
            message: `${farm.farm_name} 농장이 삭제되었습니다.`,
            data: {
              farm_id: params.farmId,
              farm_name: farm.farm_name,
            },
            link: "/admin/farms",
          })),
        });
      });
    } catch (transactionError) {
      throwBusinessError(
        "GENERAL_TRANSACTION_FAILED",
        {
          resourceType: "farm",
          operationType: "delete",
        },
        transactionError
      );
    }

    // 농장 삭제 로그 (삭제 전에 기록)
    await createSystemLog(
      "FARM_DELETED",
      LOG_MESSAGES.FARM_DELETED(farm.farm_name || "Unknown"),
      "warn",
      { id: user.id, email: user.email || "" },
      "farm",
      params.farmId,
      {
        action_type: "farm_event",
        event: "farm_deleted",
        farm_id: params.farmId,
        farm_name: farm.farm_name || "Unknown",
        admin_action: isAdmin,
      },
      request
    );

    return NextResponse.json(
      {
        success: true,
        message: `${farm.farm_name} 농장이 삭제되었습니다.`,
      },
      { status: 200, headers: { "Cache-Control": "no-store" } }
    );
  } catch (error) {
    // 농장 삭제 실패 로그 기록
    const errorMessage = error instanceof Error ? error.message : String(error);
    await createSystemLog(
      "FARM_DELETE_FAILED",
      LOG_MESSAGES.FARM_DELETE_FAILED(params.farmId, errorMessage),
      "error",
      user?.id ? { id: user.id, email: user.email || "" } : undefined,
      "farm",
      params.farmId,
      {
        action_type: "farm_event",
        event: "farm_delete_failed",
        farm_id: params.farmId,
        error_message: errorMessage,
      },
      request
    );

    // 비즈니스 에러 또는 시스템 에러를 표준화된 에러 코드로 매핑
    const result = getErrorResultFromRawError(error, {
      operation: "delete_farm",
      farmId: params.farmId,
      userId: user?.id,
    });

    return NextResponse.json(makeErrorResponseFromResult(result), {
      status: result.status,
    });
  }
}
