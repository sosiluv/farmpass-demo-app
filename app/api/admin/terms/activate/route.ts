import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/server/auth-utils";
import { prisma } from "@/lib/prisma";
import { devLog } from "@/lib/utils/logging/dev-logger";
import {
  getErrorResultFromRawError,
  makeErrorResponseFromResult,
  throwBusinessError,
} from "@/lib/utils/error/errorUtil";

// POST: 약관 활성화/비활성화
export async function POST(request: NextRequest) {
  let user = null;

  try {
    // 인증 확인
    const authResult = await requireAuth(true); // 관리자만 접근
    if (!authResult.success || !authResult.user) {
      return authResult.response!;
    }

    user = authResult.user;

    const body = await request.json();
    const { termId, activate } = body;

    // 필수 필드 검증
    if (!termId) {
      throwBusinessError("MISSING_REQUIRED_FIELDS", {
        missingFields: ["termId"],
      });
    }

    if (typeof activate !== "boolean") {
      throwBusinessError("INVALID_ACTIVATE_VALUE", {
        invalidValue: activate,
        expectedType: "boolean",
      });
    }

    // 약관 조회
    let term;
    try {
      term = await prisma.terms_management.findUnique({
        where: { id: termId },
      });
    } catch (queryError) {
      throwBusinessError(
        "GENERAL_QUERY_FAILED",
        {
          resourceType: "terms",
        },
        queryError
      );
    }

    if (!term) {
      throwBusinessError("GENERAL_NOT_FOUND", {
        resourceType: "terms",
      });
    }

    // 활성화하려는 경우, 같은 타입의 다른 약관들을 비활성화
    if (activate) {
      try {
        await prisma.terms_management.updateMany({
          where: {
            type: term.type,
            is_active: true,
          },
          data: {
            is_active: false,
            updated_at: new Date(),
          },
        });
      } catch (queryError) {
        throwBusinessError(
          "GENERAL_UPDATE_FAILED",
          {
            resourceType: "terms",
          },
          queryError
        );
      }

      // 선택된 약관을 활성화
      let updatedTerm;
      try {
        updatedTerm = await prisma.terms_management.update({
          where: { id: termId },
          data: {
            is_active: true,
            is_draft: false,
            published_at: new Date(),
            updated_at: new Date(),
          },
          include: {
            profiles: {
              select: {
                name: true,
                email: true,
              },
            },
          },
        });
      } catch (queryError) {
        throwBusinessError(
          "GENERAL_UPDATE_FAILED",
          {
            resourceType: "terms",
          },
          queryError
        );
      }

      return NextResponse.json({
        success: true,
        message: "약관이 활성화되었습니다",
        term: updatedTerm,
      });
    } else {
      // 비활성화
      let updatedTerm;
      try {
        updatedTerm = await prisma.terms_management.update({
          where: { id: termId },
          data: {
            is_active: false,
            updated_at: new Date(),
          },
          include: {
            profiles: {
              select: {
                name: true,
                email: true,
              },
            },
          },
        });
      } catch (queryError) {
        throwBusinessError(
          "GENERAL_UPDATE_FAILED",
          {
            resourceType: "terms",
          },
          queryError
        );
      }

      return NextResponse.json({
        success: true,
        message: "약관이 비활성화되었습니다",
        term: updatedTerm,
      });
    }
  } catch (error) {
    devLog.error("약관 활성화/비활성화 오류:", error);

    // 비즈니스 에러 또는 시스템 에러를 표준화된 에러 코드로 매핑
    const result = getErrorResultFromRawError(error, {
      operation: "activate_term",
    });

    return NextResponse.json(makeErrorResponseFromResult(result), {
      status: result.status,
    });
  }
}
