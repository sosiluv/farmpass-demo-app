# 🔔 푸시 구독 전체 프로세스 가이드

> **최종 업데이트**: 2024년 12월 27일  
> **문서 버전**: v1.0  
> **대상**: 개발자, 관리자

---

## 📋 목차

1. [개요](#개요)
2. [구독 생성 프로세스](#구독-생성-프로세스)
3. [구독 해지 프로세스](#구독-해지-프로세스)
4. [구독 재구독 프로세스](#구독-재구독-프로세스)
5. [구독 정리 프로세스](#구독-정리-프로세스)
6. [푸시 발송 프로세스](#푸시-발송-프로세스)
7. [데이터베이스 스키마](#데이터베이스-스키마)
8. [API 엔드포인트](#api-엔드포인트)
9. [관리자 기능](#관리자-기능)
10. [문제 해결](#문제-해결)

---

## 🎯 개요

푸시 구독 시스템은 사용자가 농장 관리 알림을 실시간으로 받을 수 있도록 하는 핵심 기능입니다. 이 문서는 구독의 전체 생명주기를 상세히 설명합니다.

### 주요 구성 요소

- **Service Worker**: 브라우저에서 푸시 알림을 처리
- **VAPID 키**: 웹 푸시 인증을 위한 키
- **구독 데이터**: 사용자별 구독 정보 저장
- **정리 시스템**: 만료되거나 실패한 구독 자동 정리

---

## 🔄 구독 생성 프로세스

### 1. 사용자 액션

```
사용자가 알림 허용 버튼 클릭
↓
브라우저 알림 권한 요청
↓
권한 승인 시 구독 생성 시작
```

### 2. 클라이언트 측 처리

#### 2.1 Service Worker 등록

```javascript
// push-sw.js 등록
const registration = await navigator.serviceWorker.register("/push-sw.js");
```

#### 2.2 VAPID 키 요청

```javascript
// 서버에서 VAPID 공개키 요청
const vapidKey = await fetch("/api/push/vapid").then((r) => r.json());
```

#### 2.3 구독 생성

```javascript
// 브라우저 API로 구독 생성
const subscription = await registration.pushManager.subscribe({
  userVisibleOnly: true,
  applicationServerKey: vapidKey.publicKey,
});
```

#### 2.4 Device ID 생성

```javascript
// 고유한 디바이스 ID 생성
const deviceId = generateDeviceId(); // UUID v4
```

### 3. 서버 측 처리

#### 3.1 구독 데이터 검증

```typescript
// API: /api/push/subscription
interface CreateSubscriptionDTO {
  endpoint: string;
  p256dh: string;
  auth: string;
  deviceId: string;
  userAgent: string;
}
```

#### 3.2 UPSERT 처리

```sql
-- 기존 구독이 있으면 업데이트, 없으면 생성
INSERT INTO push_subscriptions (
  user_id, farm_id, endpoint, p256dh, auth,
  device_id, user_agent, is_active, fail_count
) VALUES (...)
ON CONFLICT (user_id, device_id)
DO UPDATE SET
  endpoint = EXCLUDED.endpoint,
  p256dh = EXCLUDED.p256dh,
  auth = EXCLUDED.auth,
  updated_at = NOW(),
  is_active = true,
  fail_count = 0;
```

#### 3.3 알림 설정 활성화

```sql
-- 사용자의 푸시 알림 설정 활성화
UPDATE user_notification_settings
SET push_notifications = true
WHERE user_id = ?;
```

### 4. 성공 응답

```typescript
{
  success: true,
  message: "푸시 구독이 성공적으로 설정되었습니다.",
  subscription: {
    id: string,
    deviceId: string,
    isActive: boolean
  }
}
```

---

## 🗑️ 구독 해지 프로세스

### 1. 사용자 액션

```
사용자가 알림 해지 버튼 클릭
↓
확인 다이얼로그 표시
↓
확인 시 해지 프로세스 시작
```

### 2. 클라이언트 측 처리

#### 2.1 브라우저 구독 해지

```javascript
// 브라우저에서 구독 해지
const subscription = await registration.pushManager.getSubscription();
if (subscription) {
  await subscription.unsubscribe();
}
```

#### 2.2 서버에 해지 요청

```javascript
// 서버에 해지 요청
await fetch("/api/push/subscription", {
  method: "DELETE",
  body: JSON.stringify({ deviceId }),
});
```

### 3. 서버 측 처리

#### 3.1 Soft Delete 처리

```sql
-- 구독을 완전 삭제하지 않고 비활성화
UPDATE push_subscriptions
SET
  is_active = false,
  deleted_at = NOW(),
  fail_count = 0,
  updated_at = NOW()
WHERE user_id = ? AND device_id = ?;
```

#### 3.2 알림 설정 비활성화

```sql
-- 사용자의 푸시 알림 설정 비활성화
UPDATE user_notification_settings
SET push_notifications = false
WHERE user_id = ?;
```

#### 3.3 시스템 로그 기록

```sql
-- 해지 이벤트 로그 기록
INSERT INTO system_logs (
  action, message, level, user_id,
  category, metadata
) VALUES (
  'PUSH_SUBSCRIPTION_UNSUBSCRIBE',
  '사용자가 푸시 구독을 해지했습니다.',
  'info',
  ?,
  'subscription',
  '{"deviceId": ?, "reason": "user_request"}'
);
```

---

## 🔄 구독 재구독 프로세스

### 1. 재구독 트리거

```
사용자가 알림을 다시 받고 싶어함
↓
알림 권한이 이미 허용된 상태
↓
재구독 프로세스 시작
```

### 2. 기존 구독 확인

```javascript
// 기존 구독 상태 확인
const existingSubscription = await registration.pushManager.getSubscription();
if (existingSubscription) {
  // 기존 구독이 있으면 재활성화
  await reactivateSubscription(existingSubscription);
} else {
  // 새 구독 생성
  await createNewSubscription();
}
```

### 3. 서버 측 재활성화

```sql
-- 기존 구독 재활성화
UPDATE push_subscriptions
SET
  is_active = true,
  deleted_at = NULL,
  fail_count = 0,
  updated_at = NOW()
WHERE user_id = ? AND device_id = ?;
```

### 4. 알림 설정 재활성화

```sql
-- 푸시 알림 설정 재활성화
UPDATE user_notification_settings
SET push_notifications = true
WHERE user_id = ?;
```

---

## 🧹 구독 정리 프로세스

### 1. 정리 조건

#### 1.1 실패 횟수 초과

```sql
-- fail_count가 임계값을 초과한 구독
WHERE fail_count >= ? -- 기본값: 5회
```

#### 1.2 비활성 구독

```sql
-- is_active = false인 구독
WHERE is_active = false
```

#### 1.4 오래된 Soft Delete

```sql
-- deleted_at이 설정된 일수보다 오래된 구독
WHERE deleted_at < NOW() - INTERVAL '? days'
```

### 2. 정리 실행

#### 2.1 테스트 정리 (미리보기)

```typescript
// API: /api/push/subscription/cleanup
{
  realTimeCheck: false,
  forceDelete: false,
  failCountThreshold: 5,
  cleanupInactive: true,
  deleteAfterDays: 30
}
```

#### 2.2 실제 정리

```typescript
// 실제 삭제 실행
{
  realTimeCheck: false,
  forceDelete: settings.subscriptionForceDelete,
  failCountThreshold: settings.subscriptionFailCountThreshold,
  cleanupInactive: settings.subscriptionCleanupInactive,
  deleteAfterDays: settings.subscriptionCleanupDays
}
```

### 3. 정리 결과

```typescript
{
  message: string;
  cleanedCount: number;
  validCount: number;
  totalChecked: number;
  stats: {
    failCountCleaned: number;
    inactiveCleaned: number;
    expiredCleaned: number;
    forceDeleted: number;
    oldSoftDeletedCleaned: number;
  }
}
```

---

## 📤 푸시 발송 프로세스

### 1. 발송 대상 선별

```sql
-- 활성 구독자만 대상으로 선별
SELECT * FROM push_subscriptions
WHERE is_active = true
  AND deleted_at IS NULL
```

### 2. 푸시 페이로드 생성

```typescript
interface PushPayload {
  title: string;
  message: string;
  icon?: string;
  badge?: string;
  tag?: string;
  data?: Record<string, any>;
}
```

### 3. 웹 푸시 라이브러리 사용

```typescript
import webpush from "web-push";

// 각 구독자에게 푸시 발송
for (const subscription of subscriptions) {
  try {
    await webpush.sendNotification(
      {
        endpoint: subscription.endpoint,
        keys: {
          p256dh: subscription.p256dh,
          auth: subscription.auth,
        },
      },
      JSON.stringify(payload)
    );

    // 성공 시 fail_count 초기화
    await updateSubscriptionSuccess(subscription.id);
  } catch (error) {
    // 실패 시 fail_count 증가
    await updateSubscriptionFailure(subscription.id, error);
  }
}
```

### 4. 실패 처리

```sql
-- 실패 시 fail_count 증가
UPDATE push_subscriptions
SET
  fail_count = fail_count + 1,
  last_fail_at = NOW(),
  updated_at = NOW()
WHERE id = ?;

-- 임계값 초과 시 자동 비활성화
UPDATE push_subscriptions
SET is_active = false
WHERE fail_count >= ? AND is_active = true;
```

---

## 🗄️ 데이터베이스 스키마

### push_subscriptions 테이블

```sql
CREATE TABLE push_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  farm_id UUID REFERENCES farms(id) ON DELETE CASCADE,
  endpoint TEXT NOT NULL,
  p256dh TEXT,
  auth TEXT,
  device_id TEXT NOT NULL,
  user_agent TEXT,
  is_active BOOLEAN DEFAULT true,
  fail_count INTEGER DEFAULT 0,
  last_fail_at TIMESTAMP WITH TIME ZONE,
  last_used_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  deleted_at TIMESTAMP WITH TIME ZONE,

  UNIQUE(user_id, device_id)
);
```

### user_notification_settings 테이블

```sql
CREATE TABLE user_notification_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  notification_method TEXT NOT NULL DEFAULT 'email',
  visitor_alerts BOOLEAN DEFAULT true,
  emergency_alerts BOOLEAN DEFAULT true,
  maintenance_alerts BOOLEAN DEFAULT true,
  notice_alerts BOOLEAN DEFAULT true,
  push_notifications BOOLEAN DEFAULT false,
  kakao_user_id TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

---

## 🔌 API 엔드포인트

### 구독 관리

- `POST /api/push/subscription` - 구독 생성/업데이트
- `DELETE /api/push/subscription` - 구독 해지
- `GET /api/push/subscription` - 구독 상태 조회

### VAPID 키

- `GET /api/push/vapid` - VAPID 공개키 조회

### 구독 정리

- `POST /api/push/subscription/cleanup` - 구독 정리 실행

### 푸시 발송

- `POST /api/push/send` - 푸시 알림 발송

---

## 👨‍💼 관리자 기능

### 1. 구독 정리 설정

- **자동 삭제 일수**: 7일, 15일, 30일, 60일, 90일
- **실패 횟수 임계값**: 3회, 5회, 10회, 15회
- **비활성 구독 정리**: 활성화/비활성화
- **강제 삭제**: Soft Delete 대신 완전 삭제

### 2. 정리 실행

- **정리 테스트**: 실제 삭제 없이 미리보기
- **실제 정리**: 설정에 따라 실제 삭제 실행
- **정리 통계**: 유형별 삭제 개수 및 상세 정보

### 3. 모니터링

- **구독 상태 대시보드**: 전체 구독 현황
- **실패 통계**: 실패 원인별 분석
- **정리 이력**: 정리 실행 기록

---

## 🔧 문제 해결

### 1. 구독 생성 실패

**증상**: 알림 권한은 허용되었지만 구독이 생성되지 않음

**해결 방법**:

1. Service Worker 등록 상태 확인
2. VAPID 키 유효성 검증
3. 브라우저 호환성 확인
4. 네트워크 연결 상태 확인

### 2. 푸시 발송 실패

**증상**: 구독은 있지만 푸시가 도착하지 않음

**해결 방법**:

1. 구독 정보 유효성 검증
2. VAPID 키 일치 여부 확인
3. Service Worker 활성 상태 확인
4. 브라우저 알림 설정 확인

### 3. 구독 정리 문제

**증상**: 정리 조건에 맞는 구독이 정리되지 않음

**해결 방법**:

1. 정리 설정 값 확인
2. 데이터베이스 쿼리 로그 확인
3. 권한 설정 확인
4. 정리 조건 재검토

### 4. 재구독 실패

**증상**: 해지 후 재구독이 되지 않음

**해결 방법**:

1. 기존 구독 완전 해지 확인
2. 브라우저 구독 상태 확인
3. 서버 구독 데이터 상태 확인
4. 알림 권한 재확인

---

## 📊 모니터링 지표

### 1. 구독 현황

- 전체 구독자 수
- 활성 구독자 수
- 비활성 구독자 수
- 실패 구독자 수

### 2. 발송 통계

- 일일 발송 건수
- 성공률
- 실패 원인별 분포
- 평균 응답 시간

### 3. 정리 통계

- 정리된 구독 개수
- 정리 유형별 분포
- 정리 주기별 성능
- 정리 후 시스템 영향

---

## 🔄 전체 플로우 다이어그램

```
사용자 액션
    ↓
권한 요청
    ↓
구독 생성 ←→ VAPID 키
    ↓
서버 저장 ←→ UPSERT
    ↓
푸시 발송 ←→ 실패 처리
    ↓
정리 조건 확인
    ↓
자동/수동 정리
    ↓
구독 해지/재구독
```

이 문서를 통해 푸시 구독의 전체 프로세스를 이해하고, 문제 발생 시 빠르게 대응할 수 있습니다.
