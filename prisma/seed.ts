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

  // 약관 초기 데이터 생성
  await createInitialTerms();
}

async function createInitialTerms() {
  const termsData = [
    {
      type: "privacy",
      title: "개인정보 처리방침 (Demo)",
      content: `# 개인정보 처리방침 (Demo)

> ⚠️ 본 문서는 포트폴리오 데모 전용이며, 실제 서비스에서 적용되지 않습니다.

## 1. 수집하는 항목
- 이름, 전화번호, 방문 목적(테스트 입력)

## 2. 이용 목적
- 데모 화면에서 방문자 리스트를 보여주기 위한 **시연용**

## 3. 보관 기간
- 모든 데이터는 정기적으로 초기화되며, 영구 보관하지 않습니다.

## 4. 제3자 제공
- 본 데모는 수집한 정보를 외부에 제공하지 않습니다.

## 5. 문의
- 본 데모와 관련한 문의: sosiluv@gmail.com`,

      version: "1.0",
      is_active: true,
      is_draft: false,
    },
    {
      type: "privacy_consent",
      title: "개인정보 수집 및 이용 동의 (Demo)",
      content: `# 개인정보 수집 및 이용 동의 (Demo)

방문자 등록을 위해 아래 항목을 입력하며, 데모 앱 화면에 표시됩니다.

- **수집 항목:** 이름, 연락처, 방문 목적
- **이용 목적:** 방문 기록 확인, 출입자 리스트 시연
- **보유 기간:** 데모 데이터는 24시간 ~ 7일 이내 자동 삭제될 수 있음`,

      version: "1.0",
      is_active: true,
      is_draft: false,
    },
    {
      type: "terms",
      title: "서비스 이용약관 (Demo)",
      content: `# 서비스 이용약관 (Demo)

> ⚠️ 본 문서는 포트폴리오 데모 전용이며, 실제 서비스 약관이 아닙니다.

## 1. 목적
이 앱은 농장 출입 관리 시스템의 기능 시연을 위해 제작된 **데모**입니다.

## 2. 서비스 성격
- 실제 상용 서비스가 아니며, 데이터는 언제든 초기화될 수 있습니다.
- 가입·로그인·방문자 등록은 테스트 목적으로만 사용하세요.

## 3. 금지 행위
- 악의적 스팸, 자동화 공격, 불법 행위에 본 데모를 사용하지 마십시오.

## 4. 면책
- 운영자는 데모에서 발생한 데이터 손실·오류에 책임지지 않습니다.`,

      version: "1.0",
      is_active: true,
      is_draft: false,
    },
    {
      type: "marketing",
      title: "마케팅 정보 수신 동의 (Demo)",
      content: `# 마케팅 정보 수신 동의 (Demo)

> 이 데모 앱은 실제 마케팅 메시지를 전송하지 않습니다.

- 데모에서는 체크박스 상태만 저장합니다.
- 실제 푸시 알림/이메일 발송은 이루어지지 않습니다.`,

      version: "1.0",
      is_active: true,
      is_draft: false,
    },
    {
      type: "age_consent",
      title: "만 14세 이상 이용 동의",
      content: `# 만 14세 이상 이용 동의

**본 서비스는 만 14세 이상만 이용할 수 있습니다.**

---

**제1조 (연령 제한)**

1. 본 서비스는 개인정보보호법에 따라 만 14세 이상의 이용자만 가입 및 이용할 수 있습니다.
2. 만 14세 미만의 아동은 법정대리인의 동의 없이 개인정보를 제공할 수 없으므로 서비스 이용이 제한됩니다.

**제2조 (법적 근거)**

1. 개인정보보호법 제22조(동의를 받는 방법)에 따라, 만 14세 미만 아동의 개인정보를 처리하려면 법정대리인의 동의가 필요합니다.
2. 본 서비스는 원활한 서비스 제공을 위해 만 14세 이상 이용자로 제한합니다.

**제3조 (확인 의무)**

이용자는 회원가입 시 본인이 만 14세 이상임을 확인하고 동의해야 합니다.

**제4조 (위반 시 조치)**

만약 가입 후 만 14세 미만임이 확인될 경우, 회사는 해당 계정을 즉시 정지하고 관련 개인정보를 삭제할 수 있습니다.

**본인은 만 14세 이상임을 확인하며, 위 내용에 동의합니다.**`,

      version: "1.0",
      is_active: true,
      is_draft: false,
    },
  ];

  for (const termData of termsData) {
    // 해당 타입의 약관이 이미 존재하는지 확인
    const existingTerm = await prisma.terms_management.findFirst({
      where: {
        type: termData.type,
        version: termData.version,
      },
    });

    if (!existingTerm) {
      await prisma.terms_management.create({
        data: termData,
      });
      devLog.log(
        `✅ ${termData.title} (${termData.type}) 초기 데이터가 생성되었습니다.`
      );
    } else {
      devLog.log(`ℹ️ ${termData.title} (${termData.type})이 이미 존재합니다.`);
    }
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
