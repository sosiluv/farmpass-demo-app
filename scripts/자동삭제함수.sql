  ------------------------------------------------------------------------------------------------------------------------------------


--  방문자 데이터 삭제 실행 전용 함수 (시스템 사용자 정보 포함)

CREATE OR REPLACE FUNCTION auto_cleanup_expired_visitor_entries()
RETURNS TABLE(
  execution_id UUID,
  deleted_count INTEGER,
  retention_days INTEGER,
  cutoff_date TIMESTAMPTZ,
  execution_time INTERVAL,
  status TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_execution_id UUID := gen_random_uuid();
  v_start_time TIMESTAMPTZ := NOW();
  v_retention_days INTEGER;
  v_cutoff_date TIMESTAMPTZ;
  v_deleted_count INTEGER;
  v_execution_time INTERVAL;
  v_admin_user_id UUID;
  v_admin_email TEXT;
  v_error_message TEXT;
BEGIN
  -- 첫 번째 admin 사용자 정보 가져오기
  SELECT id, email 
  INTO v_admin_user_id, v_admin_email
  FROM profiles 
  WHERE account_type = 'admin' 
  ORDER BY created_at 
  LIMIT 1;
  
  -- admin 사용자가 없으면 NULL 사용
  IF v_admin_user_id IS NULL THEN
    v_admin_email := 'admin@system';
  END IF;

  -- 실행 시작 로그 (logScheduledJob 형식)
  INSERT INTO system_logs (
    level, 
    action, 
    message, 
    user_id,
    user_email,
    user_ip,
    user_agent,
    resource_type,
    metadata,
    created_at
  ) VALUES (
    'info',
    'SCHEDULED_JOB',
    '스케줄 작업: visitor_data_cleanup started',
    v_admin_user_id,
    COALESCE(v_admin_email, 'admin@system'),
    'system-internal',
    'PostgreSQL Auto Cleanup Service',
    'system',
    jsonb_build_object(
      'job_name', 'visitor_data_cleanup',
      'job_status', 'STARTED',
      'execution_id', v_execution_id,
      'start_time', v_start_time,
      'trigger_type', 'cron_scheduled',
      'executed_by', 'system_automation',
      'timestamp', v_start_time
    ),
    v_start_time
  );

  BEGIN
    SELECT "visitorDataRetentionDays" 
    INTO v_retention_days 
    FROM "system_settings" 
    LIMIT 1;
    
    IF v_retention_days IS NULL THEN
      v_retention_days := 1095;
    END IF;
    
    v_cutoff_date := NOW() - (v_retention_days || ' days')::INTERVAL;
    
    DELETE FROM visitor_entries 
    WHERE visit_datetime < v_cutoff_date;
    
    GET DIAGNOSTICS v_deleted_count = ROW_COUNT;
    v_execution_time := NOW() - v_start_time;
    
    -- 성공 로그 (logScheduledJob + logDataChange 형식)
    INSERT INTO system_logs (
      level, action, message, user_id, user_email, user_ip, user_agent,
      resource_type, metadata, created_at
    ) VALUES (
      'info', 'SCHEDULED_JOB',
      format('스케줄 작업: visitor_data_cleanup completed (%s건 삭제)', v_deleted_count),
      v_admin_user_id,
      COALESCE(v_admin_email, 'admin@system'),
      'system-internal', 'PostgreSQL Auto Cleanup Service', 'system',
      jsonb_build_object(
        'job_name', 'visitor_data_cleanup',
        'job_status', 'COMPLETED',
        'execution_id', v_execution_id, 
        'deleted_count', v_deleted_count,
        'retention_days', v_retention_days, 
        'cutoff_date', v_cutoff_date,
        'duration_ms', EXTRACT(EPOCH FROM v_execution_time) * 1000,
        'cleanup_type', 'automated',
        'executed_by', 'system_automation',
        'timestamp', NOW()
      ), NOW()
    );

    -- 데이터 변경 로그 추가 (logDataChange 형식)
    IF v_deleted_count > 0 THEN
      INSERT INTO system_logs (
        level, action, message, user_id, user_email, user_ip, user_agent,
        resource_type, metadata, created_at
      ) VALUES (
        'info', 'VISITOR_DELETED',
        format('visitor delete: 만료된 데이터 자동 정리 (%s건)', v_deleted_count),
        v_admin_user_id,
        COALESCE(v_admin_email, 'admin@system'),
        'system-internal', 'PostgreSQL Auto Cleanup Service', 'visitor',
        jsonb_build_object(
          'resource_type', 'visitor',
          'action', 'DELETE',
          'record_id', null,
          'changes', jsonb_build_object(
            'deleted_count', v_deleted_count,
            'retention_days', v_retention_days,
            'cutoff_date', v_cutoff_date,
            'cleanup_type', 'automated'
          ),
          'timestamp', NOW()
        ), NOW()
      );
    END IF;
    
    RETURN QUERY SELECT 
      v_execution_id, v_deleted_count, v_retention_days, v_cutoff_date,
      v_execution_time, 'SUCCESS'::TEXT;
      
  EXCEPTION WHEN OTHERS THEN
    v_error_message := SQLERRM;
    v_execution_time := NOW() - v_start_time;
    
    -- 실패 로그 (logScheduledJobFailure 형식)
    INSERT INTO system_logs (
      level, action, message, user_id, user_email, user_ip, user_agent,
      resource_type, metadata, created_at
    ) VALUES (
      'error', 'SCHEDULED_JOB',
      format('스케줄 작업 실패: visitor_data_cleanup - %s', v_error_message),
      v_admin_user_id,
      COALESCE(v_admin_email, 'admin@system'),
      'system-internal', 'PostgreSQL Auto Cleanup Service', 'system',
      jsonb_build_object(
        'job_name', 'visitor_data_cleanup',
        'job_status', 'FAILED',
        'execution_id', v_execution_id, 
        'error_message', v_error_message,
        'duration_ms', EXTRACT(EPOCH FROM v_execution_time) * 1000,
        'cleanup_type', 'automated',
        'executed_by', 'system_automation',
        'timestamp', NOW()
      ), NOW()
    );
    
    RETURN QUERY SELECT 
      v_execution_id, 0, v_retention_days, v_cutoff_date,
      v_execution_time, 'ERROR'::TEXT;
  END;
END;
$$;

-- 시스템 로그 자동 정리 함수
CREATE OR REPLACE FUNCTION auto_cleanup_expired_system_logs()
RETURNS TABLE(
  execution_id UUID,
  deleted_count INTEGER,
  retention_days INTEGER,
  cutoff_date TIMESTAMPTZ,
  execution_time INTERVAL,
  status TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_execution_id UUID := gen_random_uuid();
  v_start_time TIMESTAMPTZ := NOW();
  v_retention_days INTEGER;
  v_cutoff_date TIMESTAMPTZ;
  v_deleted_count INTEGER;
  v_execution_time INTERVAL;
  v_admin_user_id UUID;
  v_admin_email TEXT;
  v_error_message TEXT;
BEGIN
  -- 첫 번째 admin 사용자 정보 가져오기
  SELECT id, email 
  INTO v_admin_user_id, v_admin_email
  FROM profiles 
  WHERE account_type = 'admin' 
  ORDER BY created_at 
  LIMIT 1;
  
  -- admin 사용자가 없으면 NULL 사용
  IF v_admin_user_id IS NULL THEN
    v_admin_email := 'admin@system';
  END IF;

  -- 실행 시작 로그 (logScheduledJob 형식)
  INSERT INTO system_logs (
    level, 
    action, 
    message, 
    user_id,
    user_email,
    user_ip,
    user_agent,
    resource_type,
    metadata,
    created_at
  ) VALUES (
    'info',
    'SCHEDULED_JOB',
    '스케줄 작업: system_logs_cleanup started',
    v_admin_user_id,
    COALESCE(v_admin_email, 'admin@system'),
    'system-internal',
    'PostgreSQL Auto Log Cleanup Service',
    'system',
    jsonb_build_object(
      'job_name', 'system_logs_cleanup',
      'job_status', 'STARTED',
      'execution_id', v_execution_id,
      'start_time', v_start_time,
      'trigger_type', 'cron_scheduled',
      'executed_by', 'system_automation',
      'timestamp', v_start_time
    ),
    v_start_time
  );

  BEGIN
    -- 시스템 설정에서 로그 보관 기간 가져오기
    SELECT "logRetentionDays" 
    INTO v_retention_days 
    FROM "system_settings" 
    LIMIT 1;
    
    -- 기본값 설정 (90일)
    IF v_retention_days IS NULL THEN
      v_retention_days := 90;
    END IF;
    
    v_cutoff_date := NOW() - (v_retention_days || ' days')::INTERVAL;
    
    -- 오래된 시스템 로그 삭제 (현재 실행 로그는 제외)
    DELETE FROM system_logs 
    WHERE created_at < v_cutoff_date
    AND NOT (
      action = 'SCHEDULED_JOB' 
      AND metadata->>'job_name' LIKE '%cleanup%'
      AND created_at > NOW() - INTERVAL '2 hours'
    );
    
    GET DIAGNOSTICS v_deleted_count = ROW_COUNT;
    v_execution_time := NOW() - v_start_time;
    
    -- 성공 로그 (logScheduledJob 형식)
    INSERT INTO system_logs (
      level, action, message, user_id, user_email, user_ip, user_agent,
      resource_type, metadata, created_at
    ) VALUES (
      'info', 'SCHEDULED_JOB',
      format('스케줄 작업: system_logs_cleanup completed (%s건 삭제)', v_deleted_count),
      v_admin_user_id,
      COALESCE(v_admin_email, 'admin@system'),
      'system-internal', 'PostgreSQL Auto Log Cleanup Service', 'system',
      jsonb_build_object(
        'job_name', 'system_logs_cleanup',
        'job_status', 'COMPLETED',
        'execution_id', v_execution_id, 
        'deleted_count', v_deleted_count,
        'retention_days', v_retention_days, 
        'cutoff_date', v_cutoff_date,
        'duration_ms', EXTRACT(EPOCH FROM v_execution_time) * 1000,
        'cleanup_type', 'automated',
        'executed_by', 'system_automation',
        'timestamp', NOW()
      ), NOW()
    );

    -- 데이터 변경 로그 추가 (logDataChange 형식)
    IF v_deleted_count > 0 THEN
      INSERT INTO system_logs (
        level, action, message, user_id, user_email, user_ip, user_agent,
        resource_type, metadata, created_at
      ) VALUES (
        'info', 'LOG_DELETE',
        format('log delete: 만료된 로그 자동 정리 (%s건)', v_deleted_count),
        v_admin_user_id,
        COALESCE(v_admin_email, 'admin@system'),
        'system-internal', 'PostgreSQL Auto Log Cleanup Service', 'system',
        jsonb_build_object(
          'resource_type', 'system',
          'action', 'DELETE',
          'record_id', null,
          'changes', jsonb_build_object(
            'deleted_count', v_deleted_count,
            'retention_days', v_retention_days,
            'cutoff_date', v_cutoff_date,
            'cleanup_type', 'automated'
          ),
          'timestamp', NOW()
        ), NOW()
      );
    END IF;
    
    RETURN QUERY SELECT 
      v_execution_id, v_deleted_count, v_retention_days, v_cutoff_date,
      v_execution_time, 'SUCCESS'::TEXT;
      
  EXCEPTION WHEN OTHERS THEN
    v_error_message := SQLERRM;
    v_execution_time := NOW() - v_start_time;
    
    -- 실패 로그 (logScheduledJobFailure 형식)
    INSERT INTO system_logs (
      level, action, message, user_id, user_email, user_ip, user_agent,
      resource_type, metadata, created_at
    ) VALUES (
      'error', 'SCHEDULED_JOB',
      format('스케줄 작업 실패: system_logs_cleanup - %s', v_error_message),
      v_admin_user_id,
      COALESCE(v_admin_email, 'admin@system'),
      'system-internal', 'PostgreSQL Auto Log Cleanup Service', 'system',
      jsonb_build_object(
        'job_name', 'system_logs_cleanup',
        'job_status', 'FAILED',
        'execution_id', v_execution_id, 
        'error_message', v_error_message,
        'duration_ms', EXTRACT(EPOCH FROM v_execution_time) * 1000,
        'cleanup_type', 'automated',
        'executed_by', 'system_automation',
        'timestamp', NOW()
      ), NOW()
    );
    
    RETURN QUERY SELECT 
      v_execution_id, 0, v_retention_days, v_cutoff_date,
      v_execution_time, 'ERROR'::TEXT;
  END;
END;
$$;

-- 통합 자동 정리 함수 (방문자 데이터 + 시스템 로그)
-- CREATE OR REPLACE FUNCTION auto_cleanup_all_expired_data()
-- RETURNS TABLE(
--   cleanup_type TEXT,
--   execution_id UUID,
--   deleted_count INTEGER,
--   retention_days INTEGER,
--   cutoff_date TIMESTAMPTZ,
--   execution_time INTERVAL,
--   status TEXT
-- )
-- LANGUAGE plpgsql
-- SECURITY DEFINER
-- SET search_path = public
-- AS $$
-- DECLARE
--   visitor_result RECORD;
--   log_result RECORD;
-- BEGIN
--   -- 방문자 데이터 정리
--   FOR visitor_result IN 
--     SELECT * FROM auto_cleanup_expired_visitor_entries()
--   LOOP
--     RETURN QUERY SELECT 
--       'VISITOR_DATA'::TEXT,
--       visitor_result.execution_id,
--       visitor_result.deleted_count,
--       visitor_result.retention_days,
--       visitor_result.cutoff_date,
--       visitor_result.execution_time,
--       visitor_result.status;
--   END LOOP;
  
--   -- 시스템 로그 정리
--   FOR log_result IN 
--     SELECT * FROM auto_cleanup_expired_system_logs()
--   LOOP
--     RETURN QUERY SELECT 
--       'SYSTEM_LOGS'::TEXT,
--       log_result.execution_id,
--       log_result.deleted_count,
--       log_result.retention_days,
--       log_result.cutoff_date,
--       log_result.execution_time,
--       log_result.status;
--   END LOOP;
-- END;
-- $$;




------------------------------------------------------------------------------------------------------------------------------------------------

-- 만료된 구독 정리 함수 (개선된 버전)
CREATE OR REPLACE FUNCTION auto_cleanup_expired_push_subscriptions()
RETURNS TABLE(
  execution_id UUID,
  deleted_subscriptions INTEGER,
  retention_months INTEGER,
  cutoff_date TIMESTAMPTZ,
  execution_time INTERVAL,
  status TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_execution_id UUID := gen_random_uuid();
  v_start_time TIMESTAMPTZ := NOW();
  v_retention_months INTEGER := 6; -- 기본값 6개월
  v_cutoff_date TIMESTAMPTZ;
  v_deleted_subscriptions INTEGER;
  v_execution_time INTERVAL;
  v_admin_user_id UUID;
  v_admin_email TEXT;
  v_error_message TEXT;
BEGIN
  -- 첫 번째 admin 사용자 정보 가져오기
  SELECT id, email 
  INTO v_admin_user_id, v_admin_email
  FROM profiles 
  WHERE account_type = 'admin' 
  ORDER BY created_at 
  LIMIT 1;
  
  -- admin 사용자가 없으면 NULL 사용
  IF v_admin_user_id IS NULL THEN
    v_admin_email := 'admin@system';
  END IF;

  -- 실행 시작 로그
  INSERT INTO system_logs (
    level, 
    action, 
    message, 
    user_id,
    user_email,
    user_ip,
    user_agent,
    resource_type,
    metadata,
    created_at
  ) VALUES (
    'info',
    'SCHEDULED_JOB',
    '스케줄 작업: push_subscription_cleanup started',
    v_admin_user_id,
    COALESCE(v_admin_email, 'admin@system'),
    'system-internal',
    'PostgreSQL Auto Cleanup Service',
    'system',
    jsonb_build_object(
      'job_name', 'push_subscription_cleanup',
      'job_status', 'STARTED',
      'execution_id', v_execution_id,
      'start_time', v_start_time,
      'trigger_type', 'cron_scheduled',
      'executed_by', 'system_automation',
      'timestamp', v_start_time
    ),
    v_start_time
  );

  BEGIN
    -- 시스템 설정에서 보존 기간 가져오기 (선택사항)
    -- SELECT "pushSubscriptionRetentionMonths" INTO v_retention_months FROM "system_settings" LIMIT 1;
    -- IF v_retention_months IS NULL THEN
    --   v_retention_months := 6;
    -- END IF;
    
    v_cutoff_date := NOW() - (v_retention_months || ' months')::INTERVAL;
    
    -- 만료된 구독 삭제
    DELETE FROM push_subscriptions 
    WHERE updated_at < v_cutoff_date;
    
    GET DIAGNOSTICS v_deleted_subscriptions = ROW_COUNT;
    
    v_execution_time := NOW() - v_start_time;
    
    -- 성공 로그
    INSERT INTO system_logs (
      level, action, message, user_id, user_email, user_ip, user_agent,
      resource_type, metadata, created_at
    ) VALUES (
      'info',
      'SCHEDULED_JOB',
      format('스케줄 작업: push_subscription_cleanup completed. 삭제된 구독: %s', v_deleted_subscriptions),
      v_admin_user_id,
      COALESCE(v_admin_email, 'admin@system'),
      'system-internal',
      'PostgreSQL Auto Cleanup Service',
      'system',
      jsonb_build_object(
        'job_name', 'push_subscription_cleanup',
        'job_status', 'COMPLETED',
        'execution_id', v_execution_id,
        'start_time', v_start_time,
        'end_time', NOW(),
        'duration_ms', EXTRACT(EPOCH FROM v_execution_time) * 1000,
        'deleted_subscriptions', v_deleted_subscriptions,
        'retention_months', v_retention_months,
        'cutoff_date', v_cutoff_date,
        'trigger_type', 'cron_scheduled',
        'executed_by', 'system_automation',
        'timestamp', NOW()
      ),
      NOW()
    );

    RETURN QUERY SELECT 
      v_execution_id,
      v_deleted_subscriptions,
      v_retention_months,
      v_cutoff_date,
      v_execution_time,
      'SUCCESS'::TEXT;

  EXCEPTION WHEN OTHERS THEN
    v_error_message := SQLERRM;
    
    -- 오류 로그
    INSERT INTO system_logs (
      level, action, message, user_id, user_email, user_ip, user_agent,
      resource_type, metadata, created_at
    ) VALUES (
      'error',
      'SCHEDULED_JOB',
      format('스케줄 작업: push_subscription_cleanup failed. Error: %s', v_error_message),
      v_admin_user_id,
      COALESCE(v_admin_email, 'admin@system'),
      'system-internal',
      'PostgreSQL Auto Cleanup Service',
      'system',
      jsonb_build_object(
        'job_name', 'push_subscription_cleanup',
        'job_status', 'FAILED',
        'execution_id', v_execution_id,
        'start_time', v_start_time,
        'end_time', NOW(),
        'error', v_error_message,
        'trigger_type', 'cron_scheduled',
        'executed_by', 'system_automation',
        'timestamp', NOW()
      ),
      NOW()
    );

    RETURN QUERY SELECT 
      v_execution_id,
      0,
      v_retention_months,
      v_cutoff_date,
      NOW() - v_start_time,
      'ERROR: ' || v_error_message;
  END;
END;
$$;

----------------------------------------------------------------------------------------------------------------


-- 크론 작업 등록 예시 (한국 시간 기준으로 조정)
/*
-- 한국 시간 새벽 2시 (UTC 전날 17시)에 방문자 데이터 정리
SELECT cron.schedule('cleanup-visitor-data', '0 17 * * *', 'SELECT auto_cleanup_expired_visitor_entries();');

-- 한국 시간 새벽 3시 (UTC 전날 18시)에 시스템 로그 정리
SELECT cron.schedule('cleanup-system-logs', '0 18 * * *', 'SELECT auto_cleanup_expired_system_logs();');

-- 한국 시간 새벽 4시 (UTC 전날 19시)에 구독 만료 사용자 정리
SELECT cron.schedule('cleanup-push_subscriptions', '0 19 * * *', 'SELECT auto_cleanup_expired_push_subscriptions();');

-- 한국 시간 일요일 새벽 4시 (UTC 토요일 19시)에 주간 보고서 생성
SELECT cron.schedule('weekly-cleanup-report', '0 19 * * 6', 'SELECT generate_weekly_cleanup_report();');

-- 시간대 참고사항:
-- - PostgreSQL 크론은 UTC 기준으로 실행됩니다
-- - 한국 시간(KST)은 UTC+9 이므로 9시간을 빼서 설정해야 합니다
-- - 예: 한국 새벽 2시 = UTC 전날 17시
-- - 일요일은 한국 기준이므로 UTC에서는 토요일(6)이 됩니다

-- 또는 통합 정리 (한국 시간 새벽 2시 = UTC 전날 17시)
SELECT cron.schedule('cleanup-all-data', '0 17 * * *', 'SELECT auto_cleanup_all_expired_data();');
*/


----------------------------------------------------------------------------------------------------------------


-- 크론에서 호출할 간단한 래퍼 함수
-- CREATE OR REPLACE FUNCTION cron_visitor_cleanup()
-- RETURNS void
-- LANGUAGE plpgsql
-- SECURITY DEFINER
-- AS $$
-- DECLARE
--   v_result RECORD;
-- BEGIN
--   -- 자동 정리 실행
--   SELECT * INTO v_result 
--   FROM auto_cleanup_expired_visitor_entries() 
--   LIMIT 1;
  
--   -- 결과를 PostgreSQL 로그에도 기록 (선택사항)
--   IF v_result.status = 'SUCCESS' THEN
--     RAISE NOTICE '[CRON] 방문자 데이터 정리 성공: %건 삭제', v_result.deleted_count;
--   ELSE
--     RAISE WARNING '[CRON] 방문자 데이터 정리 실패';
--   END IF;
-- END;
-- $$;


----------------------------------------------------------------------------------------------------------------


-- 기존 스케줄이 있다면 삭제
SELECT cron.unschedule('auto-visitor-cleanup');

-- 새로운 스케줄 등록 (매일 새벽 2시 한국시간 = UTC 17시)
SELECT cron.schedule(
  'auto-visitor-cleanup',
  '0 17 * * *',  -- 매일 17:00 UTC (한국시간 02:00)
  'SELECT cron_visitor_cleanup();'
);

-- 스케줄 확인
SELECT 
  jobid,
  schedule,
  command,
  nodename,
  nodeport,
  database,
  username,
  active
FROM cron.job 
WHERE jobname = 'auto-visitor-cleanup';



----------------------------------------------------------------------------------------------------------------

-- 1. 수동으로 자동 정리 함수 테스트
SELECT * FROM auto_cleanup_expired_visitor_entries();

-- 2. 크론 래퍼 함수 테스트
SELECT cron_visitor_cleanup();

-- 3. 시스템 로그 확인 (새로운 형식에 맞춰 수정)
SELECT 
  action,
  message,
  user_email,
  user_ip,
  user_agent,
  metadata->>'execution_id' as execution_id,
  metadata->>'job_name' as job_name,
  metadata->>'job_status' as job_status,
  metadata->>'deleted_count' as deleted_count,
  created_at
FROM system_logs 
WHERE action IN ('SCHEDULED_JOB', 'VISITOR_DELETED', 'LOG_DELETE')
  AND (metadata->>'job_name' LIKE '%cleanup%' OR action LIKE '%_DELETE')
ORDER BY created_at DESC
LIMIT 20;

-- 4. 크론 작업 상태 확인
SELECT 
  jobname,
  schedule,
  active,
  database,
  username
FROM cron.job;



-- 실제 만료된 데이터 조회해보기
SELECT 
  id, 
  visitor_name, 
  visit_datetime,
  NOW() - visit_datetime as age
FROM visitor_entries 
WHERE visit_datetime < (NOW() - INTERVAL '1095 days')
ORDER BY visit_datetime;

-- 개수 확인
SELECT 
  COUNT(*) as expired_count,
  MIN(visit_datetime) as oldest_entry,
  MAX(visit_datetime) as newest_expired_entry
FROM visitor_entries 
WHERE visit_datetime < (NOW() - INTERVAL '1095 days');





---------------------------------------------------------------------------------------------------------------------------------------------------------------------



-- 5. 실행 순서
-- Supabase SQL Editor에서 위 함수들 실행
-- pg_cron 스케줄 등록
-- API 엔드포인트 생성 (수동 실행용)
-- 관리자 UI에서 미리보기/수동 실행 기능 연결
-- ⚡ 장점
-- DB 레벨 처리: 네트워크 오버헤드 없음
-- 트랜잭션 안전: 원자적 삭제 보장
-- 자동 로깅: 삭제 작업 자동 기록
-- 유연한 실행: 자동 + 수동 모두 지원
-- 이렇게 하면 완벽한 방문자 데이터 보존 기간 관리 시스템이 완성됩니다! 🎯

-- 주간 데이터 정리 현황 보고서 생성 함수
CREATE OR REPLACE FUNCTION generate_weekly_cleanup_report()
RETURNS TABLE(
  report_date TIMESTAMPTZ,
  period_start TIMESTAMPTZ,
  period_end TIMESTAMPTZ,
  system_logs_cleaned INTEGER,
  visitor_entries_cleaned INTEGER,
  current_system_logs_count INTEGER,
  current_visitor_entries_count INTEGER,
  next_week_estimated_cleanup INTEGER,
  cleanup_jobs_status JSONB,
  recommendations TEXT[]
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_period_start TIMESTAMPTZ := NOW() - INTERVAL '7 days';
  v_period_end TIMESTAMPTZ := NOW();
  v_system_logs_cleaned INTEGER := 0;
  v_visitor_entries_cleaned INTEGER := 0;
  v_current_system_logs INTEGER := 0;
  v_current_visitor_entries INTEGER := 0;
  v_next_week_estimate INTEGER := 0;
  v_cleanup_jobs_status JSONB;
  v_recommendations TEXT[] := ARRAY[]::TEXT[];
  v_retention_days_logs INTEGER;
  v_retention_days_visitors INTEGER;
  v_admin_user_id UUID;
  v_admin_email TEXT;
BEGIN
  -- 첫 번째 admin 사용자 정보 가져오기
  SELECT id, email 
  INTO v_admin_user_id, v_admin_email
  FROM profiles 
  WHERE account_type = 'admin' 
  ORDER BY created_at 
  LIMIT 1;

  -- 시스템 설정에서 보관 기간 가져오기
  SELECT "logRetentionDays", "visitorDataRetentionDays"
  INTO v_retention_days_logs, v_retention_days_visitors
  FROM "system_settings" 
  LIMIT 1;

  -- 기본값 설정
  v_retention_days_logs := COALESCE(v_retention_days_logs, 90);
  v_retention_days_visitors := COALESCE(v_retention_days_visitors, 1095);

  -- 지난 주 정리된 데이터 개수 조회 (새로운 로그 형식에서)
  SELECT 
    COALESCE(SUM((metadata->>'deleted_count')::INTEGER), 0)
  INTO v_system_logs_cleaned
  FROM system_logs 
  WHERE action = 'LOG_DELETE'
    AND created_at BETWEEN v_period_start AND v_period_end;

  SELECT 
    COALESCE(SUM((metadata->'changes'->>'deleted_count')::INTEGER), 0)
  INTO v_visitor_entries_cleaned
  FROM system_logs 
  WHERE action = 'VISITOR_DELETED'
    AND created_at BETWEEN v_period_start AND v_period_end;

  -- 현재 데이터 개수 조회
  SELECT COUNT(*) INTO v_current_system_logs FROM system_logs;
  SELECT COUNT(*) INTO v_current_visitor_entries FROM visitor_entries;

  -- 다음 주 예상 정리량 (일주일치 데이터 생성량 기준)
  SELECT 
    COALESCE(COUNT(*), 0)
  INTO v_next_week_estimate
  FROM system_logs 
  WHERE created_at >= NOW() - INTERVAL '7 days';

  -- 크론 작업 상태 확인
  SELECT jsonb_build_object(
    'system_logs_job', CASE 
      WHEN EXISTS(SELECT 1 FROM cron.job WHERE jobname = 'cleanup-system-logs') 
      THEN 'active' ELSE 'not_configured' END,
    'visitor_data_job', CASE 
      WHEN EXISTS(SELECT 1 FROM cron.job WHERE jobname = 'cleanup-visitor-data') 
      THEN 'active' ELSE 'not_configured' END,
    'last_system_log_cleanup', (
      SELECT start_time 
      FROM cron.job_run_details 
      WHERE jobid = (SELECT jobid FROM cron.job WHERE jobname = 'cleanup-system-logs')
      ORDER BY start_time DESC LIMIT 1
    ),
    'last_visitor_cleanup', (
      SELECT start_time 
      FROM cron.job_run_details 
      WHERE jobid = (SELECT jobid FROM cron.job WHERE jobname = 'cleanup-visitor-data')
      ORDER BY start_time DESC LIMIT 1
    )
  ) INTO v_cleanup_jobs_status;

  -- 권장사항 생성
  IF v_current_system_logs > 100000 THEN
    v_recommendations := array_append(v_recommendations, 
      '시스템 로그가 10만건을 초과했습니다. 로그 레벨 조정을 고려해보세요.');
  END IF;

  IF v_current_visitor_entries > 50000 THEN
    v_recommendations := array_append(v_recommendations, 
      '방문자 데이터가 5만건을 초과했습니다. 보관 기간 단축을 고려해보세요.');
  END IF;

  IF v_system_logs_cleaned = 0 AND v_current_system_logs > 1000 THEN
    v_recommendations := array_append(v_recommendations, 
      '지난 주 시스템 로그 정리가 실행되지 않았습니다. 크론 작업 상태를 확인하세요.');
  END IF;

  IF array_length(v_recommendations, 1) IS NULL THEN
    v_recommendations := ARRAY['모든 정리 작업이 정상적으로 실행되고 있습니다.'];
  END IF;

  -- 보고서 로그 생성 (logBusinessEvent 형식)
  INSERT INTO system_logs (
    level, action, message, user_id, user_email, user_ip, user_agent,
    resource_type, metadata, created_at
  ) VALUES (
    'info', 'BUSINESS_EVENT',
    format('비즈니스 이벤트: WEEKLY_CLEANUP_REPORT - 주간 데이터 정리 현황 보고서 생성 완료 (시스템 로그: %s건, 방문자 데이터: %s건)', 
           v_system_logs_cleaned, v_visitor_entries_cleaned),
    v_admin_user_id,
    COALESCE(v_admin_email, 'admin@system'),
    'system-internal', 'PostgreSQL Weekly Report Service', 'system',
    jsonb_build_object(
      'event_type', 'WEEKLY_CLEANUP_REPORT',
      'description', 'weekly_cleanup_summary',
      'period_start', v_period_start,
      'period_end', v_period_end,
      'system_logs_cleaned', v_system_logs_cleaned,
      'visitor_entries_cleaned', v_visitor_entries_cleaned,
      'current_system_logs_count', v_current_system_logs,
      'current_visitor_entries_count', v_current_visitor_entries,
      'next_week_estimated_cleanup', v_next_week_estimate,
      'cleanup_jobs_status', v_cleanup_jobs_status,
      'recommendations', v_recommendations,
      'retention_settings', jsonb_build_object(
        'log_retention_days', v_retention_days_logs,
        'visitor_retention_days', v_retention_days_visitors
      ),
      'timestamp', NOW()
    ), NOW()
  );

  -- 결과 반환
  RETURN QUERY SELECT 
    NOW()::TIMESTAMPTZ,
    v_period_start,
    v_period_end,
    v_system_logs_cleaned,
    v_visitor_entries_cleaned,
    v_current_system_logs,
    v_current_visitor_entries,
    v_next_week_estimate,
    v_cleanup_jobs_status,
    v_recommendations;
END;
$$;

-- 주간 보고서 크론 작업 등록 예시 (한국 시간 기준)
/*
-- 한국 시간 일요일 새벽 4시 (UTC 토요일 19시)에 주간 보고서 생성
SELECT cron.schedule(
  'weekly-cleanup-report', 
  '0 19 * * 6',  -- UTC 토요일 19시 = 한국 일요일 새벽 4시
  'SELECT generate_weekly_cleanup_report();'
);

-- 시간대 변환 가이드:
-- 한국 시간 (KST) = UTC + 9시간
-- 크론 설정 시 UTC 기준으로 입력해야 하므로:
-- 원하는 한국 시간 - 9시간 = 크론 설정 시간
-- 
-- 예시:
-- - 한국 새벽 1시 → UTC 전날 16시 → '0 16 * * *'
-- - 한국 새벽 2시 → UTC 전날 17시 → '0 17 * * *'  
-- - 한국 새벽 3시 → UTC 전날 18시 → '0 18 * * *'
-- - 한국 새벽 4시 → UTC 전날 19시 → '0 19 * * *'
-- - 한국 새벽 5시 → UTC 전날 20시 → '0 20 * * *'
*/


-----------------------------------------------------------------------------------------------------------------------------------------------------------

 
