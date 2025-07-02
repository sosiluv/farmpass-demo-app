
1. 더미 데이터 생성
-- Supabase SQL Editor에서 실행
-- 테스트용 과거 방문자 데이터 생성
INSERT INTO visitor_entries (
  farm_id, 
  visit_datetime, 
  visitor_name, 
  visitor_phone, 
  visitor_address,
  visitor_purpose,
  disinfection_check,
  consent_given,
  created_at
)
SELECT 
  (SELECT id FROM farms LIMIT 1), -- 첫 번째 농장 ID 사용
  NOW() - (generate_series(1, 10) * INTERVAL '150 days'), -- 150일씩 과거로
  '테스트방문자' || generate_series(1, 10),
  '010-1234-567' || generate_series(1, 10),
  '서울시 테스트구 테스트동 ' || generate_series(1, 10) || '번지',
  '테스트 목적',
  true,
  true,
  NOW() - (generate_series(1, 10) * INTERVAL '150 days')
FROM generate_series(1, 10);

-----------------------------------------------------------------------------------------------------------------------------------

-- 테스트용 로그 생성
DO $$
DECLARE
    admin_user_id UUID;
    admin_email TEXT;
    farm_ids UUID[];
    visitor_ids UUID[];
    i INTEGER;
    random_date TIMESTAMP WITH TIME ZONE;
    log_levels TEXT[] := ARRAY['error', 'warn', 'info', 'debug'];
    actions TEXT[] := ARRAY[
        'USER_LOGIN', 'USER_LOGOUT', 'USER_CREATE', 'USER_UPDATE', 'USER_DELETE',
        'FARM_CREATE', 'FARM_UPDATE', 'FARM_DELETE', 'FARM_MEMBER_ADD', 'FARM_MEMBER_REMOVE',
        'VISITOR_CREATE', 'VISITOR_UPDATE', 'VISITOR_DELETE', 'VISITOR_ENTRY',
        'SYSTEM_BACKUP', 'SYSTEM_MAINTENANCE', 'SYSTEM_ERROR', 'SYSTEM_CONFIG_UPDATE',
        'SECURITY_LOGIN_FAILED', 'SECURITY_PASSWORD_RESET', 'SECURITY_ACCOUNT_LOCKED',
        'NOTIFICATION_SENT', 'NOTIFICATION_FAILED', 'API_REQUEST', 'API_ERROR',
        'SCHEDULED_JOB', 'DATA_EXPORT', 'DATA_IMPORT', 'FILE_UPLOAD'
    ];
    resource_types TEXT[] := ARRAY['farm', 'user', 'visitor', 'system'];
    user_agents TEXT[] := ARRAY[
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
        'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36',
        'Mozilla/5.0 (iPhone; CPU iPhone OS 14_7_1 like Mac OS X)',
        'Mozilla/5.0 (Android 11; Mobile; rv:68.0) Gecko/68.0'
    ];
BEGIN
    -- 첫 번째 관리자 사용자 정보 가져오기
    SELECT id, email INTO admin_user_id, admin_email
    FROM profiles 
    WHERE account_type = 'admin' 
    ORDER BY created_at 
    LIMIT 1;

    -- 농장 ID 목록 가져오기
    SELECT ARRAY_AGG(id) INTO farm_ids FROM farms LIMIT 10;
    
    -- 방문자 ID 목록 가져오기 (있다면)
    SELECT ARRAY_AGG(id) INTO visitor_ids FROM visitor_entries LIMIT 50;

    -- 더미 로그 데이터 생성 (최근 6개월 동안)
    FOR i IN 1..1000 LOOP
        -- 랜덤 날짜 생성 (최근 6개월)
        random_date := NOW() - (RANDOM() * INTERVAL '180 days');
        
        INSERT INTO system_logs (
            level,
            action,
            message,
            user_id,
            user_email,
            user_ip,
            user_agent,
            resource_type,
            resource_id,
            metadata,
            created_at
        ) VALUES (
            -- 로그 레벨 (가중치: info 50%, warn 25%, error 15%, debug 10%)
            CASE 
                WHEN RANDOM() < 0.5 THEN 'info'
                WHEN RANDOM() < 0.75 THEN 'warn'
                WHEN RANDOM() < 0.9 THEN 'error'
                ELSE 'debug'
            END,
            
            -- 액션 (랜덤 선택)
            actions[1 + FLOOR(RANDOM() * array_length(actions, 1))],
            
            -- 메시지 (액션에 따라 다른 메시지)
            CASE actions[1 + FLOOR(RANDOM() * array_length(actions, 1))]
                WHEN 'USER_LOGIN' THEN '사용자 로그인: ' || COALESCE(admin_email, 'unknown@example.com')
                WHEN 'USER_LOGOUT' THEN '사용자 로그아웃: ' || COALESCE(admin_email, 'unknown@example.com')
                WHEN 'VISITOR_CREATE' THEN '방문자 등록: 새로운 방문자가 등록되었습니다'
                WHEN 'VISITOR_ENTRY' THEN '방문자 입장: 방문자가 농장에 입장했습니다'
                WHEN 'FARM_CREATE' THEN '농장 생성: 새로운 농장이 등록되었습니다'
                WHEN 'SYSTEM_BACKUP' THEN '시스템 백업: 정기 백업이 완료되었습니다'
                WHEN 'SYSTEM_ERROR' THEN '시스템 오류: ' || (ARRAY['데이터베이스 연결 실패', '메모리 부족', '디스크 공간 부족', 'API 응답 시간 초과'])[1 + FLOOR(RANDOM() * 4)]
                WHEN 'SECURITY_LOGIN_FAILED' THEN '로그인 실패: 잘못된 비밀번호 시도'
                WHEN 'API_REQUEST' THEN 'API 요청: ' || (ARRAY['/api/farms', '/api/visitors', '/api/users', '/api/settings'])[1 + FLOOR(RANDOM() * 4)]
                WHEN 'SCHEDULED_JOB' THEN '스케줄 작업: ' || (ARRAY['데이터 정리', '백업 실행', '알림 발송', '통계 생성'])[1 + FLOOR(RANDOM() * 4)]
                ELSE '시스템 이벤트: ' || actions[1 + FLOOR(RANDOM() * array_length(actions, 1))] || ' 실행됨'
            END,
            
            -- 사용자 정보 (80% 확률로 관리자, 20% 확률로 NULL)
            CASE WHEN RANDOM() < 0.8 THEN admin_user_id ELSE NULL END,
            CASE WHEN RANDOM() < 0.8 THEN admin_email ELSE 'system@farm.com' END,
            
            -- IP 주소 (랜덤 생성)
            '192.168.' || FLOOR(RANDOM() * 255) || '.' || FLOOR(RANDOM() * 255),
            
            -- User Agent (랜덤 선택)
            user_agents[1 + FLOOR(RANDOM() * array_length(user_agents, 1))],
            
            -- 리소스 타입 (랜덤 선택)
            resource_types[1 + FLOOR(RANDOM() * array_length(resource_types, 1))],
            
            -- 리소스 ID (농장 또는 방문자 ID, 또는 NULL)
            CASE 
                WHEN farm_ids IS NOT NULL AND array_length(farm_ids, 1) > 0 AND RANDOM() < 0.3 
                THEN farm_ids[1 + FLOOR(RANDOM() * array_length(farm_ids, 1))]
                WHEN visitor_ids IS NOT NULL AND array_length(visitor_ids, 1) > 0 AND RANDOM() < 0.2 
                THEN visitor_ids[1 + FLOOR(RANDOM() * array_length(visitor_ids, 1))]
                ELSE NULL
            END,
            
            -- 메타데이터 (JSON)
            jsonb_build_object(
                'timestamp', random_date,
                'session_id', 'sess_' || substr(md5(random()::text), 1, 16),
                'request_id', 'req_' || substr(md5(random()::text), 1, 12),
                'duration_ms', FLOOR(RANDOM() * 5000),
                'status_code', CASE 
                    WHEN RANDOM() < 0.8 THEN 200
                    WHEN RANDOM() < 0.9 THEN 400
                    WHEN RANDOM() < 0.95 THEN 404
                    ELSE 500
                END,
                'additional_info', jsonb_build_object(
                    'browser', (ARRAY['Chrome', 'Firefox', 'Safari', 'Edge'])[1 + FLOOR(RANDOM() * 4)],
                    'os', (ARRAY['Windows', 'macOS', 'Linux', 'iOS', 'Android'])[1 + FLOOR(RANDOM() * 5)],
                    'device', (ARRAY['desktop', 'mobile', 'tablet'])[1 + FLOOR(RANDOM() * 3)]
                )
            ),
            
            -- 생성 시간
            random_date
        );
        
        -- 진행 상황 출력 (100개마다)
        IF i % 100 = 0 THEN
            RAISE NOTICE '더미 로그 데이터 생성 진행률: %/1000', i;
        END IF;
    END LOOP;
    
    RAISE NOTICE '시스템 로그 더미 데이터 1000개 생성 완료!';
END $$;

-- 생성된 데이터 확인
SELECT 
    level,
    COUNT(*) as count,
    MIN(created_at) as oldest,
    MAX(created_at) as newest
FROM system_logs 
GROUP BY level 
ORDER BY level;

-- 액션별 통계
SELECT 
    action,
    COUNT(*) as count
FROM system_logs 
GROUP BY action 
ORDER BY count DESC 
LIMIT 10;

-- 최근 로그 몇 개 확인
SELECT 
    level,
    action,
    message,
    user_email,
    created_at
FROM system_logs 
ORDER BY created_at DESC 
LIMIT 10;


----------------------------------------------------------------------------------------------------------------------------------------


2. 미리보기 함수 테스트
-- 삭제될 데이터 미리 확인
SELECT * FROM preview_expired_visitor_entries();

-- 실제 만료된 데이터 조회해보기
SELECT 
  id, 
  visitor_name, 
  visit_datetime,
  NOW() - visit_datetime as age
FROM visitor_entries 
WHERE visit_datetime < (NOW() - INTERVAL '1095 days')
ORDER BY visit_datetime;




3. 테스트용 삭제 함수
-- 실제 삭제하지 않고 로그만 남기는 테스트 함수
CREATE OR REPLACE FUNCTION test_cleanup_expired_visitor_entries()
RETURNS TABLE(
  would_delete_count INTEGER,
  retention_days INTEGER,
  cutoff_date TIMESTAMPTZ,
  sample_entries JSONB
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_retention_days INTEGER;
  v_cutoff_date TIMESTAMPTZ;
  v_count INTEGER;
  v_samples JSONB;
BEGIN
  -- 시스템 설정에서 보존 기간 가져오기
  SELECT "visitorDataRetentionDays" 
  INTO v_retention_days 
  FROM "system_settings" 
  LIMIT 1;
  
  IF v_retention_days IS NULL THEN
    v_retention_days := 1095;
  END IF;
  
  v_cutoff_date := NOW() - (v_retention_days || ' days')::INTERVAL;
  
  -- 삭제될 데이터 개수 확인
  SELECT COUNT(*) 
  INTO v_count
  FROM visitor_entries 
  WHERE visit_datetime < v_cutoff_date;
  
  -- 샘플 데이터 (최대 5개)
  SELECT jsonb_agg(
    jsonb_build_object(
      'id', id,
      'visitor_name', visitor_name,
      'visit_datetime', visit_datetime,
      'days_old', EXTRACT(DAY FROM NOW() - visit_datetime)
    )
  )
  INTO v_samples
  FROM (
    SELECT id, visitor_name, visit_datetime
    FROM visitor_entries 
    WHERE visit_datetime < v_cutoff_date
    ORDER BY visit_datetime
    LIMIT 5
  ) sample;
  
  -- 테스트 로그 기록
  INSERT INTO system_logs (
    level, 
    action, 
    message, 
    resource_type,
    metadata
  ) VALUES (
    'info',
    'TEST_CLEANUP_VISITORS',
    format('테스트 모드: %s건이 삭제될 예정', v_count),
    'visitor',
    jsonb_build_object(
      'test_mode', true,
      'would_delete_count', v_count,
      'retention_days', v_retention_days,
      'cutoff_date', v_cutoff_date
    )
  );
  
  RETURN QUERY SELECT v_count, v_retention_days, v_cutoff_date, v_samples;
END;
$$;






4. 단계별 테스트 실행
-- 1. 테스트 함수 실행
SELECT * FROM test_cleanup_expired_visitor_entries();

-- 2. 시스템 로그 확인
SELECT * FROM system_logs 
WHERE action = 'TEST_CLEANUP_VISITORS' 
ORDER BY created_at DESC 
LIMIT 5;

-- 3. 보존 기간 임시 변경해서 테스트
UPDATE "system_settings" 
SET "visitorDataRetentionDays" = 100  -- 100일로 임시 변경
WHERE id = (SELECT id FROM "system_settings" LIMIT 1);

-- 4. 다시 테스트
SELECT * FROM test_cleanup_expired_visitor_entries();

-- 5. 원래 설정으로 복구
UPDATE "system_settings" 
SET "visitorDataRetentionDays" = 1095  -- 원래대로 복구
WHERE id = (SELECT id FROM "system_settings" LIMIT 1);






5. API 테스트
// 브라우저 콘솔이나 Postman으로 테스트

// 1. 미리보기 API 테스트
fetch('/api/admin/visitors/cleanup', { method: 'GET' })
  .then(res => res.json())
  .then(data => console.log('미리보기:', data));

// 2. 실제 삭제 API 테스트 (주의!)
fetch('/api/admin/visitors/cleanup', { 
  method: 'POST',
  headers: { 'Content-Type': 'application/json' }
})
  .then(res => res.json())
  .then(data => console.log('삭제 결과:', data));








6. 트렌젝션으로 안전 테스트
-- 트랜잭션 시작 (롤백 가능)
BEGIN;

-- 실제 삭제 함수 실행
SELECT * FROM cleanup_expired_visitor_entries();

-- 결과 확인
SELECT COUNT(*) as remaining_entries FROM visitor_entries;
SELECT * FROM system_logs WHERE action = 'AUTO_CLEANUP_VISITORS' ORDER BY created_at DESC LIMIT 1;

-- 마음에 들지 않으면 롤백
ROLLBACK;

-- 또는 확정하려면
-- COMMIT;




7. 크론 작업 테스트
-- 크론 작업 수동 실행
SELECT cron.schedule(
  'test-cleanup-now',
  '* * * * *',  -- 매분 실행 (테스트용)
  'SELECT test_cleanup_expired_visitor_entries();'
);

-- 1분 후 로그 확인
SELECT * FROM system_logs 
WHERE action = 'TEST_CLEANUP_VISITORS' 
ORDER BY created_at DESC;

-- 테스트 완료 후 스케줄 삭제
SELECT cron.unschedule('test-cleanup-now');
