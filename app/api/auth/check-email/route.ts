import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { devLog } from "@/lib/utils/logging/dev-logger";

export async function GET(request: NextRequest) {
  const email = request.nextUrl.searchParams.get("email");

  if (!email) {
    return NextResponse.json(
      { error: "이메일이 필요합니다." },
      { status: 400 }
    );
  }

  try {
    const existingUser = await prisma.profiles.findFirst({
      where: { email: email },
      select: { id: true },
    });

    return NextResponse.json({
      isDuplicate: !!existingUser,
      message: existingUser ? "이미 사용 중인 이메일입니다." : "",
    });
  } catch (error) {
    devLog.error("Email check error:", error);
    return NextResponse.json(
      { error: "이메일 확인 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
