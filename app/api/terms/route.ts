import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { devLog } from "@/lib/utils/logging/dev-logger";
import {
  getErrorResultFromRawError,
  makeErrorResponseFromResult,
  throwBusinessError,
} from "@/lib/utils/error/errorUtil";

// GET: 활성화된 약관 조회 (공개 API)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type");
    const includeInactive = searchParams.get("include_inactive") === "true";

    // 쿼리 조건 구성
    const where: any = {};
    if (type) where.type = type;
    if (!includeInactive) where.is_active = true;

    let terms;
    try {
      terms = await prisma.terms_management.findMany({
        where,
        select: {
          id: true,
          type: true,
          title: true,
          content: true,
          version: true,
          is_active: true,
          published_at: true,
          created_at: true,
          updated_at: true,
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

    // 활성화된 약관만 반환하는 경우, 각 타입별로 최신 버전만 반환
    if (!includeInactive) {
      const activeTerms = [];
      const typeMap = new Map();

      for (const term of terms) {
        if (!term.type) continue; // type이 없는 경우 스킵

        if (
          !typeMap.has(term.type) ||
          new Date(term.created_at) >
            new Date(typeMap.get(term.type).created_at)
        ) {
          typeMap.set(term.type, term);
        }
      }

      activeTerms.push(...Array.from(typeMap.values()));
      return NextResponse.json({ terms: activeTerms });
    }

    return NextResponse.json({ terms });
  } catch (error) {
    devLog.error("약관 조회 오류:", error);

    // 비즈니스 에러 또는 시스템 에러를 표준화된 에러 코드로 매핑
    const result = getErrorResultFromRawError(error, {
      operation: "get_terms",
    });

    return NextResponse.json(makeErrorResponseFromResult(result), {
      status: result.status,
    });
  }
}
