import { prisma } from "@/lib/prisma";
import { devLog } from "@/lib/utils/logging/dev-logger";

/**
 * 사용자의 약관 동의 상태 조회
 */
export async function getUserConsentStatus(userId: string) {
  try {
    // 활성 약관과 사용자 동의 상태를 하나의 쿼리로 조회
    const activeTermsWithConsents = await prisma.terms_management.findMany({
      where: {
        is_active: true,
        type: { in: ["privacy_consent", "terms_of_service"] },
      },
      select: {
        id: true,
        type: true,
        version: true,
        user_consents: {
          where: { user_id: userId },
          select: { agreed: true },
        },
      },
      orderBy: [{ type: "asc" }, { version: "desc" }],
    });

    // 타입별 최신 약관만 필터링
    const latestTerms = new Map();
    for (const term of activeTermsWithConsents) {
      if (
        !latestTerms.has(term.type) ||
        term.version > latestTerms.get(term.type).version
      ) {
        latestTerms.set(term.type, term);
      }
    }

    const requiredTerms = Array.from(latestTerms.values());
    const hasAllRequiredConsents = requiredTerms.every((term) =>
      term.user_consents.some((consent: { agreed: boolean }) => consent.agreed)
    );

    return {
      hasAllRequiredConsents,
      requiredTermsCount: requiredTerms.length,
      agreedTermsCount: requiredTerms.filter((term) =>
        term.user_consents.some(
          (consent: { agreed: boolean }) => consent.agreed
        )
      ).length,
    };
  } catch (error) {
    devLog.warn("약관 동의 상태 조회 실패:", error);
    return {
      hasAllRequiredConsents: false,
      requiredTermsCount: 0,
      agreedTermsCount: 0,
    };
  }
}
