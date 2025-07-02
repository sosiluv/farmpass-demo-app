-- 자동 삭제 함수
CREATE OR REPLACE FUNCTION cleanup_expired_visitor_entries()
RETURNS TABLE(
  deleted_count INTEGER,
  retention_days INTEGER,
  cutoff_date TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_retention_days INTEGER;
  v_cutoff_date TIMESTAMPTZ;
  v_deleted_count INTEGER;
BEGIN
  -- 시스템 설정에서 보존 기간 가져오기
  SELECT "visitorDataRetentionDays" 
  INTO v_retention_days 
  FROM "system_settings" 
  LIMIT 1;
  
  -- 기본값 설정 (설정이 없는 경우)
  IF v_retention_days IS NULL THEN
    v_retention_days := 1095; -- 3년
  END IF;
  
  -- 삭제 기준 날짜 계산 (visit_datetime 기준)
  v_cutoff_date := NOW() - (v_retention_days || ' days')::INTERVAL;
  
  -- 만료된 방문자 데이터 삭제
  DELETE FROM visitor_entries 
  WHERE visit_datetime < v_cutoff_date;
  
  -- 삭제된 행 수 가져오기
  GET DIAGNOSTICS v_deleted_count = ROW_COUNT;
  
  -- 시스템 로그에 기록
  INSERT INTO system_logs (
    level, 
    action, 
    message, 
    resource_type,
    metadata,
    created_at
  ) VALUES (
    'info',
    'AUTO_CLEANUP_VISITORS',
    format('방문자 데이터 자동 정리 완료: %s건 삭제', v_deleted_count),
    'visitor',
    jsonb_build_object(
      'deleted_count', v_deleted_count,
      'retention_days', v_retention_days,
      'cutoff_date', v_cutoff_date,
      'cleanup_type', 'automated'
    ),
    NOW()
  );
  
  -- 결과 반환
  RETURN QUERY SELECT v_deleted_count, v_retention_days, v_cutoff_date;
END;
$$;


----------------------------------------------------------------------------------------------------------------------

-- 매일 새벽 2시 (한국시간) = UTC 17시에 실행
SELECT cron.schedule(
  'cleanup-visitor-entries',
  '0 17 * * *',  -- 매일 17:00 UTC (한국시간 02:00)
  'SELECT cleanup_expired_visitor_entries();'
);

-- 스케줄 확인
SELECT * FROM cron.job WHERE jobname = 'cleanup-visitor-entries';









----------------------------------------------------------------------------------------------------------------

-- 미리보기 함수 (삭제 전 확인용)
CREATE OR REPLACE FUNCTION preview_expired_visitor_entries()
RETURNS TABLE(
  count_to_delete INTEGER,
  retention_days INTEGER,
  cutoff_date TIMESTAMPTZ,
  oldest_entry TIMESTAMPTZ,
  newest_entry TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_retention_days INTEGER;
  v_cutoff_date TIMESTAMPTZ;
  v_count INTEGER;
  v_oldest TIMESTAMPTZ;
  v_newest TIMESTAMPTZ;
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
  
  -- 삭제될 데이터 통계
  SELECT 
    COUNT(*),
    MIN(visit_datetime),
    MAX(visit_datetime)
  INTO v_count, v_oldest, v_newest
  FROM visitor_entries 
  WHERE visit_datetime < v_cutoff_date;
  
  RETURN QUERY SELECT v_count, v_retention_days, v_cutoff_date, v_oldest, v_newest;
END;
$$;


-------------------------------------------------------------------------------------------------------------------------


-- // app/api/admin/visitors/cleanup/route.ts
-- import { createClient } from '@supabase/supabase-js';

-- export async function POST() {
--   const supabase = createClient(
--     process.env.NEXT_PUBLIC_SUPABASE_URL!,
--     process.env.SUPABASE_SERVICE_ROLE_KEY! // 서비스 롤 키 필요
--   );

--   try {
--     // RPC 함수 호출
--     const { data, error } = await supabase.rpc('cleanup_expired_visitor_entries');
    
--     if (error) throw error;
    
--     const result = data[0];
    
--     return Response.json({
--       success: true,
--       deletedCount: result.deleted_count,
--       retentionDays: result.retention_days,
--       cutoffDate: result.cutoff_date
--     });
    
--   } catch (error) {
--     devLog.error('방문자 데이터 정리 오류:', error);
--     return Response.json(
--       { error: '방문자 데이터 정리에 실패했습니다.' },
--       { status: 500 }
--     );
--   }
-- }

-- // 미리보기 API
-- export async function GET() {
--   const supabase = createClient(
--     process.env.NEXT_PUBLIC_SUPABASE_URL!,
--     process.env.SUPABASE_SERVICE_ROLE_KEY!
--   );

--   try {
--     const { data, error } = await supabase.rpc('preview_expired_visitor_entries');
    
--     if (error) throw error;
    
--     const result = data[0];
    
--     return Response.json({
--       count: result.count_to_delete,
--       retentionDays: result.retention_days,
--       cutoffDate: result.cutoff_date,
--       oldestEntry: result.oldest_entry,
--       newestEntry: result.newest_entry
--     });
    
--   } catch (error) {
--     return Response.json(
--       { error: '만료 데이터 조회에 실패했습니다.' },
--       { status: 500 }
--     );
--   }
-- }


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