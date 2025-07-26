import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/server/auth-utils";

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
  const [notifications, total] = await Promise.all([
    prisma.notifications.findMany({
      where: { user_id: user.id },
      orderBy: { created_at: "desc" },
      skip,
      take: pageSize,
    }),
    prisma.notifications.count({ where: { user_id: user.id } }),
  ]);
  return NextResponse.json({
    notifications,
    total,
    page,
    totalPages: Math.ceil(total / pageSize),
    pageSize,
  });
}

// [POST] 새 알림 추가
export async function POST(request: NextRequest) {
  const authResult = await requireAuth(false);
  if (!authResult.success || !authResult.user) {
    return authResult.response!;
  }
  const user = authResult.user;
  const { type, title, message, data } = await request.json();
  const notification = await prisma.notifications.create({
    data: {
      user_id: user.id,
      type,
      title,
      message,
      data,
    },
  });
  return NextResponse.json({ notification, success: true });
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
    return NextResponse.json(
      { success: false, error: "NO_IDS", message: "알림 ID가 필요합니다." },
      { status: 400 }
    );
  }
  await prisma.notifications.updateMany({
    where: { user_id: user.id, id: { in: ids } },
    data: { read: true, updated_at: new Date() },
  });
  return NextResponse.json({ success: true });
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
    return NextResponse.json(
      { success: false, error: "NO_IDS", message: "알림 ID가 필요합니다." },
      { status: 400 }
    );
  }
  await prisma.notifications.deleteMany({
    where: { user_id: user.id, id: { in: ids } },
  });
  return NextResponse.json({ success: true });
}
