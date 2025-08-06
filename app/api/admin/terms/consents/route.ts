import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/server/auth-utils";
import { prisma } from "@/lib/prisma";
import { devLog } from "@/lib/utils/logging/dev-logger";
import {
  getErrorResultFromRawError,
  makeErrorResponseFromResult,
  throwBusinessError,
} from "@/lib/utils/error/errorUtil";

// GET: 사용자 동의 목록 조회
export async function GET(request: NextRequest) {
  let user: any = null;

  try {
    // 인증 확인
    const authResult = await requireAuth(true); // 관리자만 접근
    if (!authResult.success || !authResult.user) {
      return authResult.response!;
    }

    user = authResult.user;

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("user_id");
    const termType = searchParams.get("term_type");
    const agreed = searchParams.get("agreed");

    // 쿼리 조건 구성
    const where: any = {};
    if (userId) where.user_id = userId;
    if (agreed !== null) where.agreed = agreed === "true";

    let consents;
    try {
      consents = await prisma.user_consents.findMany({
        where,
        include: {
          profiles: {
            select: {
              name: true,
              email: true,
              account_type: true,
            },
          },
          terms_management: {
            select: {
              type: true,
              title: true,
              version: true,
              is_active: true,
            },
          },
        },
        orderBy: [{ created_at: "desc" }],
      });
    } catch (queryError) {
      throwBusinessError(
        "GENERAL_QUERY_FAILED",
        {
          resourceType: "consent",
        },
        queryError
      );
    }

    // term_type 필터링 (Prisma where에서 직접 필터링이 어려운 경우)
    const filteredConsents = termType
      ? consents.filter((consent) => consent.terms_management.type === termType)
      : consents;

    return NextResponse.json({ consents: filteredConsents });
  } catch (error) {
    devLog.error("사용자 동의 목록 조회 오류:", error);

    // 비즈니스 에러 또는 시스템 에러를 표준화된 에러 코드로 매핑
    const result = getErrorResultFromRawError(error, {
      operation: "get_consents",
    });

    return NextResponse.json(makeErrorResponseFromResult(result), {
      status: result.status,
    });
  }
}

// POST: 사용자 동의 철회 (관리자용)
export async function POST(request: NextRequest) {
  let user: any = null;

  try {
    // 인증 확인
    const authResult = await requireAuth(true); // 관리자만 접근
    if (!authResult.success || !authResult.user) {
      return authResult.response!;
    }

    user = authResult.user;

    const body = await request.json();
    const { consentId, reason } = body;

    if (!consentId) {
      throwBusinessError("MISSING_REQUIRED_FIELDS", {
        missingFields: ["consentId"],
      });
    }

    // 동의 기록 조회
    let consent;
    try {
      consent = await prisma.user_consents.findUnique({
        where: { id: consentId },
        include: {
          profiles: {
            select: {
              name: true,
              email: true,
            },
          },
          terms_management: {
            select: {
              type: true,
              title: true,
              version: true,
            },
          },
        },
      });
    } catch (queryError) {
      throwBusinessError(
        "GENERAL_QUERY_FAILED",
        {
          resourceType: "consent",
        },
        queryError
      );
    }

    if (!consent) {
      throwBusinessError("GENERAL_NOT_FOUND", {
        resourceType: "consent",
      });
    }

    // 동의 철회 (agreed를 false로 변경)
    let updatedConsent;
    try {
      updatedConsent = await prisma.user_consents.update({
        where: { id: consentId },
        data: {
          agreed: false,
          agreed_at: null,
          updated_at: new Date(),
        },
        include: {
          profiles: {
            select: {
              name: true,
              email: true,
            },
          },
          terms_management: {
            select: {
              type: true,
              title: true,
              version: true,
            },
          },
        },
      });
    } catch (queryError) {
      throwBusinessError(
        "GENERAL_UPDATE_FAILED",
        {
          resourceType: "consent",
        },
        queryError
      );
    }

    return NextResponse.json({
      consent: updatedConsent,
      message: "동의가 철회되었습니다",
    });
  } catch (error) {
    devLog.error("동의 철회 오류:", error);

    // 비즈니스 에러 또는 시스템 에러를 표준화된 에러 코드로 매핑
    const result = getErrorResultFromRawError(error, {
      operation: "revoke_consent",
    });

    return NextResponse.json(makeErrorResponseFromResult(result), {
      status: result.status,
    });
  }
}
