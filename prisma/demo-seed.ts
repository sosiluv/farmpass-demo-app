import { PrismaClient } from "@prisma/client";
import { devLog } from "../lib/utils/logging/dev-logger";

const prisma = new PrismaClient();

async function main() {
  devLog.log("🌱 데모용 샘플 데이터 생성 시작...");

  await createDemoVisitorData();

  devLog.log("✅ 데모용 샘플 데이터 생성 완료!");
}

async function createDemoVisitorData() {
  const farms = await prisma.farms.findMany();
  if (farms.length === 0) {
    devLog.warn("⚠️ 농장 데이터가 없어 방문자 데이터를 생성할 수 없습니다.");
    return;
  }

  const farm = farms[0]; // 첫 번째 농장 사용

  // 최근 30일간의 데모 방문자 데이터 생성
  const visitorData = [];
  const today = new Date();

  for (let i = 0; i < 30; i++) {
    const visitDate = new Date(today);
    visitDate.setDate(today.getDate() - i);

    // 하루에 1-5명의 방문자 생성
    const visitorCount = Math.floor(Math.random() * 5) + 1;

    for (let j = 0; j < visitorCount; j++) {
      const visitorNames = [
        "김방문",
        "이방문",
        "박방문",
        "최방문",
        "정방문",
        "강방문",
        "조방문",
        "윤방문",
        "장방문",
        "임방문",
      ];

      const purposes = [
        "농장 견학",
        "상품 구매",
        "기술 상담",
        "방역 점검",
        "정기 점검",
        "설비 수리",
        "교육 참여",
        "기타 업무",
        "면담",
        "시설 점검",
      ];

      const addresses = [
        "서울특별시 강남구",
        "경기도 수원시",
        "인천광역시 연수구",
        "대전광역시 유성구",
        "부산광역시 해운대구",
        "대구광역시 수성구",
      ];

      visitorData.push({
        farm_id: farm.id,
        created_by: null, // 시스템 생성
        visitor_name:
          visitorNames[Math.floor(Math.random() * visitorNames.length)],
        visitor_phone: `010-${Math.floor(Math.random() * 9000) + 1000}-${
          Math.floor(Math.random() * 9000) + 1000
        }`,
        visitor_address:
          addresses[Math.floor(Math.random() * addresses.length)],
        visit_purpose: purposes[Math.floor(Math.random() * purposes.length)],
        vehicle_number: `12가${Math.floor(Math.random() * 9000) + 1000}`,
        disinfection_completed: Math.random() > 0.3, // 70% 확률로 방역 완료
        visit_date: visitDate,
        created_at: visitDate,
      });
    }
  }

  // 배치로 방문자 데이터 삽입
  // for (const visitor of visitorData) {
  //   await prisma.visitor_entries.create({ data: visitor });
  // }

  devLog.log(`✅ ${visitorData.length}개의 데모 방문자 데이터 생성 완료`);
}

main()
  .catch((e) => {
    devLog.error("❌ 데모 시드 실행 중 오류가 발생했습니다:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
