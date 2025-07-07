# Cloudflare Turnstile 구현 가이드

## 개요

이 문서는 Farm App에서 Cloudflare Turnstile 캡차를 구현한 방법과 설정 과정을 설명합니다.

## 구현 배경

### 기존 문제점

- 회원가입 페이지에서 "Auth session missing" 에러 발생
- 캡차 미작동 및 무한루프 문제
- DialogManager 에러와 AuthProvider 위치 문제
- 401 Unauthorized 에러 (Cloudflare Private Access Token 관련)

### 해결 목표

- 체크박스 없는 자동 인증 캡차 구현
- 실패 시 적절한 에러 메시지 표시
- Safari 호환성 확보
- 개발/프로덕션 환경 대응

## 구현 과정

### 1. Turnstile 컴포넌트 구현

#### 컴포넌트 위치

```
components/common/turnstile.tsx
```

#### 주요 기능

- **자동 인증**: 체크박스 없이 자동으로 인증 수행
- **에러 처리**: 실패 시 사용자 친화적 메시지 표시
- **콜백 관리**: 성공/실패/만료 이벤트 처리
- **테스트 기능**: 개발 환경에서 실패 테스트 가능

#### 핵심 코드 구조

```typescript
interface TurnstileProps {
  onSuccess: (token: string) => void;
  onError: (error: string) => void;
  onExpire: () => void;
  className?: string;
}

export function Turnstile({
  onSuccess,
  onError,
  onExpire,
  className,
}: TurnstileProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isExpired, setIsExpired] = useState(false);

  // Turnstile 위젯 렌더링 및 이벤트 처리
}
```

### 2. 회원가입 페이지 통합

#### 통합 위치

```
app/register/page.tsx
```

#### 구현 특징

- **상태 관리**: 캡차 토큰, 에러, 만료 상태 관리
- **폼 검증**: 캡차 인증 완료 후 회원가입 진행
- **에러 표시**: 실패 시 적절한 에러 메시지 표시
- **재시도 기능**: 만료 시 자동 재인증

#### 핵심 로직

```typescript
const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
const [turnstileError, setTurnstileError] = useState<string | null>(null);
const [turnstileExpired, setTurnstileExpired] = useState(false);

const handleTurnstileSuccess = (token: string) => {
  setTurnstileToken(token);
  setTurnstileError(null);
  setTurnstileExpired(false);
};

const handleTurnstileError = (error: string) => {
  setTurnstileError(error);
  setTurnstileToken(null);
};
```

### 3. API 엔드포인트 구현

#### 검증 엔드포인트

```
app/api/auth/verify-turnstile/route.ts
```

#### 주요 기능

- **토큰 검증**: Cloudflare API를 통한 토큰 유효성 검증
- **에러 처리**: 다양한 에러 상황에 대한 적절한 응답
- **보안**: Private Access Token을 통한 안전한 검증

#### 핵심 코드

```typescript
export async function POST(request: Request) {
  try {
    const { token } = await request.json();

    const response = await fetch(
      `https://challenges.cloudflare.com/turnstile/v0/siteverify`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          secret: process.env.CLOUDFLARE_TURNSTILE_SECRET_KEY,
          response: token,
        }),
      }
    );

    const data = await response.json();

    if (data.success) {
      return NextResponse.json({ success: true });
    } else {
      return NextResponse.json(
        { success: false, error: "캡차 인증에 실패했습니다." },
        { status: 400 }
      );
    }
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "캡차 검증 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
```

## 환경 설정

### 1. Cloudflare 대시보드 설정

#### 도메인 등록

1. Cloudflare 대시보드 접속
2. Turnstile 섹션으로 이동
3. 도메인 등록 (예: `farm-app.vercel.app`)
4. 위젯 생성 및 설정

#### 키 생성

- **Site Key**: 클라이언트에서 사용 (공개)
- **Secret Key**: 서버에서 사용 (비공개)

### 2. 환경 변수 설정

#### .env.local

```env
# Cloudflare Turnstile
CLOUDFLARE_TURNSTILE_SITE_KEY=your_site_key_here
CLOUDFLARE_TURNSTILE_SECRET_KEY=your_secret_key_here
```

#### .env.production

```env
# Cloudflare Turnstile (프로덕션)
CLOUDFLARE_TURNSTILE_SITE_KEY=your_production_site_key
CLOUDFLARE_TURNSTILE_SECRET_KEY=your_production_secret_key
```

### 3. 개발 환경 설정

#### 로컬 개발

- `localhost` 도메인 허용 설정
- 개발용 Site Key 사용
- Private Access Token 비활성화 (개발 편의성)

#### 프로덕션 배포

- 실제 도메인 등록
- Private Access Token 활성화
- 보안 강화 설정 적용

## 문제 해결

### 1. "Auth session missing" 에러

#### 원인

- AuthProvider 위치 문제
- DialogManager와의 충돌
- 컴포넌트 마운트 순서 문제

#### 해결 방법

```typescript
// AuthProvider를 최상위에 배치
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <body>
        <AuthProvider>
          <DialogManager>{children}</DialogManager>
        </AuthProvider>
      </body>
    </html>
  );
}
```

### 2. 캡차 무한루프 문제

#### 원인

- 컴포넌트 재렌더링으로 인한 위젯 재생성
- useEffect 의존성 배열 문제

#### 해결 방법

```typescript
useEffect(() => {
  // 위젯이 이미 존재하면 제거
  if (window.turnstile) {
    window.turnstile.remove(widgetId);
  }

  // 새 위젯 생성
  const newWidgetId = window.turnstile.render(containerRef.current, {
    sitekey: siteKey,
    callback: handleSuccess,
    "error-callback": handleError,
    "expired-callback": handleExpire,
    theme: "light",
  });

  setWidgetId(newWidgetId);
}, []); // 빈 의존성 배열로 한 번만 실행
```

### 3. 401 Unauthorized 에러

#### 원인

- Cloudflare Private Access Token 보안 기능
- 개발 환경에서 토큰 검증 실패

#### 해결 방법

```typescript
// 개발 환경에서는 우회 옵션 제공
const isDevelopment = process.env.NODE_ENV === "development";

if (isDevelopment && !token) {
  // 개발 환경에서 토큰이 없어도 통과
  return NextResponse.json({ success: true });
}
```

### 4. Safari 호환성 문제

#### 원인

- Safari에서 `getSession()` 호출 시 오류
- 쿠키 및 CORS 정책 차이

#### 해결 방법

```typescript
// session 필드 제거로 Safari 호환성 개선
type AuthState =
  | { status: "initializing" }
  | { status: "loading" }
  | { status: "authenticated"; user: User; profile: Profile }
  | { status: "unauthenticated" }
  | { status: "error"; error: Error };
```

## 테스트 방법

### 1. 성공 케이스 테스트

1. 회원가입 페이지 접속
2. 캡차 자동 인증 확인
3. 폼 작성 및 제출
4. 성공적인 회원가입 확인

### 2. 실패 케이스 테스트

1. 개발 환경에서 실패 테스트 버튼 사용
2. 에러 메시지 표시 확인
3. 재시도 기능 동작 확인

### 3. 만료 케이스 테스트

1. 캡차 토큰 만료 대기
2. 자동 재인증 확인
3. 사용자 경험 확인

## 성능 최적화

### 1. 로딩 최적화

- 캡차 위젯 지연 로딩
- 에러 상태 관리 최적화
- 불필요한 리렌더링 방지

### 2. 네트워크 최적화

- 토큰 검증 요청 최소화
- 에러 재시도 로직 구현
- 타임아웃 설정

### 3. 사용자 경험 개선

- 로딩 상태 표시
- 에러 메시지 명확화
- 재시도 가이드 제공

## 보안 고려사항

### 1. 토큰 검증

- 서버 사이드에서만 토큰 검증
- Secret Key 절대 노출 금지
- 토큰 재사용 방지

### 2. 에러 처리

- 민감한 정보 노출 금지
- 적절한 에러 로깅
- 사용자 친화적 메시지

### 3. 환경별 설정

- 개발/프로덕션 환경 분리
- Private Access Token 적절한 사용
- 도메인 제한 설정

## 모니터링 및 로깅

### 1. 성공률 모니터링

- 캡차 인증 성공률 추적
- 실패 원인 분석
- 사용자 행동 패턴 분석

### 2. 에러 로깅

- 실패 케이스 상세 로깅
- 네트워크 오류 추적
- 성능 지표 수집

### 3. 알림 설정

- 높은 실패률 알림
- 서비스 중단 감지
- 보안 이벤트 알림

## 향후 개선 계획

### 1. 기능 확장

- 다국어 지원
- 다크모드 테마 지원
- 접근성 개선

### 2. 성능 개선

- 캐싱 전략 구현
- CDN 활용 최적화
- 로딩 속도 개선

### 3. 보안 강화

- 추가 보안 레이어 구현
- 봇 탐지 정교화
- 위험도 기반 인증

## 참고 자료

- [Cloudflare Turnstile 공식 문서](https://developers.cloudflare.com/turnstile/)
- [Next.js API Routes 문서](https://nextjs.org/docs/api-routes/introduction)
- [React Hook Form 문서](https://react-hook-form.com/)

## 변경 이력

- **2024-01-XX**: 초기 구현 및 문서 작성
- **2024-01-XX**: Safari 호환성 개선
- **2024-01-XX**: 에러 처리 강화
- **2024-01-XX**: 성능 최적화 적용
