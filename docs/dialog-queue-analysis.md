# 🔍 다이얼로그 큐 우선순위 시스템 - 현재 상태 분석

## ✅ 주요 상태 업데이트 (2024-01-XX)

### 1. 알림 권한 다이얼로그 **재활성화 완료**

**파일**: `components/common/DialogManager.tsx` (라인 18-28)

```typescript
// 알림 권한 다이얼로그 관리
useEffect(() => {
  if (showDialog) {
    addDialog({
      type: "notification",
      priority: 100, // 최고 우선순위
      data: {
        showDialog,
        handleAllow,
        handleDeny,
        closeDialog,
        farmCount: 0, // 기본값 추가
      },
      isSystemDialog: true,
    });
  }
}, [showDialog, addDialog, handleAllow, handleDeny, closeDialog]);
```

### 2. 현재 동작 상태

#### ✅ **정상 동작하는** 프로세스:

- **알림 권한 다이얼로그**: 우선순위 100으로 최우선 표시
- **PWA 설치 프롬프트**: 우선순위 50으로 알림 권한 다이얼로그 이후 표시
- 다이얼로그 큐 시스템 정상 작동
- Safari 브라우저 호환성 문제 해결

#### 📋 **다이얼로그 표시 순서**:

1. 로그인 후 2초: 알림 권한 다이얼로그 (우선순위 100)
2. 알림 권한 처리 완료 후 10초: PWA 설치 프롬프트 (우선순위 50)

### 3. useNotificationPermission 훅 **정상 동작 확인**

**파일**: `hooks/useNotificationPermission.ts`

```typescript
// 로그인 후 2초 후에 showDialog: true로 설정됨
setState({
  hasAsked: false,
  permission: currentPermission,
  showDialog: true, // ✅ 이 값이 DialogManager에서 큐에 정상 추가됨
});
```

**이제** DialogManager에서 이 상태를 큐에 정상적으로 추가하여 다이얼로그가 표시됨

### 4. 다이얼로그 큐 시스템 자체는 **완벽하게 구현됨**

**파일**: `store/use-dialog-queue.ts`

- 우선순위 기반 큐 관리 ✅
- 시스템 vs 사용자 다이얼로그 분류 ✅
- 동시 표시 방지 ✅
- 순차 처리 로직 ✅

## 🔍 코드 플로우 분석

### 현재 실제 동작 순서:

1. **사용자 로그인** → `useNotificationPermission` 훅 실행
2. **2초 후** → `showDialog: true` 상태 변경
3. **DialogManager 감지** → 하지만 주석처리된 useEffect로 인해 **아무것도 하지 않음**
4. **10초 후** → PWA 설치 프롬프트만 큐에 추가되어 표시

### 원래 의도된 동작 순서:

1. **사용자 로그인** → `useNotificationPermission` 훅 실행
2. **2초 후** → 알림 권한 다이얼로그가 큐에 추가 (우선순위 100)
3. **즉시 표시** → 알림 권한 다이얼로그 표시
4. **사용자 응답 후** → 다이얼로그 제거, 큐에서 다음 항목 처리
5. **10초 후** → PWA 설치 프롬프트 큐에 추가 (우선순위 50)
6. **순차 표시** → PWA 설치 프롬프트 표시

## 🚨 문제점 요약

### 1. 기능적 문제

- **알림 권한 요청이 표시되지 않음**
- 사용자가 수동으로 알림 설정 페이지에 가야만 권한 요청 가능
- PWA 설치와 알림 권한의 우선순위 로직이 실제로 테스트되지 않음

### 2. 코드 일관성 문제

- `useNotificationPermission`은 정상 동작하지만 사용되지 않음
- 다이얼로그 큐 시스템이 완벽하지만 알림 부분은 우회됨
- 주석에 "임시 비활성화"라고 되어 있지만 실제로는 계속 비활성화 상태

### 3. 사용자 경험 문제

- 새 사용자가 알림 기능을 발견하기 어려움
- 알림 권한을 허용하지 않은 사용자에게 자동 안내 없음

## 💡 해결 방안

### 옵션 1: 알림 권한 다이얼로그 재활성화

```typescript
// DialogManager.tsx에서 주석 해제
useEffect(() => {
  if (showDialog) {
    addDialog({
      type: "notification",
      priority: 100, // 최고 우선순위
      data: { showDialog, handleAllow, handleDeny, closeDialog },
      isSystemDialog: true,
    });
  }
}, [showDialog, addDialog, handleAllow, handleDeny, closeDialog]);
```

### 옵션 2: 조건부 활성화

```typescript
// 특정 조건에서만 알림 다이얼로그 표시
useEffect(() => {
  if (showDialog && shouldShowNotificationDialog) {
    addDialog({
      type: "notification",
      priority: 100,
      data: { showDialog, handleAllow, handleDeny, closeDialog },
      isSystemDialog: true,
    });
  }
}, [
  showDialog,
  addDialog,
  handleAllow,
  handleDeny,
  closeDialog,
  shouldShowNotificationDialog,
]);
```

### 옵션 3: 완전 제거

- `useNotificationPermission` 훅에서 다이얼로그 관련 로직 제거
- 설정 페이지에서만 알림 권한 관리

## 🎯 권장사항

**즉시 결정 필요**: 알림 권한 다이얼로그를 활성화할지 완전히 제거할지 결정

- **활성화하는 경우**: 주석 해제하고 충돌 방지 로직 테스트 필요
- **제거하는 경우**: 관련 코드 정리 및 문서 업데이트 필요

현재 상태는 "반쪽짜리 구현"으로, 코드는 있지만 실제로 동작하지 않는 상태입니다.
