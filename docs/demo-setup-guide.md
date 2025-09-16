# 데모 환경 설정 가이드

## 🎯 포트폴리오 데모앱 설정

### 1. 환경 변수 설정 (.env.local)

```bash
# 데모 환경 플래그
NEXT_PUBLIC_DEMO_MODE=true
NEXT_PUBLIC_SITE_NAME="FarmPass 데모"

# Supabase 설정 (데모용)
NEXT_PUBLIC_SUPABASE_URL=your_demo_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_demo_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_demo_service_role_key

# 이메일 설정 (데모용 - 실제 발송 안함)
RESEND_API_KEY=your_resend_key

# 기타 설정
NEXT_PUBLIC_SITE_URL=https://farmpass.site
NODE_ENV=production
```

### 2. 데모용 데이터베이스 초기화

```bash
# 데모용 시드 데이터 실행
npx prisma db push
npx tsx prisma/demo-seed.ts
```

### 3. 데모용 기능 활성화

```typescript
// lib/constants/demo.ts
export const DEMO_CONFIG = {
  ENABLE_DEMO_MODE: process.env.NEXT_PUBLIC_DEMO_MODE === "true",
  DEMO_FARM_COUNT: 3,
  DEMO_VISITOR_COUNT: 100,
  DEMO_LOG_COUNT: 50,
  SHOW_DEMO_BANNER: true,
  DEMO_BANNER_MESSAGE: "🚀 포트폴리오 데모 버전입니다. 실제 데이터가 아닙니다.",
};
```

### 4. 데모용 UI 컴포넌트

```typescript
// components/demo/DemoBanner.tsx
export function DemoBanner() {
  if (!DEMO_CONFIG.ENABLE_DEMO_MODE) return null;

  return (
    <div className="bg-blue-500 text-white text-center py-2 px-4">
      <p className="text-sm font-medium">{DEMO_CONFIG.DEMO_BANNER_MESSAGE}</p>
    </div>
  );
}
```

### 5. 데모용 라우팅 설정

```typescript
// app/demo/page.tsx - 데모 소개 페이지
export default function DemoPage() {
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">FarmPass 데모</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <DemoFeatureCard
          title="QR코드 출입 관리"
          description="방문자가 QR코드를 스캔하여 30초 만에 등록"
          icon="📱"
        />
        <DemoFeatureCard
          title="실시간 대시보드"
          description="방문 현황을 실시간으로 모니터링"
          icon="📊"
        />
        <DemoFeatureCard
          title="다중 농장 관리"
          description="한 계정으로 여러 농장 관리"
          icon="🏡"
        />
        <DemoFeatureCard
          title="PWA 지원"
          description="모바일 앱처럼 설치 가능"
          icon="📲"
        />
      </div>

      <div className="mt-8">
        <h2 className="text-2xl font-bold mb-4">데모 계정</h2>
        <div className="bg-gray-100 p-4 rounded-lg">
          <p>
            <strong>이메일:</strong> admin@demo.com
          </p>
          <p>
            <strong>비밀번호:</strong> demo123!
          </p>
          <p className="text-sm text-gray-600 mt-2">
            데모 계정으로 모든 기능을 체험해보세요.
          </p>
        </div>
      </div>
    </div>
  );
}
```

### 6. 데모용 미들웨어 설정

```typescript
// middleware.ts 수정
export function middleware(request: NextRequest) {
  // 데모 모드에서는 특정 제한 완화
  if (process.env.NEXT_PUBLIC_DEMO_MODE === "true") {
    // 데모용 특별 처리
    return handleDemoMode(request);
  }

  // 일반 미들웨어 로직
  return handleNormalMode(request);
}
```
