import { PrismaClient } from "@prisma/client";
import { devLog } from "../lib/utils/logging/dev-logger";
import { DEFAULT_SYSTEM_SETTINGS } from "../lib/constants/defaults";

const prisma = new PrismaClient();

async function main() {
  devLog.log("🌱 데모용 샘플 데이터 생성 시작...");

  // 1. 시스템 설정 생성
  await createSystemSettings();

  // 2. 약관 데이터 생성
  await createInitialTerms();

  // 3. 데모용 사용자 및 농장 데이터 생성
  await createDemoUsersAndFarms();

  // 4. 데모용 방문자 데이터 생성
  await createDemoVisitorData();

  // 5. 데모용 시스템 로그 생성
  await createDemoSystemLogs();

  devLog.log("✅ 데모용 샘플 데이터 생성 완료!");
}

async function createSystemSettings() {
  const existingSettings = await prisma.system_settings.findFirst();

  if (!existingSettings) {
    await prisma.system_settings.create({
      data: {
        ...DEFAULT_SYSTEM_SETTINGS,
        siteName: "FarmPass 데모",
      },
    });
    devLog.log("✅ 시스템 설정 생성 완료");
  }
}

async function createInitialTerms() {
  // 기존 시드 파일의 약관 데이터와 동일
  const termsData = [
    {
      type: "privacy",
      title: "개인정보처리방침",
      content:
        "# 개인정보처리방침\n\n**제1조(목적)**\n\n(주)삼원기업 (이하 '회사'라고 함)는 회사가 제공하고자 하는 서비스(이하 '회사 서비스')를 이용하는 개인(이하 '이용자' 또는 '개인')의 정보(이하 '개인정보')를 보호하기 위해, 개인정보보호법, 정보통신망 이용촉진 및 정보보호 등에 관한 법률(이하 '정보통신망법') 등 관련 법령을 준수하고, 서비스 이용자의 개인정보 보호 관련한 고충을 신속하고 원활하게 처리할 수 있도록 하기 위하여 다음과 같이 개인정보처리방침(이하 '본 방침')을 수립합니다.",
      version: "1.0",
      is_active: true,
      is_draft: false,
    },
    {
      type: "terms",
      title: "서비스 이용약관",
      content:
        "# 서비스 이용약관\n\n**제1조(목적)**\n\n이 약관은 (주)삼원기업(이하 '회사')가 제공하는 웹서비스(이하 '서비스')의 이용과 관련하여 회사와 이용자 간의 권리, 의무, 책임 및 기타 필요한 사항을 규정함을 목적으로 합니다.",
      version: "1.0",
      is_active: true,
      is_draft: false,
    },
  ];

  for (const termData of termsData) {
    const existingTerm = await prisma.terms_management.findFirst({
      where: { type: termData.type, version: termData.version },
    });

    if (!existingTerm) {
      await prisma.terms_management.create({ data: termData });
    }
  }
  devLog.log("✅ 약관 데이터 생성 완료");
}

async function createDemoUsersAndFarms() {
  // 데모용 농장 데이터 생성
  const demoFarms = [
    {
      farm_name: "청정농장 (데모)",
      farm_type: "축산업",
      farm_address: "경기도 안양시 만안구 안양동 123-45",
      manager_name: "김농장",
      manager_contact: "010-1234-5678",
      additional_notes: "데모용 농장입니다. 실제 농장이 아닙니다.",
      is_active: true,
    },
    {
      farm_name: "친환경농장 (데모)",
      farm_type: "농업",
      farm_address: "충청남도 천안시 동남구 신부동 678-90",
      manager_name: "이농장",
      manager_contact: "010-2345-6789",
      additional_notes: "유기농 채소 재배 농장",
      is_active: true,
    },
    {
      farm_name: "스마트농장 (데모)",
      farm_type: "원예업",
      farm_address: "전라북도 전주시 덕진구 인후동 111-22",
      manager_name: "박농장",
      manager_contact: "010-3456-7890",
      additional_notes: "ICT 기반 스마트팜 운영",
      is_active: true,
    },
  ];

  for (const farmData of demoFarms) {
    const existingFarm = await prisma.farms.findFirst({
      where: { farm_name: farmData.farm_name },
    });

    // if (!existingFarm) {
    //   await prisma.farms.create({ data: farmData });
    // }
  }
  devLog.log("✅ 데모용 농장 데이터 생성 완료");
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

async function createDemoSystemLogs() {
  const logActions = [
    "LOGIN_SUCCESS",
    "FARM_CREATED",
    "VISITOR_REGISTERED",
    "USER_UPDATED",
    "SETTINGS_CHANGED",
    "DATA_EXPORTED",
    "BACKUP_CREATED",
    "SYSTEM_STARTED",
  ];

  const logMessages = [
    "시스템 관리자 로그인",
    "새 농장 등록",
    "방문자 등록 완료",
    "사용자 정보 수정",
    "시스템 설정 변경",
    "데이터 내보내기 실행",
    "백업 생성 완료",
    "시스템 시작",
  ];

  const logData = [];
  const today = new Date();

  // 최근 7일간의 시스템 로그 생성
  for (let i = 0; i < 7; i++) {
    const logDate = new Date(today);
    logDate.setDate(today.getDate() - i);

    // 하루에 5-15개의 로그 생성
    const logCount = Math.floor(Math.random() * 11) + 5;

    for (let j = 0; j < logCount; j++) {
      const actionIndex = Math.floor(Math.random() * logActions.length);

      logData.push({
        user_id: null, // 시스템 로그
        action: logActions[actionIndex],
        description: logMessages[actionIndex],
        metadata: {
          timestamp: logDate.toISOString(),
          source: "demo_seed",
          environment: "demo",
        },
        log_type: "system",
        created_at: logDate,
      });
    }
  }

  // 배치로 시스템 로그 삽입
  // for (const log of logData) {
  //   await prisma.system_logs.create({ data: log });
  // }

  devLog.log(`✅ ${logData.length}개의 데모 시스템 로그 생성 완료`);
}

main()
  .catch((e) => {
    devLog.error("❌ 데모 시드 실행 중 오류가 발생했습니다:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
