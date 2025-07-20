# React Query DevTools 가이드

## 🔍 Query Key 네이밍 개선

### 문제점

기존에 React Query DevTools에서 다음과 같이 표시되었습니다:

- `["visitors", null]` - farmId가 null일 때
- `["farms", undefined]` - userId가 undefined일 때
- `["farmMembers", ""]` - farmId가 빈 문자열일 때

### 해결 방안

명확한 쿼리 키 네이밍을 통해 DevTools에서 더 나은 가독성을 제공합니다:

```typescript
// 개선 전
["visitors", null][("farms", undefined)][ // 혼란스러움 // 의미 불분명
  // 개선 후
  ("visitors", "all")
][("farms", "anonymous")][("farmMembers", "none")]; // 전체 방문자 조회 // 익명 사용자 // 농장 선택 안됨
```

## 📊 쿼리 키 구조

### 방문자 쿼리

```typescript
// 전체 방문자 조회
["visitors", "all"][
  // 특정 농장 방문자 조회
  ("visitors", "farm_123")
];
```

### 농장 쿼리

```typescript
// 인증된 사용자의 농장 목록
["farms", "user_456"][
  // 익명 또는 인증되지 않은 사용자
  ("farms", "anonymous")
];
```

### 농장 멤버 쿼리

```typescript
// 특정 농장의 멤버 목록
["farmMembers", "farm_123"][
  // 농장이 선택되지 않은 상태
  ("farmMembers", "none")
];
```

## 🛠️ DevTools 활용 팁

### 1. 쿼리 상태 확인

- **Fresh**: 데이터가 최신 상태 (staleTime 내)
- **Stale**: 데이터가 오래됨 (staleTime 초과)
- **Fetching**: 데이터 가져오는 중
- **Error**: 에러 발생

### 2. 캐시 관리

- **Invalidate**: 특정 쿼리 무효화
- **Remove**: 쿼리 캐시에서 제거
- **Refetch**: 강제 재조회

### 3. 네트워크 상태 시뮬레이션

- **Online/Offline**: 네트워크 상태 변경
- **Slow Connection**: 느린 네트워크 시뮬레이션

## 📈 성능 모니터링

### 캐시 효율성

- **Cache Hit Rate**: 캐시에서 데이터를 가져온 비율
- **Network Request Count**: 실제 네트워크 요청 횟수

### 메모리 사용량

- **Active Queries**: 활성 쿼리 수
- **Cache Size**: 캐시 크기

## 🔧 디버깅 가이드

### 1. 쿼리가 실행되지 않는 경우

- `enabled` 조건 확인
- 인증 상태 확인
- 의존성 배열 확인

### 2. 데이터가 업데이트되지 않는 경우

- `staleTime` 설정 확인
- `refetchOnWindowFocus` 설정 확인
- Query Invalidation 필요 여부 확인

### 3. 에러 처리

- 글로벌 에러 핸들러 동작 확인
- 개별 쿼리 에러 상태 확인
- 네트워크 에러 vs 서버 에러 구분

## 🎯 Best Practices

1. **명확한 쿼리 키 사용**

   - null/undefined 대신 의미 있는 문자열 사용
   - 계층적 구조 유지

2. **적절한 캐시 전략**

   - 데이터 변경 빈도에 따른 staleTime 설정
   - 사용자 행동 패턴 고려

3. **에러 처리**

   - 사용자 친화적인 에러 메시지
   - 재시도 로직 구현

4. **성능 최적화**
   - 불필요한 쿼리 비활성화
   - 적절한 polling 간격 설정
