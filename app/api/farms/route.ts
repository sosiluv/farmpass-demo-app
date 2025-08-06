import { NextRequest, NextResponse } from "next/server";
import { createSystemLog } from "@/lib/utils/logging/system-log";
import { requireAuth } from "@/lib/server/auth-utils";
import { prisma } from "@/lib/prisma";
import {
  getErrorResultFromRawError,
  makeErrorResponseFromResult,
  throwBusinessError,
} from "@/lib/utils/error/errorUtil";
import { LOG_MESSAGES } from "@/lib/utils/logging/log-templates";

export async function POST(request: NextRequest) {
  let user: any = null;
  let farmData: any = {};
  let statusCode = 200;

  try {
    // 인증 확인
    const authResult = await requireAuth(false);
    if (!authResult.success || !authResult.user) {
      return authResult.response!;
    }

    user = authResult.user;

    const {
      farm_name,
      farm_address,
      farm_detailed_address,
      farm_type,
      description,
      manager_name,
      manager_phone,
    } = await request.json();

    farmData = {
      farm_name,
      farm_type,
      farm_address,
      manager_name,
      manager_phone,
    };

    // Start a transaction
    let farm;
    const farmCreateData = {
      farm_name: farm_name.trim(),
      farm_address: farm_address.trim(),
      farm_detailed_address: farm_detailed_address?.trim() || null,
      farm_type,
      description: description?.trim() || null,
      manager_name: manager_name?.trim(),
      manager_phone: manager_phone?.trim(),
      owner_id: user.id,
    };

    try {
      farm = await prisma.$transaction(async (tx: any) => {
        const createdFarm = await tx.farms.create({
          data: farmCreateData,
        });
        await tx.farm_members.create({
          data: {
            farm_id: createdFarm.id,
            user_id: user.id,
            role: "owner",
          },
        });
        // 알림 생성도 트랜잭션 안에서 처리
        await tx.notifications.create({
          data: {
            user_id: createdFarm.owner_id,
            type: "farm_created",
            title: `새 농장 등록`,
            message: `${createdFarm.farm_name} 농장이 등록되었습니다.`,
            data: {
              farm_id: createdFarm.id,
              farm_name: createdFarm.farm_name,
            },
            link: `/admin/farms`,
          },
        });
        return createdFarm;
      });

      // 농장 생성 로그
      await createSystemLog(
        "FARM_CREATED",
        LOG_MESSAGES.FARM_CREATED(farmCreateData.farm_name, farm.id),
        "info",
        { id: user.id, email: user.email || "" },
        "farm",
        farm.id,
        {
          action_type: "farm_event",
          event: "farm_created",
          farm_id: farm.id,
          farm_name: farmCreateData.farm_name,
        },
        request
      );

      statusCode = 201;
      return NextResponse.json(
        {
          farm,
          success: true,
          message: `${farm_name}이 등록되었습니다.`,
        },
        { status: 201, headers: { "Cache-Control": "no-store" } }
      );
    } catch (error) {
      throwBusinessError(
        "GENERAL_CREATE_FAILED",
        {
          resourceType: "farm",
        },
        error
      );
    }
  } catch (error) {
    statusCode = 500;
    // 농장 생성 실패 로그 기록
    const errorMessage = error instanceof Error ? error.message : String(error);
    await createSystemLog(
      "FARM_CREATE_FAILED",
      LOG_MESSAGES.FARM_CREATE_FAILED(
        farmData.farm_name || "Unknown",
        errorMessage
      ),
      "error",
      user?.id ? { id: user.id, email: user.email || "" } : undefined,
      "farm",
      undefined,
      {
        action_type: "farm_event",
        event: "farm_create_failed",
        error_message: errorMessage,
        farm_name: farmData.farm_name || "Unknown",
      },
      request
    );

    // 비즈니스 에러 또는 시스템 에러를 표준화된 에러 코드로 매핑
    const result = getErrorResultFromRawError(error, {
      operation: "farm_creation",
      userId: user?.id,
    });

    return NextResponse.json(makeErrorResponseFromResult(result), {
      status: result.status,
    });
  }
}

export async function GET(request: NextRequest) {
  let statusCode = 200;
  let user: any = null;

  try {
    // 인증 확인
    const authResult = await requireAuth(false);
    if (!authResult.success || !authResult.user) {
      return authResult.response!;
    }

    const user = authResult.user;
    const isAdmin = authResult.isAdmin || false;

    let farms;

    // admin인 경우 모든 농장을 조회, 아닌 경우 접근 가능한 농장 조회
    if (isAdmin) {
      // 관리자는 모든 농장 조회
      try {
        farms = await prisma.farms.findMany({
          include: {
            profiles: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
          orderBy: {
            created_at: "desc",
          },
        });
      } catch (adminFarmsError) {
        throwBusinessError(
          "GENERAL_QUERY_FAILED",
          {
            resourceType: "farmList",
          },
          adminFarmsError
        );
      }
    } else {
      // 일반 사용자는 접근 가능한 농장만 조회 - 한 번의 쿼리로 최적화
      try {
        farms = await prisma.farms.findMany({
          where: {
            OR: [
              // 소유한 농장
              { owner_id: user.id },
              // 구성원으로 속한 농장
              {
                farm_members: {
                  some: {
                    user_id: user.id,
                    is_active: true,
                  },
                },
              },
            ],
          },
          include: {
            profiles: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
          orderBy: {
            created_at: "desc",
          },
        });
      } catch (userFarmsError) {
        throwBusinessError(
          "GENERAL_QUERY_FAILED",
          {
            resourceType: "farmList",
          },
          userFarmsError
        );
      }
    }

    // 농장 목록 조회 로그 기록
    await createSystemLog(
      "FARM_READ",
      LOG_MESSAGES.FARM_READ(
        farms?.length || 0,
        isAdmin ? "관리자 전체 조회" : "접근 가능한 농장 조회"
      ),
      "info",
      { id: user.id, email: user.email || "" },
      "farm",
      undefined,
      {
        action_type: "farm_event",
        event: "farm_read",
        count: farms?.length || 0,
        is_admin: isAdmin,
        email: user.email || "",
      },
      request
    );

    return NextResponse.json(
      { farms },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (error) {
    statusCode = 500;
    // 농장 목록 조회 실패 로그 기록
    const errorMessage = error instanceof Error ? error.message : String(error);
    await createSystemLog(
      "FARM_READ_FAILED",
      LOG_MESSAGES.FARM_READ_FAILED(errorMessage),
      "error",
      user?.id ? { id: user.id, email: user.email || "" } : undefined,
      "farm",
      undefined,
      {
        action_type: "farm_event",
        event: "farm_read_failed",
        error_message: errorMessage,
      },
      request
    );

    // 비즈니스 에러 또는 시스템 에러를 표준화된 에러 코드로 매핑
    const result = getErrorResultFromRawError(error, {
      operation: "farm_list_fetch",
      userId: user?.id,
    });

    return NextResponse.json(makeErrorResponseFromResult(result), {
      status: result.status,
    });
  }
}
