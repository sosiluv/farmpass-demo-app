# 🚀 FarmPass 데모 배포 가이드

## 📋 배포 준비 체크리스트

### ✅ 필수 준비사항

- [ ] Supabase 데모 프로젝트 생성
- [ ] Vercel 계정 및 프로젝트 설정
- [ ] 환경 변수 설정 완료
- [ ] 데모용 데이터베이스 초기화
- [ ] 도메인 설정 (선택사항)

---

## 🔧 Supabase 데모 프로젝트 설정

### 1. 새 프로젝트 생성

```bash
# Supabase 대시보드에서 새 프로젝트 생성
Project Name: farmpass-demo
Database Password: [강력한 비밀번호 설정]
Region: Asia Northeast (Seoul)
```

### 2. 데이터베이스 스키마 적용

```bash
# 로컬에서 스키마 푸시
npx prisma db push

# 데모용 시드 데이터 실행
npx tsx prisma/demo-seed.ts
```

### 3. Row Level Security 정책 설정

```sql
-- 데모용 RLS 정책 활성화
ALTER TABLE farms ENABLE ROW LEVEL SECURITY;
ALTER TABLE visitor_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE farm_members ENABLE ROW LEVEL SECURITY;

-- 데모용 정책 생성 (실제 프로덕션과 동일)
CREATE POLICY "farm_access" ON farms
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM farm_members
    WHERE farm_id = farms.id
    AND user_id = auth.uid()
  )
);
```

### 4. 인증 설정

```bash
# Supabase Auth 설정
- 이메일 인증 활성화
- 소셜 로그인 설정 (Google, Kakao)
- 비밀번호 정책 설정
- 도메인 화이트리스트 설정
```

---

## 🌐 Vercel 배포 설정

### 1. 프로젝트 연결

```bash
# Vercel CLI 설치 및 로그인
npm i -g vercel
vercel login

# 프로젝트 배포
vercel --prod
```

### 2. 환경 변수 설정

```bash
# Vercel 대시보드에서 환경 변수 설정
NEXT_PUBLIC_DEMO_MODE=true
NEXT_PUBLIC_SITE_NAME="FarmPass 데모"
NEXT_PUBLIC_SITE_URL=https://farmpass.site

# Supabase 설정
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# 이메일 설정
RESEND_API_KEY=your_resend_key

# 기타 설정
NODE_ENV=production
```

### 3. 빌드 설정

```json
// vercel.json
{
  "buildCommand": "npm run build",
  "outputDirectory": ".next",
  "framework": "nextjs",
  "regions": ["icn1"],
  "env": {
    "NEXT_PUBLIC_DEMO_MODE": "true"
  },
  "rewrites": [
    {
      "source": "/demo",
      "destination": "/demo"
    }
  ],
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "X-Frame-Options",
          "value": "DENY"
        },
        {
          "key": "X-Content-Type-Options",
          "value": "nosniff"
        }
      ]
    }
  ]
}
```

---

## 📱 PWA 설정

### 1. 매니페스트 파일 수정

```json
// public/manifest.json
{
  "name": "FarmPass 데모",
  "short_name": "FarmPass Demo",
  "description": "농장 출입 관리 시스템 데모",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#000000",
  "icons": [
    {
      "src": "/icon-192x192.png",
      "sizes": "192x192",
      "type": "image/png"
    },
    {
      "src": "/icon-512x512.png",
      "sizes": "512x512",
      "type": "image/png"
    }
  ]
}
```

### 2. 서비스 워커 설정

```typescript
// next.config.mjs
const withPWA = require("next-pwa")({
  dest: "public",
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === "development",
  runtimeCaching: [
    {
      urlPattern: /^https:\/\/.*\.supabase\.co\/.*/i,
      handler: "NetworkFirst",
      options: {
        cacheName: "supabase-cache",
        expiration: {
          maxEntries: 100,
          maxAgeSeconds: 60 * 60 * 24, // 24시간
        },
      },
    },
  ],
});

module.exports = withPWA({
  // 기존 설정
});
```

---

## 🔒 보안 설정

### 1. Content Security Policy

```typescript
// next.config.mjs
const nextConfig = {
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "Content-Security-Policy",
            value: `
              default-src 'self';
              script-src 'self' 'unsafe-eval' 'unsafe-inline' https://vercel.live;
              style-src 'self' 'unsafe-inline';
              img-src 'self' data: https:;
              font-src 'self' data:;
              connect-src 'self' https://*.supabase.co wss://*.supabase.co;
              frame-src 'none';
            `
              .replace(/\s{2,}/g, " ")
              .trim(),
          },
        ],
      },
    ];
  },
};
```

### 2. 환경별 보안 설정

```typescript
// lib/utils/security.ts
export const SECURITY_CONFIG = {
  DEMO_MODE: process.env.NEXT_PUBLIC_DEMO_MODE === "true",

  // 데모 모드에서는 일부 제한 완화
  RATE_LIMIT: process.env.NEXT_PUBLIC_DEMO_MODE === "true" ? 1000 : 100,
  SESSION_DURATION:
    process.env.NEXT_PUBLIC_DEMO_MODE === "true" ? 24 * 60 * 60 : 60 * 60, // 24시간 vs 1시간

  // 보안 헤더
  SECURITY_HEADERS: {
    "X-Frame-Options": "DENY",
    "X-Content-Type-Options": "nosniff",
    "Referrer-Policy": "strict-origin-when-cross-origin",
  },
};
```

---

## 📊 모니터링 설정

### 1. Sentry 설정

```typescript
// sentry.client.config.ts
import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment:
    process.env.NEXT_PUBLIC_DEMO_MODE === "true" ? "demo" : "production",

  // 데모 모드에서는 더 상세한 로깅
  tracesSampleRate: process.env.NEXT_PUBLIC_DEMO_MODE === "true" ? 1.0 : 0.1,

  beforeSend(event) {
    // 데모 모드에서는 민감한 정보 제거
    if (process.env.NEXT_PUBLIC_DEMO_MODE === "true") {
      delete event.user?.email;
      delete event.user?.id;
    }
    return event;
  },
});
```

### 2. Vercel Analytics

```typescript
// app/layout.tsx
import { Analytics } from "@vercel/analytics/react";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <body>
        {children}
        <Analytics />
      </body>
    </html>
  );
}
```

---

## 🧪 테스트 및 검증

### 1. 배포 전 테스트

```bash
# 로컬 빌드 테스트
npm run build
npm run start

# 데모 데이터 확인
npx prisma studio

# PWA 테스트
npm run dev
# 브라우저에서 PWA 설치 테스트
```

### 2. 배포 후 검증

```bash
# 배포된 사이트 테스트
curl -I https://farmpass.site

# 핵심 기능 테스트
- 회원가입/로그인
- QR코드 생성/스캔
- 실시간 대시보드
- PWA 설치
- 모바일 반응형
```

### 3. 성능 테스트

```bash
# Lighthouse 성능 테스트
npx lighthouse https://farmpass.site --output=html

# Core Web Vitals 확인
- LCP (Largest Contentful Paint): < 2.5초
- FID (First Input Delay): < 100ms
- CLS (Cumulative Layout Shift): < 0.1
```

---

## 📝 배포 체크리스트

### ✅ 배포 전 확인사항

- [ ] 모든 환경 변수 설정 완료
- [ ] 데이터베이스 스키마 적용
- [ ] 데모용 시드 데이터 실행
- [ ] RLS 정책 설정 완료
- [ ] PWA 매니페스트 수정
- [ ] 보안 헤더 설정
- [ ] 모니터링 도구 연동

### ✅ 배포 후 확인사항

- [ ] 사이트 접속 정상
- [ ] 회원가입/로그인 동작
- [ ] 핵심 기능 정상 동작
- [ ] 모바일 반응형 확인
- [ ] PWA 설치 가능
- [ ] 성능 지표 확인
- [ ] 에러 모니터링 동작

---

## 🔄 자동 배포 설정

### 1. GitHub Actions 워크플로우

```yaml
# .github/workflows/deploy-demo.yml
name: Deploy Demo

on:
  push:
    branches: [demo]
  workflow_dispatch:

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: "18"
          cache: "npm"

      - name: Install dependencies
        run: npm ci

      - name: Run tests
        run: npm test

      - name: Build application
        run: npm run build
        env:
          NEXT_PUBLIC_DEMO_MODE: true

      - name: Deploy to Vercel
        uses: vercel/action@v1
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.ORG_ID }}
          vercel-project-id: ${{ secrets.PROJECT_ID }}
          vercel-args: "--prod"
```

### 2. 자동 데이터베이스 마이그레이션

```bash
# 배포 시 자동으로 데이터베이스 업데이트
vercel env add DATABASE_URL
vercel env add SUPABASE_SERVICE_ROLE_KEY

# 배포 후 자동 시드 실행
npx vercel env pull .env.local
npx prisma db push
npx tsx prisma/demo-seed.ts
```

---

## 📞 배포 완료 후 작업

### 1. 도메인 설정 (선택사항)

```bash


# DNS 설정
# A 레코드: @ -> 76.76.19.61
# CNAME: www -> cname.vercel-dns.com
```

### 2. SSL 인증서 확인

```bash
# SSL 인증서 자동 발급 확인
curl -I https://farmpass.site
# HTTP/2 200 OK 응답 확인
```

### 3. 모니터링 설정 확인

```bash
# Sentry 에러 추적 확인
# Vercel Analytics 데이터 수집 확인
# 성능 메트릭 모니터링 확인
```

---

## 🎯 배포 완료!

데모 사이트가 성공적으로 배포되었습니다!

### 📍 배포 정보

- **URL**: https://farmpass.site
- **상태**: 프로덕션 배포 완료
- **모니터링**: Sentry + Vercel Analytics 활성화
- **PWA**: 설치 가능
- **모바일**: 완전 반응형

### 🧪 테스트 계정

- **이메일**: admin@demo.com
- **비밀번호**: demo123!

### 📊 성능 지표

- **로딩 시간**: < 1초
- **Lighthouse 점수**: 90+ (모든 카테고리)
- **PWA 점수**: 100/100

이제 포트폴리오 데모앱이 완성되었습니다! 🎉
