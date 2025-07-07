# Cloudflare Turnstile 설정 가이드

## 개요

Cloudflare Turnstile는 사용자 친화적인 캡차 시스템으로, 봇 공격을 방지하면서도 사용자 경험을 해치지 않습니다.

## 설정 단계

### 1. Cloudflare 대시보드에서 Turnstile 생성

1. [Cloudflare 대시보드](https://dash.cloudflare.com/)에 로그인
2. **Security** → **Turnstile** 메뉴로 이동
3. **Add site** 클릭
4. 설정:
   - **Domains**: `your-domain.com` (프로덕션), `localhost` (개발)
   - **Widget Mode**: `Managed` (권장)
   - **App Type**: `Non-Interactive`
   - **Security Level**: `Standard`

### 2. 환경변수 설정

#### `.env.local` 파일에 추가:

```bash
# Turnstile 설정
NEXT_PUBLIC_TURNSTILE_SITE_KEY=your_site_key_here
TURNSTILE_SECRET_KEY=your_secret_key_here
```

#### 프로덕션 환경변수:

```bash
# Vercel, Netlify 등에 환경변수 추가
NEXT_PUBLIC_TURNSTILE_SITE_KEY=your_site_key_here
TURNSTILE_SECRET_KEY=your_secret_key_here
```

### 3. 키 확인 방법

1. **Site Key**: 클라이언트에서 사용 (공개)

   - 회원가입 폼에 표시
   - 브라우저에서 접근 가능

2. **Secret Key**: 서버에서 사용 (비공개)
   - 토큰 검증용
   - 절대 클라이언트에 노출하지 않음

## 사용법

### 회원가입 페이지

```tsx
import { Turnstile } from "@/components/common";

<Turnstile
  siteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || ""}
  onVerify={(token) => setTurnstileToken(token)}
  onError={(error) => setTurnstileError(error)}
  onExpire={() => setTurnstileToken("")}
  theme="light"
  size="normal"
/>;
```

### 서버 검증

```typescript
// /api/auth/verify-turnstile
const verificationResponse = await fetch(
  "https://challenges.cloudflare.com/turnstile/v0/siteverify",
  {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      secret: process.env.TURNSTILE_SECRET_KEY || "",
      response: token,
      remoteip: clientIP,
    }),
  }
);
```

## 보안 고려사항

### 1. 도메인 제한

- 프로덕션과 개발 환경에 다른 키 사용
- 도메인별로 키 생성하여 보안 강화

### 2. IP 기반 검증

- 클라이언트 IP를 서버 검증에 포함
- 프록시 환경 고려

### 3. 토큰 만료

- 토큰은 일회성 사용
- 만료 시간 설정 (기본 5분)

## 문제 해결

### 일반적인 오류

1. **"Invalid site key"**

   - 도메인 설정 확인
   - 환경변수 확인

2. **"Invalid secret key"**

   - 서버 환경변수 확인
   - 키 복사 시 공백 확인

3. **"Token expired"**
   - 토큰 재생성 필요
   - 사용자에게 다시 시도 안내

### 디버깅

```typescript
// 개발 환경에서 로그 확인
devLog.log("Turnstile verification result:", {
  success: verificationResult.success,
  errorCodes: verificationResult["error-codes"],
  clientIP,
});
```

## 성능 최적화

### 1. 스크립트 로딩

- 비동기 로딩으로 페이지 성능 최적화
- 에러 처리로 로딩 실패 시 대응

### 2. 캐싱

- 성공한 토큰은 세션에 저장
- 불필요한 재검증 방지

## 추가 기능

### 다크 모드 지원

```tsx
<Turnstile theme="dark" />
```

### 컴팩트 모드

```tsx
<Turnstile size="compact" />
```

### 커스텀 콜백

```tsx
<Turnstile
  onVerify={(token) => {
    // 성공 시 처리
  }}
  onError={(error) => {
    // 에러 시 처리
  }}
  onExpire={() => {
    // 만료 시 처리
  }}
/>
```
