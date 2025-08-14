import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/server/auth-utils";
import { prisma } from "@/lib/prisma";
import { devLog } from "@/lib/utils/logging/dev-logger";
import {
  getErrorResultFromRawError,
  makeErrorResponseFromResult,
  throwBusinessError,
} from "@/lib/utils/error/errorUtil";

// GET: 사용자 동의 상태 확인
export async function GET(request: NextRequest) {
  let user = null;

  try {
    // 인증 확인
    const authResult = await requireAuth(false); // 로그인된 사용자만 접근
    if (!authResult.success || !authResult.user) {
      return authResult.response!;
    }

    user = authResult.user;

    // 사용자의 동의 상태 조회
    let userConsents;
    try {
      userConsents = await prisma.user_consents.findMany({
        where: {
          user_id: user.id,
          agreed: true,
        },
        include: {
          terms_management: {
            select: {
              type: true,
              title: true,
              version: true,
              is_active: true,
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

    // 활성화된 약관 조회
    let activeTerms;
    try {
      activeTerms = await prisma.terms_management.findMany({
        where: {
          is_active: true,
        },
        select: {
          id: true,
          type: true,
          title: true,
          version: true,
        },
        orderBy: [{ type: "asc" }, { version: "desc" }],
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

    // 각 타입별로 최신 활성 약관만 필터링
    const latestActiveTerms: Array<{
      id: string;
      type: string;
      title: string;
      version: string;
    }> = [];
    const typeMap = new Map<
      string,
      {
        id: string;
        type: string;
        title: string;
        version: string;
      }
    >();

    for (const term of activeTerms) {
      const existingTerm = typeMap.get(term.type);
      if (!existingTerm || term.version > existingTerm.version) {
        typeMap.set(term.type, term);
      }
    }

    latestActiveTerms.push(...Array.from(typeMap.values()));

    // 필수 약관 타입들
    const requiredTypes = ["privacy_consent", "terms"];

    // 누락된 동의 확인
    const missingConsents: Array<{
      type: string;
      title: string;
      version: string;
      termId: string;
    }> = [];
    const hasAllRequiredConsents = requiredTypes.every((type) => {
      const hasConsent = userConsents.some(
        (consent) =>
          consent.terms_management.type === type &&
          consent.terms_management.is_active
      );

      if (!hasConsent) {
        const activeTerm = latestActiveTerms.find((term) => term.type === type);
        if (activeTerm) {
          missingConsents.push({
            type: activeTerm.type,
            title: activeTerm.title,
            version: activeTerm.version,
            termId: activeTerm.id,
          });
        }
      }

      return hasConsent;
    });

    return NextResponse.json({
      success: true,
      hasAllRequiredConsents,
      missingConsents,
      userConsents: userConsents.map((consent) => ({
        type: consent.terms_management.type,
        title: consent.terms_management.title,
        version: consent.terms_management.version,
        agreed_at: consent.agreed_at,
      })),
    });
  } catch (error) {
    const result = getErrorResultFromRawError(error, {
      operation: "check_user_consents",
    });

    return NextResponse.json(makeErrorResponseFromResult(result), {
      status: result.status,
    });
  }
}
