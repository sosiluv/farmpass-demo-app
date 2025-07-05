# 📊 모니터링 설정 가이드

## 🎯 완벽한 모니터링 조합

### 1. UptimeRobot 설정 (필수)

```bash
# 모니터링 URL 설정
- https://your-app.vercel.app (메인 사이트)
- https://your-app.vercel.app/api/health (헬스체크)

# 알림 설정
- 이메일 알림: 관리자 이메일
- Slack 알림: #alerts 채널
- 체크 간격: 5분
- 타임아웃: 30초
```

### 2. Slack 웹훅 설정 (선택사항)

```bash
# 1. Slack 워크스페이스에서 앱 생성
# 2. Incoming Webhooks 활성화
# 3. 웹훅 URL 복사
# 4. 환경 변수 설정

# .env.local
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/YOUR/WEBHOOK/URL
```

### 3. 각 모니터링 도구의 역할

#### UptimeRobot (외부 모니터링)

```bash
✅ 서버 완전 다운 감지
✅ 네트워크 연결 문제 감지
✅ DNS 해결 실패 감지
✅ SSL 인증서 만료 감지
✅ 지역별 접속 문제 감지
✅ CDN 문제 감지
```

#### Slack 헬스체크 (내부 모니터링)

```bash
✅ 애플리케이션 에러 감지
✅ 데이터베이스 연결 실패 감지
✅ 메모리 사용량 경고
✅ API 응답 시간 문제
✅ 비즈니스 로직 에러
```

### 4. 알림 시나리오

#### 시나리오 1: 애플리케이션 에러

```bash
상황: 데이터베이스 연결 실패
✅ Slack 헬스체크: 즉시 알림
✅ UptimeRobot: 정상 (서버는 응답)
결과: Slack 알림만으로 충분
```

#### 시나리오 2: 서버 완전 다운

```bash
상황: Vercel 서버 자체 문제
❌ Slack 헬스체크: 알림 불가
✅ UptimeRobot: 즉시 알림
결과: UptimeRobot이 필수
```

#### 시나리오 3: 네트워크 문제

```bash
상황: 지역별 네트워크 문제
❌ Slack 헬스체크: 알림 불가
✅ UptimeRobot: 즉시 알림
결과: UptimeRobot이 필수
```

### ✅ 다이얼로그 큐 및 운영자 디버그 패널

- 알림 권한 요청, PWA 설치 안내 등 여러 다이얼로그가 동시에 뜨지 않도록 **다이얼로그 큐 시스템**을 도입하여 사용자 경험을 개선했습니다.
- 운영자/개발자는 **디버그 패널**을 통해 실시간 시스템 상태, 성능, 로그, 네트워크 상태를 한눈에 확인할 수 있습니다.

### 5. 비용 분석

```bash
# 🆓 무료 모니터링 조합 (월 비용: $0)
✅ UptimeRobot: $0/월 (50개 모니터, 5분 간격)
✅ Slack 알림: $0/월 (무료 플랜)
✅ Vercel Analytics: $0/월 (Vercel 배포 시 무료)
✅ Vercel Logs: $0/월 (Vercel 배포 시 무료)

# 총 비용: $0/월
# 기능: 프로덕션급 모니터링
```

### 6. 설정 우선순위

```bash
# 1단계: UptimeRobot 설정 (필수)
- 서버 다운 감지가 가장 중요

# 2단계: Slack 웹훅 설정 (선택)
- 애플리케이션 레벨 모니터링

# 3단계: Vercel Analytics 확인 (자동)
- 사용자 행동 분석
```

## 🎉 결론

**UptimeRobot과 Slack 헬스체크는 서로 다른 역할**을 하므로 **둘 다 필요**합니다:

- **UptimeRobot**: "서버가 살아있는가?" (외부 모니터링)
- **Slack 헬스체크**: "애플리케이션이 정상인가?" (내부 모니터링)

이 조합으로 **완벽한 모니터링 시스템**을 구축할 수 있습니다!
