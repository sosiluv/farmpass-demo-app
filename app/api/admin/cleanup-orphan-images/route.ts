import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireAuth } from "@/lib/server/auth-utils";
import { devLog } from "@/lib/utils/logging/dev-logger";
import { createSystemLog } from "@/lib/utils/logging/system-log";
import { getClientIP, getUserAgent } from "@/lib/server/ip-helpers";

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
      devLog.error(`[GET_ALL_FILES] Error listing ${bucket}/${prefix}:`, error);
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
  } catch (error) {
    devLog.error(`[GET_ALL_FILES] Error in getAllStorageFiles:`, error);
  }

  return allFiles;
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const clientIP = getClientIP(request);
  const userAgent = getUserAgent(request);

  // 인증 및 권한 확인 (admin만 접근 가능)
  const authResult = await requireAuth(true);
  if (!authResult.success || !authResult.user) {
    return authResult.response!;
  }

  const user = authResult.user;

  try {
    devLog.log("[CLEANUP_ORPHAN_IMAGES] Starting orphan file cleanup...");

    let totalDeleted = 0;
    const results = {
      visitor: { deleted: 0, total: 0 },
      profile: { deleted: 0, total: 0 },
    };

    // 1. 방문자 이미지 정리 (visitor-photos 버킷)
    const visitorResult = await cleanupVisitorImages(supabase);
    results.visitor = visitorResult;
    totalDeleted += visitorResult.deleted;

    // 2. 프로필 이미지 정리 (profiles 버킷)
    const profileResult = await cleanupProfileImages(supabase);
    results.profile = profileResult;
    totalDeleted += profileResult.deleted;

    // 3. 시스템 로그 기록
    await createSystemLog(
      "ORPHAN_FILE_CLEANUP",
      `Orphan file cleanup completed: ${totalDeleted} files deleted`,
      "info",
      user.id,
      "system",
      undefined,
      {
        visitor_deleted: results.visitor.deleted,
        visitor_total: results.visitor.total,
        profile_deleted: results.profile.deleted,
        profile_total: results.profile.total,
        total_deleted: totalDeleted,
        cleanup_type: "manual",
      },
      user.email,
      clientIP,
      userAgent
    );

    devLog.log(
      `[CLEANUP_ORPHAN_IMAGES] Cleanup completed: ${totalDeleted} files deleted`
    );

    return NextResponse.json({
      success: true,
      message: `${totalDeleted}개의 orphan 파일이 정리되었습니다.`,
      results,
    });
  } catch (error) {
    devLog.error("[CLEANUP_ORPHAN_IMAGES] Error:", error);

    await createSystemLog(
      "ORPHAN_FILE_CLEANUP_ERROR",
      "Orphan file cleanup failed",
      "error",
      user.id,
      "system",
      undefined,
      {
        error: error instanceof Error ? error.message : "Unknown error",
        cleanup_type: "manual",
      },
      user.email,
      clientIP,
      userAgent
    );

    return NextResponse.json(
      {
        success: false,
        message: "Orphan file 정리 중 오류가 발생했습니다.",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

// 방문자 이미지 정리 함수
async function cleanupVisitorImages(supabase: any) {
  let deleted = 0;
  let total = 0;

  try {
    // 1. DB에서 사용 중인 방문자 이미지 URL들 수집
    const { data: usedUrls, error: dbError } = await supabase
      .from("visitor_entries")
      .select("profile_photo_url")
      .not("profile_photo_url", "is", null)
      .neq("profile_photo_url", "");

    if (dbError) {
      devLog.error("[CLEANUP_VISITOR_IMAGES] DB error:", dbError);
      return { deleted: 0, total: 0 };
    }

    const usedUrlSet = new Set(
      usedUrls?.map((entry: any) => entry.profile_photo_url) || []
    );

    // 2. 재귀적으로 모든 방문자 이미지 파일 목록 가져오기
    const visitorFiles = await getAllStorageFiles(supabase, "visitor-photos");

    total = visitorFiles.length;

    // 3. 각 파일에 대해 DB 사용 여부 확인
    for (const filePath of visitorFiles) {
      // DB에서 해당 파일이 사용되고 있는지 확인
      const isUsed = Array.from(usedUrlSet).some((url) =>
        (url as string).includes(filePath)
      );

      // 사용되지 않는 파일이면 삭제
      if (!isUsed) {
        const { error: deleteError } = await supabase.storage
          .from("visitor-photos")
          .remove([filePath]);

        if (deleteError) {
          devLog.error(
            `[CLEANUP_VISITOR_IMAGES] Failed to delete ${filePath}:`,
            deleteError
          );
        } else {
          deleted++;
          devLog.log(
            `[CLEANUP_VISITOR_IMAGES] Deleted orphan file: ${filePath}`
          );
        }
      }
    }
  } catch (error) {
    devLog.error("[CLEANUP_VISITOR_IMAGES] Error:", error);
  }

  return { deleted, total };
}

// 프로필 이미지 정리 함수
async function cleanupProfileImages(supabase: any) {
  let deleted = 0;
  let total = 0;

  try {
    // 1. DB에서 사용 중인 프로필 이미지 URL들 수집
    const { data: profiles, error: profilesError } = await supabase
      .from("profiles")
      .select("profile_image_url")
      .not("profile_image_url", "is", null)
      .neq("profile_image_url", "");

    if (profilesError) {
      devLog.error("[CLEANUP_PROFILE_IMAGES] DB error:", {
        profilesError,
      });
      return { deleted: 0, total: 0 };
    }

    const usedUrlSet = new Set(
      profiles?.map((p: any) => p.profile_image_url).filter(Boolean) || []
    );

    // 2. 재귀적으로 모든 프로필 이미지 파일 목록 가져오기
    const profileFiles = await getAllStorageFiles(supabase, "profiles");

    total = profileFiles.length;

    // 3. 각 파일에 대해 DB 사용 여부 확인
    for (const filePath of profileFiles) {
      // DB에서 해당 파일이 사용되고 있는지 확인
      const isUsed = Array.from(usedUrlSet).some((url) =>
        (url as string).includes(filePath)
      );

      // 사용되지 않는 파일이면 삭제
      if (!isUsed) {
        const { error: deleteError } = await supabase.storage
          .from("profiles")
          .remove([filePath]);

        if (deleteError) {
          devLog.error(
            `[CLEANUP_PROFILE_IMAGES] Failed to delete ${filePath}:`,
            deleteError
          );
        } else {
          deleted++;
          devLog.log(
            `[CLEANUP_PROFILE_IMAGES] Deleted orphan file: ${filePath}`
          );
        }
      }
    }
  } catch (error) {
    devLog.error("[CLEANUP_PROFILE_IMAGES] Error:", error);
  }

  return { deleted, total };
}
