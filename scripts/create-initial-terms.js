const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function createInitialTerms() {
  try {
    console.log("초기 약관 데이터를 생성합니다...");

    // 기존 약관 데이터 삭제 (테스트용)
    await prisma.user_consents.deleteMany();
    await prisma.terms_management.deleteMany();

    // 개인정보처리방침 생성
    const privacyTerm = await prisma.terms_management.create({
      data: {
        type: "privacy",
        title: "개인정보처리방침",
        content: `# 개인정보처리방침

## 1. 개인정보의 처리 목적

회사는 다음의 목적을 위하여 개인정보를 처리하고 있으며, 다음의 목적 이외의 용도로는 이용하지 않습니다.

- 회원 가입 및 관리
- 서비스 제공 및 운영
- 고객 상담 및 문의 응대

## 2. 개인정보의 처리 및 보유기간

회사는 법령에 따른 개인정보 보유·이용기간 또는 정보주체로부터 개인정보를 수집 시에 동의받은 개인정보 보유·이용기간 내에서 개인정보를 처리·보유합니다.

## 3. 개인정보의 제3자 제공

회사는 정보주체의 별도 동의, 법률의 특별한 규정 등 개인정보보호법 제17조에 해당하는 경우에만 개인정보를 제3자에게 제공합니다.`,
        version: "1.0",
        is_active: true,
        is_draft: false,
        published_at: new Date(),
      },
    });

    // 서비스 이용약관 생성
    const termsTerm = await prisma.terms_management.create({
      data: {
        type: "terms",
        title: "서비스 이용약관",
        content: `# 서비스 이용약관

## 제1조 (목적)

이 약관은 회사가 제공하는 농장 출입 관리 서비스의 이용과 관련하여 회사와 회원과의 권리, 의무 및 책임사항, 기타 필요한 사항을 규정함을 목적으로 합니다.

## 제2조 (정의)

1. "서비스"라 함은 회사가 제공하는 농장 출입 관리 서비스를 의미합니다.
2. "회원"이라 함은 회사의 서비스에 접속하여 이 약관에 따라 회사와 이용계약을 체결하고 회사가 제공하는 서비스를 이용하는 고객을 말합니다.

## 제3조 (약관의 효력 및 변경)

1. 이 약관은 서비스 화면에 게시하거나 기타의 방법으로 회원에게 공지함으로써 효력이 발생합니다.
2. 회사는 필요한 경우 관련법령을 위배하지 않는 범위에서 이 약관을 변경할 수 있습니다.`,
        version: "1.0",
        is_active: true,
        is_draft: false,
        published_at: new Date(),
      },
    });

    // 마케팅 정보 수신 동의 생성
    const marketingTerm = await prisma.terms_management.create({
      data: {
        type: "marketing",
        title: "마케팅 정보 수신 동의",
        content: `# 마케팅 정보 수신 동의

## 1. 마케팅 정보 수신 동의

회사는 고객에게 다양한 혜택과 정보를 제공하기 위해 마케팅 정보를 발송할 수 있습니다.

## 2. 수신 정보

- 새로운 서비스 및 기능 안내
- 이벤트 및 프로모션 정보
- 농업 관련 유용한 정보
- 시스템 업데이트 및 개선사항

## 3. 수신 방법

- 이메일
- 푸시 알림
- SMS (선택적)

## 4. 동의 철회

언제든지 설정 페이지에서 마케팅 정보 수신 동의를 철회할 수 있습니다.`,
        version: "1.0",
        is_active: true,
        is_draft: false,
        published_at: new Date(),
      },
    });

    console.log("✅ 초기 약관 데이터 생성 완료!");
    console.log("생성된 약관:");
    console.log("- 개인정보처리방침:", privacyTerm.id);
    console.log("- 서비스 이용약관:", termsTerm.id);
    console.log("- 마케팅 정보 수신:", marketingTerm.id);
  } catch (error) {
    console.error("❌ 초기 약관 데이터 생성 실패:", error);
  } finally {
    await prisma.$disconnect();
  }
}

createInitialTerms();
