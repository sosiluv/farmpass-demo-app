# CHANGELOG

## [2025-7-5] - 로그인 성능 최적화 및 API 클라이언트 통합

### 🚀 로그인 성능 최적화 (새로 추가)

#### 1. **로그인 시도 횟수 확인 최적화**

- **기존**: 순차적 처리 (로그인 시도 확인 → Supabase 인증)
- **개선**: 병렬 처리 (로그인 시도 확인과 Supabase 인증 동시 실행)
- **효과**: 약 200-400ms 단축
- **구현**: `Promise.all([supabase.auth.signInWithPassword(), checkLoginAttempts()])`

#### 2. **성능 로깅 최적화**

- **기존**: 각 단계마다 동기 로깅으로 응답 지연 발생
- **개선**: 비동기 로깅 (setTimeout으로 백그라운드 처리)
- **효과**: 응답 지연 제거, 약 100-200ms 단축
- **구현**: 성능 로깅을 `setTimeout(() => {}, 0)`으로 비동기 처리

#### 3. **DB 쿼리 최적화**

- **기존**: 두 개의 별도 UPDATE 쿼리 (resetLoginAttempts + updateLoginTime)
- **개선**: 단일 쿼리로 통합하여 DB 연결 오버헤드 감소
- **효과**: 약 100-200ms 단축
- **구현**: `prisma.profiles.update()`로 모든 필드 한 번에 업데이트

#### 4. **세션 설정 최적화**

- **기존**: API 응답 후 클라이언트에서 별도 세션 설정 (`supabase.auth.setSession`)
- **개선**: 서버에서 세션 쿠키 직접 설정하여 클라이언트 세션 설정 불필요
- **효과**: 약 200-300ms 단축
- **구현**: `response.cookies.set()`로 세션 쿠키 직접 설정

#### 5. **프로필 로드 최적화**

- **기존**: 실패 시 1초 대기 후 재시도
- **개선**: 즉시 재시도 + 백그라운드 로드
- **효과**: 대기 시간 제거, 약 1000ms 단축
- **구현**: 대기 시간 제거, 백그라운드에서 프로필 로드 시도

#### 6. **안전한 사용자 정보 처리**

- **문제**: `result.user.id` 접근 시 undefined 에러 발생
- **해결**: 사용자 정보 존재 여부를 먼저 확인하는 안전한 접근 방식 적용
- **구현**: `if (!result.user || !result.user.id)` 체크 추가

### 📊 성능 개선 효과

#### **현재 성능**

- **로그인 처리**: 2-4초
- **대시보드 로딩**: 3-5초
- **총 소요 시간**: 5-9초

#### **개선 후 예상 성능**

- **로그인 처리**: 1-2초 (50-60% 개선)
- **대시보드 로딩**: 2-3초 (40-50% 개선)
- **총 소요 시간**: 3-5초 (40-60% 개선)

### 🔧 최적화 코드 예시

#### 병렬 처리

```typescript
// 기존: 순차적 처리
const attempts = await checkLoginAttempts(email);
const {
  data: { user, session },
  error,
} = await supabase.auth.signInWithPassword({ email, password });

// 개선: 병렬 처리
const [authResult, attempts] = await Promise.all([
  supabase.auth.signInWithPassword({ email, password }),
  checkLoginAttempts(email),
]);
```

#### 비동기 로깅

```typescript
// 기존: 동기 로깅
await logApiPerformance({...});
return NextResponse.json(responseData);

// 개선: 비동기 로깅
setTimeout(async () => {
  await logApiPerformance({...});
}, 0);
return NextResponse.json(responseData);
```

#### 단일 DB 쿼리

```typescript
// 기존: 두 개의 별도 쿼리
await Promise.all([
  resetLoginAttempts(email, clientIP, userAgent),
  updateLoginTime(user!.id, clientIP, userAgent),
]);

// 개선: 단일 쿼리
await prisma.profiles.update({
  where: { email },
  data: {
    login_attempts: 0,
    last_failed_login: null,
    last_login_attempt: null,
    last_login_at: new Date(),
  },
});
```

#### 세션 쿠키 설정

```typescript
// 기존: 클라이언트에서 세션 설정
const { error: setSessionError } = await supabase.auth.setSession(session);

// 개선: 서버에서 쿠키 설정
response.cookies.set("sb-access-token", session!.access_token, {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax",
  maxAge: session!.expires_at ? session!.expires_at * 1000 - Date.now() : 3600,
});
```

### 📁 수정된 파일들

#### API 라우터

- `app/api/auth/login/route.ts` - 로그인 성능 최적화 (병렬 처리, 비동기 로깅, 단일 쿼리, 세션 쿠키)

#### 컴포넌트

- `components/providers/auth-provider.tsx` - 프로필 로드 최적화, 안전한 사용자 정보 처리

---

## [2025-7-5] - API 클라이언트 통합 및 에러 처리 패턴 개선

### 🔄 주요 변경사항

#### 1. **fetch → apiClient 통일 및 에러 처리 패턴**

- **변경**: 모든 fetch 호출을 공통 fetch wrapper(apiClient)로 통일
- **변경**: 에러 처리는 handleError로 일관성 유지
- **변경**: 토스트 알림은 컴포넌트에서만 처리하는 패턴 적용
- **문제 해결**: apiClient와 handleError에서 토스트 중복 호출 문제 발견 및 해결
- **리팩토링**: apiClient에서만 토스트를 처리하고 handleError는 상태 업데이트만 담당하도록 구조 개선

#### 2. **apiClient context 옵션 및 handleError 일관성**

- **개선**: apiClient 호출에 context 옵션이 일관되지 않은 점 수정
- **적용**: 주요 파일에 context 추가 (useAccountActions, useNotificationPermission, useNotificationService, useNotificationSettings 등)
- **구조 통일**: 훅에서는 에러 상태만 관리, 토스트는 컴포넌트에서만 처리하도록 구조 통일
- **확인**: handleError가 Sentry 외부 로깅에 필요하다는 점 확인

#### 3. **캐시/헤더/세션 만료 처리**

- **수정**: system-settings-cache.ts에서 handleError 누락과 no-cache 헤더 문제 수정
- **변경**: app/api/settings/route.ts의 캐시 헤더를 max-age=300에서 no-store로 변경
- **설명**: HTTP 캐시와 애플리케이션 캐시의 차이, max-age와 no-store의 차이, 서버 메모리 캐시의 역할 설명
- **개선**: 세션 만료 시 로그인 페이지로 리다이렉트하는 방식 적용
- **구현**: 일반적인 세션 만료 처리(401/403), fetch 유틸에서 세션 관리 로직의 일반성, 미들웨어에서 인증/권한 체크, 자동 로그아웃 및 쿠키 정리, 토큰 자동 갱신 시도 등 세션 관리 개선

#### 4. **세션 관리 및 미들웨어 개선**

- **구현**: lib/auth/authService.ts에서 토큰 만료 확인, 자동 갱신, 세션 유효성 검증 함수 구현
- **개선**: 토큰 만료 시간 확인 공통 함수 (checkTokenExpiration) 구현
- **구현**: 쿠키 정리 공통 함수 (clearSessionCookies) 구현
- **개선**: 토큰 갱신 함수 (refreshToken) - 중복 요청 방지 로직 포함
- **구현**: 세션 만료 처리 함수 (handleSessionExpired) - 토스트 제거, 상태만 반환
- **개선**: 로그아웃 함수 (logout) - 브라우저 구독 해제, 서버 구독 정리, 강제 로그아웃 시 로컬 스토리지 정리
- **구현**: 세션 유효성 검증 함수 (validateSession) - 토큰 만료 여부, 갱신 필요 여부 확인
- **개선**: middleware.ts에서 토큰 검증 및 자동 갱신 로직 구현
- **구현**: 미들웨어에서 세션 만료 시 서버 측 구독 정리 로직
- **개선**: 미들웨어에서 공개 경로 매칭, 인증 상태 검증, 보안 로깅 구현

#### 5. **PWA 설치/가이드/다이얼로그 큐**

- **구현**: PWA 설치 가능 여부 체크 훅, 설치 유도 UI, 플랫폼별 설치 가이드, 테스트 페이지
- **추가**: 메인 레이아웃/대시보드에 설치 가이드 버튼 추가
- **개선**: 알림 권한 다이얼로그와 PWA 설치 프롬프트가 중첩되지 않도록 다이얼로그 큐 시스템을 Zustand로 구현
- **우선순위**: 우선순위에 따라 다이얼로그를 순차적으로 표시하도록 구현
- **설정**: 디버그 패널은 다이얼로그 큐와 별개로 항상 표시되도록 설정

#### 6. **UI/다크모드/ThemeProvider**

- **논의**: ThemeProvider가 실제로 다크/라이트 테마 전환을 지원하는지, 어디서 사용되는지, 다크모드가 실제로 적용되는지, 테마 토글 버튼을 추가하는 방법, 다크모드 적용 범위(admin 전용) 등 UI/UX 관련 논의 진행
- **개선**: 다크모드에서 필터, 테이블, 버튼, 뱃지 등 텍스트/아이콘이 잘 안 보이는 문제를 반복적으로 개선(다크 스타일, !important, style 속성 등)

#### 7. **FarmsProvider 적용 범위**

- **분석**: FarmsProvider가 루트에서 필요한지, 실제로 admin 이외 경로에서 사용되는지 코드베이스 전체를 분석
- **정리**: admin 전용에서만 감싸도록 구조 정리

#### 8. **apiClient/fetch 구조분해 할당 및 응답 구조**

- **설명**: apiClient가 fetch와 동일하게 동작하는지, 구조분해 할당이 안 되는 원인(응답 구조 차이), 배열/객체 반환에 따른 올바른 구조분해 할당 방법, 실제 코드에서의 적용 예시를 상세히 설명
- **개선**: use-farm-members-store.ts, use-visitor-store.ts 등에서 구조분해 할당, 변수명 중복, 방어 코드, API 응답 구조에 따른 올바른 사용법 안내
- **해결**: admin/farms/[farmId]/members 페이지 무한로딩 및 map is not a function 오류의 원인을 apiClient/fetch 응답 구조, 구조분해 할당, API 응답값 방어 코드 등에서 진단하고, 올바른 패턴 안내

### 📁 수정된 파일들

#### 훅 (Hooks)

- `hooks/useAccountActions.ts` - 토스트 제거, apiClient 통일
- `hooks/useNotificationSettings.ts` - apiClient 응답 구조 확인 및 수정
- `hooks/useNotificationService.ts` - apiClient 응답 구조 확인 및 수정
- `hooks/useNotificationPermission.ts` - apiClient 응답 구조 확인 및 수정
- `hooks/useVisitorSettings.ts` - apiClient 응답 구조 확인 및 수정
- `hooks/useVisitorForm.ts` - apiClient 응답 구조 확인 및 수정
- `hooks/useSubscriptionManager.ts` - apiClient 응답 구조 확인 및 수정

#### 스토어 (Store)

- `store/use-farms-store.ts` - apiClient 응답 구조 확인 및 수정
- `store/use-farm-members-store.ts` - apiClient 응답 구조 확인 및 수정
- `store/use-visitor-store.ts` - apiClient 응답 구조 확인 및 수정

#### 유틸리티 (Utils)

- `lib/utils/validation/validation.ts` - apiClient 응답 구조 확인 및 수정
- `lib/cache/system-settings-cache.ts` - handleError 누락 수정, no-cache 헤더 문제 수정
- `lib/auth/authService.ts` - 세션 관리 함수들 구현 (토큰 갱신, 세션 유효성 검증, 로그아웃 등)
- `middleware.ts` - 토큰 검증 및 자동 갱신 로직, 세션 만료 시 구독 정리 로직 구현

#### 컴포넌트 (Components)

- `components/providers/auth-provider.tsx` - apiClient 응답 구조 확인 및 수정
- `components/admin/notifications/NotificationSettingsActions.tsx` - apiClient 응답 구조 확인 및 수정
- `components/admin/management/logs/LogsActionManager.tsx` - apiClient 응답 구조 확인 및 수정

#### 페이지 (Pages)

- `app/reset-password/page.tsx` - apiClient 응답 구조 확인 및 수정
- `app/admin/monitoring/page.tsx` - apiClient 응답 구조 확인 및 수정

### 🔧 기술적 개선사항

#### API 응답 구조 패턴 통일

```javascript
// 목록 조회 (GET)
const { farms } = await apiClient("/api/farms", { method: "GET" });
const { members } = await apiClient("/api/farm-members", { method: "GET" });

// 단건 생성 (POST)
const { farm } = await apiClient("/api/farms", { method: "POST", body: ... });
const visitor = await apiClient("/api/farms/${farmId}/visitors", { method: "POST", body: ... });

// 단건 수정 (PUT)
const { farm } = await apiClient(`/api/farms/${farmId}`, { method: "PUT", body: ... });

// 단건 삭제 (DELETE)
await apiClient(`/api/farms/${farmId}`, { method: "DELETE" });
```

#### 에러 처리 패턴 통일

```javascript
// 훅에서는 에러 상태만 관리
onError: (error, context) => {
  handleError(error, {
    context,
    onStateUpdate: (errorMessage) => {
      setError(new Error(errorMessage));
    },
  });
};

// 컴포넌트에서만 토스트 처리
toast.showError("오류", error.message);
```

#### 세션 관리 패턴

```javascript
// 토큰 만료 확인
const { isExpired, needsRefresh } = checkTokenExpiration(session, 5);

// 토큰 자동 갱신
const success = await refreshToken();

// 세션 유효성 검증
const { isValid, needsRefresh, error } = await validateSession();

// 세션 만료 처리
const { success, message } = await handleSessionExpired();
```

#### 구조분해 할당 패턴

```javascript
// 안전한 방법 (권장)
const { members = [] } = await apiClient("/api/farm-members", {
  method: "GET",
});

// 간단한 방법
const { members } = await apiClient("/api/farm-members", { method: "GET" });
```

### 🎯 해결된 문제들

1. **토스트 중복 호출 문제** - apiClient와 handleError에서 중복 토스트 호출 방지
2. **구조분해 할당 오류** - API 응답 구조에 따른 올바른 구조분해 할당 패턴 적용
3. **map is not a function 오류** - 배열 응답 처리 시 방어 코드 추가
4. **캐시 헤더 문제** - no-store vs max-age 캐시 헤더 적절한 사용
5. **세션 만료 처리** - 일관된 세션 만료 처리 및 리다이렉트 로직
6. **토큰 자동 갱신** - 미들웨어에서 토큰 만료 시 자동 갱신 시도
7. **구독 정리** - 세션 만료 시 브라우저 및 서버 구독 자동 정리
8. **다크모드 가독성** - 다크모드에서 UI 요소들의 가독성 개선

### 📈 성능 개선

- **중복 요청 방지**: 쿨다운 및 중복 요청 체크 로직 개선
- **캐시 최적화**: 적절한 캐시 헤더 설정으로 불필요한 요청 감소
- **에러 처리 최적화**: 일관된 에러 처리로 사용자 경험 개선

### 🔒 보안 개선

- **세션 관리**: 안전한 세션 만료 처리 및 자동 로그아웃
- **토큰 관리**: 토큰 만료 시 자동 갱신 및 안전한 세션 정리
- **구독 정리**: 세션 만료 시 푸시 알림 구독 자동 정리
- **에러 로깅**: 민감한 정보 노출 방지를 위한 에러 메시지 처리
- **권한 검증**: 일관된 권한 검증 로직 적용
- **미들웨어 보안**: 모든 요청에 대한 인증 상태 검증 및 로깅

---

## [2024-12-18] - 이전 작업 내용

### 🔄 주요 변경사항

#### 1. **PWA 기능 구현**

- next-pwa를 사용한 PWA 기능 구현
- 오프라인 상태 감지 및 안내 기능 구현
- 홈화면 추가 기능 지원
- 푸시 알림 기능 구현

#### 2. **다중 농장 관리**

- 계정 1개로 여러 농장 등록 가능하도록 구현
- 농장별 권한 관리 구현
- 농장별 QR코드 생성 및 관리 기능 구현

#### 3. **권한 관리**

- admin, owner, manager, viewer 역할 구현
- 역할별 접근 권한 엄격 관리
- 권한 변경은 admin만 가능하도록 구현

#### 4. **모바일 최적화**

- 모바일 우선 반응형 디자인 적용
- 터치 친화적 UI 구현 (최소 48px 버튼)
- 입력 필드는 모바일에 최적화
- PWA 기능을 활용한 모바일 경험 개선

### 📁 주요 구현 파일들

- PWA 관련 설정 및 컴포넌트
- 농장 관리 시스템
- 권한 관리 시스템
- 모바일 최적화 컴포넌트

---

## 📝 참고사항

- 모든 변경사항은 기존 기능을 유지하면서 개선
- 하위 호환성 보장
- 성능 및 보안 최적화 우선
- 사용자 경험 개선에 중점

## [Unreleased]

### 🚀 성능 최적화

- **PWA 설치 훅 최적화**: `usePWAInstall` 훅의 중복 호출 문제 해결
  - Context Provider 패턴 도입으로 전역 상태 관리
  - 4개 컴포넌트에서 개별 호출 → 1개 Provider에서 중앙 관리
  - 브라우저 환경 체크 함수 메모이제이션
  - 불필요한 리렌더링 방지 및 성능 향상
  - SSR 호환성 개선 (브라우저 환경 체크)

### 🔧 기술적 개선

- **PWA Provider 구조 개선**:
  - `components/providers/pwa-provider.tsx` 신규 생성
  - 기존 `hooks/usePWAInstall.ts` 삭제 및 Provider로 완전 대체
  - `usePWALoading` 훅 추가로 로딩 상태 관리
  - Context 값 메모이제이션으로 불필요한 리렌더링 방지

### 📱 PWA 기능

- **설치 프롬프트 최적화**:
  - 전역 다이얼로그 큐 시스템과 통합
  - 알림 권한 다이얼로그와 우선순위 관리
  - 24시간 거부 기록 및 자동 재표시 로직

### 🎨 UI/UX 개선

- **Toast 메시지 variant 활용 강화**:

  - `showWarning`: 설정 저장, 긴급 알림, 데이터 로딩 지연, 권한 부여, 에러 테스트 등에 적용
  - `showInfo`: 설정 저장 시작, 알림 발송 시작, 내보내기 시작, 로그 정리, 방문자 등록, 이미지 업로드 등에 적용
  - `showError`: 방문자 작업 실패, 네트워크 오류 등 심각한 오류에 적용
  - 더 직관적이고 일관된 사용자 피드백 제공
  - 메시지 타입별 시각적 구분으로 사용자 경험 향상
  - 진행 상황과 결과를 명확히 구분하여 사용자 혼란 방지

- **Toast 메시지 variant 일관성 완전 적용**:
  - 전체 애플리케이션에서 `toast.showInfo`, `toast.showWarning`, `toast.showError`, `toast.showSuccess` 패턴 통일
  - 설정 유효성 검사, 이미지 관리, 사용자/농장 데이터 관리, 멤버 작업 등 모든 영역에 일관된 적용
  - 작업 시작 시 `showInfo`, 입력 오류 등 경계 상황에 `showWarning`, 실패 시 `showError`, 성공 시 `showSuccess` 패턴 적용
  - 사용자에게 일관되고 명확한 피드백 제공으로 전체적인 사용자 경험 개선

## [1.2.0] - 2024-12-19

### 🚀 성능 최적화

- **로그인 프로세스 대폭 개선**:
  - 로그인 시도 횟수 확인과 Supabase 인증 병렬 처리 (Promise.all)
  - 비동기 성능 로깅으로 응답 지연 방지
  - DB 쿼리 통합으로 데이터베이스 호출 최소화
  - 서버에서 세션 쿠키 직접 설정으로 클라이언트 작업 감소
  - 프로필 로드 즉시 재시도 및 백그라운드 로드
  - 예상 성능 향상: 로그인 2-4초 → 1-2초, 대시보드 3-5초 → 2-3초

### 🔧 기술적 개선

- **API 라우터 최적화**:
  - 로그인 API에서 병렬 처리 도입
  - 성능 모니터링 강화
  - 에러 처리 개선 및 안전성 향상
  - 세션 관리 최적화

### 🐛 버그 수정

- **로그인 에러 처리 개선**:
  - `result.user.id` undefined 에러 안전 처리
  - 로그인 실패 시 적절한 에러 메시지 표시
  - 계정 잠금 상태 정확한 처리
