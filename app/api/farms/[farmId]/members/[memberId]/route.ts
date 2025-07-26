import { NextRequest, NextResponse } from "next/server";
import { createSystemLog } from "@/lib/utils/logging/system-log";
import { devLog } from "@/lib/utils/logging/dev-logger";
import { getClientIP, getUserAgent } from "@/lib/server/ip-helpers";
import { requireAuth } from "@/lib/server/auth-utils";
import { prisma } from "@/lib/prisma";

// PUT - 농장 멤버 역할 변경
export async function PUT(
  request: NextRequest,
  { params }: { params: { farmId: string; memberId: string } }
) {
  // 요청 컨텍스트 정보 추출
  const clientIP = getClientIP(request);
  const userAgent = getUserAgent(request);

  let user: any = null;

  try {
    // 인증 확인
    const authResult = await requireAuth(false);
    if (!authResult.success || !authResult.user) {
      return authResult.response!;
    }

    const user = authResult.user;
    const { role } = await request.json();

    // 농장 소유권 또는 관리자 권한 확인
    let farm;
    try {
      farm = await prisma.farms.findUnique({
        where: { id: params.farmId },
        select: { owner_id: true, farm_name: true },
      });
    } catch (farmError) {
      devLog.error("Error fetching farm:", farmError);
      return NextResponse.json(
        {
          success: false,
          error: "FARM_FETCH_ERROR",
          message: "농장 정보 조회 중 오류가 발생했습니다.",
        },
        { status: 500 }
      );
    }

    if (!farm) {
      return NextResponse.json(
        {
          success: false,
          error: "FARM_NOT_FOUND",
          message: "농장을 찾을 수 없습니다.",
        },
        { status: 404 }
      );
    }

    // 시스템 관리자가 아닌 경우에만 농장별 권한 확인
    if (!authResult.isAdmin && farm.owner_id !== user.id) {
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
          {
            success: false,
            error: "PERMISSION_CHECK_ERROR",
            message: "권한 확인 중 오류가 발생했습니다.",
          },
          { status: 500 }
        );
      }

      if (!memberRole || memberRole.role !== "manager") {
        return NextResponse.json(
          {
            success: false,
            error: "INSUFFICIENT_PERMISSIONS",
            message: "멤버 역할 변경 권한이 없습니다.",
          },
          { status: 403 }
        );
      }
    }

    // 변경할 멤버 정보 조회
    let memberToUpdate;
    try {
      memberToUpdate = await prisma.farm_members.findUnique({
        where: { id: params.memberId },
        include: {
          profiles: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      });
    } catch (memberError) {
      devLog.error("Error fetching member:", memberError);
      return NextResponse.json(
        {
          success: false,
          error: "MEMBER_FETCH_ERROR",
          message: "멤버 정보 조회 중 오류가 발생했습니다.",
        },
        { status: 500 }
      );
    }

    if (!memberToUpdate || memberToUpdate.farm_id !== params.farmId) {
      return NextResponse.json(
        {
          success: false,
          error: "MEMBER_NOT_FOUND",
          message: "멤버를 찾을 수 없습니다.",
        },
        { status: 404 }
      );
    }

    // 농장 소유자의 역할은 변경할 수 없음
    if (memberToUpdate.user_id === farm.owner_id) {
      return NextResponse.json(
        {
          success: false,
          error: "CANNOT_CHANGE_OWNER_ROLE",
          message: "농장 소유자의 역할은 변경할 수 없습니다.",
        },
        { status: 400 }
      );
    }

    const oldRole = memberToUpdate.role;

    // 멤버 역할 업데이트 + 알림 트랜잭션 처리
    try {
      await prisma.$transaction(async (tx: any) => {
        await tx.farm_members.update({
          where: { id: params.memberId },
          data: { role },
        });
        const members = await tx.farm_members.findMany({
          where: { farm_id: params.farmId },
          select: { user_id: true },
        });
        await tx.notifications.createMany({
          data: members.map((m: any) => ({
            user_id: m.user_id,
            type: "member_updated",
            title: `멤버 역할 변경`,
            message: `${farm.farm_name} 농장 멤버 ${
              (memberToUpdate.profiles as any)?.name || ""
            }의 역할이 ${oldRole === "manager" ? "관리자" : "조회자"}에서 ${
              role === "manager" ? "관리자" : "조회자"
            }로 변경되었습니다.`,
            data: {
              farm_id: params.farmId,
              farm_name: farm.farm_name,
              member_id: params.memberId,
              old_role: oldRole,
              new_role: role,
            },
            link: `/admin/farms/${params.farmId}/members`,
          })),
        });
      });
    } catch (updateError) {
      devLog.error("Error updating member role:", updateError);
      throw updateError;
    }

    // 농장 멤버 역할 변경 로그 기록
    await createSystemLog(
      "MEMBER_UPDATE",
      `농장 멤버 역할 변경: ${(memberToUpdate.profiles as any)?.name} (${
        (memberToUpdate.profiles as any)?.email
      }) - ${oldRole} → ${role} (농장: ${farm.farm_name})`,
      "info",
      user.id,
      "member",
      params.memberId,
      {
        member_id: params.memberId,
        farm_id: params.farmId,
        farm_name: farm.farm_name,
        member_email: (memberToUpdate.profiles as any)?.email,
        old_role: oldRole,
        new_role: role,
        target_user_id: memberToUpdate.user_id,
        action_type: "member_management",
      },
      user.email,
      clientIP,
      userAgent
    );

    return NextResponse.json(
      {
        message: `${(memberToUpdate.profiles as any)?.name}의 역할이 ${
          oldRole === "manager" ? "관리자" : "조회자"
        }에서 ${role === "manager" ? "관리자" : "조회자"}로 변경되었습니다.`,
        member: {
          ...memberToUpdate,
          role: role,
        },
      },
      {
        headers: {
          "Cache-Control": "no-store",
        },
      }
    );
  } catch (error) {
    devLog.error("Error updating member role:", error);

    // 농장 멤버 역할 변경 실패 로그 기록
    await createSystemLog(
      "MEMBER_UPDATE_FAILED",
      `농장 멤버 역할 변경 실패: ${
        error instanceof Error ? error.message : "Unknown error"
      } (멤버 ID: ${params.memberId}, 농장 ID: ${params.farmId})`,
      "error",
      user?.id,
      "member",
      params.memberId,
      {
        error_message: error instanceof Error ? error.message : "Unknown error",
        farm_id: params.farmId,
        member_id: params.memberId,
        action_type: "member_management",
      },
      user?.email,
      clientIP,
      userAgent
    ).catch((logError: any) =>
      devLog.error("Failed to log member role update error:", logError)
    );

    return NextResponse.json(
      {
        success: false,
        error: "MEMBER_UPDATE_ERROR",
        message: "멤버 정보 수정 중 오류가 발생했습니다.",
      },
      { status: 500 }
    );
  }
}

// DELETE - 농장 멤버 제거
export async function DELETE(
  request: NextRequest,
  { params }: { params: { farmId: string; memberId: string } }
) {
  // 요청 컨텍스트 정보 추출
  const clientIP = getClientIP(request);
  const userAgent = getUserAgent(request);

  let user: any = null;

  try {
    // 인증 확인
    const authResult = await requireAuth(false);
    if (!authResult.success || !authResult.user) {
      return authResult.response!;
    }

    const user = authResult.user;

    // 농장 소유권 또는 관리자 권한 확인
    let farm;
    try {
      farm = await prisma.farms.findUnique({
        where: { id: params.farmId },
        select: { owner_id: true, farm_name: true },
      });
    } catch (farmError) {
      devLog.error("Error fetching farm:", farmError);
      return NextResponse.json(
        {
          success: false,
          error: "FARM_FETCH_ERROR",
          message: "농장 정보 조회 중 오류가 발생했습니다.",
        },
        { status: 500 }
      );
    }

    if (!farm) {
      return NextResponse.json(
        {
          success: false,
          error: "FARM_NOT_FOUND",
          message: "농장을 찾을 수 없습니다.",
        },
        { status: 404 }
      );
    }

    // 시스템 관리자가 아닌 경우에만 농장별 권한 확인
    if (!authResult.isAdmin && farm.owner_id !== user.id) {
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
          {
            success: false,
            error: "PERMISSION_CHECK_ERROR",
            message: "권한 확인 중 오류가 발생했습니다.",
          },
          { status: 500 }
        );
      }

      if (!memberRole || memberRole.role !== "manager") {
        return NextResponse.json(
          {
            success: false,
            error: "INSUFFICIENT_PERMISSIONS",
            message: "멤버 역할 변경 권한이 없습니다.",
          },
          { status: 403 }
        );
      }
    }

    // 삭제할 멤버 정보 조회
    let memberToRemove;
    try {
      memberToRemove = await prisma.farm_members.findUnique({
        where: { id: params.memberId },
        include: {
          profiles: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      });
    } catch (memberError) {
      devLog.error("Error fetching member:", memberError);
      return NextResponse.json(
        {
          success: false,
          error: "MEMBER_FETCH_ERROR",
          message: "멤버 정보 조회 중 오류가 발생했습니다.",
        },
        { status: 500 }
      );
    }

    if (!memberToRemove || memberToRemove.farm_id !== params.farmId) {
      return NextResponse.json(
        {
          success: false,
          error: "MEMBER_NOT_FOUND",
          message: "멤버를 찾을 수 없습니다.",
        },
        { status: 404 }
      );
    }

    // 농장 소유자는 제거할 수 없음
    if (memberToRemove.user_id === farm.owner_id) {
      return NextResponse.json(
        {
          success: false,
          error: "CANNOT_REMOVE_OWNER",
          message: "농장 소유자는 제거할 수 없습니다.",
        },
        { status: 400 }
      );
    }

    // 멤버 삭제 + 알림 트랜잭션 처리
    try {
      await prisma.$transaction(async (tx: any) => {
        await tx.farm_members.delete({
          where: { id: params.memberId },
        });
        const members = await tx.farm_members.findMany({
          where: { farm_id: params.farmId },
          select: { user_id: true },
        });
        await tx.notifications.createMany({
          data: members.map((m: any) => ({
            user_id: m.user_id,
            type: "member_deleted",
            title: `멤버 정보 삭제`,
            message: `${farm.farm_name} 농장 멤버 ${
              (memberToRemove.profiles as any)?.name || ""
            }이(가) 제거되었습니다.`,
            data: {
              farm_id: params.farmId,
              farm_name: farm.farm_name,
              member_id: params.memberId,
              member_role: memberToRemove.role,
            },
            link: `/admin/farms/${params.farmId}/members`,
          })),
        });
      });
    } catch (deleteError) {
      devLog.error("Error deleting member or notification:", deleteError);
      throw deleteError;
    }
    // 농장 멤버 제거 로그 기록
    await createSystemLog(
      "MEMBER_DELETE",
      `농장 멤버 제거: ${(memberToRemove.profiles as any)?.name} (${
        (memberToRemove.profiles as any)?.email
      }) - ${memberToRemove.role} 역할 (농장: ${farm.farm_name})`,
      "info",
      user.id,
      "member",
      params.memberId,
      {
        member_id: params.memberId,
        farm_id: params.farmId,
        farm_name: farm.farm_name,
        member_email: (memberToRemove.profiles as any)?.email,
        member_role: memberToRemove.role,
        target_user_id: memberToRemove.user_id,
        action_type: "member_management",
      },
      user.email,
      clientIP,
      userAgent
    );

    return NextResponse.json(
      {
        message: `${(memberToRemove.profiles as any)?.name || "구성원"}이(가) ${
          memberToRemove.role === "manager" ? "관리자" : "조회자"
        } 역할에서 제거되었습니다.`,
        removedMember: memberToRemove,
      },
      {
        headers: {
          "Cache-Control": "no-store",
        },
      }
    );
  } catch (error) {
    devLog.error("Error removing member:", error);

    // 농장 멤버 제거 실패 로그 기록
    await createSystemLog(
      "MEMBER_DELETE_FAILED",
      `농장 멤버 제거 실패: ${
        error instanceof Error ? error.message : "Unknown error"
      } (멤버 ID: ${params.memberId}, 농장 ID: ${params.farmId})`,
      "error",
      user?.id,
      "member",
      params.memberId,
      {
        error_message: error instanceof Error ? error.message : "Unknown error",
        farm_id: params.farmId,
        member_id: params.memberId,
        action_type: "member_management",
      },
      user?.email,
      clientIP,
      userAgent
    ).catch((logError: any) =>
      devLog.error("Failed to log member removal error:", logError)
    );

    return NextResponse.json(
      {
        success: false,
        error: "MEMBER_DELETE_ERROR",
        message: "멤버 삭제 중 오류가 발생했습니다.",
      },
      { status: 500 }
    );
  }
}
