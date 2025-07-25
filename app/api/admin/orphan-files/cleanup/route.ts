import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireAuth } from "@/lib/server/auth-utils";
import { devLog } from "@/lib/utils/logging/dev-logger";
import { createSystemLog } from "@/lib/utils/logging/system-log";
import { getClientIP, getUserAgent } from "@/lib/server/ip-helpers";
import { prisma } from "@/lib/prisma";

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
        devLog.error(`[GET_ALL_FILES] HTML 응답 오류 - ${bucket}/${prefix}:`, {
          error: error.message,
          bucket,
          prefix,
          suggestion: "Storage 버킷 권한 또는 환경 변수를 확인하세요",
        });
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
  } catch (error) {
    // 예상치 못한 오류 처리
    devLog.error(`[GET_ALL_FILES] 예상치 못한 오류 - ${bucket}/${prefix}:`, {
      error: error instanceof Error ? error.message : String(error),
      bucket,
      prefix,
      stack: error instanceof Error ? error.stack : undefined,
    });
  }

  return allFiles;
}

// 프로필 orphan 정리(파일 삭제 + DB orphan 초기화)를 하나의 함수로 통합
async function cleanupProfileOrphans(supabase: any) {
  let deleted = 0;
  let dbOrphanUpdated = 0;
  let totalFiles = 0;
  let totalProfiles = 0;

  // 1. DB에서 profile_image_url이 있는 모든 프로필 조회 (1번)
  const profiles = await prisma.profiles.findMany({
    where: {
      AND: [
        { profile_image_url: { not: null } },
        { profile_image_url: { not: "" } },
      ],
    },
    select: {
      id: true,
      profile_image_url: true,
    },
  });
  totalProfiles = profiles.length;

  // 2. Storage의 모든 파일 목록 가져오기 (1번)
  const profileFiles = await getAllStorageFiles(supabase, "profiles");
  totalFiles = profileFiles.length;
  const fileSet = new Set(profileFiles);

  // 3. DB → Storage에 없는 파일: DB orphan (초기화 대상)
  for (const profile of profiles) {
    const url = profile.profile_image_url;
    if (!url) continue;
    const match = url.match(/profiles\/(.+)$/);
    const filePath = match ? match[1] : null;
    if (!filePath) continue;
    if (filePath.startsWith("systems/")) continue;

    if (!fileSet.has(filePath)) {
      await prisma.profiles.update({
        where: { id: profile.id },
        data: { profile_image_url: null },
      });
      dbOrphanUpdated++;
      devLog.log(
        `[CLEANUP_PROFILE_ORPHAN] DB orphan 초기화: userId=${profile.id}, url=${url}`
      );
    }
  }

  // 4. Storage → DB에 없는 파일: Storage orphan (삭제 대상)
  const dbFileSet = new Set(
    profiles
      .map((p: any) => {
        const match = p.profile_image_url?.match(/profiles\/(.+)$/);
        return match ? match[1] : null;
      })
      .filter((v: any) => v && !v.startsWith("systems/"))
  );

  for (const filePath of profileFiles) {
    if (filePath.startsWith("systems/")) continue;
    if (!dbFileSet.has(filePath)) {
      const { error: deleteError } = await supabase.storage
        .from("profiles")
        .remove([filePath]);
      if (!deleteError) {
        deleted++;
        devLog.log(`[CLEANUP_PROFILE_ORPHAN] Storage orphan 삭제: ${filePath}`);
      }
    }
  }

  return {
    deleted,
    dbOrphanUpdated,
    totalFiles,
    totalProfiles,
  };
}

// 방문자 orphan 정리(파일 삭제 + DB orphan 초기화)를 하나의 함수로 통합
async function cleanupVisitorOrphans(supabase: any) {
  let deleted = 0;
  let dbOrphanUpdated = 0;
  let totalFiles = 0;
  let totalEntries = 0;

  // 1. DB에서 profile_photo_url이 있는 모든 방문자 엔트리 조회 (1번)
  const entries = await prisma.visitor_entries.findMany({
    where: {
      AND: [
        { profile_photo_url: { not: null } },
        { profile_photo_url: { not: "" } },
      ],
    },
    select: {
      id: true,
      profile_photo_url: true,
    },
  });
  totalEntries = entries.length;

  // 2. Storage의 모든 파일 목록 가져오기 (1번)
  const visitorFiles = await getAllStorageFiles(supabase, "visitor-photos");
  totalFiles = visitorFiles.length;
  const fileSet = new Set(visitorFiles);

  // 3. DB → Storage에 없는 파일: DB orphan (초기화 대상)
  for (const entry of entries) {
    const url = entry.profile_photo_url;
    if (!url) continue;
    const match = url.match(/visitor-photos\/(.+)$/);
    const filePath = match ? match[1] : null;
    if (!filePath) continue;
    if (!fileSet.has(filePath)) {
      await prisma.visitor_entries.update({
        where: { id: entry.id },
        data: { profile_photo_url: null },
      });
      dbOrphanUpdated++;
      devLog.log(
        `[CLEANUP_VISITOR_ORPHAN] DB orphan 초기화: entryId=${entry.id}, url=${url}`
      );
    }
  }

  // 4. Storage → DB에 없는 파일: Storage orphan (삭제 대상)
  const dbFileSet = new Set(
    entries
      .map((e: any) => {
        const match = e.profile_photo_url?.match(/visitor-photos\/(.+)$/);
        return match ? match[1] : null;
      })
      .filter((v: any) => v)
  );

  for (const filePath of visitorFiles) {
    if (!dbFileSet.has(filePath)) {
      const { error: deleteError } = await supabase.storage
        .from("visitor-photos")
        .remove([filePath]);
      if (!deleteError) {
        deleted++;
        devLog.log(`[CLEANUP_VISITOR_ORPHAN] Storage orphan 삭제: ${filePath}`);
      }
    }
  }

  return {
    deleted,
    dbOrphanUpdated,
    totalFiles,
    totalEntries,
  };
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
      visitor: { deleted: 0, total: 0, db_orphan_updated: 0, db_total: 0 },
      profile: { deleted: 0, total: 0, db_orphan_updated: 0, db_total: 0 },
    };

    // 1. 방문자 orphan 정리 (Storage orphan + DB orphan)
    const visitorOrphanResult = await cleanupVisitorOrphans(supabase);
    results.visitor = {
      deleted: visitorOrphanResult.deleted,
      total: visitorOrphanResult.totalFiles,
      db_orphan_updated: visitorOrphanResult.dbOrphanUpdated,
      db_total: visitorOrphanResult.totalEntries,
    };
    totalDeleted += visitorOrphanResult.deleted;

    // 2. 프로필 orphan 정리 (Storage orphan + DB orphan)
    const profileOrphanResult = await cleanupProfileOrphans(supabase);
    results.profile = {
      deleted: profileOrphanResult.deleted,
      total: profileOrphanResult.totalFiles,
      db_orphan_updated: profileOrphanResult.dbOrphanUpdated,
      db_total: profileOrphanResult.totalProfiles,
    };
    totalDeleted += profileOrphanResult.deleted;

    // 3. 시스템 로그 기록 (성공)
    await createSystemLog(
      "ORPHAN_FILE_CLEANUP",
      `관리자가 orphan 파일 정리를 완료했습니다 (총 ${totalDeleted}개 삭제, 방문자 DB orphan ${visitorOrphanResult.dbOrphanUpdated}건, 프로필 DB orphan ${profileOrphanResult.dbOrphanUpdated}건 초기화)`,
      "info",
      user.id,
      "system",
      undefined,
      {
        visitor_deleted: results.visitor.deleted,
        visitor_total: results.visitor.total,
        visitor_db_orphan_updated: results.visitor.db_orphan_updated,
        visitor_db_orphan_total: results.visitor.db_total,
        profile_deleted: results.profile.deleted,
        profile_total: results.profile.total,
        profile_db_orphan_updated: results.profile.db_orphan_updated,
        profile_db_orphan_total: results.profile.db_total,
        total_deleted: totalDeleted,
        cleanup_type: "manual",
        userAgent,
        ip: clientIP,
      },
      user.email,
      clientIP,
      userAgent
    );

    devLog.log(
      `[CLEANUP_ORPHAN_IMAGES] Cleanup completed: ${totalDeleted} files deleted, 방문자 DB orphan ${visitorOrphanResult.dbOrphanUpdated}건, 프로필 DB orphan ${profileOrphanResult.dbOrphanUpdated}건 초기화`
    );

    return NextResponse.json({
      success: true,
      message: `${totalDeleted}개의 orphan 파일이 정리되고, 방문자 DB orphan ${visitorOrphanResult.dbOrphanUpdated}건, 프로필 DB orphan ${profileOrphanResult.dbOrphanUpdated}건이 초기화되었습니다.`,
      results,
    });
  } catch (error) {
    devLog.error("[CLEANUP_ORPHAN_IMAGES] Error:", error);

    await createSystemLog(
      "ORPHAN_FILE_CLEANUP_ERROR",
      "관리자가 orphan 파일 정리에 실패했습니다.",
      "error",
      user?.id,
      "system",
      undefined,
      {
        error: error instanceof Error ? error.message : "Unknown error",
        cleanup_type: "manual",
        userAgent,
        ip: clientIP,
      },
      user?.email,
      clientIP,
      userAgent
    );

    return NextResponse.json(
      {
        success: false,
        error: "ORPHAN_FILES_CLEANUP_FAILED",
        message: "고아 파일 정리에 실패했습니다.",
      },
      { status: 500 }
    );
  }
}
