import { NextRequest, NextResponse } from "next/server";
import { createSystemLog } from "@/lib/utils/logging/system-log";
import { devLog } from "@/lib/utils/logging/dev-logger";
import { getClientIP, getUserAgent } from "@/lib/server/ip-helpers";
import { requireAuth } from "@/lib/server/auth-utils";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: { farmId: string } }
) {
  try {
    devLog.log("🔍 농장 정보 조회 시작:", { farmId: params.farmId });

    // Prisma를 사용하여 RLS 우회
    const farm = await prisma.farms.findUnique({
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

    devLog.log("🔍 농장 조회 결과:", {
      hasData: !!farm,
      farmId: params.farmId,
      isActive: farm?.is_active,
    });

    if (!farm) {
      devLog.log("농장을 찾을 수 없음:", { farmId: params.farmId });
      return NextResponse.json(
        {
          success: false,
          error: "FARM_NOT_FOUND",
          message: "농장을 찾을 수 없습니다.",
        },
        { status: 404, headers: { "Cache-Control": "no-store" } }
      );
    }

    return NextResponse.json(
      { farm },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (error) {
    devLog.error("Error fetching farm:", error);
    return NextResponse.json(
      {
        success: false,
        error: "FARM_FETCH_ERROR",
        message: "농장 정보 조회 중 오류가 발생했습니다.",
      },
      { status: 500, headers: { "Cache-Control": "no-store" } }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { farmId: string } }
) {
  // 요청 컨텍스트 정보 추출
  const clientIP = getClientIP(request);
  const userAgent = getUserAgent(request);

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
      const existingFarm = await prisma.farms.findUnique({
        where: { id: params.farmId },
        select: { owner_id: true },
      });

      if (!existingFarm) {
        return NextResponse.json(
          {
            success: false,
            error: "FARM_NOT_FOUND",
            message: "농장을 찾을 수 없습니다.",
          },
          { status: 404 }
        );
      }

      if (existingFarm.owner_id !== user.id) {
        return NextResponse.json(
          {
            success: false,
            error: "UNAUTHORIZED",
            message: "이 농장에 대한 권한이 없습니다.",
          },
          { status: 403 }
        );
      }
    } else {
      // 관리자인 경우에도 농장 존재 여부는 확인
      const existingFarm = await prisma.farms.findUnique({
        where: { id: params.farmId },
        select: { id: true },
      });

      if (!existingFarm) {
        return NextResponse.json(
          {
            success: false,
            error: "FARM_NOT_FOUND",
            message: "농장을 찾을 수 없습니다.",
          },
          { status: 404 }
        );
      }
    }

    // Update farm
    const farm = await prisma.farms.update({
      where: { id: params.farmId },
      data: farmData,
    });

    // 🔥 농장 수정 실시간 브로드캐스트
    try {
      const { createServiceRoleClient } = await import(
        "@/lib/supabase/service-role"
      );
      const supabase = createServiceRoleClient();
      await supabase.channel("farm_updates").send({
        type: "broadcast",
        event: "farm_updated",
        payload: {
          eventType: "UPDATE",
          new: farm,
          old: null,
          table: "farms",
          schema: "public",
        },
      });
      console.log("📡 [FARM-UPDATE-API] Supabase Broadcast 발송 완료");
    } catch (broadcastError) {
      console.error(
        "⚠️ [FARM-UPDATE-API] Broadcast 발송 실패:",
        broadcastError
      );
    }

    // 농장 수정 로그
    await createSystemLog(
      "FARM_UPDATE",
      `농장 정보 수정: ${farm.farm_name} (${
        Object.keys(farmData).length
      }개 필드 수정)`,
      "info",
      user.id,
      "farm",
      params.farmId,
      {
        farm_id: params.farmId,
        updated_fields: Object.keys(farmData),
        farm_name: farm.farm_name,
        action_type: "farm_management",
        admin_action: isAdmin, // 관리자 액션 여부 기록
      },
      user.email,
      clientIP,
      userAgent
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
    devLog.error("Error updating farm:", error);

    // 농장 수정 실패 로그 기록
    await createSystemLog(
      "FARM_UPDATE_FAILED",
      `농장 정보 수정 실패: ${
        error instanceof Error ? error.message : "Unknown error"
      } (농장 ID: ${params.farmId})`,
      "error",
      user?.id,
      "farm",
      params.farmId,
      {
        error_message: error instanceof Error ? error.message : "Unknown error",
        farm_id: params.farmId,
        farm_data: farmData,
        action_type: "farm_management",
        status: "failed",
      },
      user?.email,
      clientIP,
      userAgent
    ).catch((logError: any) =>
      devLog.error("Failed to log farm update error:", logError)
    );

    return NextResponse.json(
      {
        success: false,
        error: "FARM_UPDATE_ERROR",
        message: "농장 정보 수정 중 오류가 발생했습니다.",
      },
      { status: 500, headers: { "Cache-Control": "no-store" } }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { farmId: string } }
) {
  // 요청 컨텍스트 정보 추출
  const clientIP = getClientIP(request);
  const userAgent = getUserAgent(request);

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
    const farm = await prisma.farms.findUnique({
      where: { id: params.farmId },
      select: { owner_id: true, farm_name: true },
    });

    if (!farm) {
      devLog.error(`Farm not found for deletion: ${params.farmId}`);
      return NextResponse.json(
        {
          success: false,
          error: "FARM_NOT_FOUND",
          message: "농장을 찾을 수 없습니다.",
        },
        { status: 404 }
      );
    }

    // 소유권 확인 (관리자가 아닌 경우에만)
    if (!isAdmin) {
      devLog.log(
        `Farm ownership check for deletion - Farm: ${params.farmId}, Owner: ${farm.owner_id}, User: ${user.id}`
      );

      if (farm.owner_id !== user.id) {
        devLog.error(
          `Unauthorized farm deletion - Farm: ${params.farmId}, Owner: ${farm.owner_id}, User: ${user.id}`
        );
        return NextResponse.json(
          {
            success: false,
            error: "UNAUTHORIZED",
            message: "이 농장을 삭제할 권한이 없습니다.",
          },
          { status: 403 }
        );
      }
    } else {
      devLog.log(
        `Admin farm deletion - Farm: ${params.farmId}, Admin User: ${user.id}`
      );
    }

    // 농장 삭제 로그 (삭제 전에 기록)
    await createSystemLog(
      "FARM_DELETE",
      `농장 삭제: ${farm.farm_name || "Unknown"} (농장 ID: ${params.farmId})`,
      "warn",
      user.id,
      "farm",
      params.farmId,
      {
        farm_id: params.farmId,
        farm_name: farm.farm_name || "Unknown",
        action_type: "farm_management",
        admin_action: isAdmin, // 관리자 액션 여부 기록
      },
      user.email,
      clientIP,
      userAgent
    );

    // 농장 삭제 (CASCADE로 farm_members도 자동 삭제됨)
    await prisma.farms.delete({
      where: { id: params.farmId },
    });

    // 🔥 농장 삭제 실시간 브로드캐스트
    try {
      const { createServiceRoleClient } = await import(
        "@/lib/supabase/service-role"
      );
      const supabase = createServiceRoleClient();
      await supabase.channel("farm_updates").send({
        type: "broadcast",
        event: "farm_deleted",
        payload: {
          eventType: "DELETE",
          new: null,
          old: {
            id: params.farmId,
            farm_name: farm.farm_name,
            owner_id: farm.owner_id,
          },
          table: "farms",
          schema: "public",
        },
      });
      console.log("📡 [FARM-DELETE-API] Supabase Broadcast 발송 완료");
    } catch (broadcastError) {
      console.error(
        "⚠️ [FARM-DELETE-API] Broadcast 발송 실패:",
        broadcastError
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: `${farm.farm_name}이 삭제되었습니다.`,
      },
      { status: 200, headers: { "Cache-Control": "no-store" } }
    );
  } catch (error) {
    devLog.error("Error deleting farm:", error);

    // 농장 삭제 실패 로그 기록
    await createSystemLog(
      "FARM_DELETE_FAILED",
      `농장 삭제 실패: ${
        error instanceof Error ? error.message : "Unknown error"
      } (농장: ${existingFarm?.farm_name || "Unknown"}, 농장 ID: ${
        params.farmId
      })`,
      "error",
      user?.id,
      "farm",
      params.farmId,
      {
        error_message: error instanceof Error ? error.message : "Unknown error",
        farm_id: params.farmId,
        farm_name: existingFarm?.farm_name || "Unknown",
        action_type: "farm_management",
        status: "failed",
        admin_action: user ? isAdmin : false, // 관리자 액션 여부 기록
      },
      user?.email,
      clientIP,
      userAgent
    ).catch((logError: any) =>
      devLog.error("Failed to log farm deletion error:", logError)
    );

    return NextResponse.json(
      {
        success: false,
        error: "FARM_DELETE_ERROR",
        message: "농장 삭제 중 오류가 발생했습니다.",
      },
      { status: 500, headers: { "Cache-Control": "no-store" } }
    );
  }
}
