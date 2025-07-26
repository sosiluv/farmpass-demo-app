import { NextRequest, NextResponse } from "next/server";
import { createSystemLog } from "@/lib/utils/logging/system-log";
import { devLog } from "@/lib/utils/logging/dev-logger";
import {
  PerformanceMonitor,
  logApiPerformance,
} from "@/lib/utils/logging/system-log";
import { getClientIP, getUserAgent } from "@/lib/server/ip-helpers";
import { requireAuth } from "@/lib/server/auth-utils";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  // 성능 모니터링 시작
  const performanceMonitor = new PerformanceMonitor("farm_creation_api", {
    endpoint: "/api/farms",
    method: "POST",
  });

  // 요청 컨텍스트 정보 추출
  const clientIP = getClientIP(request);
  const userAgent = getUserAgent(request);

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
      farm = await prisma.$transaction(async (tx: typeof prisma) => {
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
        "FARM_CREATE",
        `농장 생성: ${farmCreateData.farm_name} (${farm.id})`,
        "info",
        user.id,
        "farm",
        farm.id,
        {
          farm_id: farm.id,
          farm_data: farmCreateData,
          action_type: "farm_management",
        },
        user.email,
        clientIP,
        userAgent
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
      statusCode = 500;
      throw error;
    }
  } catch (error) {
    statusCode = 500;

    // 농장 생성 실패 로그 기록
    await createSystemLog(
      "FARM_CREATE_FAILED",
      `농장 생성 실패: ${farmData.farm_name || "Unknown"} - ${
        error instanceof Error ? error.message : "Unknown error"
      }`,
      "error",
      user?.id,
      "farm",
      undefined,
      {
        error_message: error instanceof Error ? error.message : "Unknown error",
        farm_data: farmData,
        action_type: "farm_management",
      },
      user?.email,
      clientIP,
      userAgent
    ).catch((logError: any) =>
      devLog.error("Failed to log farm creation error:", logError)
    );

    return NextResponse.json(
      {
        success: false,
        error: "FARM_CREATE_ERROR",
        message: "농장 생성 중 오류가 발생했습니다.",
      },
      { status: 500, headers: { "Cache-Control": "no-store" } }
    );
  } finally {
    // 성능 모니터링 종료 및 로깅
    const duration = await performanceMonitor.finish(1000); // 1초 임계값

    // API 성능 로깅
    await logApiPerformance(
      {
        endpoint: "/api/farms",
        method: "POST",
        duration_ms: duration,
        status_code: statusCode,
        response_size: 0, // 실제로는 응답 크기를 계산해야 함
      },
      user?.id,
      {
        ip: clientIP,
        email: user?.email,
        userAgent: userAgent,
      }
    );
  }
}

export async function GET(request: NextRequest) {
  // 성능 모니터링 시작
  const performanceMonitor = new PerformanceMonitor("farm_list_api", {
    endpoint: "/api/farms",
    method: "GET",
  });

  // 요청 컨텍스트 정보 추출
  const clientIP = getClientIP(request);
  const userAgent = getUserAgent(request);

  let statusCode = 200;

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
        throw adminFarmsError;
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
        throw userFarmsError;
      }
    }

    // 농장 목록 조회 로그 기록
    await createSystemLog(
      "FARM_READ",
      `농장 목록 조회: ${farms?.length || 0}개 (${
        isAdmin ? "관리자 전체 조회" : "접근 가능한 농장 조회"
      })`,
      "info",
      user.id,
      "farm",
      undefined,
      {
        access_type: isAdmin ? "admin_all_farms" : "accessible_farms",
        farm_count: farms?.length || 0,
        user_email: user.email,
        action_type: "farm_management",
      },
      user.email,
      clientIP,
      userAgent
    );

    return NextResponse.json(
      { farms },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (error) {
    statusCode = 500;

    // 농장 목록 조회 실패 로그 기록
    await createSystemLog(
      "FARM_READ_FAILED",
      `농장 목록 조회 실패: ${
        error instanceof Error ? error.message : "Unknown error"
      }`,
      "error",
      undefined,
      "farm",
      undefined,
      {
        error_message: error instanceof Error ? error.message : "Unknown error",
        action_type: "farm_management",
      },
      undefined,
      clientIP,
      userAgent
    ).catch((logError: any) =>
      devLog.error("Failed to log farm fetch error:", logError)
    );

    return NextResponse.json(
      {
        success: false,
        error: "FARM_LIST_FETCH_ERROR",
        message: "농장 목록 조회 중 오류가 발생했습니다.",
      },
      { status: 500, headers: { "Cache-Control": "no-store" } }
    );
  } finally {
    // 성능 모니터링 종료 및 로깅
    const duration = await performanceMonitor.finish(500); // 500ms 임계값

    // API 성능 로깅
    await logApiPerformance(
      {
        endpoint: "/api/farms",
        method: "GET",
        duration_ms: duration,
        status_code: statusCode,
        response_size: 0, // 실제로는 응답 크기를 계산해야 함
      },
      undefined,
      {
        ip: clientIP,
        userAgent: userAgent,
      }
    );
  }
}
