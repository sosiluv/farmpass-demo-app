import { PrismaClient } from "@prisma/client";
import { createSystemLog } from "@/lib/utils/logging/system-log";

const globalForPrisma = global as unknown as { prisma: PrismaClient };

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: ["error", "warn"], // 쿼리 로그는 제외하고 오류와 경고만
  });

// 데이터베이스 연결 오류 처리
prisma.$connect().catch(async (error) => {
  await createSystemLog(
    "DATABASE_CONNECTION_ERROR",
    "데이터베이스 연결 실패",
    "error",
    undefined,
    "system",
    "database_connection",
    {
      error_message: error instanceof Error ? error.message : String(error),
      action_type: "database_connection",
    }
  );
});

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

export default prisma;
