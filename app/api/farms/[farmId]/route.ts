import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { logDataChange } from "@/lib/utils/logging/system-log";
import { devLog } from "@/lib/utils/logging/dev-logger";
import { getClientIP, getUserAgent } from "@/lib/server/ip-helpers";

export async function GET(
  request: NextRequest,
  { params }: { params: { farmId: string } }
) {
  // 요청 컨텍스트 정보 추출
  const clientIP = getClientIP(request);
  const userAgent = getUserAgent(request);

  try {
    const supabase = await createClient();

    // 특정 농장 정보 조회 (공개 API)
    const { data: farm, error } = await supabase
      .from("farms")
      .select(
        `
        id,
        farm_name,
        farm_address,
        farm_detailed_address,
        manager_name,
        manager_phone,
        farm_type,
        is_active,
        created_at
      `
      )
      .eq("id", params.farmId)
      .eq("is_active", true) // 활성화된 농장만 조회
      .single();

    if (error || !farm) {
      return NextResponse.json(
        { error: "Farm not found or inactive" },
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
      { error: "Failed to fetch farm" },
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
    const supabase = await createClient();
    const {
      data: { user: authUser },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !authUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    user = authUser;
    farmData = await request.json();

    // Verify ownership
    const { data: existingFarm, error: farmCheckError } = await supabase
      .from("farms")
      .select("owner_id")
      .eq("id", params.farmId)
      .single();

    if (farmCheckError || !existingFarm) {
      return NextResponse.json({ error: "Farm not found" }, { status: 404 });
    }

    if (existingFarm.owner_id !== user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Update farm
    const { data: farm, error: updateError } = await supabase
      .from("farms")
      .update(farmData)
      .eq("id", params.farmId)
      .select()
      .single();

    if (updateError) {
      throw updateError;
    }

    // 농장 수정 로그
    await logDataChange(
      "FARM_UPDATE",
      "FARM",
      user.id,
      {
        farm_id: params.farmId,
        updated_fields: Object.keys(farmData),
        farm_name: farm.farm_name,
        action_type: "farm_management",
      },
      {
        ip: clientIP,
        email: user.email,
        userAgent: userAgent,
      }
    );

    return NextResponse.json(
      { farm },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (error) {
    devLog.error("Error updating farm:", error);

    // 농장 수정 실패 로그 기록
    await logDataChange(
      "FARM_UPDATE_FAILED",
      "FARM",
      user?.id,
      {
        error_message: error instanceof Error ? error.message : "Unknown error",
        farm_id: params.farmId,
        farm_data: farmData,
        action_type: "farm_management",
        status: "failed",
      },
      {
        ip: clientIP,
        userAgent: userAgent,
      }
    ).catch((logError) =>
      devLog.error("Failed to log farm update error:", logError)
    );

    return NextResponse.json(
      { error: "Failed to update farm" },
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

  try {
    const supabase = await createClient();
    const {
      data: { user: authUser },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !authUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    user = authUser;

    // Verify ownership and get farm info for logging
    const { data: farm, error: farmCheckError } = await supabase
      .from("farms")
      .select("owner_id, farm_name")
      .eq("id", params.farmId)
      .single();

    if (farmCheckError || !farm) {
      return NextResponse.json({ error: "Farm not found" }, { status: 404 });
    }

    if (farm.owner_id !== user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    existingFarm = farm;

    // 농장 삭제 로그 (삭제 전에 기록)
    await logDataChange(
      "FARM_DELETE",
      "FARM",
      user.id,
      {
        farm_id: params.farmId,
        farm_name: existingFarm.farm_name || "Unknown",
        action_type: "farm_management",
      },
      {
        ip: clientIP,
        email: user.email,
        userAgent: userAgent,
      }
    );

    // 농장 삭제 (CASCADE로 farm_members도 자동 삭제됨)
    const { error: deleteError } = await supabase
      .from("farms")
      .delete()
      .eq("id", params.farmId);

    if (deleteError) {
      throw deleteError;
    }

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    devLog.error("Error deleting farm:", error);

    // 농장 삭제 실패 로그 기록
    await logDataChange(
      "FARM_DELETE_FAILED",
      "FARM",
      user?.id,
      {
        error_message: error instanceof Error ? error.message : "Unknown error",
        farm_id: params.farmId,
        farm_name: existingFarm?.farm_name || "Unknown",
        action_type: "farm_management",
        status: "failed",
      },
      {
        ip: clientIP,
        userAgent: userAgent,
      }
    ).catch((logError) =>
      devLog.error("Failed to log farm deletion error:", logError)
    );

    return NextResponse.json(
      { error: "Failed to delete farm" },
      { status: 500, headers: { "Cache-Control": "no-store" } }
    );
  }
}
