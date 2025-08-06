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

// GET - 농장 멤버 목록 조회
export async function GET(
  request: NextRequest,
  { params }: { params: { farmId: string } }
) {
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
        throwBusinessError(
          "GENERAL_QUERY_FAILED",
          {
            resourceType: "farm",
          },
          accessError
        );
      }

      if (!access) {
        throwBusinessError("FARM_NOT_FOUND", {
          operation: "find_farm_for_member_access",
          farmId: params.farmId,
        });
      }

      // 농장 소유자이거나 구성원인지 확인
      const isOwner = access.owner_id === user.id;
      const isMember = await isFarmMember(params.farmId, user.id);

      if (!isOwner && !isMember) {
        throwBusinessError("ACCESS_DENIED", {
          operation: "check_farm_member_access",
          farmId: params.farmId,
          userId: user.id,
        });
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
              avatar_seed: true,
            },
          },
        },
        orderBy: { created_at: "desc" },
      });
    } catch (membersError) {
      throwBusinessError(
        "GENERAL_QUERY_FAILED",
        {
          resourceType: "member",
        },
        membersError
      );
    }

    // 농장 멤버 조회 로그 기록
    await createSystemLog(
      "MEMBER_READ",
      LOG_MESSAGES.MEMBER_READ(members?.length || 0, params.farmId),
      "info",
      { id: user.id, email: user.email || "" },
      "member",
      undefined,
      {
        action_type: "farm_event",
        event: "member_read",
        count: members?.length || 0,
        farm_id: params.farmId,
      },
      request
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
    // 농장 멤버 조회 실패 로그 기록
    const errorMessage = error instanceof Error ? error.message : String(error);
    await createSystemLog(
      "MEMBER_READ_FAILED",
      LOG_MESSAGES.MEMBER_READ_FAILED(params.farmId, errorMessage),
      "error",
      undefined,
      "member",
      undefined,
      {
        action_type: "farm_event",
        event: "member_read_failed",
        farm_id: params.farmId,
        error_message: errorMessage,
      },
      request
    );
    const result = getErrorResultFromRawError(error, {
      operation: "member_read",
      farmId: params.farmId,
    });
    return NextResponse.json(makeErrorResponseFromResult(result), {
      status: result.status,
    });
  }
}

// 농장 구성원 여부 확인 헬퍼 함수
async function isFarmMember(farmId: string, userId: string) {
  try {
    const data = await prisma.farm_members.findFirst({
      where: {
        farm_id: farmId,
        user_id: userId,
        is_active: true,
      },
      select: { id: true },
    });
    return !!data;
  } catch (error) {
    throwBusinessError(
      "GENERAL_QUERY_FAILED",
      {
        resourceType: "member",
      },
      error
    );
  }
}

// POST - 농장 멤버 추가
export async function POST(
  request: NextRequest,
  { params }: { params: { farmId: string } }
) {
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
      throwBusinessError(
        "GENERAL_QUERY_FAILED",
        {
          resourceType: "farm",
        },
        farmError
      );
    }

    if (!farm) {
      throwBusinessError("FARM_NOT_FOUND", {
        operation: "find_farm_for_member_add",
        farmId: params.farmId,
      });
    }

    // 권한 확인
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
        throwBusinessError(
          "GENERAL_QUERY_FAILED",
          {
            resourceType: "member",
          },
          memberError
        );
      }

      if (!memberRole || memberRole.role !== "manager") {
        throwBusinessError("INSUFFICIENT_PERMISSIONS", {
          operation: "add_farm_member",
          farmId: params.farmId,
          userId: user.id,
        });
      }
    }

    // 사용자 프로필 조회
    let userToAdd;
    try {
      userToAdd = await prisma.profiles.findFirst({
        where: { email: email.toLowerCase() },
        select: {
          id: true,
          email: true,
          name: true,
          profile_image_url: true,
          avatar_seed: true,
        },
      });
    } catch (profileError) {
      throwBusinessError(
        "GENERAL_QUERY_FAILED",
        {
          resourceType: "user",
        },
        profileError
      );
    }

    if (!userToAdd) {
      throwBusinessError("USER_NOT_FOUND", {
        operation: "add_farm_member",
        email: email,
      });
    }

    // 중복 멤버 확인
    let existingMember;
    try {
      existingMember = await prisma.farm_members.findFirst({
        where: {
          farm_id: params.farmId,
          user_id: userToAdd.id,
        },
        select: { id: true },
      });
    } catch (existingError) {
      throwBusinessError(
        "GENERAL_QUERY_FAILED",
        {
          resourceType: "member",
        },
        existingError
      );
    }

    if (existingMember) {
      throwBusinessError("MEMBER_ALREADY_EXISTS", {
        operation: "add_farm_member",
        farmId: params.farmId,
        userId: userToAdd.id,
      });
    }

    // 새 멤버 추가 + 알림 insert 트랜잭션 처리
    let newMember;
    try {
      newMember = await prisma.$transaction(async (tx: any) => {
        const createdMember = await tx.farm_members.create({
          data: {
            farm_id: params.farmId,
            user_id: userToAdd.id,
            role: role,
            is_active: true,
          },
          select: { id: true, created_at: true },
        });
        const notificationData = {
          type: "farm_member_added",
          title: `농장 멤버 추가`,
          message: `${farm.farm_name} 농장에 ${
            role === "manager" ? "관리자" : "구성원"
          }으로 추가되었습니다.`,
          data: {
            farm_id: params.farmId,
            farm_name: farm.farm_name,
            role,
            invited_by: user.email,
          },
          link: `/admin/farms/${params.farmId}/members`,
        };

        await tx.notifications.createMany({
          data: [
            { ...notificationData, user_id: userToAdd.id },
            { ...notificationData, user_id: user.id },
          ],
        });
        return createdMember;
      });
    } catch (insertError) {
      throwBusinessError(
        "GENERAL_TRANSACTION_FAILED",
        {
          resourceType: "member",
          operationType: "create",
        },
        insertError
      );
    }

    // 농장 멤버 추가 로그 기록
    await createSystemLog(
      "MEMBER_CREATED",
      LOG_MESSAGES.MEMBER_CREATED(userToAdd.email, farm.farm_name, role),
      "info",
      { id: user.id, email: user.email || "" },
      "member",
      newMember.id,
      {
        action_type: "farm_event",
        event: "member_created",
        member_id: newMember.id,
        member_email: userToAdd.email,
        farm_name: farm.farm_name,
        role: role,
      },
      request
    );

    // 응답용 멤버 데이터 구성
    const memberWithProfile = {
      id: newMember.id,
      farm_id: params.farmId,
      user_id: userToAdd.id,
      role: role,
      position: null,
      responsibilities: null,
      is_active: true,
      created_at: newMember.created_at,
      updated_at: newMember.created_at,
      profiles: {
        id: userToAdd.id,
        name: userToAdd.name,
        email: userToAdd.email,
        profile_image_url: userToAdd.profile_image_url,
        avatar_seed: userToAdd.avatar_seed,
      },
    };

    return NextResponse.json(
      {
        success: true,
        member: memberWithProfile,
        message: `${userToAdd.name}이 ${
          role === "manager" ? "관리자" : "조회자"
        }로 추가되었습니다.`,
      },
      {
        status: 201,
        headers: {
          "Cache-Control": "no-store",
        },
      }
    );
  } catch (error) {
    // 농장 멤버 추가 실패 로그 기록
    const errorMessage = error instanceof Error ? error.message : String(error);
    await createSystemLog(
      "MEMBER_CREATE_FAILED",
      LOG_MESSAGES.MEMBER_CREATE_FAILED(params.farmId, errorMessage),
      "error",
      user?.id ? { id: user.id, email: user.email || "" } : undefined,
      "member",
      undefined,
      {
        action_type: "farm_event",
        event: "member_create_failed",
        farm_id: params.farmId,
        error_message: errorMessage,
      },
      request
    );
    const result = getErrorResultFromRawError(error, {
      operation: "add_farm_member",
      farmId: params.farmId,
      userId: user?.id,
    });
    return NextResponse.json(makeErrorResponseFromResult(result), {
      status: result.status,
    });
  }
}
