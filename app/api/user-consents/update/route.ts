import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/server/auth-utils";
import { prisma } from "@/lib/prisma";
import {
  getErrorResultFromRawError,
  makeErrorResponseFromResult,
  throwBusinessError,
} from "@/lib/utils/error/errorUtil";

// POST: 사용자 동의 업데이트
export async function POST(request: NextRequest) {
  let user = null;

  try {
    // 인증 확인
    const authResult = await requireAuth(false); // 로그인된 사용자만 접근
    if (!authResult.success || !authResult.user) {
      return authResult.response!;
    }

    user = authResult.user;

    const body = await request.json();
    const { privacyConsent, termsConsent, marketingConsent, ageConsent } = body;

    // 필수 필드 검증
    if (
      typeof privacyConsent !== "boolean" ||
      typeof termsConsent !== "boolean" ||
      typeof ageConsent !== "boolean"
    ) {
      throwBusinessError("MISSING_REQUIRED_FIELDS", {
        missingFields: ["privacyConsent", "termsConsent", "ageConsent"],
      });
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

    // 동의할 약관들 준비
    const consentRecords: Array<{
      user_id: string;
      term_id: string;
      agreed: boolean;
      agreed_at: Date;
      created_at: Date;
      updated_at: Date;
    }> = [];
    const now = new Date();

    // 연령 동의
    const ageTerm = latestActiveTerms.find(
      (term) => term.type === "age_consent"
    );
    if (ageTerm && ageConsent) {
      consentRecords.push({
        user_id: user.id,
        term_id: ageTerm.id,
        agreed: true,
        agreed_at: now,
        created_at: now,
        updated_at: now,
      });
    }
    // 개인정보 처리방침 동의
    const privacyTerm = latestActiveTerms.find(
      (term) => term.type === "privacy_consent"
    );
    if (privacyTerm && privacyConsent) {
      consentRecords.push({
        user_id: user.id,
        term_id: privacyTerm.id,
        agreed: true,
        agreed_at: now,
        created_at: now,
        updated_at: now,
      });
    }

    // 이용약관 동의
    const termsTerm = latestActiveTerms.find((term) => term.type === "terms");
    if (termsTerm && termsConsent) {
      consentRecords.push({
        user_id: user.id,
        term_id: termsTerm.id,
        agreed: true,
        agreed_at: now,
        created_at: now,
        updated_at: now,
      });
    }

    // 마케팅 정보 수신 동의 (선택사항)
    const marketingTerm = latestActiveTerms.find(
      (term) => term.type === "marketing"
    );
    if (marketingTerm && marketingConsent) {
      consentRecords.push({
        user_id: user.id,
        term_id: marketingTerm.id,
        agreed: true,
        agreed_at: now,
        created_at: now,
        updated_at: now,
      });
    }

    // 기존 동의 기록 삭제 후 새로운 동의 기록 생성
    try {
      await prisma.$transaction([
        // 기존 동의 기록 삭제
        prisma.user_consents.deleteMany({
          where: {
            user_id: user.id,
          },
        }),
        // 새로운 동의 기록 생성
        ...(consentRecords.length > 0
          ? [
              prisma.user_consents.createMany({
                data: consentRecords,
              }),
            ]
          : []),
      ]);
    } catch (transactionError) {
      throwBusinessError(
        "GENERAL_UPDATE_FAILED",
        {
          resourceType: "consent",
        },
        transactionError
      );
    }

    return NextResponse.json({
      success: true,
      message: "약관 동의가 업데이트되었습니다",
      consents: consentRecords.map((record) => ({
        term_id: record.term_id,
        agreed: record.agreed,
        agreed_at: record.agreed_at,
      })),
    });
  } catch (error) {
    const result = getErrorResultFromRawError(error, {
      operation: "update_user_consents",
    });

    return NextResponse.json(makeErrorResponseFromResult(result), {
      status: result.status,
    });
  }
}
