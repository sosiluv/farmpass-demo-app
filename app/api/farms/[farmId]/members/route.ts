import { NextRequest, NextResponse } from "next/server";
import { createSystemLog } from "@/lib/utils/logging/system-log";
import { devLog } from "@/lib/utils/logging/dev-logger";
import { requireAuth } from "@/lib/server/auth-utils";
import { getClientIP, getUserAgent } from "@/lib/server/ip-helpers";
import { prisma } from "@/lib/prisma";

// GET - 농장 멤버 목록 조회
export async function GET(
  request: NextRequest,
  { params }: { params: { farmId: string } }
) {
  const clientIP = getClientIP(request);
  const userAgent = getUserAgent(request);

  try {
    // 인증된 사용자 확인
    // 인증 확인
    const authResult = await requireAuth(false);
    if (!authResult.success || !authResult.user) {
      return authResult.response!;
    }

    const user = authResult.user;
    const isAdmin = authResult.isAdmin || false;

    // 시스템 관리자가 아닌 경우 농장별 권한 체크
    if (!isAdmin) {
      let access;
      try {
        access = await prisma.farms.findUnique({
          where: { id: params.farmId },
          select: { owner_id: true },
        });
      } catch (accessError) {
        devLog.error("Error checking farm access:", accessError);
        return NextResponse.json(
          { error: "FARM_ACCESS_CHECK_ERROR" },
          { status: 500 }
        );
      }

      if (!access) {
        return NextResponse.json({ error: "FARM_NOT_FOUND" }, { status: 404 });
      }

      // 농장 소유자이거나 구성원인지 확인
      const isOwner = access.owner_id === user.id;
      const isMember = await isFarmMember(params.farmId, user.id);

      if (!isOwner && !isMember) {
        return NextResponse.json({ error: "ACCESS_DENIED" }, { status: 403 });
      }
    }

    // 멤버 목록 조회
    let members;
    try {
      members = await prisma.farm_members.findMany({
        where: { farm_id: params.farmId },
        include: {
          profiles: {
            select: {
              id: true,
              name: true,
              email: true,
              profile_image_url: true,
            },
          },
        },
        orderBy: { created_at: "desc" },
      });
    } catch (membersError) {
      devLog.error("Error fetching farm members:", membersError);
      throw membersError;
    }

    // 농장 멤버 조회 로그 기록
    await createSystemLog(
      "MEMBER_READ",
      `농장 멤버 조회: ${members?.length || 0}명 (농장 ID: ${params.farmId})`,
      "info",
      user.id,
      "member",
      undefined,
      {
        farm_id: params.farmId,
        member_count: members?.length || 0,
        action_type: "member_management",
      },
      user.email,
      clientIP,
      userAgent
    );

    return NextResponse.json(
      { members },
      {
        headers: {
          "Cache-Control": "no-store",
        },
      }
    );
  } catch (error) {
    devLog.error("Error fetching farm members:", error);

    // 농장 멤버 조회 실패 로그 기록
    await createSystemLog(
      "MEMBER_READ_FAILED",
      `농장 멤버 조회 실패: ${
        error instanceof Error ? error.message : "Unknown error"
      } (농장 ID: ${params.farmId})`,
      "error",
      undefined,
      "member",
      undefined,
      {
        error_message: error instanceof Error ? error.message : "Unknown error",
        farm_id: params.farmId,
        action_type: "member_management",
        status: "failed",
      },
      undefined,
      clientIP,
      userAgent
    ).catch((logError: any) =>
      devLog.error("Failed to log member fetch error:", logError)
    );

    return NextResponse.json(
      { error: "MEMBER_FETCH_ERROR" },
      { status: 500, headers: { "Cache-Control": "no-store" } }
    );
  }
}

// 농장 구성원 여부 확인 헬퍼 함수
async function isFarmMember(farmId: string, userId: string) {
  const data = await prisma.farm_members.findFirst({
    where: {
      farm_id: farmId,
      user_id: userId,
      is_active: true,
    },
    select: { id: true },
  });
  return !!data;
}

// POST - 농장 멤버 추가
export async function POST(
  request: NextRequest,
  { params }: { params: { farmId: string } }
) {
  const clientIP = getClientIP(request);
  const userAgent = getUserAgent(request);
  let user: any = null;

  try {
    // 인증된 사용자 확인
    // 인증 확인
    const authResult = await requireAuth(false);
    if (!authResult.success || !authResult.user) {
      return authResult.response!;
    }

    user = authResult.user;
    const isAdmin = authResult.isAdmin || false;
    const { email, role } = await request.json();

    // 농장 소유권, 농장 관리자 권한, 또는 시스템 관리자 권한 확인
    let farm;
    try {
      farm = await prisma.farms.findUnique({
        where: { id: params.farmId },
        select: { owner_id: true, farm_name: true },
      });
    } catch (farmError) {
      devLog.error("Error fetching farm:", farmError);
      return NextResponse.json({ error: "FARM_FETCH_ERROR" }, { status: 500 });
    }

    if (!farm) {
      return NextResponse.json({ error: "FARM_NOT_FOUND" }, { status: 404 });
    }

    // 권한 확인: 시스템 관리자, 농장 소유자, 또는 농장 관리자
    if (!isAdmin && farm.owner_id !== user.id) {
      let memberRole;
      try {
        memberRole = await prisma.farm_members.findFirst({
          where: {
            farm_id: params.farmId,
            user_id: user.id,
          },
          select: { role: true },
        });
      } catch (memberError) {
        devLog.error("Error checking member role:", memberError);
        return NextResponse.json(
          { error: "PERMISSION_CHECK_ERROR" },
          { status: 500 }
        );
      }

      if (!memberRole || memberRole.role !== "manager") {
        return NextResponse.json(
          {
            error: "INSUFFICIENT_PERMISSIONS",
          },
          { status: 403 }
        );
      }
    }

    // 사용자 프로필 조회
    let profileData;
    try {
      profileData = await prisma.profiles.findFirst({
        where: { email: email.toLowerCase() },
        select: {
          id: true,
          email: true,
          name: true,
          profile_image_url: true,
        },
      });
    } catch (profileError) {
      devLog.error("Error fetching profile:", profileError);
      return NextResponse.json(
        { error: "PROFILE_FETCH_ERROR" },
        { status: 500 }
      );
    }

    if (!profileData) {
      return NextResponse.json({ error: "USER_NOT_FOUND" }, { status: 404 });
    }

    // 중복 멤버 확인
    let existingMember;
    try {
      existingMember = await prisma.farm_members.findFirst({
        where: {
          farm_id: params.farmId,
          user_id: profileData.id,
        },
        select: { id: true },
      });
    } catch (existingError) {
      devLog.error("Error checking existing member:", existingError);
      return NextResponse.json(
        { error: "MEMBER_CHECK_ERROR" },
        { status: 500 }
      );
    }

    if (existingMember) {
      return NextResponse.json(
        { error: "MEMBER_ALREADY_EXISTS" },
        { status: 409 }
      );
    }

    // 새 멤버 추가
    let newMember;
    try {
      newMember = await prisma.farm_members.create({
        data: {
          farm_id: params.farmId,
          user_id: profileData.id,
          role: role,
          is_active: true,
        },
        select: { id: true, created_at: true },
      });
    } catch (insertError) {
      devLog.error("Error creating farm member:", insertError);
      throw insertError;
    }

    // 농장 멤버 추가 로그 기록
    await createSystemLog(
      "MEMBER_CREATE",
      `농장 멤버 추가: ${profileData.name} (${profileData.email}) - ${role} 역할 (농장: ${farm.farm_name})`,
      "info",
      user.id,
      "member",
      newMember.id,
      {
        member_id: newMember.id,
        farm_id: params.farmId,
        farm_name: farm.farm_name,
        member_email: profileData.email,
        member_name: profileData.name,
        member_role: role,
        target_user_id: profileData.id,
        action_type: "member_management",
      },
      user.email,
      clientIP,
      userAgent
    );

    // 응답용 멤버 데이터 구성
    const memberWithProfile = {
      id: newMember.id,
      farm_id: params.farmId,
      user_id: profileData.id,
      role: role,
      position: null,
      responsibilities: null,
      is_active: true,
      created_at: newMember.created_at,
      updated_at: newMember.created_at,
      profiles: {
        id: profileData.id,
        name: profileData.name,
        email: profileData.email,
        profile_image_url: profileData.profile_image_url,
      },
    };

    return NextResponse.json(
      { member: memberWithProfile },
      {
        status: 201,
        headers: {
          "Cache-Control": "no-store",
        },
      }
    );
  } catch (error) {
    devLog.error("Error adding farm member:", error);

    // 농장 멤버 추가 실패 로그 기록
    await createSystemLog(
      "MEMBER_CREATE_FAILED",
      `농장 멤버 추가 실패: ${
        error instanceof Error ? error.message : "Unknown error"
      } (농장 ID: ${params.farmId})`,
      "error",
      user?.id,
      "member",
      undefined,
      {
        error_message: error instanceof Error ? error.message : "Unknown error",
        farm_id: params.farmId,
        action_type: "member_management",
        status: "failed",
      },
      user?.email,
      clientIP,
      userAgent
    ).catch((logError: any) =>
      devLog.error("Failed to log member addition error:", logError)
    );

    return NextResponse.json(
      { error: "MEMBER_CREATE_ERROR" },
      { status: 500, headers: { "Cache-Control": "no-store" } }
    );
  }
}
