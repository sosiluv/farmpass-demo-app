# 🚀 React Query 점진적 마이그레이션 계획

## 📋 브랜치 전략

```
dev (메인 개발 브랜치)
└── feature/react-query-migration (마이그레이션 브랜치)
```

## 🎯 마이그레이션 단계별 계획

### Phase 1: 기반 구조 설정 ✅

- [x] React Query 패키지 설치
- [x] QueryProvider 설정
- [x] Auth 연동 유틸리티 생성
- [x] 첫 번째 Hook 마이그레이션 (Farm Visitors)

### Phase 2: 핵심 데이터 Hook 마이그레이션 ✅

- [x] `use-farm-visitors.ts` → `use-farm-visitors-query.ts`
- [x] `use-farms.ts` → `use-farms-query.ts`
- [x] `use-farm-members-preview-safe.ts` → `use-farm-members-query.ts`
- [x] 비교 테스트 컴포넌트 생성
- [x] 테스트 페이지 구축

### Phase 3: 실제 서비스 페이지 적용 ✅

- [x] 대시보드 페이지 (`/admin/dashboard`)
- [x] 방문자 페이지 (`/admin/visitors`)
- [x] 농장별 방문자 페이지 (`/admin/farms/[farmId]/visitors`)
- [x] 농장별 멤버 페이지 (`/admin/farms/[farmId]/members`)
- [x] Feature Flag 기반 점진적 전환
- [x] UI에 현재 모드 표시

### Phase 4: 고급 기능 구현 ✅

- [x] **Mutation Hook 구현**
  - [x] `use-visitor-mutations.ts`: 방문자 CRUD 작업 (토스트 메시지 분리)
  - [x] `use-farm-mutations.ts`: 농장 CRUD 작업
  - [x] `use-farm-member-mutations.ts`: 멤버 관리 작업
- [x] **Optimistic Updates**
  - [x] `use-optimistic-visitor-mutations.ts`: 낙관적 업데이트 적용
  - [x] 실시간 UI 업데이트 (네트워크 응답 대기 없음)
  - [x] 에러 시 자동 롤백 기능
- [x] **필터링 기능**
  - [x] `use-farm-visitors-filtered-query.ts`: 고급 필터링 지원
  - [x] 검색, 날짜 범위, 방역 여부, 동의 여부, 방문 목적 필터
  - [x] 실시간 필터링 및 클라이언트 사이드 검색
  - [x] 방문 목적 옵션 자동 조회
  - [x] **실제 서비스 페이지 적용**: 방문자 페이지에 필터링 기능 적용
- [x] **농장별 방문자 페이지 필터링 적용**
  - [x] `/admin/farms/[farmId]/visitors` 페이지에 필터링 Hook 적용
  - [x] 농장별 특화 필터 옵션 지원
- [x] **Infinite Query (페이지네이션)**
  - [x] `use-infinite-visitors-query.ts`: 무한 스크롤 구현
  - [x] 커서 기반 페이지네이션
  - [x] 성능 최적화된 대용량 데이터 로딩
- [x] **Background Sync**
  - [x] `use-background-sync.ts`: 백그라운드 동기화
  - [x] 네트워크 재연결 시 자동 refetch
  - [x] Supabase Realtime 연동
  - [x] 탭 활성화 시 stale 데이터 갱신
- [x] **Cache Invalidation 전략**
  - [x] `query-keys.ts`: 체계적인 Query Key 관리
  - [x] Factory Pattern으로 타입 안전한 키 생성
  - [x] 스마트 캐시 무효화 헬퍼 함수들
  - [x] 연관 데이터 자동 무효화

### Phase 5: 성능 최적화 및 정리 ✅

- [x] Query Key 체계 최적화
- [x] DevTools 활용 모니터링 설정
- [x] 불필요한 Zustand Store 제거
- [x] 테스트 컴포넌트 및 페이지 정리
- [x] 공통 타입 정의 분리
- [x] Feature Flag 제거 및 완전 마이그레이션
- [ ] 성능 측정 및 벤치마크
- [ ] 프로덕션 배포 준비

### Phase 6: 최종 정리 및 문서화 🔄

- [ ] 사용하지 않는 Hook 파일 정리
- [ ] 타입 정의 통합 및 최적화
- [ ] 성능 벤치마크 실제 데이터 테스트
- [ ] 사용자 가이드 작성

## 🔄 마이그레이션 방법

### 1. 기존 Hook과 병행 사용

```typescript
// 기존 Hook (유지)
import { useFarmVisitors } from "@/lib/hooks/use-farm-visitors";

// 새로운 Query Hook (추가)
import { useFarmVisitorsQuery } from "@/lib/hooks/query/use-farm-visitors-query";

function FarmVisitorsPage() {
  // 기존 방식
  const { visitors: oldVisitors, loading: oldLoading } =
    useFarmVisitors(farmId);

  // 새로운 방식 (테스트)
  const { visitors: newVisitors, isLoading: newLoading } =
    useFarmVisitorsQuery(farmId);

  // 환경변수나 플래그로 전환 제어
  const useNewQuery = process.env.NEXT_PUBLIC_USE_REACT_QUERY === "true";

  const visitors = useNewQuery ? newVisitors : oldVisitors;
  const loading = useNewQuery ? newLoading : oldLoading;

  return <VisitorsList visitors={visitors} loading={loading} />;
}
```

### 2. 점진적 컴포넌트 교체

```typescript
// 1단계: 새로운 Hook 생성
// 2단계: 기존 Hook과 병행 사용
// 3단계: 컴포넌트별 새 Hook으로 전환
// 4단계: 기존 Hook 제거
```

## 📊 마이그레이션 우선순위

### 🔥 High Priority (복잡한 상태 관리)

1. **Farm Visitors** - 복잡한 통계 및 필터링
2. **Farm Members** - CRUD 작업 많음
3. **Dashboard Stats** - 실시간 업데이트 필요

### 🟡 Medium Priority (단순한 데이터 페칭)

4. **Farms List** - 캐싱 혜택 큼
5. **Notification Settings** - 사용자별 설정

### 🟢 Low Priority (안정적인 기능)

6. **Admin Hooks** - 이미 안정적
7. **Static Data** - 자주 변경되지 않음

## 🧪 테스트 전략

### 1. 기능 테스트

- [ ] 기존 기능과 동일한 동작 확인
- [ ] 에러 처리 동작 확인
- [ ] 로딩 상태 확인

### 2. 성능 테스트

- [ ] 초기 로딩 시간 비교
- [ ] 캐싱 효과 측정
- [ ] 메모리 사용량 확인

### 3. 사용자 경험 테스트

- [ ] 실시간 업데이트 확인
- [ ] 네트워크 재연결 시 동작
- [ ] 백그라운드 동기화

## 🔧 개발 가이드라인

### 1. 명명 규칙

```typescript
// 기존 Hook: use-farm-visitors.ts
// 새로운 Hook: use-farm-visitors-query.ts
// 디렉토리: lib/hooks/query/
```

### 2. 타입 안전성

```typescript
// 엄격한 타입 정의
interface QueryResult<T> {
  data: T | undefined;
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  refetch: () => void;
}
```

### 3. 에러 처리

```typescript
// 일관된 에러 처리
- 인증 에러: 재시도 안함
- 네트워크 에러: 3번 재시도
- 서버 에러: 로깅 후 사용자에게 알림
```

## 📈 성공 지표

### 1. 개발자 경험

- [ ] 코드 라인 수 30% 감소
- [ ] 중복 로직 제거
- [ ] 디버깅 도구 개선

### 2. 사용자 경험

- [ ] 로딩 시간 20% 단축
- [ ] 캐싱으로 데이터 응답 개선
- [ ] 실시간 동기화 향상

### 3. 유지보수성

- [ ] 상태 관리 복잡도 감소
- [ ] 일관된 에러 처리
- [ ] 테스트 커버리지 향상

## 🚀 배포 전략

### 1. Feature Flag 활용

```typescript
const useReactQuery = process.env.NEXT_PUBLIC_USE_REACT_QUERY === "true";
```

### 2. 점진적 롤아웃

1. 개발 환경에서 충분한 테스트
2. 스테이징 환경에서 통합 테스트
3. 프로덕션에서 일부 기능부터 활성화
4. 모니터링 후 전체 활성화

### 3. 롤백 계획

- 기존 Hook 유지로 빠른 롤백 가능
- Feature Flag로 즉시 전환 가능
- 모니터링 알림 설정

---

**목표**: 안정적이고 성능이 우수한 React Query 마이그레이션을 통해 개발자 경험과 사용자 경험 모두 향상

## � 마이그레이션 완료 현황

### ✅ 완료된 작업 (97%)

1. **기반 구조 설정**
   - React Query v5 설치 및 설정
   - QueryProvider 및 DevTools 설정
   - 글로벌 에러 핸들러 (이벤트 기반)
   - 인증 연동 유틸리티

2. **핵심 Hook 마이그레이션**
   - `useFarmVisitorsQuery`: 방문자 통계 및 데이터 조회
   - `useFarmsQuery`: 농장 목록 조회
   - `useFarmMembersQuery`: 농장 멤버 관리

3. **서비스 페이지 적용**
   - 대시보드 페이지 (`/admin/dashboard`) - Feature Flag 제거 완료
   - 방문자 페이지 (`/admin/visitors`)
   - 농장별 방문자 페이지 (`/admin/farms/[farmId]/visitors`)
   - 농장별 멤버 페이지 (`/admin/farms/[farmId]/members`)
   - 농장 목록 페이지 (`/admin/farms`) - 개별 컴포넌트 데이터 로딩

4. **고급 기능 구현**
   - Infinite Query (무한 스크롤)
   - Background Sync 및 실시간 동기화
   - Query Key 표준화 체계
   - Cache Invalidation 전략

5. **코드 정리 및 최적화**
   - 테스트 컴포넌트 및 페이지 정리
   - 공통 타입 정의 분리 (`lib/types/farm.ts`)
   - Feature Flag 제거
   - 레이아웃 컴포넌트들 React Query 전환

### 🔄 남은 작업 (3%)

1. **최종 정리**
   - [ ] 사용하지 않는 기존 Hook 파일들 정리
   - [ ] 타입 정의 통합 완료
   - [ ] 성능 벤치마크 실제 데이터 테스트

2. **문서화**
   - [ ] 사용자 가이드 작성
   - [ ] API 문서 업데이트

### 📊 마이그레이션 진행률

- 📊 **Query Hook**: 100% 완료
- 🎯 **서비스 페이지**: 100% 완료
- 🔄 **Mutation Hook**: 100% 완료
- 🚀 **고급 기능**: 100% 완료
- 🧹 **코드 정리**: 85% 완료

**전체 진행률**: 약 **97%** 완료

## 🎉 다음 단계 작업

### 1. 성능 측정 및 벤치마크
- [ ] React Query vs Zustand 성능 비교
- [ ] 메모리 사용량 측정
- [ ] 초기 로딩 시간 비교
- [ ] 캐싱 효과 분석

### 2. 불필요한 코드 제거
- [ ] 기존 Zustand Store 파일 정리
- [ ] 중복된 타입 정의 통합
- [ ] 사용하지 않는 유틸리티 함수 제거

### 3. 프로덕션 배포 준비
- [ ] Feature Flag 기반 점진적 활성화
- [ ] 모니터링 및 알림 설정
- [ ] 롤백 계획 수립
- [ ] 사용자 가이드 작성
