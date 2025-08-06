const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function createDummyLogs() {
  try {
    console.log("더미 로그 데이터 생성 시작...");

    // 관리자 사용자 정보 가져오기
    const adminUser = await prisma.profiles.findFirst({
      where: { account_type: "admin" },
      orderBy: { created_at: "asc" },
    });

    // 농장 ID 목록 가져오기
    const farms = await prisma.farms.findMany({
      select: { id: true },
      take: 10,
    });

    // 방문자 ID 목록 가져오기
    const visitors = await prisma.visitor_entries.findMany({
      select: { id: true },
      take: 50,
    });

    const logLevels = ["error", "warn", "info", "debug"];
    const actions = [
      "USER_LOGIN",
      "USER_LOGOUT",
      "USER_CREATE",
      "USER_UPDATE",
      "USER_DELETE",
      "FARM_CREATE",
      "FARM_UPDATE",
      "FARM_DELETE",
      "FARM_MEMBER_ADD",
      "FARM_MEMBER_REMOVE",
      "VISITOR_CREATE",
      "VISITOR_UPDATE",
      "VISITOR_DELETE",
      "VISITOR_ENTRY",
      "SYSTEM_BACKUP",
      "SYSTEM_MAINTENANCE",
      "SYSTEM_ERROR",
      "SYSTEM_CONFIG_UPDATE",
      "SECURITY_LOGIN_FAILED",
      "SECURITY_PASSWORD_RESET",
      "SECURITY_ACCOUNT_LOCKED",
      "NOTIFICATION_SENT",
      "NOTIFICATION_FAILED",
      "API_REQUEST",
      "API_ERROR",
      "SCHEDULED_JOB",
      "DATA_EXPORT",
      "DATA_IMPORT",
      "FILE_UPLOAD",
    ];

    const resourceTypes = ["farm", "user", "visitor", "system"];
    const userAgents = [
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
      "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36",
      "Mozilla/5.0 (iPhone; CPU iPhone OS 14_7_1 like Mac OS X)",
      "Mozilla/5.0 (Android 11; Mobile; rv:68.0) Gecko/68.0",
    ];

    const browsers = ["Chrome", "Firefox", "Safari", "Edge"];
    const os = ["Windows", "macOS", "Linux", "iOS", "Android"];
    const devices = ["desktop", "mobile", "tablet"];

    // 1000개의 더미 로그 생성
    for (let i = 1; i <= 1000; i++) {
      // 랜덤 날짜 생성 (최근 6개월)
      const randomDate = new Date(
        Date.now() - Math.random() * 180 * 24 * 60 * 60 * 1000
      );

      // 로그 레벨 (가중치: info 50%, warn 25%, error 15%, debug 10%)
      let level;
      const rand = Math.random();
      if (rand < 0.5) level = "info";
      else if (rand < 0.75) level = "warn";
      else if (rand < 0.9) level = "error";
      else level = "debug";

      // 랜덤 액션 선택
      const action = actions[Math.floor(Math.random() * actions.length)];

      // 메시지 생성
      let message;
      switch (action) {
        case "USER_LOGIN":
          message = `사용자 로그인: ${
            adminUser?.email || "unknown@example.com"
          }`;
          break;
        case "USER_LOGOUT":
          message = `사용자 로그아웃: ${
            adminUser?.email || "unknown@example.com"
          }`;
          break;
        case "VISITOR_CREATE":
          message = "방문자 등록: 새로운 방문자가 등록되었습니다";
          break;
        case "VISITOR_ENTRY":
          message = "방문자 입장: 방문자가 농장에 입장했습니다";
          break;
        case "FARM_CREATE":
          message = "농장 생성: 새로운 농장이 등록되었습니다";
          break;
        case "SYSTEM_BACKUP":
          message = "시스템 백업: 정기 백업이 완료되었습니다";
          break;
        case "SYSTEM_ERROR":
          const errors = [
            "데이터베이스 연결 실패",
            "메모리 부족",
            "디스크 공간 부족",
            "API 응답 시간 초과",
          ];
          message = `시스템 오류: ${
            errors[Math.floor(Math.random() * errors.length)]
          }`;
          break;
        case "SECURITY_LOGIN_FAILED":
          message = "로그인 실패: 잘못된 비밀번호 시도";
          break;
        case "API_REQUEST":
          const apis = [
            "/api/farms",
            "/api/visitors",
            "/api/users",
            "/api/settings",
          ];
          message = `API 요청: ${
            apis[Math.floor(Math.random() * apis.length)]
          }`;
          break;
        case "SCHEDULED_JOB":
          const jobs = ["데이터 정리", "백업 실행", "알림 발송", "통계 생성"];
          message = `스케줄 작업: ${
            jobs[Math.floor(Math.random() * jobs.length)]
          }`;
          break;
        default:
          message = `시스템 이벤트: ${action} 실행됨`;
      }

      // 사용자 정보 (80% 확률로 관리자, 20% 확률로 NULL)
      const userId = Math.random() < 0.8 ? adminUser?.id : null;
      const userEmail =
        Math.random() < 0.8 ? adminUser?.email : "admin@farm.com";

      // IP 주소 랜덤 생성
      const userIp = `192.168.${Math.floor(Math.random() * 255)}.${Math.floor(
        Math.random() * 255
      )}`;

      // User Agent 랜덤 선택
      const userAgent =
        userAgents[Math.floor(Math.random() * userAgents.length)];

      // 리소스 타입 랜덤 선택
      const resourceType =
        resourceTypes[Math.floor(Math.random() * resourceTypes.length)];

      // 리소스 ID (농장 또는 방문자 ID, 또는 NULL)
      let resourceId = null;
      if (farms.length > 0 && Math.random() < 0.3) {
        resourceId = farms[Math.floor(Math.random() * farms.length)].id;
      } else if (visitors.length > 0 && Math.random() < 0.2) {
        resourceId = visitors[Math.floor(Math.random() * visitors.length)].id;
      }

      // 메타데이터 생성
      const metadata = {
        timestamp: randomDate,
        session_id: "sess_" + Math.random().toString(36).substring(2, 18),
        request_id: "req_" + Math.random().toString(36).substring(2, 14),
        duration_ms: Math.floor(Math.random() * 5000),
        status_code:
          Math.random() < 0.8
            ? 200
            : Math.random() < 0.9
            ? 400
            : Math.random() < 0.95
            ? 404
            : 500,
        additional_info: {
          browser: browsers[Math.floor(Math.random() * browsers.length)],
          os: os[Math.floor(Math.random() * os.length)],
          device: devices[Math.floor(Math.random() * devices.length)],
        },
      };

      // 로그 데이터 삽입
      await prisma.system_logs.create({
        data: {
          level,
          action,
          message,
          user_id: userId,
          user_email: userEmail,
          user_ip: userIp,
          user_agent: userAgent,
          resource_type: resourceType,
          resource_id: resourceId,
          metadata,
          created_at: randomDate,
        },
      });

      // 진행 상황 출력 (100개마다)
      if (i % 100 === 0) {
        console.log(`더미 로그 데이터 생성 진행률: ${i}/1000`);
      }
    }

    console.log("시스템 로그 더미 데이터 1000개 생성 완료!");
  } catch (error) {
    console.error("더미 로그 생성 중 오류 발생:", error);
  } finally {
    await prisma.$disconnect();
  }
}

// 스크립트 실행
createDummyLogs();
