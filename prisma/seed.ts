import { PrismaClient } from "@prisma/client";
import { devLog } from "../lib/utils/logging/dev-logger";
import { DEFAULT_SYSTEM_SETTINGS } from "../lib/constants/defaults";

const prisma = new PrismaClient();

async function main() {
  // 기존 시스템 설정이 있는지 확인
  const existingSettings = await prisma.system_settings.findFirst();

  if (!existingSettings) {
    // 초기 시스템 설정 생성
    await prisma.system_settings.create({
      data: {
        ...DEFAULT_SYSTEM_SETTINGS,
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
