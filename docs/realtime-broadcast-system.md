# 실시간 데이터 시스템 (Supabase Broadcast)

## 개요

농장 관리 시스템에서 데이터 변경사항을 실시간으로 반영하기 위한 Supabase Broadcast 기반 실시간 시스템입니다.

## 시스템 구조

### 1. 브로드캐스트 발송 (서버 → 클라이언트)

```
API Route Handler → sendSupabaseBroadcast() → Supabase Channel → 구독 클라이언트
```

### 2. 브로드캐스트 수신 (클라이언트)

```
useSupabaseRealtime Hook → 전역 구독 → handleGlobalEvent → 데이터 refetch
```

## 주요 구성 요소

### 1. 공통 브로드캐스트 유틸 (`lib/supabase/broadcast.ts`)

```typescript
import { sendSupabaseBroadcast } from "@/lib/supabase/broadcast";

// 사용 예시
await sendSupabaseBroadcast({
  channel: "farm_updates",
  event: "farm_created",
  payload: {
    eventType: "INSERT",
    new: farmData,
    old: null,
    table: "farms",
    schema: "public",
  },
});
```

**특징:**

- 공통 에러 로깅 (console.error + Sentry)
- 성공 로그 (`devLog.log`)
- 일관된 브로드캐스트 포맷

### 2. 실시간 구독 훅 (`hooks/useSupabaseRealtime.ts`)

```typescript
import { useSupabaseRealtime } from "@/hooks/useSupabaseRealtime";

// 사용 예시
useSupabaseRealtime({
  table: "visitor_entries",
  refetch: () => queryClient.invalidateQueries(["visitors"]),
  filter: (payload) => payload.payload.new.farm_id === currentFarmId,
});
```

**특징:**

- 전역 구독 방식 (성능 최적화)
- 필터링 지원
- 자동 구독/해제 관리

## 채널 구성

| 채널명            | 테이블          | 이벤트                                             | 설명               |
| ----------------- | --------------- | -------------------------------------------------- | ------------------ |
| `profile_updates` | profiles        | profile_created, profile_updated                   | 사용자 프로필 변경 |
| `farm_updates`    | farms           | farm_created, farm_updated, farm_deleted           | 농장 정보 변경     |
| `member_updates`  | farm_members    | member_created, member_updated, member_deleted     | 농장 멤버 변경     |
| `visitor_updates` | visitor_entries | visitor_inserted, visitor_updated, visitor_deleted | 방문자 데이터 변경 |
| `log_updates`     | system_logs     | log_created, log_updated, log_deleted              | 시스템 로그 변경   |

## 적용된 API 엔드포인트

### 사용자 관련

- `POST /api/auth/register` - 회원가입 시 profile_created
- `POST /api/auth/login` - 로그인 시 profile_updated (last_login_at)
- `PUT /api/profile` - 프로필 수정 시 profile_updated

### 농장 관련

- `POST /api/farms` - 농장 생성 시 farm_created
- `PUT /api/farms/[farmId]` - 농장 수정 시 farm_updated
- `DELETE /api/farms/[farmId]` - 농장 삭제 시 farm_deleted

### 농장 멤버 관련

- `POST /api/farms/[farmId]/members` - 멤버 추가 시 member_created
- `PUT /api/farms/[farmId]/members/[memberId]` - 멤버 수정 시 member_updated
- `DELETE /api/farms/[farmId]/members/[memberId]` - 멤버 삭제 시 member_deleted

### 방문자 관련

- `POST /api/farms/[farmId]/visitors` - 방문자 등록 시 visitor_inserted
- `PUT /api/farms/[farmId]/visitors/[visitorId]` - 방문자 수정 시 visitor_updated
- `DELETE /api/farms/[farmId]/visitors/[visitorId]` - 방문자 삭제 시 visitor_deleted

### 로그 관리

- `DELETE /api/admin/logs/delete` - 로그 삭제 시 log_deleted

## 브로드캐스트 페이로드 형식

```typescript
{
  eventType: "INSERT" | "UPDATE" | "DELETE",
  new: object | null,        // 새 데이터 (INSERT, UPDATE)
  old: object | null,        // 기존 데이터 (UPDATE, DELETE)
  table: string,             // 테이블명
  schema: "public"           // 스키마
}
```

## 사용법

### 1. 새로운 API에 브로드캐스트 추가

```typescript
import { sendSupabaseBroadcast } from "@/lib/supabase/broadcast";

// 데이터 변경 후
await sendSupabaseBroadcast({
  channel: "적절한_채널명",
  event: "적절한_이벤트명",
  payload: {
    eventType: "INSERT", // 또는 UPDATE, DELETE
    new: 변경된_데이터,
    old: 기존_데이터_또는_null,
    table: "테이블명",
    schema: "public",
  },
});
```

### 2. 새로운 컴포넌트에 실시간 구독 추가

```typescript
import { useSupabaseRealtime } from "@/hooks/useSupabaseRealtime";

function MyComponent() {
  const { data, refetch } = useQuery(["my-data"], fetchMyData);

  // 실시간 구독
  useSupabaseRealtime({
    table: "테이블명",
    refetch: () => refetch(),
    filter: (payload) => {
      // 필요시 필터링 로직
      return payload.payload.new.farm_id === currentFarmId;
    },
  });

  return <div>{/* UI */}</div>;
}
```

## 성능 최적화

### 1. 전역 구독 방식

- 여러 컴포넌트가 동일 채널을 구독해도 Supabase 연결은 1개만 생성
- 콜백 등록/해제 방식으로 메모리 효율성 확보

### 2. 필터링 지원

- 불필요한 refetch 방지
- 농장별, 사용자별 데이터 필터링 가능

### 3. 에러 처리

- 브로드캐스트 실패해도 API 응답에 영향 없음
- Sentry 연동으로 에러 모니터링

## 디버깅

### 1. 브로드캐스트 발송 로그

```
[BROADCAST SUCCESS] farm_updates - farm_created 발송 완료
[BROADCAST ERROR] farm_updates - farm_created 발송 실패: Error...
```

### 2. 구독 상태 확인

- 브라우저 개발자 도구에서 Supabase 연결 상태 확인
- Network 탭에서 WebSocket 연결 모니터링

## 주의사항

### 1. 채널명/이벤트명 일관성

- 서버 브로드캐스트와 클라이언트 구독에서 동일한 채널명/이벤트명 사용 필수

### 2. 페이로드 크기 제한

- Supabase Broadcast는 큰 데이터 전송에 부적합
- 필요한 최소 정보만 포함 권장

### 3. 네트워크 연결

- 오프라인 상태에서는 실시간 업데이트 불가
- PWA 오프라인 감지와 연동 고려

## 향후 개선 계획

1. **채널명/이벤트명 상수화**

   ```typescript
   // lib/supabase/broadcast-channels.ts
   export const CHANNELS = {
     PROFILE: "profile_updates",
     FARM: "farm_updates",
     // ...
   };
   ```

2. **브로드캐스트 실패 시 재시도 로직**
3. **실시간 연결 상태 UI 표시**
4. **구독 성능 메트릭 수집**

## 관련 파일

- `lib/supabase/broadcast.ts` - 브로드캐스트 공통 유틸
- `hooks/useSupabaseRealtime.ts` - 실시간 구독 훅
- `app/api/**/*.ts` - 각 API 엔드포인트의 브로드캐스트 코드
- `components/**/*.tsx` - 실시간 구독을 사용하는 컴포넌트들

---

_최종 업데이트: 2024년 (어제-오늘 구현 완료)_
