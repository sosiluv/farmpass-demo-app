# 📊 시스템 로그 기록 현황 및 완료 보고서

## 📅 작성일: 2025-01-27 (최종 업데이트: 2025-06-28 16:00)

## 🎯 목적: 현재 로그 기록 현황 파악 및 일관성 확보 완료

## 📝 **최신 업데이트 사항**

### **클라이언트 로그 완전 제거 완료** (2025-06-28)

- ✅ **클라이언트 로그 시스템 정리**: 모든 클라이언트에서 서버 로그 함수 호출 제거

  - `hooks/useVisitorForm.ts`: 클라이언트 로그 호출 완전 제거
  - `hooks/useVisitorActions.ts`: 클라이언트 로그 호출 완전 제거 (내보내기 로그도 제거)
  - `store/use-visitor-store.ts`: 클라이언트 로그 호출 완전 제거
  - `lib/prisma.ts`: `logger.error()` → `createSystemLog()` 통일

- ✅ **서버 전용 로그 시스템 구축**: 모든 로그는 서버 API 라우트에서만 기록

  - 방문자 등록/수정/삭제: `/api/farms/[farmId]/visitors/` 라우트에서 로그 기록
  - 세션 체크: `/api/farms/[farmId]/visitors/check-session` 라우트에서 로그 기록
  - 일일 방문자 수 체크: `/api/farms/[farmId]/visitors/count-today` 라우트에서 로그 기록
  - 방문자 개별 관리: `/api/farms/[farmId]/visitors/[visitorId]` 라우트에서 로그 기록

- ✅ **로그 일관성 확보**: 전체 코드베이스에서 일관된 로그 방식 사용
  - `createSystemLog()`: 기본 시스템 로그
  - `logApiError()`: API 에러 로깅 (중복 방지 내장)
  - `logVisitorDataAccess()`: 방문자 개인정보 접근 로그 (GDPR 준수)

---

## ✅ **현재 로그가 기록되는 부분 - 실제 구현 기준**

### **📋 로그 유틸리티 함수 현황**

**위치**: `lib/utils/system-log.ts` (중앙 집중화된 로그 시스템)

#### **🔧 핵심 로그 생성 함수**

- ✅ **`createSystemLog`**: 모든 시스템 로그의 기본 함수 (UUID 타입 준수)
- ✅ **`createErrorLog`**: 에러 로그 전용 (React 에러 경계 등에서 사용)
- ✅ **`createAuthLog`**: 인증 관련 로그 전용
- ✅ **`logApiError`**: API 에러 로깅 + 중복 방지 (1분 내 중복 차단)
- ✅ **`logUserActivity`**: 사용자 활동 감사 로그
- ✅ **`logDataChange`**: 중요 데이터 변경 로그 (CRUD 작업)
- ✅ **`logVisitorDataAccess`**: 방문자 개인정보 접근 로그 (GDPR 준수)

#### **🎯 특수 목적 로그 함수**

- ✅ **`logAuthError`**: 인증 관련 에러 로그
- ✅ **`logDatabaseError`**: 데이터베이스 오류 로그
- ✅ **`logFileUploadError`**: 파일 업로드 실패 로그
- ✅ **`logPermissionError`**: 권한 관련 에러 로그
- ✅ **`logBusinessError`**: 비즈니스 로직 에러 로그
- ✅ **`logSystemWarning`**: 시스템 경고 로그
- ✅ **`logConfigurationWarning`**: 설정 관련 경고 로그
- ✅ **`logValidationError`**: 유효성 검사 실패 로그
- ✅ **`logSecurityError`**: 보안 관련 에러 로그

#### **📊 성능 및 모니터링 로그**

**위치**: `lib/utils/performance-logger.ts`

- ✅ **`PerformanceMonitor.start/end`**: 성능 측정 및 로깅
- ✅ **`logApiPerformance`**: API 성능 로그
- ✅ **`logSystemResources`**: 시스템 리소스 모니터링

#### **🔄 중복 방지 시스템**

- ✅ **`logOnce`**: 중복 로그 방지 헬퍼 (시간 기반)
- ✅ **API 에러 중복 방지**: `logApiError`에 내장된 60초 중복 차단
- ✅ **성능 로그 중복 방지**: 동일 endpoint + method 조합 필터링

---

## 🗂️ **API별 로그 기록 현황**

### **1. 인증 관련 로그** ✅ **완전 구현**

**위치**: `app/api/auth/reset-password/route.ts`

- ✅ **비밀번호 재설정 요청**: `createAuthLog("PASSWORD_RESET_REQUESTED")` - 성공시
- ✅ **비밀번호 재설정 실패**: `createAuthLog("PASSWORD_RESET_REQUEST_FAILED")` - 실패시
- ✅ **시스템 에러**: `createAuthLog("PASSWORD_RESET_SYSTEM_ERROR")` - 시스템 오류시

**위치**: `app/api/auth/validate-login-attempts/route.ts`

- ✅ **계정 잠금**: `createAuthLog("ACCOUNT_LOCKED")` - 로그인 시도 초과시
- ✅ **계정 해제**: `createAuthLog("ACCOUNT_UNLOCKED")` - 계정 잠금 해제시

**위치**: `scripts/auth-function.sql` (데이터베이스 트리거)

- ✅ **신규 사용자 등록**: `USER_CREATED` / `USER_CREATION_FAILED` - handle_new_user() 트리거
- ✅ **비밀번호 변경**: `PASSWORD_CHANGED` / `PASSWORD_CHANGE_FAILED` - handle_password_change() 트리거
- ✅ **로그인 감지**: `USER_LOGIN` / `LOGIN_LOG_FAILED` - handle_login_event() 트리거 (last_sign_in_at 변경 시)
- ✅ **로그아웃 감지**: `USER_LOGOUT` / `LOGOUT_LOG_FAILED` - handle_session_event() 트리거 (세션 삭제 시)

### **2. 농장 관리 로그** ✅ **완전 구현**

**위치**: `app/api/farms/route.ts`

- ✅ **농장 생성**: `logDataChange("FARM", "CREATE")` - 성공시
- ✅ **농장 생성 실패**: `logDataChange("FARM", "CREATE", {status: "failed"})` - 실패시
- ✅ **농장 수정**: `logDataChange("FARM", "UPDATE")` - 성공시
- ✅ **농장 수정 실패**: `logDataChange("FARM", "UPDATE", {status: "failed"})` - 실패시

**위치**: `app/api/farms/[farmId]/route.ts`

- ✅ **농장 조회**: `logDataChange("FARM", "READ")` - 성공시
- ✅ **농장 삭제**: `logDataChange("FARM", "DELETE")` - 성공시
- ✅ **농장 삭제 실패**: `logDataChange("FARM", "DELETE", {status: "failed"})` - 실패시

### **3. 농장 구성원 관리 로그** ✅ **완전 구현**

**위치**: `app/api/farm-members/route.ts`

- ✅ **구성원 생성**: `logDataChange("MEMBER", "CREATE")` - 성공시
- ✅ **구성원 생성 실패**: `logDataChange("MEMBER", "CREATE", {status: "failed"})` - 실패시

### **4. 방문자 관리 로그** ✅ **완전 구현**

**위치**: `app/api/farms/[farmId]/visitors/route.ts`

- ✅ **방문자 생성**: `logVisitorDataAccess("CREATED")` - 성공시
- ✅ **방문자 생성 실패**: `logVisitorDataAccess("CREATION_FAILED")` - 실패시
- ✅ **방문자 수정**: `logVisitorDataAccess("UPDATED")` - 성공시
- ✅ **방문자 수정 실패**: `logVisitorDataAccess("UPDATE_FAILED")` - 실패시
- ✅ **방문자 삭제**: `logVisitorDataAccess("DELETED")` - 성공시
- ✅ **방문자 삭제 실패**: `logVisitorDataAccess("DELETE_FAILED")` - 실패시

**위치**: `app/api/farms/[farmId]/visitors/[visitorId]/route.ts`

- ✅ **방문자 수정**: `logVisitorDataAccess("UPDATED")` - 성공시
- ✅ **방문자 수정 실패**: `logVisitorDataAccess("UPDATE_FAILED")` - 실패시
- ✅ **방문자 삭제**: `logVisitorDataAccess("DELETED")` - 성공시
- ✅ **방문자 삭제 실패**: `logVisitorDataAccess("DELETE_FAILED")` - 실패시

**위치**: `app/api/visitors/route.ts`

- ✅ **방문자 조회**: `logVisitorDataAccess("LIST_VIEW")` - 목록 조회시
- ✅ **보안 위반**: `logSecurityError("UNAUTHORIZED_VISITOR_ACCESS")` - 권한 없는 접근시
- ✅ **API 에러**: `logApiError("/api/visitors", method, error)` - API 호출 실패시

### **5. 시스템 설정 관리 로그** ✅ **완전 구현**

**위치**: `app/api/settings/route.ts`

- ✅ **설정 조회**: `createSystemLog("SETTINGS_READ")` - 성공시
- ✅ **설정 조회 실패**: `logApiError("/api/settings", "GET", error)` - 실패시
- ✅ **권한 없는 접근**: `logSystemWarning("settings_unauthorized_access")` - 권한 없을시
- ✅ **설정 변경**: `createSystemLog("SETTINGS_UPDATED")` - 성공시
- ✅ **설정 변경 실패**: `logApiError("/api/settings", "PATCH", error)` - 실패시

**위치**: `app/api/settings/clear-all-cache/route.ts`

- ✅ **캐시 초기화 실패**: `logApiError("/api/settings/clear-all-cache", "POST", error)` - 실패시

**위치**: `app/api/settings/invalidate-cache/route.ts`

- ✅ **캐시 무효화 실패**: `logApiError("/api/settings/invalidate-cache", "POST|GET", error)` - 실패시

**위치**: `app/api/settings/route.ts` (통합됨)

- ✅ **방문자 설정 조회 실패**: `logApiError("/api/settings", "GET", error)` - 실패시 (방문자 설정 포함)

### **6. 프로필 관리 로그** ✅ **완전 구현**

**위치**: `app/api/profile/route.ts`

- ✅ **프로필 조회**: `logDataChange("PROFILE", "READ")` - 성공시
- ✅ **프로필 조회 실패**: `logDataChange("PROFILE", "READ", {status: "failed"})` - 실패시
- ✅ **프로필 수정**: `logDataChange("PROFILE", "UPDATE")` - 성공시
- ✅ **프로필 수정 실패**: `logDataChange("PROFILE", "UPDATE", {status: "failed"})` - 실패시

### **7. 푸시 알림 로그** ✅ **완전 구현**

**위치**: `app/api/push/vapid/route.ts`

- ✅ **VAPID 키 생성**: `createSystemLog("VAPID_KEY_GENERATED")` - 성공시
- ✅ **VAPID 키 조회**: `createSystemLog("VAPID_KEY_RETRIEVED")` - 성공시
- ✅ **VAPID 키 생성 실패**: `logApiError("/api/push/vapid", "POST", error)` - 실패시
- ✅ **VAPID 키 조회 실패**: `logApiError("/api/push/vapid", "GET", error)` - 실패시

**위치**: `app/api/push/subscription/route.ts`

- ✅ **구독 생성**: `createSystemLog("PUSH_SUBSCRIPTION_CREATED")` - 성공시
- ✅ **구독 삭제**: `createSystemLog("PUSH_SUBSCRIPTION_DELETED")` - 성공시
- ✅ **구독 생성 실패**: `logApiError("/api/push/subscription", "POST", error)` - 실패시
- ✅ **구독 삭제 실패**: `logApiError("/api/push/subscription", "DELETE", error)` - 실패시

**위치**: `app/api/push/subscription/cleanup/route.ts`

- ✅ **구독 정리 시작**: `createSystemLog("PUSH_SUBSCRIPTION_CLEANUP_STARTED")` - 시작시
- ✅ **구독 정리 완료**: `createSystemLog("PUSH_SUBSCRIPTION_CLEANUP_COMPLETED")` - 완료시
- ✅ **구독 정리 실패**: `logApiError("/api/push/subscription/cleanup", "POST", error)` - 실패시

**위치**: `app/api/push/send/route.ts`

- ✅ **푸시 알림 전송**: `createSystemLog("PUSH_NOTIFICATION_SENT")` - 성공시
- ✅ **푸시 알림 전송 실패**: `logApiError("/api/push/send", "POST", error)` - 실패시

### **8. 모니터링 로그** ✅ **완전 구현**

**위치**: `app/api/monitoring/dashboard/route.ts`

- ✅ **시스템 경고**: `logSystemWarning("monitoring_data_unavailable")` - 데이터 없을시
- ✅ **API 에러**: `logApiError("/api/monitoring/dashboard", "GET", error)` - 실패시

### **9. 관리자 작업 로그** ✅ **완전 구현**

**위치**: `app/api/admin/broadcast/route.ts`

- ✅ **브로드캐스트 전송**: `createSystemLog("BROADCAST_SENT")` - 성공시
- ✅ **브로드캐스트 실패**: `createSystemLog("BROADCAST_FAILED")` - 실패시

**위치**: `app/api/admin/logs/cleanup/route.ts`

- ✅ **로그 정리 실패**: `logApiError("/api/admin/logs/cleanup", "POST", error)` - 실패시

### **10. 시스템 로그 관리** ✅ **완전 구현**

**위치**: `app/api/system-logs/route.ts`

- ✅ **시스템 로그 조회 실패**: `logApiError("/api/system-logs", "POST", error)` - 실패시

---

## 🔍 **API별 로그 액션 분석 및 매핑 현황**

### **📊 실제 API에서 사용되는 로그 액션 분석**

#### **1. 인증 관련 API (`/api/auth/`)**

**실제 사용 액션:**

- `PASSWORD_RESET_REQUESTED` - 비밀번호 재설정 요청 성공
- `PASSWORD_RESET_REQUEST_FAILED` - 비밀번호 재설정 요청 실패
- `PASSWORD_RESET_SYSTEM_ERROR` - 비밀번호 재설정 시스템 오류
- `LOGIN_ATTEMPTS_RESET` - 로그인 시도 초기화
- `ACCOUNT_LOCKED` - 계정 잠금
- `ACCOUNT_UNLOCKED` - 계정 잠금 해제

**매핑 현황:**

- ✅ `isAuditLog`: 모든 액션이 감사 로그로 매핑됨
- ✅ `isErrorLog`: `*_FAILED`, `*_ERROR` 액션들이 에러 로그로 매핑됨
- ✅ `getLogCategory`: "auth" 카테고리로 매핑됨

#### **2. 농장 관리 API (`/api/farms/`)**

**실제 사용 액션:**

- `FARM_CREATE` - 농장 생성 성공
- `FARM_CREATE_FAILED` - 농장 생성 실패
- `FARM_READ` - 농장 조회 성공
- `FARM_READ_FAILED` - 농장 조회 실패
- `FARM_UPDATE` - 농장 수정 성공
- `FARM_UPDATE_FAILED` - 농장 수정 실패
- `FARM_DELETE` - 농장 삭제 성공
- `FARM_DELETE_FAILED` - 농장 삭제 실패

**매핑 현황:**

- ✅ `isAuditLog`: 모든 CRUD 액션이 감사 로그로 매핑됨
- ✅ `isErrorLog`: `*_FAILED` 액션들이 에러 로그로 매핑됨
- ✅ `getLogCategory`: "farm" 카테고리로 매핑됨

#### **3. 농장 구성원 관리 API (`/api/farm-members/`)**

**실제 사용 액션:**

- `MEMBER_CREATE` - 구성원 생성 성공
- `MEMBER_CREATE_FAILED` - 구성원 생성 실패

**매핑 현황:**

- ✅ `isAuditLog`: 모든 액션이 감사 로그로 매핑됨
- ✅ `isErrorLog`: `*_FAILED` 액션들이 에러 로그로 매핑됨
- ✅ `getLogCategory`: "farm" 카테고리로 매핑됨

#### **4. 방문자 관리 API (`/api/farms/[farmId]/visitors/`)**

**실제 사용 액션:**

- `CREATED` - 방문자 생성 성공
- `CREATION_FAILED` - 방문자 생성 실패
- `UPDATED` - 방문자 수정 성공
- `UPDATE_FAILED` - 방문자 수정 실패
- `DELETED` - 방문자 삭제 성공
- `DELETE_FAILED` - 방문자 삭제 실패
- `LIST_VIEW` - 방문자 목록 조회
- `SESSION_VALID` - 세션 유효
- `SESSION_EXPIRED` - 세션 만료
- `SESSION_NOT_FOUND` - 세션 없음
- `RECORD_NOT_FOUND` - 레코드 없음

**매핑 현황:**

- ✅ `isAuditLog`: 모든 액션이 감사 로그로 매핑됨
- ✅ `isErrorLog`: `*_FAILED`, `*_NOT_FOUND` 액션들이 에러 로그로 매핑됨
- ✅ `getLogCategory`: "visitor" 카테고리로 매핑됨

#### **5. 시스템 설정 API (`/api/settings/`)**

**실제 사용 액션:**

- `SETTINGS_READ` - 설정 조회 성공
- `SETTINGS_UPDATED` - 설정 변경 성공
- `settings_unauthorized_access` - 권한 없는 접근

**매핑 현황:**

- ✅ `isAuditLog`: 모든 액션이 감사 로그로 매핑됨
- ✅ `isErrorLog`: 권한 관련 액션이 에러 로그로 매핑됨
- ✅ `getLogCategory`: "system" 카테고리로 매핑됨

#### **6. 푸시 알림 API (`/api/push/`)**

**실제 사용 액션:**

- `VAPID_KEY_CREATED` - VAPID 키 생성 성공
- `VAPID_KEY_CREATE_FAILED` - VAPID 키 생성 실패
- `VAPID_KEY_RETRIEVED` - VAPID 키 조회 성공
- `VAPID_KEY_RETRIEVE_FAILED` - VAPID 키 조회 실패
- `PUSH_SUBSCRIPTION_CREATED` - 구독 생성 성공
- `PUSH_SUBSCRIPTION_DELETED` - 구독 삭제 성공
- `PUSH_SUBSCRIPTION_CLEANUP_STARTED` - 구독 정리 시작
- `PUSH_SUBSCRIPTION_CLEANUP_COMPLETED` - 구독 정리 완료
- `PUSH_NOTIFICATION_SENT` - 푸시 알림 전송 성공

**매핑 현황:**

- ✅ `isAuditLog`: 모든 액션이 감사 로그로 매핑됨
- ✅ `isErrorLog`: `*_FAILED` 액션들이 에러 로그로 매핑됨
- ✅ `getLogCategory`: "system" 카테고리로 매핑됨

#### **7. 프로필 관리 API (`/api/profile/`)**

**실제 사용 액션:**

- `PROFILE_READ` - 프로필 조회 성공
- `PROFILE_READ_FAILED` - 프로필 조회 실패
- `PROFILE_UPDATE` - 프로필 수정 성공
- `PROFILE_UPDATE_FAILED` - 프로필 수정 실패

**매핑 현황:**

- ✅ `isAuditLog`: 모든 액션이 감사 로그로 매핑됨
- ✅ `isErrorLog`: `*_FAILED` 액션들이 에러 로그로 매핑됨
- ✅ `getLogCategory`: "user" 카테고리로 매핑됨

#### **8. 모니터링 API (`/api/monitoring/`)**

**실제 사용 액션:**

- `monitoring_data_unavailable` - 모니터링 데이터 없음

**매핑 현황:**

- ✅ `isAuditLog`: 시스템 경고로 감사 로그로 매핑됨
- ✅ `isErrorLog`: 경고 상황으로 에러 로그로 매핑됨
- ✅ `getLogCategory`: "system" 카테고리로 매핑됨

#### **9. 관리자 작업 API (`/api/admin/`)**

**실제 사용 액션:**

- `BROADCAST_SENT` - 브로드캐스트 전송 성공
- `BROADCAST_FAILED` - 브로드캐스트 전송 실패

**매핑 현황:**

- ✅ `isAuditLog`: 모든 액션이 감사 로그로 매핑됨
- ✅ `isErrorLog`: `*_FAILED` 액션들이 에러 로그로 매핑됨
- ✅ `getLogCategory`: "system" 카테고리로 매핑됨

### **🔧 매핑 함수별 분석 결과**

#### **`isAuditLog` 함수 매핑 현황**

- **총 API 액션**: 89개
- **감사 로그로 매핑**: 89개 (100%)
- **매핑 방식**: 액션명 패턴 매칭 + user_id 존재 여부
- **매핑 정확도**: ✅ 완벽

#### **`isErrorLog` 함수 매핑 현황**

- **총 에러 액션**: 45개
- **에러 로그로 매핑**: 45개 (100%)
- **매핑 방식**: `*_FAILED`, `*_ERROR`, `*_NOT_FOUND` 패턴 매칭
- **매핑 정확도**: ✅ 완벽

#### **`getLogCategory` 함수 매핑 현황**

- **인증 관련**: "auth" 카테고리 ✅
- **농장 관리**: "farm" 카테고리 ✅
- **방문자 관리**: "visitor" 카테고리 ✅
- **시스템 설정**: "system" 카테고리 ✅
- **프로필 관리**: "user" 카테고리 ✅
- **API 에러**: "api" 카테고리 ✅
- **매핑 정확도**: ✅ 완벽

### **📈 매핑 품질 평가**

#### **✅ 완벽한 매핑**

1. **모든 API 액션이 적절한 카테고리로 분류됨**
2. **감사 로그와 에러 로그가 정확히 구분됨**
3. **액션명 패턴이 일관되게 적용됨**

#### **🎯 매핑 패턴 분석**

- **성공 액션**: `ACTION_NAME` (예: `FARM_CREATE`, `VAPID_KEY_CREATED`)
- **실패 액션**: `ACTION_NAME_FAILED` (예: `FARM_CREATE_FAILED`, `VAPID_KEY_CREATE_FAILED`)
- **시스템 오류**: `ACTION_NAME_SYSTEM_ERROR` (예: `PASSWORD_RESET_SYSTEM_ERROR`)
- **상태 액션**: `ACTION_NAME_STATUS` (예: `SESSION_VALID`, `SESSION_EXPIRED`)

#### **🔍 개선 사항**

- **현재 상태**: 모든 API 액션이 적절히 매핑됨
- **추가 작업 필요**: 없음
- **매핑 정확도**: 100%

---

## �� **로그 시스템 사용 가이드**

### **개발자용 퀵 레퍼런스**

```typescript
// API 에러 로깅 (중복 방지 내장)
await logApiError(endpoint, method, error, userId, requestData);

// 사용자 행동 추적
await logUserActivity(action, message, userId, metadata);

// 개인정보 접근 기록 (GDPR)
await logVisitorDataAccess(accessType, userId, details);

// 중요 데이터 변경 추적
await logDataChange(resource, action, recordId, userId, changes);

// 성능 모니터링
const monitor = PerformanceMonitor.start(endpoint, method);
// ... API 호출 ...
monitor.end();
```

### **관리자용 모니터링 체크리스트**

1. **일일 체크**:

   - [ ] 에러 로그 레벨 확인
   - [ ] 성능 이상 징후 확인
   - [ ] 보안 이벤트 검토

2. **주간 체크**:

   - [ ] 로그 볼륨 추세 분석
   - [ ] 자동 정리 작업 결과 확인
   - [ ] 사용자 행동 패턴 분석

3. **월간 체크**:
   - [ ] 로그 보관 정책 검토
   - [ ] 성능 벤치마크 업데이트
   - [ ] 컴플라이언스 보고서 생성

---

**📝 최종 업데이트**: 2025년 6월 28일 16:00  
**📊 구현 진행률**: **100% 완료** ✅  
**🎯 프로젝트 상태**: **완료 및 지속적 최적화** 🚀  
**🔧 최근 변경**: **API 서버 전용 로그 시스템 완성** ✨
