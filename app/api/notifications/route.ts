import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/server/auth-utils";
import {
  getErrorResultFromRawError,
  makeErrorResponseFromResult,
  throwBusinessError,
} from "@/lib/utils/error/errorUtil";

// [GET] 알림 목록 조회 (최신순, 최대 50개)
export async function GET(request: NextRequest) {
  const authResult = await requireAuth(false);
  if (!authResult.success || !authResult.user) {
    return authResult.response!;
  }
  const user = authResult.user;
  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get("page") || "1");
  const pageSize = parseInt(searchParams.get("pageSize") || "20");
  const skip = (page - 1) * pageSize;
  try {
    let notifications, total;
    try {
      [notifications, total] = await Promise.all([
        prisma.notifications.findMany({
          where: { user_id: user.id },
          orderBy: { created_at: "desc" },
          skip,
          take: pageSize,
        }),
        prisma.notifications.count({ where: { user_id: user.id } }),
      ]);
    } catch (queryError) {
      throwBusinessError(
        "GENERAL_QUERY_FAILED",
        {
          resourceType: "notificationList",
        },
        queryError
      );
    }
    return NextResponse.json({
      notifications,
      total,
      page,
      totalPages: Math.ceil(total / pageSize),
      pageSize,
    });
  } catch (error) {
    // 비즈니스 에러 또는 시스템 에러를 표준화된 에러 코드로 매핑
    const result = getErrorResultFromRawError(error, {
      operation: "get_notifications",
      userId: user.id,
    });

    return NextResponse.json(makeErrorResponseFromResult(result), {
      status: result.status,
    });
  }
}

// [POST] 새 알림 추가
export async function POST(request: NextRequest) {
  const authResult = await requireAuth(false);
  if (!authResult.success || !authResult.user) {
    return authResult.response!;
  }
  const user = authResult.user;
  const { type, title, message, data } = await request.json();
  try {
    let notification;
    try {
      notification = await prisma.notifications.create({
        data: {
          user_id: user.id,
          type,
          title,
          message,
          data,
        },
      });
    } catch (createError) {
      throwBusinessError(
        "GENERAL_CREATE_FAILED",
        {
          resourceType: "notification",
        },
        createError
      );
    }
    return NextResponse.json({ notification, success: true });
  } catch (error) {
    // 비즈니스 에러 또는 시스템 에러를 표준화된 에러 코드로 매핑
    const result = getErrorResultFromRawError(error, {
      operation: "create_notification",
      userId: user.id,
    });

    return NextResponse.json(makeErrorResponseFromResult(result), {
      status: result.status,
    });
  }
}

// [PATCH] 알림 읽음 처리 (여러 개 동시 처리 가능)
export async function PATCH(request: NextRequest) {
  const authResult = await requireAuth(false);
  if (!authResult.success || !authResult.user) {
    return authResult.response!;
  }
  const user = authResult.user;
  const { ids } = await request.json(); // ids: string[]
  if (!Array.isArray(ids) || ids.length === 0) {
    throwBusinessError("MISSING_REQUIRED_FIELDS", {
      missingFields: ["notificationIds"],
      operation: "mark_notifications_read",
    });
  }
  try {
    try {
      await prisma.notifications.updateMany({
        where: { user_id: user.id, id: { in: ids } },
        data: { read: true, updated_at: new Date() },
      });
    } catch (updateError) {
      throwBusinessError(
        "GENERAL_UPDATE_FAILED",
        {
          resourceType: "notification",
        },
        updateError
      );
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    // 비즈니스 에러 또는 시스템 에러를 표준화된 에러 코드로 매핑
    const result = getErrorResultFromRawError(error, {
      operation: "mark_notifications_read",
      userId: user.id,
    });

    return NextResponse.json(makeErrorResponseFromResult(result), {
      status: result.status,
    });
  }
}

// [DELETE] 알림 삭제 (여러 개 동시 처리 가능)
export async function DELETE(request: NextRequest) {
  const authResult = await requireAuth(false);
  if (!authResult.success || !authResult.user) {
    return authResult.response!;
  }
  const user = authResult.user;
  const { ids } = await request.json(); // ids: string[]
  if (!Array.isArray(ids) || ids.length === 0) {
    throwBusinessError("MISSING_REQUIRED_FIELDS", {
      missingFields: ["notificationIds"],
      operation: "delete_notifications",
    });
  }
  try {
    try {
      await prisma.notifications.deleteMany({
        where: { user_id: user.id, id: { in: ids } },
      });
    } catch (deleteError) {
      throwBusinessError(
        "GENERAL_DELETE_FAILED",
        {
          resourceType: "notification",
        },
        deleteError
      );
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    // 비즈니스 에러 또는 시스템 에러를 표준화된 에러 코드로 매핑
    const result = getErrorResultFromRawError(error, {
      operation: "delete_notifications",
      userId: user.id,
    });

    return NextResponse.json(makeErrorResponseFromResult(result), {
      status: result.status,
    });
  }
}
