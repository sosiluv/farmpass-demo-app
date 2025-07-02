import { PrismaClient } from "@prisma/client";
import { logger } from "@/lib/utils/logging/system-log";

const globalForPrisma = global as unknown as { prisma: PrismaClient };

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: ["query", "error", "warn"],
  });

// 데이터베이스 연결 오류 처리
prisma.$connect().catch(async (error) => {
  await logger.error(
    "Database connection failed",
    {},
    { error: error instanceof Error ? error.message : String(error) }
  );
});

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

export default prisma;
