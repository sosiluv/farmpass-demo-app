import { PrismaClient } from "@prisma/client";
import { devLog } from "../lib/utils/logging/dev-logger";

const prisma = new PrismaClient();

async function main() {
  // 기존 시스템 설정이 있는지 확인
  const existingSettings = await prisma.systemSettings.findFirst();

  if (!existingSettings) {
    // 초기 시스템 설정 생성
    await prisma.systemSettings.create({
      data: {
        id: "default-system-settings",
        siteName: "농장 출입 관리 시스템(FarmPass)",
        siteDescription:
          "방역은 출입자 관리부터 시작됩니다. QR기록으로 축산 질병 예방의 첫걸음을 함께하세요.",
        language: "ko",
        timezone: "Asia/Seoul",
        dateFormat: "YYYY-MM-DD",

        // 보안 설정
        maxLoginAttempts: 5,
        accountLockoutDurationMinutes: 15,
        passwordMinLength: 8,
        passwordRequireSpecialChar: true,
        passwordRequireNumber: true,

        // 방문자 정책
        reVisitAllowInterval: 6,
        maxVisitorsPerDay: 100,
        visitorDataRetentionDays: 1095,
        requireVisitorPhoto: false,
        requireVisitorContact: true,
        requireVisitPurpose: true,

        // 알림 설정
        visitTemplate:
          "{방문자명}님이 {방문날짜} {방문시간}에 {농장명}을 방문하였습니다.",

        // 시스템 설정
        logLevel: "info",
        logRetentionDays: 90,
        maintenanceMode: false,
        debugMode: false,
        passwordRequireUpperCase: true,
        passwordRequireLowerCase: true,
        maintenanceContactInfo: "문의사항이 있으시면 관리자에게 연락해 주세요.",
        maintenanceEstimatedTime: 30,
        maintenanceMessage:
          "현재 시스템 업데이트 및 유지보수 작업이 진행 중입니다.",

        // 푸시 알림 설정
        pushRequireInteraction: false,
        pushSoundEnabled: false,
        pushVibrateEnabled: false,
      },
    });

    devLog.log("✅ 초기 시스템 설정이 생성되었습니다.");
  } else {
    devLog.log("ℹ️ 시스템 설정이 이미 존재합니다.");
  }
}

main()
  .catch((e) => {
    devLog.error("❌ 시드 실행 중 오류가 발생했습니다:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
