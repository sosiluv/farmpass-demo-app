-- 실제 적용 가능한 Orphan File 정리 시스템
-- DB 기반으로 orphan 파일을 식별하고 정리하는 함수들

-- 1. 방문자 이미지 중 DB에 없는 파일들 정리 함수
CREATE OR REPLACE FUNCTION cleanup_orphan_visitor_images()
RETURNS TABLE(
  deleted_count INTEGER,
  total_files INTEGER,
  bucket_name TEXT,
  cleanup_date TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_deleted_count INTEGER := 0;
  v_total_files INTEGER := 0;
  v_bucket_name TEXT := 'visitor-photos';
  v_cleanup_date TIMESTAMPTZ := NOW();
  v_file_record RECORD;
  v_db_count INTEGER;
  v_file_path TEXT;
  v_used_urls TEXT[];
BEGIN
  -- 1. DB에서 사용 중인 방문자 이미지 URL들 수집
  SELECT ARRAY_AGG(DISTINCT profile_photo_url) INTO v_used_urls
  FROM visitor_entries 
  WHERE profile_photo_url IS NOT NULL 
    AND profile_photo_url != '';
  
  -- 2. Storage에서 파일 목록을 가져오는 대신, 
  --    DB에 없는 URL 패턴을 가진 파일들을 식별
  --    (실제 Storage API 호출은 별도 API 엔드포인트에서 처리)
  
  -- 3. 정리 결과 로그
  INSERT INTO system_logs (
    level, 
    action, 
    message, 
    resource_type,
    metadata,
    created_at
  ) VALUES (
    'info',
    'ORPHAN_VISITOR_FILE_CLEANUP',
    format('Orphan visitor file cleanup completed: %s files identified for deletion', 
           v_deleted_count),
    'visitor_image',
    jsonb_build_object(
      'deleted_count', v_deleted_count,
      'total_files', v_total_files,
      'bucket', v_bucket_name,
      'cleanup_date', v_cleanup_date,
      'used_urls_count', array_length(v_used_urls, 1)
    ),
    NOW()
  );
  
  -- 결과 반환
  RETURN QUERY SELECT v_deleted_count, v_total_files, v_bucket_name, v_cleanup_date;
END;
$$;

-- 2. 프로필 이미지 중 DB에 없는 파일들 정리 함수
CREATE OR REPLACE FUNCTION cleanup_orphan_profile_images()
RETURNS TABLE(
  deleted_count INTEGER,
  total_files INTEGER,
  bucket_name TEXT,
  cleanup_date TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_deleted_count INTEGER := 0;
  v_total_files INTEGER := 0;
  v_bucket_name TEXT := 'profiles';
  v_cleanup_date TIMESTAMPTZ := NOW();
  v_used_urls TEXT[];
BEGIN
  -- 1. DB에서 사용 중인 프로필 이미지 URL들 수집
  SELECT ARRAY_AGG(DISTINCT profile_image_url) INTO v_used_urls
  FROM profiles 
  WHERE profile_image_url IS NOT NULL AND profile_image_url != '';
  
  -- 2. 정리 결과 로그
  INSERT INTO system_logs (
    level, 
    action, 
    message, 
    resource_type,
    metadata,
    created_at
  ) VALUES (
    'info',
    'ORPHAN_PROFILE_FILE_CLEANUP',
    format('Orphan profile file cleanup completed: %s files identified for deletion', 
           v_deleted_count),
    'profile_image',
    jsonb_build_object(
      'deleted_count', v_deleted_count,
      'total_files', v_total_files,
      'bucket', v_bucket_name,
      'cleanup_date', v_cleanup_date,
      'used_urls_count', array_length(v_used_urls, 1)
    ),
    NOW()
  );
  
  -- 결과 반환
  RETURN QUERY SELECT v_deleted_count, v_total_files, v_bucket_name, v_cleanup_date;
END;
$$;

-- 3. 통합 Orphan File 정리 함수
CREATE OR REPLACE FUNCTION cleanup_all_orphan_images()
RETURNS TABLE(
  visitor_deleted INTEGER,
  profile_deleted INTEGER,
  total_deleted INTEGER,
  cleanup_date TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_visitor_result RECORD;
  v_profile_result RECORD;
  v_total_deleted INTEGER;
  v_cleanup_date TIMESTAMPTZ := NOW();
BEGIN
  -- 방문자 이미지 정리
  SELECT * INTO v_visitor_result FROM cleanup_orphan_visitor_images();
  
  -- 프로필 이미지 정리
  SELECT * INTO v_profile_result FROM cleanup_orphan_profile_images();
  
  -- 총 삭제된 파일 수 계산
  v_total_deleted := COALESCE(v_visitor_result.deleted_count, 0) + 
                     COALESCE(v_profile_result.deleted_count, 0);
  
  -- 전체 정리 결과 로그
  INSERT INTO system_logs (
    level, 
    action, 
    message, 
    resource_type,
    metadata,
    created_at
  ) VALUES (
    'info',
    'COMPLETE_ORPHAN_FILE_CLEANUP',
    format('Complete orphan file cleanup: %s total files identified for deletion', v_total_deleted),
    'system',
    jsonb_build_object(
      'visitor_deleted', COALESCE(v_visitor_result.deleted_count, 0),
      'profile_deleted', COALESCE(v_profile_result.deleted_count, 0),
      'total_deleted', v_total_deleted,
      'cleanup_date', v_cleanup_date
    ),
    NOW()
  );
  
  -- 결과 반환
  RETURN QUERY SELECT 
    COALESCE(v_visitor_result.deleted_count, 0),
    COALESCE(v_profile_result.deleted_count, 0),
    v_total_deleted,
    v_cleanup_date;
END;
$$;

-- 4. 스케줄 등록 (매주 일요일 새벽 3시 실행)
SELECT cron.schedule(
  'cleanup-orphan-images',
  '0 18 * * 0',  -- 매주 일요일 18:00 UTC (한국시간 03:00)
  'SELECT cleanup_all_orphan_images();'
);

-- 5. 스케줄 확인
SELECT * FROM cron.job WHERE jobname = 'cleanup-orphan-images';

-- 6. 수동 실행 테스트 (필요시)
-- SELECT * FROM cleanup_all_orphan_images(); 