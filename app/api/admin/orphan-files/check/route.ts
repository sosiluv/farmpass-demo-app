import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireAuth } from "@/lib/server/auth-utils";
import { devLog } from "@/lib/utils/logging/dev-logger";
import { prisma } from "@/lib/prisma";
import { createSystemLog } from "@/lib/utils/logging/system-log";
import { LOG_MESSAGES } from "@/lib/utils/logging/log-templates";

import {
  getErrorResultFromRawError,
  makeErrorResponseFromResult,
  throwBusinessError,
} from "@/lib/utils/error/errorUtil";

// 재귀적으로 Storage의 모든 파일을 가져오는 함수
async function getAllStorageFiles(
  supabase: any,
  bucket: string,
  prefix: string = ""
): Promise<string[]> {
  const allFiles: string[] = [];

  try {
    const { data: items, error } = await supabase.storage
      .from(bucket)
      .list(prefix, { limit: 1000 });

    if (error) {
      // HTML 응답 오류인지 확인
      if (error.message && error.message.includes("Unexpected token '<'")) {
        throwBusinessError(
          "STORAGE_HTML_RESPONSE_ERROR",
          {
            bucket,
            prefix,
          },
          error
        );
      } else {
        devLog.error(
          `[GET_ALL_FILES] Storage API 오류 - ${bucket}/${prefix}:`,
          error
        );
      }
      return [];
    }

    if (!items) return [];

    for (const item of items) {
      if (item.id) {
        // 파일인 경우
        allFiles.push(prefix ? `${prefix}/${item.name}` : item.name);
      } else {
        // 폴더인 경우 재귀적으로 조회
        const subPrefix = prefix ? `${prefix}/${item.name}` : item.name;
        const subFiles = await getAllStorageFiles(supabase, bucket, subPrefix);
        allFiles.push(...subFiles);
      }
    }
  } catch (error: any) {
    // 이미 비즈니스 에러로 처리된 경우 그대로 던지기
    if (error.businessCode) {
      throw error;
    }

    // 예상치 못한 오류 처리
    throwBusinessError(
      "STORAGE_UNEXPECTED_ERROR",
      {
        bucket,
        prefix,
      },
      error
    );
  }

  return allFiles;
}

export async function GET(request: NextRequest) {
  let user = null;
  try {
    // 방문자 orphan 파일 체크
    let usedVisitorUrls;
    let visitorDbError = null;
    const supabase = await createClient();
    // 인증 및 권한 확인 (admin만 접근 가능)
    const authResult = await requireAuth(true);
    if (!authResult.success || !authResult.user) {
      return authResult.response!;
    }

    user = authResult.user;

    try {
      usedVisitorUrls = await prisma.visitor_entries.findMany({
        where: {
          AND: [
            { profile_photo_url: { not: null } },
            { profile_photo_url: { not: "" } },
          ],
        },
        select: {
          profile_photo_url: true,
        },
      });
    } catch (error: any) {
      throwBusinessError(
        "GENERAL_QUERY_FAILED",
        {
          resourceType: "visitor",
        },
        error
      );
    }

    const usedVisitorSet = new Set(
      usedVisitorUrls?.map((v: any) => v.profile_photo_url) || []
    );

    // 재귀적으로 모든 방문자 파일 가져오기
    const visitorFiles = await getAllStorageFiles(supabase, "visitor-photos");
    const orphanVisitorFiles = visitorFiles.filter(
      (filePath) =>
        !Array.from(usedVisitorSet).some((url) =>
          (url as string).includes(filePath)
        )
    );

    // 프로필 orphan 파일 체크 (소셜 로그인 URL 제외)
    let profiles;
    let profileDbError = null;

    try {
      profiles = await prisma.profiles.findMany({
        where: {
          AND: [
            { profile_image_url: { not: null } },
            { profile_image_url: { not: "" } },
          ],
        },
        select: {
          profile_image_url: true,
        },
      });
    } catch (error: any) {
      throwBusinessError(
        "GENERAL_QUERY_FAILED",
        {
          resourceType: "profile",
        },
        error
      );
    }

    // 소셜 로그인 URL 제외 (구글, 카카오)
    const socialLoginUrls =
      profiles?.filter((p: any) => {
        const url = p.profile_image_url;
        return (
          url &&
          (url.includes("googleusercontent.com") ||
            url.includes("lh3.googleusercontent.com") ||
            url.includes("k.kakaocdn.net") ||
            url.includes("profile.kakaocdn.net"))
        );
      }) || [];

    const usedProfileSet = new Set(
      profiles?.map((p: any) => p.profile_image_url).filter(Boolean) || []
    );

    // 재귀적으로 모든 프로필 파일 가져오기 (systems 폴더 제외)
    const profileFiles = await getAllStorageFiles(supabase, "profiles");
    const orphanProfileFiles = profileFiles.filter(
      (filePath) =>
        // systems 폴더는 제외
        !filePath.startsWith("systems/") &&
        !Array.from(usedProfileSet).some((url) =>
          (url as string).includes(filePath)
        )
    );

    // 방문자 DB orphan (DB에는 있는데 Storage에는 없는 profile_photo_url)
    const visitorDbOrphans = (usedVisitorUrls || []).filter((entry: any) => {
      const url = entry.profile_photo_url;
      if (!url) return false;
      const match = url.match(/visitor-photos\/(.+)$/);
      const filePath = match ? match[1] : null;
      if (!filePath) return false;
      return !visitorFiles.includes(filePath);
    });

    // 프로필 DB orphan (DB에는 있는데 Storage에는 없는 profile_image_url, 소셜 로그인 제외)
    const profileDbOrphans = (profiles || []).filter((profile: any) => {
      const url = profile.profile_image_url;
      if (!url) return false;

      // 소셜 로그인 URL 제외
      if (
        url.includes("googleusercontent.com") ||
        url.includes("lh3.googleusercontent.com") ||
        url.includes("k.kakaocdn.net") ||
        url.includes("profile.kakaocdn.net")
      ) {
        return false;
      }

      const match = url.match(/profiles\/(.+)$/);
      const filePath = match ? match[1] : null;
      if (!filePath) return false;
      if (filePath.startsWith("systems/")) return false;
      return !profileFiles.includes(filePath);
    });

    // 디버깅을 위한 상세 정보 반환
    return NextResponse.json({
      visitorOrphans: orphanVisitorFiles,
      profileOrphans: orphanProfileFiles,
      visitorOrphanCount: orphanVisitorFiles.length,
      profileOrphanCount: orphanProfileFiles.length,
      visitorDbOrphans,
      profileDbOrphans,
      visitorDbOrphanCount: visitorDbOrphans.length,
      profileDbOrphanCount: profileDbOrphans.length,
      // 디버깅 정보
      debug: {
        visitor: {
          usedUrls: Array.from(usedVisitorSet),
          usedUrlCount: usedVisitorSet.size,
          storageFiles: visitorFiles,
          storageFileCount: visitorFiles.length,
          dbError: visitorDbError,
        },
        profile: {
          usedUrls: Array.from(usedProfileSet),
          usedUrlCount: usedProfileSet.size,
          socialLoginUrls: socialLoginUrls.map((p: any) => p.profile_image_url),
          socialLoginUrlCount: socialLoginUrls.length,
          storageFiles: profileFiles,
          storageFileCount: profileFiles.length,
          dbError: profileDbError,
        },
      },
    });
  } catch (error) {
    devLog.error("[CHECK_ORPHAN] General error:", error);

    // 시스템 에러 로그 기록
    const errorMessage = error instanceof Error ? error.message : String(error);
    await createSystemLog(
      "ORPHAN_FILES_CHECK_FAILED",
      LOG_MESSAGES.ORPHAN_FILES_CHECK_FAILED(errorMessage),
      "error",
      user?.id ? { id: user.id, email: user.email || "" } : undefined,
      "system",
      "check_orphan_files",
      {
        action_type: "admin_event",
        event: "orphan_files_check_failed",
        error_message: errorMessage,
      },
      request
    );

    // 통합 에러 처리 - 비즈니스 에러와 시스템 에러를 모두 처리
    const result = getErrorResultFromRawError(error, {
      operation: "check_orphan_files",
    });

    return NextResponse.json(makeErrorResponseFromResult(result), {
      status: result.status,
    });
  }
}
