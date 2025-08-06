import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/server/auth-utils";
import { prisma } from "@/lib/prisma";
import { devLog } from "@/lib/utils/logging/dev-logger";
import {
  getErrorResultFromRawError,
  makeErrorResponseFromResult,
  throwBusinessError,
} from "@/lib/utils/error/errorUtil";

// GET: 약관 목록 조회
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
    const type = searchParams.get("type");
    const isActive = searchParams.get("is_active");

    // 쿼리 조건 구성
    const where: any = {};
    if (type) where.type = type;
    if (isActive !== null) where.is_active = isActive === "true";

    let terms;
    try {
      terms = await prisma.terms_management.findMany({
        where,
        orderBy: [{ type: "asc" }, { version: "desc" }, { created_at: "desc" }],
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
        "GENERAL_QUERY_FAILED",
        {
          resourceType: "terms",
        },
        queryError
      );
    }

    return NextResponse.json({ terms });
  } catch (error) {
    devLog.error("약관 목록 조회 오류:", error);

    // 비즈니스 에러 또는 시스템 에러를 표준화된 에러 코드로 매핑
    const result = getErrorResultFromRawError(error, {
      operation: "get_terms",
    });

    return NextResponse.json(makeErrorResponseFromResult(result), {
      status: result.status,
    });
  }
}

// POST: 새 약관 생성
export async function POST(request: NextRequest) {
  let user: any = null;
  let termData: any = {};

  try {
    // 인증 확인
    const authResult = await requireAuth(true); // 관리자만 접근
    if (!authResult.success || !authResult.user) {
      return authResult.response!;
    }

    user = authResult.user;

    const body = await request.json();
    const { type, title, content, version, is_active, is_draft } = body;

    // 필수 필드 검증
    if (!type || !title || !content || !version) {
      throwBusinessError("MISSING_REQUIRED_FIELDS", {
        missingFields: ["type", "title", "content", "version"],
      });
    }

    // 타입 검증
    const validTypes = ["privacy", "privacy_consent", "terms", "marketing"];
    if (!validTypes.includes(type)) {
      throwBusinessError("INVALID_TERM_TYPE", {
        invalidType: type,
        validTypes,
      });
    }

    termData = {
      type,
      title,
      version,
    };

    // 동일한 타입과 버전이 이미 존재하는지 확인
    let existingTerm;
    try {
      existingTerm = await prisma.terms_management.findFirst({
        where: {
          type,
          version,
        },
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

    if (existingTerm) {
      throwBusinessError("TERM_ALREADY_EXISTS", {
        operation: "create_term",
        type,
        version,
      });
    }

    // 새 약관 생성
    let newTerm;
    try {
      newTerm = await prisma.terms_management.create({
        data: {
          type,
          title,
          content,
          version,
          created_by: user.id,
          is_active: is_active ?? false,
          is_draft: is_draft ?? true,
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
        "GENERAL_CREATE_FAILED",
        {
          resourceType: "terms",
        },
        queryError
      );
    }

    return NextResponse.json(
      {
        term: newTerm,
        success: true,
        message: "약관이 성공적으로 생성되었습니다",
      },
      { status: 201 }
    );
  } catch (error) {
    devLog.error("약관 생성 오류:", error);

    // 비즈니스 에러 또는 시스템 에러를 표준화된 에러 코드로 매핑
    const result = getErrorResultFromRawError(error, {
      operation: "create_term",
    });

    return NextResponse.json(makeErrorResponseFromResult(result), {
      status: result.status,
    });
  }
}

// PUT: 약관 수정
export async function PUT(request: NextRequest) {
  let user: any = null;

  try {
    // 인증 확인
    const authResult = await requireAuth(true); // 관리자만 접근
    if (!authResult.success || !authResult.user) {
      return authResult.response!;
    }

    user = authResult.user;

    const body = await request.json();
    const { id, ...updateData } = body;

    if (!id) {
      throwBusinessError("MISSING_REQUIRED_FIELDS", {
        missingFields: ["termId"],
      });
    }

    // 기존 약관 조회
    let existingTerm;
    try {
      existingTerm = await prisma.terms_management.findUnique({
        where: { id },
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

    if (!existingTerm) {
      throwBusinessError("GENERAL_NOT_FOUND", {
        resourceType: "terms",
      });
    }

    // 타입 검증 (타입이 변경되는 경우)
    if (updateData.type) {
      const validTypes = ["privacy", "privacy_consent", "terms", "marketing"];
      if (!validTypes.includes(updateData.type)) {
        throwBusinessError("INVALID_TERM_TYPE", {
          invalidType: updateData.type,
          validTypes,
        });
      }
    }

    // 버전이 변경되는 경우 중복 확인
    if (updateData.version && updateData.version !== existingTerm.version) {
      let duplicateTerm;
      try {
        duplicateTerm = await prisma.terms_management.findFirst({
          where: {
            type: existingTerm.type,
            version: updateData.version,
          },
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

      if (duplicateTerm) {
        throwBusinessError("TERM_ALREADY_EXISTS", {
          operation: "update_term",
          type: existingTerm.type,
          version: updateData.version,
        });
      }
    }

    // 약관 수정
    let updatedTerm;
    try {
      updatedTerm = await prisma.terms_management.update({
        where: { id },
        data: {
          ...updateData,
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
      message: "약관이 성공적으로 수정되었습니다",
      term: updatedTerm,
    });
  } catch (error) {
    devLog.error("약관 수정 오류:", error);

    // 비즈니스 에러 또는 시스템 에러를 표준화된 에러 코드로 매핑
    const result = getErrorResultFromRawError(error, {
      operation: "update_term",
    });

    return NextResponse.json(makeErrorResponseFromResult(result), {
      status: result.status,
    });
  }
}

// DELETE: 약관 삭제
export async function DELETE(request: NextRequest) {
  let user: any = null;

  try {
    // 인증 확인
    const authResult = await requireAuth(true); // 관리자만 접근
    if (!authResult.success || !authResult.user) {
      return authResult.response!;
    }

    user = authResult.user;

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      throwBusinessError("MISSING_REQUIRED_FIELDS", {
        missingFields: ["termId"],
      });
    }

    // 기존 약관 조회
    let existingTerm;
    try {
      existingTerm = await prisma.terms_management.findUnique({
        where: { id },
        include: {
          user_consents: true,
        },
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

    if (!existingTerm) {
      throwBusinessError("GENERAL_NOT_FOUND", {
        resourceType: "terms",
      });
    }

    // 활성화된 약관은 삭제 불가
    if (existingTerm.is_active) {
      throwBusinessError("TERM_ACTIVE_CANNOT_DELETE", {
        operation: "delete_term",
        termId: id,
      });
    }

    // 사용자 동의가 있는 약관은 삭제 불가
    if (existingTerm.user_consents.length > 0) {
      throwBusinessError("TERM_HAS_CONSENTS_CANNOT_DELETE", {
        operation: "delete_term",
        termId: id,
        consentCount: existingTerm.user_consents.length,
      });
    }

    // 약관 삭제
    try {
      await prisma.terms_management.delete({
        where: { id },
      });
    } catch (queryError) {
      throwBusinessError(
        "GENERAL_DELETE_FAILED",
        {
          resourceType: "terms",
        },
        queryError
      );
    }

    return NextResponse.json({ message: "약관이 삭제되었습니다" });
  } catch (error) {
    // 비즈니스 에러 또는 시스템 에러를 표준화된 에러 코드로 매핑
    const result = getErrorResultFromRawError(error, {
      operation: "delete_term",
    });

    return NextResponse.json(makeErrorResponseFromResult(result), {
      status: result.status,
    });
  }
}
